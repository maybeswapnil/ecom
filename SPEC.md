# Framed Prints Store — Technical Specification

Companion to `PLAN.md`. PLAN is the roadmap (what/why/when); **this file is the implementation contract**: every actor and how it authenticates, every HTTP endpoint with request/response/error shapes, cart rules, the order state machine, the NimbusPost shipping integration, the admin surface, emails, tracking payloads, and responsive/SEO acceptance criteria. When building, this document wins on detail.

Brand: **Print Company**. All outbound email: `info@swapnilsharma.in`.

Schema note: `PLAN.md §4` is migration `001_core.sql`. §4.7 below adds migration `002_lifecycle.sql`; §5.6 adds `003_shipping.sql`.

---

## 0. Contents

1. Actors & authentication (shoppers, receipt tokens, admin, machine credentials)
2. HTTP API contract (every endpoint)
3. Cart management
4. Order lifecycle (state machine + schema delta)
5. Shipping — NimbusPost integration
6. Admin panel spec
7. Emails
8. Tracking payloads (Pixel / CAPI / PostHog)
9. Responsive & SEO acceptance criteria
10. Security & privacy checklist
11. Repository structure
12. Config constants
13. Open items that touch this spec

---

## 1. Actors & authentication

### 1.1 Shoppers — no accounts, three identifiers

Guest-only checkout. A shopper's durable identity is the **email + phone** captured at checkout. Before that, three identifiers tie their journey together:

| Identifier | Set by | Cookie properties | Purpose |
|---|---|---|---|
| `anon_id` | `middleware.ts` on first request (UUID v4) | httpOnly, Secure, SameSite=Lax, 1 year | Server-side visitor id; joins attribution rows |
| `first_touch` | `middleware.ts` on first request, only if absent | httpOnly, Secure, SameSite=Lax, 90 days | JSON: `{landing_url, referrer, utm_*, fbclid, ts}` — first-touch attribution, snapshotted onto orders |
| PostHog `distinct_id` | posthog-js (its own persistence) | managed by posthog-js | Funnel identity. **Client includes `posthog.get_distinct_id()` in the checkout POST body** — don't parse PostHog's cookie server-side, it's fragile |

`_fbp` / `_fbc` are set by the Meta Pixel (not httpOnly) and read **server-side from request cookies** at checkout and in `/api/track` — the client never forwards them explicitly.

### 1.2 Order receipt access — signed token, no login

- Token: `t = hex(HMAC_SHA256(key = ORDER_TOKEN_SECRET, msg = order_number))`, truncated to 32 hex chars.
- Generated at checkout, stored nowhere (recomputable), embedded in the confirmation redirect and all customer emails.
- Grants **read-only** access to that single order (`/order/[number]?t=…` and the status poll endpoint). No expiry — it's a receipt link.
- Compare with a constant-time comparison (`crypto.timingSafeEqual`). Order numbers are guessable by design; tokens are not.

### 1.3 Admin — Supabase Auth

- One admin user (you), created manually in the Supabase dashboard. **Public signups disabled** in Auth settings.
- Email + password sign-in at `/admin/login` via `@supabase/ssr` (cookie-based session; access token ~1 h, rolling refresh handled in middleware).
- `middleware.ts` gates `/admin/*`: no session → redirect to `/admin/login`.
- **Authorization is re-checked server-side on every mutation**: the session user's email must be in the `ADMIN_EMAILS` env var (comma-separated). Only then does the action run — using the **service-role client**. The browser never writes to the DB directly, so RLS stays fully locked (§10).
- Logout = Supabase `signOut()` + redirect.

### 1.4 Machine credentials

| Caller | Credential | Verified where |
|---|---|---|
| Razorpay → webhook | `RAZORPAY_WEBHOOK_SECRET` (HMAC of raw body vs `X-Razorpay-Signature`) | `/api/webhooks/razorpay` |
| Us → Razorpay API | `RAZORPAY_KEY_SECRET` (basic auth via SDK) | outbound only |
| Us → Meta CAPI | `META_CAPI_TOKEN` (bearer in URL param) | outbound only |
| Us → NimbusPost | Bearer token minted via `POST users/login` (`NIMBUSPOST_EMAIL`/`NIMBUSPOST_PASSWORD`), cached, re-login on 401 (§5.2) | outbound only |
| NimbusPost → tracking webhook | `NIMBUSPOST_WEBHOOK_KEY` URL param + verify-by-re-poll (§5.4) | `/api/webhooks/nimbuspost` |
| Meta → feed | `FEED_SECRET` query param | `/api/meta-feed` |
| Server → Supabase | `SUPABASE_SERVICE_ROLE_KEY` | server-only code paths |

---

## 2. HTTP API contract

Conventions:

- JSON in/out. Error envelope: `{ "error": { "code": "OUT_OF_STOCK", "message": "…", "details": {…} } }`.
- Error codes: `VALIDATION_FAILED` 400 · `SIGNATURE_INVALID` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `ITEMS_UNAVAILABLE` 409 · `OUT_OF_STOCK` 409 · `PRICE_CHANGED` 409 · `UNSERVICEABLE_PINCODE` 409 · `RATE_LIMITED` 429 · `GATEWAY_ERROR` 502 · `INTERNAL` 500.
- All request bodies validated with **zod schemas in `lib/validation.ts`, shared by client forms and API routes** — one source of truth for rules like pincode format.
- **Catalog and order-view reads are NOT public JSON APIs.** Product grids, product pages, and the order page are React Server Components reading Supabase directly (anon key + RLS for catalog; service role + token check for orders). Less public surface. Only mutations and machine integrations get endpoints:

| Endpoint | Runtime | Auth | Rate limit |
|---|---|---|---|
| `POST /api/cart/validate` | Node | none | 60/min/IP |
| `POST /api/checkout` | Node | none | 10/min/IP |
| `POST /api/payment/verify` | Node | none | 30/min/IP |
| `GET /api/orders/[number]/status` | Node | receipt token | 60/min/IP |
| `POST /api/webhooks/razorpay` | Node | HMAC signature | none |
| `POST /api/webhooks/nimbuspost` | Node | secret URL key (§5.4) | none |
| `POST /api/track` | **Edge** | none | 60/min/IP |
| `GET /api/meta-feed` | Node | `?key=FEED_SECRET` | none |
| Admin mutations | Node (server actions) | Supabase session + `ADMIN_EMAILS` | none |
| `/ingest/*` | rewrite | — | — |

Rate limiting v1: fixed-window counter in Postgres — RPC `check_rate_limit(key text, max int, window_secs int)` doing an upsert on a `rate_limits(key, window_start, count)` table. No new infrastructure; replace with Vercel Firewall rules if abuse ever shows up.

### 2.1 `POST /api/cart/validate`

Re-prices the client cart against the DB. Called on cart-drawer open and cart-page load.

Request:
```json
{ "items": [ { "sku": "FP-HIMALAYA-1218-BLK", "qty": 1 } ] }
```

Response `200`:
```json
{
  "items": [
    { "sku": "FP-HIMALAYA-1218-BLK", "state": "ok", "price_paise": 649900,
      "available_qty": 4, "title": "Himalayan Dawn — 12×18 in, Black frame",
      "image": "product-images/himalaya/framed-black.jpg" }
  ],
  "subtotal_paise": 649900,
  "shipping_paise": 0,
  "free_shipping_gap_paise": 0,
  "total_paise": 649900
}
```

`state` per line: `ok` · `price_changed` (client should update its snapshot and highlight) · `out_of_stock` (`available_qty` says how many are left, possibly 0) · `unavailable` (variant/product no longer active — prompt removal). Unknown SKUs come back `unavailable`, never 404.

### 2.2 `POST /api/checkout`

Creates the pending order + Razorpay Order. The client sends **SKUs, quantities, customer details, and an expected total — never prices**.

Request:
```json
{
  "idempotency_key": "0197c2fe-9d1b-7c3a-8f4e-2f6a9d1b7c3a",
  "items": [ { "sku": "FP-HIMALAYA-1218-BLK", "qty": 1 } ],
  "customer": { "name": "Asha Rao", "email": "asha@example.com", "phone": "+919812345678" },
  "address": { "line1": "221B Baner Road", "line2": "", "city": "Pune",
               "state": "MH", "pincode": "411045" },
  "expected_total_paise": 649900,
  "ph_distinct_id": "0197c2fe-…"
}
```

Validation (zod): 1–20 line items · qty 1–10 · email format · phone `+91` + 10 digits · pincode `^[1-9][0-9]{5}$` · state from the fixed Indian state list · name/line1/city 1–120 chars.

Server steps, in order:

1. Rate limit (10/min/IP) → `429`.
2. Zod parse → `400 VALIDATION_FAILED` with per-field `details`.
3. **Idempotency**: if an order with this `idempotency_key` exists and is `pending`, return its original response again (same Razorpay order — double-clicks and modal re-opens are safe).
4. Fetch all variants by SKU in one query, requiring `active = true` and product `status = 'live'` → missing ones: `409 ITEMS_UNAVAILABLE` `{skus: […]}`.
5. Soft stock check `qty ≤ stock_qty` → `409 OUT_OF_STOCK` `{sku, available_qty}` per failing line. (Final enforcement happens at payment capture, §2.5.)
6. **Serviceability** (NimbusPost, §5.2): destination pincode must be serviceable from `PICKUP_PINCODE` for the cart's packed weight. Cached 24 h per (pincode, weight bucket) in `serviceability_cache`; NimbusPost error or response slower than `SERVICEABILITY_TIMEOUT_MS` → **fail open** (never lose a sale because the aggregator is down). Not serviceable → `409 UNSERVICEABLE_PINCODE`.
7. Compute totals from **DB prices only**: `subtotal`; `shipping = 0 if subtotal ≥ FREE_SHIP_THRESHOLD_PAISE else SHIPPING_FLAT_PAISE`; `total`. If `total ≠ expected_total_paise` → `409 PRICE_CHANGED` with the fresh breakdown (client refreshes cart UI and asks the shopper to confirm).
8. Transaction: insert `orders` row — `status='pending'`, `order_number = 'FP-' || nextval('order_number_seq')`, `purchase_event_id = uuid`, `attribution` assembled server-side from `_fbp`/`_fbc` cookies + `first_touch` cookie + `ph_distinct_id` from body + IP + user-agent — plus `order_items` snapshot rows (title, sku, unit price).
9. `razorpay.orders.create({ amount: total, currency: 'INR', receipt: order_number, notes: { order_number } })`. On failure: mark the order `cancelled` (`cancelled_reason='gateway_error'`) → `502 GATEWAY_ERROR`.
10. Store `razorpay_order_id` → `200`:

```json
{
  "order_number": "FP-1042",
  "amount_paise": 649900,
  "razorpay": { "key_id": "rzp_live_xxxxx", "order_id": "order_NXhT2…" },
  "prefill": { "name": "Asha Rao", "email": "asha@example.com", "contact": "+919812345678" },
  "receipt_token": "9f2c47d1e6b38a05…"
}
```

### 2.3 `POST /api/payment/verify`

Called by the Razorpay success handler. **UX only — no side effects here.** All fulfilment effects fire from the webhook (§2.5), so effects run exactly once no matter which path lands first.

Request: `{ "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }`

- Compute `HMAC_SHA256(key = RAZORPAY_KEY_SECRET, msg = order_id + "|" + payment_id)`; `timingSafeEqual` against `razorpay_signature`. Invalid → `400 SIGNATURE_INVALID` (log with IP).
- Valid → `update orders set razorpay_payment_id = $1, client_verified_at = now() where razorpay_order_id = $2` → `200 { "ok": true, "order_number": "FP-1042", "status": "pending" }`.
- Client then redirects to `/order/FP-1042?t=<receipt_token>`.

**Confirmation page behaviour**: it renders "confirming your payment…" and polls §2.4 every 2 s for up to 60 s. When `status = 'paid'`: show the confirmed state, fire the Pixel `Purchase` (with `event_id = purchase_event_id`, served to the page via the token-gated RSC read), and set a `sessionStorage` flag so the Pixel event never fires twice on reload. After 60 s without `paid`: "Payment is taking longer than usual — you'll get a confirmation email; nothing to do." (Covers delayed webhooks without lying to the buyer.)

### 2.4 `GET /api/orders/[number]/status?t=<token>`

- Bad/missing token → `403 FORBIDDEN`. Unknown order → `403` as well (don't leak existence).
- `200 { "status": "shipped", "paid_at": "2026-07-04T10:12:31Z", "shipment": { "courier": "Delhivery", "awb": "…", "tracking_url": "…", "last_event": "Out for delivery", "last_event_at": "…" } }` — `shipment` is `null` until booking (§5.3). `Cache-Control: no-store`. The order page renders coarse order status plus the latest courier checkpoint from this.

### 2.5 `POST /api/webhooks/razorpay` — source of truth

- Read the **raw body** (no JSON middleware first). Verify `X-Razorpay-Signature = HMAC_SHA256(webhook_secret, raw_body)`; fail → `401` (the only non-200 we return for valid-shaped requests).
- **Dedupe**: `insert into webhook_events (id, payload) values ($event_id, $payload) on conflict do nothing` — zero rows inserted → already processed → `200` immediately. Razorpay retries deliveries for up to ~24 h; idempotency is mandatory.
- Handler matrix:

| Event | Action |
|---|---|
| `payment.captured`, `order.paid` | The paid transition below (both events, whichever arrives first, idempotently) |
| `payment.failed` | Append `{payment_id, code, description, at}` to `orders.payment_attempts`; status unchanged (buyer can retry from the still-open modal) |
| `payment.authorized` | Log only (auto-capture is on; captured follows) |
| `refund.processed` | Insert `refunds` row; if cumulative refunds ≥ `total_paise` → status `refunded`, else set `partially_refunded = true`. Send refund email (guarded) |
| anything else | Log, `200` |

**Paid transition** (single guarded UPDATE is the lock):

```sql
update orders set status = 'paid', paid_at = now(), razorpay_payment_id = $pid
where razorpay_order_id = $oid and status = 'pending'
returning *;
```

- 0 rows, order already `paid` → duplicate delivery → `200`, done.
- 0 rows, order `cancelled` (paid after 24 h expiry — rare) → set `paid_after_cancel = true`, email admin, `200`. Admin refunds manually.
- 1 row → proceed:
  1. Stock, per item: `update product_variants set stock_qty = stock_qty - $qty where id = $vid and stock_qty >= $qty`. 0 rows → set `orders.oversold = true` (fulfil or refund manually — see §4 stock-model note); never go negative.
  2. Effects, each individually guarded by a key in `orders.effects` jsonb so webhook retries can't double-fire: `order_confirmation` email → `capi_purchase` (§8.2) → `posthog_purchase` (§8.3) → `admin_new_order` email. Each effect: attempt, then set its guard key with a timestamp; failures leave the key unset (`processing_error` logged on `webhook_events`) and the admin order page shows a retry button.
  3. Insert `order_status_history` row (`actor = 'webhook'`).
- Reply `200` within a few seconds; the work above is a few hundred ms inline.

### 2.6 `POST /api/track` — Edge runtime

Browser → CAPI forwarder for pre-purchase events. **`Purchase` is rejected here (`400`)** — it is server-emitted from the webhook only.

Request:
```json
{
  "event": "AddToCart",
  "event_id": "0197c2ff-…",
  "url": "https://site.in/prints/himalayan-dawn",
  "custom_data": { "content_ids": ["FP-HIMALAYA-1218-BLK"], "content_type": "product",
                    "value": 6499, "currency": "INR" }
}
```

- `event` allowlist: `ViewContent`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`.
- Enrich server-side: client IP (`x-forwarded-for` first hop), user-agent header, `_fbp`/`_fbc` from cookies, `action_source: "website"`, `event_source_url = url`.
- POST to `https://graph.facebook.com/v<current>/<PIXEL_ID>/events?access_token=…` inside `waitUntil()` — the response to the browser is an immediate `202 {}` regardless. One retry on 5xx; drop and log on 4xx. Include `test_event_code` when `META_TEST_EVENT_CODE` is set (dev/preview only).

### 2.7 Admin mutations — server actions

All follow: assert Supabase session → assert email ∈ `ADMIN_EMAILS` → execute with service-role client → insert `order_status_history` where relevant → `revalidateTag()` where relevant.

| Action | Input | Guard | Effects |
|---|---|---|---|
| `markPacked(orderId)` | — | status = `paid` | history row |
| `bookShipment(orderId, {courierId?})` | optional courier pick | status ∈ `paid, packed`; no active shipment | §5.3: rates → NimbusPost create-shipment → `shipments` row (AWB, label). Order stays `packed` until pickup |
| `markShippedManual(orderId, {courier, awb, trackingUrl?})` | awb required | status ∈ `paid, packed` | fallback for shipments booked outside NimbusPost; history; **shipping email** |
| `cancelShipment(shipmentId, reason)` | reason | shipment ∈ `booked, pickup_scheduled` | `POST shipments/cancel`; sets `active=false` → order can re-book |
| `markDelivered(orderId)` | — | status = `shipped` | history |
| `cancelPendingOrder(orderId, reason)` | reason | status = `pending` | history (unpaid — nothing to refund) |
| `retryEffect(orderId, effectKey)` | key | effect guard unset | re-runs one §2.5 effect |
| `resendEmail(orderId, kind)` | kind | — | clears that email guard, resends |
| `addOrderNote(orderId, text)` | ≤2000 chars | — | appends to `internal_notes` |
| `upsertProduct(fields)` | zod | — | `revalidateTag('product:'+slug)` + shop grid tag |
| `upsertVariant(fields)` | zod; **SKU immutable once any order references it** | — | revalidate |
| `setProductStatus(id, status)` | `draft/live/archived` | — | revalidate |
| `uploadProductImage(file)` | jpg/png/webp ≤ 10 MB | — | server-side put to `product-images`, returns path |

Refunds are **initiated in the Razorpay dashboard** (v1) — the admin order page deep-links to the payment; the `refund.processed` webhook drives our state. A `restock` decision is made in the admin when the return physically arrives (§4).

### 2.8 `GET /api/meta-feed?key=<FEED_SECRET>` (post-launch, Phase 5)

CSV, one row per **active variant** of live products; `Cache-Control: s-maxage=3600`.

Columns: `id` (= SKU — must match `content_ids` everywhere) · `item_group_id` (= product slug; groups variants) · `title` ("Himalayan Dawn — 12×18 in, Black frame") · `description` · `availability` (`in stock`/`out of stock` from `stock_qty`) · `condition` (`new`) · `price` (`6499.00 INR`) · `link` (product URL + `?variant=SKU`) · `image_link` · `brand`.

### 2.9 PostHog proxy

`next.config` rewrites: `/ingest/static/:path*` → PostHog assets host, `/ingest/:path*` → PostHog region ingest host (region = open question). posthog-js is initialized with `api_host: '/ingest'`.

---

## 3. Cart management

Client-side cart; the server holds no cart state until checkout (guest model).

**Storage**: zustand + `persist` → localStorage key `fp.cart.v1`.

```ts
type CartLine = {
  sku: string
  qty: number            // clamped 1..MAX_QTY_PER_LINE (10)
  snapshot: {            // display cache ONLY — server never reads these
    title: string; sizeLabel: string; finish: string
    pricePaise: number; image: string; slug: string
  }
}
type Cart = { lines: CartLine[]; updatedAt: string }   // max 20 lines
```

**Rules**

- Add to cart merges by SKU (increment, clamp at 10); >20 distinct lines → "cart is full".
- Snapshot prices are for optimistic display only. **Refresh on cart-drawer open and cart-page load** via `POST /api/cart/validate`; per-line states map to UI: `price_changed` → update snapshot + highlight the change; `out_of_stock` → line disabled with available qty; `unavailable` → prompt removal. Checkout button disabled while any line is not `ok`.
- Free-shipping nudge: render `free_shipping_gap_paise` from validate ("₹500 away from free shipping").
- Multi-tab sync: zustand persist + `storage` event listener.
- **Clearing**: cart clears on first load of the confirmation page with a valid token (not on the verify response — a buyer can still abandon between modal and redirect).
- Version key `fp.cart.v1` — breaking shape changes bump to `v2`, old key discarded.

**Post-launch (Phase 5)**: abandoned-checkout capture — on checkout-form email blur, upsert `checkout_sessions (email, cart jsonb, marketing_consent bool, created_at)`; a Supabase Edge Function + pg_cron sends the nudge email after 4 h if no paid order matches the email. Marketing email requires the consent checkbox — transactional email does not (keep the checkbox unticked by default).

---

## 4. Order lifecycle

```
 pending ──payment──► paid ──admin──► packed ──pickup*──► shipped ──delivered*──► delivered
    │     (webhook)     │               │                    │
    │                   └───────────────┴────────────────────┴──refund.processed──► refunded
    │                                                        └──────── RTO* ─────► returned
    └──24 h expiry / admin cancel──► cancelled     * = NimbusPost tracking (§5.5); admin fallback
```

| # | From → To | Trigger | Guards | Side effects |
|---|---|---|---|---|
| 1 | `pending → paid` | webhook `payment.captured`/`order.paid` | guarded UPDATE (§2.5) | stock decrement, confirmation email, CAPI Purchase, PostHog purchase, admin email, history |
| 2 | `pending → cancelled` | pg_cron hourly: `created_at < now() - interval '24 hours'` (`cancelled_reason='expired'`) or admin | status still `pending` | history. No stock was reserved, so nothing to release |
| 3 | `paid → packed` | admin | — | history |
| 4 | `packed → shipped` (also `paid → shipped`) | NimbusPost tracking: first pickup / in-transit event (§5.5), or admin `markShippedManual` | active shipment or manual AWB | shipping email (guarded), history |
| 5 | `shipped → delivered` | NimbusPost tracking `delivered` (§5.5), or admin | — | history, `shipments.delivered_at` |
| 6 | `paid/packed/shipped → refunded` | webhook `refund.processed`, cumulative ≥ total | — | refund email, history. **No automatic restock** — admin ticks "restock" on the refund row when the return arrives intact (damage cases don't restock) |
| 7 | partial refund | webhook `refund.processed`, cumulative < total | — | `partially_refunded = true`, refund email, status unchanged |
| 8 | `cancelled` + payment arrives | webhook after expiry | — | `paid_after_cancel = true`, admin alerted, manual refund |
| 9 | `shipped → returned` | NimbusPost tracking `rto_delivered` (§5.5) | — | admin alert email, history; refund + restock decided manually |

**Invariants**

- Stock is decremented **exactly once**, at transition 1, protected by the `status='pending'` guarded UPDATE.
- Every effect is idempotent via `orders.effects` / `orders.emails_sent` guard keys — webhook retries and admin "retry effect" can't double-send.
- Every transition writes `order_status_history (order_id, from_status, to_status, actor, note, created_at)` with `actor ∈ 'webhook' | 'nimbuspost' | 'system' | 'admin:<email>'`.
- Order status stays coarse; fine-grained courier checkpoints live on `shipments.status` + `shipments.tracking_events` (§5.5). **Booking a shipment does not change order status — pickup does.**
- `order_number` comes from sequence `order_number_seq` (start 1001) → `FP-1042`. Monotonic, human-readable, no PII.

**Stock model — decided tradeoff**: decrement-at-capture (chosen) means two buyers can both pass the soft check in §2.2 step 5 and race to pay for the last unit; the loser trips the capture-time guard and the order is flagged `oversold` (you refund with an apology, or print another). At launch volume this is the right trade — reservation-with-TTL (reserve at checkout, release on expiry) adds a background release job and UX for "your reservation expired" and is **explicitly deferred** until the shop regularly sells out of variants.

### 4.7 Schema delta — migration `002_lifecycle.sql`

```sql
alter table orders
  add column client_verified_at timestamptz,
  add column idempotency_key uuid unique,
  add column payment_attempts jsonb not null default '[]',
  add column emails_sent      jsonb not null default '{}',
  add column effects          jsonb not null default '{}',
  add column oversold             boolean not null default false,
  add column partially_refunded   boolean not null default false,
  add column paid_after_cancel    boolean not null default false,
  add column cancelled_reason text,
  add column internal_notes   text not null default '';

create sequence order_number_seq start 1001;

create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders,
  from_status text not null,
  to_status   text not null,
  actor       text not null,            -- 'webhook' | 'system' | 'admin:<email>'
  note        text,
  created_at  timestamptz default now()
);

create table refunds (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders,
  razorpay_refund_id text unique not null,
  amount_paise       int not null,
  restocked          boolean not null default false,
  created_at         timestamptz default now()
);

create table rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (key, window_start)
);
-- + RPC check_rate_limit(key, max, window_secs); RLS enabled, no anon policies,
-- on all of the above.
```

---

## 5. Shipping — NimbusPost

Base URL, auth, and endpoint paths below are **verified against NimbusPost's official PHP SDK** (`tech-nimbuspost/nimbuspost-api`). The SDK confirms endpoints but not payload field names — those get locked from NimbusPost's Postman collection with one real test booking (open item #6).

### 5.1 Account prerequisites (Phase 0)

NimbusPost KYC complete · **wallet topped up** (shipping charges debit a prepaid wallet — a ₹0 balance silently blocks booking) · warehouse/pickup address registered (its pincode = `PICKUP_PINCODE` env) · tracking webhook URL configured in their panel → `https://<site>/api/webhooks/nimbuspost?key=<NIMBUSPOST_WEBHOOK_KEY>` · API login credentials in env.

### 5.2 Outbound client — `lib/nimbuspost.ts`

Base URL `https://api.nimbuspost.com/v1/`. Auth: `POST users/login` `{email, password}` → Bearer token on every subsequent call. Cache the token module-level; **any 401 → re-login once and retry**. All calls: 10 s timeout, one retry on 5xx — except checkout serviceability, which uses `SERVICEABILITY_TIMEOUT_MS` (1.5 s) and **fails open** (§2.2 step 6).

| Call | Endpoint | Used by |
|---|---|---|
| Serviceability + rates | `POST courier/serviceability` (origin/destination pincodes, weight, payment type) | checkout gate (§2.2 step 6); admin rate table (§5.3) |
| Create shipment | `POST shipments` | `bookShipment` (§5.3) |
| Track by AWB | `GET shipments/track/{awb}` | webhook verification + sweep (§5.4) |
| Bulk track | `POST shipments/track/bulk` | reconciliation sweep |
| Cancel | `POST shipments/cancel` `{awb}` | `cancelShipment` (§2.7) |
| Manifest | `POST shipments/manifest` `{awbs[]}` | end-of-day courier handover doc |
| Courier list | `GET courier` | courier id → name mapping |

Create-shipment payload: `order_number`, payment type **prepaid** (no COD), order amount, consignee (name, address, city, state, pincode, phone), items (name, SKU, qty, price), package weight + dimensions from the variant rows. Multi-item orders: summed weight, largest box's dimensions — a v1 simplification, revisit if multi-frame orders become common. Persist from the response: NimbusPost shipment id, AWB, courier id + name, label URL, and the charged cost → `shipments.shipping_cost_paise` (your real cost vs the flat fee the buyer paid — margin stays visible per order).

### 5.3 Booking flow (admin action `bookShipment`)

1. Guards: order `paid`/`packed`, no active `shipments` row.
2. Serviceability with the real packed weight → admin sees the rate table (courier, our cost, estimated delivery days), cheapest preselected.
3. Confirm → `POST shipments` → insert `shipments` row (`status='booked'`, `active=true`) → print label from `label_url`.
4. **Order status does not change at booking.** The courier's first pickup scan — arriving via §5.4 — flips `packed → shipped` and sends the shipping email. `markShippedManual` (§2.7) remains for anything shipped outside NimbusPost, including "NimbusPost is down" days.

### 5.4 Inbound tracking webhook + reconciliation

`POST /api/webhooks/nimbuspost?key=…` — NimbusPost tracking pushes aren't HMAC-signed the way Razorpay's are, so payloads are treated as **hints, never truth**:

1. `key` query param ≠ `NIMBUSPOST_WEBHOOK_KEY` (long random string) → `401`.
2. Extract the AWB from the payload; no matching `shipments` row → log + `200`.
3. **Verify by re-poll**: call `GET shipments/track/{awb}` and use *that* response — not the webhook body — to append checkpoints to `shipments.tracking_events` and update `shipments.status` per §5.5.
4. Order transitions run as guarded idempotent updates (`actor='nimbuspost'`). Always `200`, fast.

**Reconciliation sweep**: Supabase pg_cron every `TRACKING_SWEEP_HOURS` (6) polls every shipment in a non-terminal status (bulk endpoint) and applies the same §5.5 mapping. The system converges even if **every** webhook is dropped — the webhook only makes it faster.

### 5.5 Status normalization → order transitions

`shipments.status` vocabulary: `booked → pickup_scheduled → in_transit → out_for_delivery → delivered`, plus `exception`, `rto_in_transit`, `rto_delivered`, `cancelled`. Raw courier status strings vary per courier — normalize via an explicit mapping table in `lib/nimbuspost.ts`; **unknown strings map to `exception` + admin alert**, never a silent guess.

| Shipment reaches | Order effect |
|---|---|
| first pickup / `in_transit` | `packed → shipped`, shipping email (guard `emails_sent.shipping`) |
| `out_for_delivery` | shipment-level only (shown on order page + admin) |
| `delivered` | `shipped → delivered`, set `shipments.delivered_at` |
| `rto_in_transit` | admin alert email; order stays `shipped` |
| `rto_delivered` | `shipped → returned`; refund (Razorpay dashboard → §2.5 webhook) + restock decided manually |
| `exception` | admin alert only |

### 5.6 Schema delta — migration `003_shipping.sql`

```sql
create table shipments (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references orders,
  nimbuspost_shipment_id text,
  awb                    text unique,
  courier_id             text,
  courier_name           text,
  label_url              text,
  status                 text not null default 'booked',   -- §5.5 vocabulary
  shipping_cost_paise    int,                -- what NimbusPost charges us
  tracking_events        jsonb not null default '[]',
  active                 boolean not null default true,    -- false after cancel
  booked_at              timestamptz default now(),
  shipped_at             timestamptz,
  delivered_at           timestamptz
);
create unique index one_active_shipment_per_order on shipments (order_id) where active;

create table serviceability_cache (
  pincode       text not null,
  weight_bucket int  not null,              -- kg, rounded up
  serviceable   boolean not null,
  checked_at    timestamptz default now(),
  primary key (pincode, weight_bucket)
);
-- RLS enabled on both, no anon policies. orders gains no columns; 'returned'
-- joins the status vocabulary (status is text — documented, not an enum change).
```

---

## 6. Admin panel

All under `/admin`, gated per §1.3. Server components + server actions; no client-side DB access.

**`/admin/login`** — Supabase email+password form. No signup link, no password reset UI (reset via Supabase dashboard if ever needed).

**`/admin` (dashboard)** — revenue today / 7 d / 30 d (sum of `paid_at` windows, refunds netted); order counts by status; **action queue**: paid-but-not-shipped orders oldest-first, booked-but-not-picked-up older than 48 h; low-stock list (`stock_qty ≤ 2`, active variants); any orders flagged `oversold` / `paid_after_cancel` / RTO in progress / failed effects — rendered as red alerts.

**`/admin/orders`** — table: number, date, customer name, city, total, status badge, flags. Filter by status; search by order number / email / phone. Default sort: newest. Pagination 50/page.

**`/admin/orders/[id]`** —
- Items (image thumb, title snapshot, SKU, qty, unit price), amount breakdown, payment attempts.
- Address block with a **copy-for-courier button** (formatted plain text).
- Payment: `razorpay_payment_id` deep-linked to the Razorpay dashboard; refunds listed with a `restock` checkbox each (ticking it increments the variant's stock once — guarded by `refunds.restocked`).
- Attribution summary (source/medium/campaign, first-touch landing page) — read-only.
- Timeline from `order_status_history`.
- Actions (§2.7), rendered only when the state machine allows them.
- **Shipment panel** (§5.3): before booking — the serviceability rate table (courier, our cost, EDD) with a Book button; after booking — courier, AWB, label download, cancel-before-pickup, and the live checkpoint timeline from `tracking_events`. Manual-AWB fallback form stays.
- Effects panel: each §2.5 effect with sent-at timestamp or a **retry** button; `resendEmail` per template.
- Internal notes textarea (append-only log).

**`/admin/products`** — list with status, variant count, stock sum, "view live" link. New-product button.

**`/admin/products/[id]`** — product fields (slug immutable after first publish), story, tags; image manager (upload → Storage, drag-reorder, alt text per image, first = hero); **variant matrix editor** (rows = size, columns = finish → price + stock + active per cell; SKU auto-suggested `FP-<SLUG>-<SIZE>-<FIN>`, immutable once ordered); publish/unpublish with on-demand revalidation.

**Explicitly not in v1**: multi-admin roles, bulk operations, invoice PDF generation (blocked on GST question), analytics pages (PostHog is the analytics UI), courier API integration.

---

## 7. Emails (Resend)

All mail sends as **`Print Company <info@swapnilsharma.in>`**, reply-to the same. Verify `swapnilsharma.in` in Resend during Phase 0: their DKIM records plus a custom return-path subdomain (`send.swapnilsharma.in`) — **additive DNS entries that don't touch the domain's existing MX/SPF**, so any personal mailbox on swapnilsharma.in keeps working. Add a DMARC record (`p=none` to start) if the domain has none. Templates in `emails/` with react-email. Every send is guarded by a key in `orders.emails_sent` so retries never duplicate.

| Template | Trigger | To | Subject | Guard key | Must contain |
|---|---|---|---|---|---|
| `order_confirmation` | webhook paid (§2.5) | customer | `Order FP-1042 confirmed — <Brand>` | `order_confirmation` | items, amounts, address, receipt link (`/order/…?t=…`), dispatch expectation, support contact |
| `shipping_confirmation` | `packed → shipped` (NimbusPost pickup event §5.5, or `markShippedManual`) | customer | `Your print is on its way — FP-1042` | `shipping` | courier, AWB, tracking link, receipt link |
| `refund_confirmation` | webhook `refund.processed` | customer | `Refund processed — FP-1042` | `refund_<razorpay_refund_id>` | amount, "5–7 business days to your account" |
| `admin_new_order` | webhook paid | `info@swapnilsharma.in` | `₹6,499 — FP-1042 (Pune)` | `admin_new` | items, address, admin deep link |

---

## 8. Tracking payloads

### 8.1 Event id rules

- Pre-purchase events: client generates a UUID v4 per event occurrence; the **same id** goes to the Pixel call and the `/api/track` body — Meta dedupes on `(event_name, event_id)`.
- Purchase: `orders.purchase_event_id` (minted at checkout) is used by **both** the confirmation-page Pixel fire and the webhook CAPI fire.

### 8.2 CAPI `Purchase` (webhook-emitted) — canonical example

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1751623951,
    "event_id": "<orders.purchase_event_id>",
    "action_source": "website",
    "event_source_url": "<attribution.landing_url>",
    "user_data": {
      "em": ["<sha256(email)>"], "ph": ["<sha256(phone)>"],
      "fn": ["<sha256(first)>"], "ln": ["<sha256(last)>"],
      "ct": ["<sha256(city)>"],  "st": ["<sha256(state)>"],
      "zp": ["<sha256(pincode)>"], "country": ["<sha256('in')>"],
      "client_ip_address": "<attribution.ip>",
      "client_user_agent": "<attribution.ua>",
      "fbp": "<attribution.fbp>", "fbc": "<attribution.fbc>"
    },
    "custom_data": {
      "currency": "INR", "value": 6499.00,
      "content_type": "product",
      "content_ids": ["FP-HIMALAYA-1218-BLK"],
      "contents": [{ "id": "FP-HIMALAYA-1218-BLK", "quantity": 1, "item_price": 6499.00 }],
      "num_items": 1, "order_id": "FP-1042"
    }
  }],
  "test_event_code": "<only outside production>"
}
```

Hash normalization before SHA-256 (all lowercase, trimmed): email as-is lowercased · phone digits-only with country code (`919812345678`) · names letters-only lowercased · city lowercased no spaces · state lowercased (`mh`) · pincode as-is · country `in`. `value` in rupees (paise ÷ 100), not paise.

### 8.3 PostHog events

| Event | Source | Properties |
|---|---|---|
| `$pageview` | auto (posthog-js) | — |
| `product_viewed` | client | `sku, slug, title, price_paise` |
| `variant_selected` | client | `sku, size_label, finish` |
| `add_to_cart` | client | `sku, qty, price_paise, cart_value_paise` |
| `checkout_started` | client | `cart_value_paise, num_items, skus` |
| `payment_opened` | client | `order_number, total_paise` |
| `purchase` | **server** (webhook, posthog-node) | `order_number, total_paise, num_items, skus`; `distinct_id = attribution.ph_distinct_id`; `uuid = purchase_event_id` (dedupes retries) |

No raw email/phone/address as event properties — the order row is the PII store, PostHog gets ids and amounts. Session replay: `maskAllInputs: false` globally but **`mask_all_text + maskAllInputs: true` scoped on `/checkout`** via posthog config, so addresses and phones never enter recordings.

---

## 9. Responsive & SEO acceptance criteria

The site is one responsive codebase serving phone and desktop — most Meta-ad clicks land on phones, so **every page is designed mobile-first and desktop inherits**.

### 9.1 Responsive

- Breakpoints: default = phone (360–430 px design targets), `md` 768, `lg` 1024, `xl` 1280. **No horizontal scroll at 360 px on any page** — a hard gate.
- Product page: swipeable gallery on touch (scroll-snap; thumbnails on desktop); variant picker + price + add-to-cart inside the first phone viewport; sticky add-to-cart bar once it scrolls away.
- Cart: full-screen sheet on phone, side drawer on desktop. Checkout: single column on phone; Razorpay's modal is responsive out of the box.
- Tap targets ≥ 44 px. Forms use correct `inputmode`/`autocomplete` (pincode → numeric keypad, phone → `tel`, address autocomplete hints) — thumb-typing the checkout must not hurt.
- Admin is phone-usable too (you'll book shipments from anywhere): tables collapse to cards below `md`.

### 9.2 Performance budgets (Core Web Vitals)

Measured on the product page, mid-range Android over 4G: **LCP < 2.5 s · CLS < 0.1 · INP < 200 ms**. Lighthouse mobile ≥ 90 on Performance, SEO, Accessibility, Best Practices — a Phase 1 gate, re-verified at hardening.

- `next/image` everywhere: AVIF/WebP, explicit `sizes`, `priority` only on the LCP image, aspect-ratio boxes so nothing shifts.
- Fonts: ≤ 2 families via `next/font` (self-hosted, `display: swap`).
- Pixel + PostHog load after interactive; zero render-blocking third parties.

### 9.3 SEO

- Every indexable page is server-rendered (ISR) — full content without JavaScript.
- URLs: `/prints/[slug]` stable and human-readable; filter/sort query params **canonicalize to the clean URL** (no crawlable faceted explosion).
- Metadata via `generateMetadata`: unique title ≤ 60 chars (`<Print title> — Framed Print | Print Company`), description ≤ 155 chars, canonical, OG + Twitter card per product (the photograph itself as OG image).
- JSON-LD: `Product` + `Offer` (INR price, availability from stock, SKU) on product pages; `BreadcrumbList`; `Organization` + `WebSite` on home. Validated with Google's Rich Results test at hardening.
- `sitemap.xml` generated from live products; `robots.txt` blocks `/admin`, `/api`, `/order`. Submit to **Google Search Console and Bing Webmaster Tools** at launch; confirm indexing of the top pages in week 1.
- Alt text mandatory per image (the admin image manager enforces it), written for humans.
- Product story + specs are real crawlable text — photography sites often ship image-only pages that can't rank; this one won't be that.
- Single locale: `lang="en"`, no hreflang needed.

---

## 10. Security & privacy checklist

- RLS: anon role reads only live catalog; **zero anon policies** on orders/history/refunds/webhooks/rate_limits. All mutations via service-role in server code.
- `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `META_CAPI_TOKEN`, `ORDER_TOKEN_SECRET`, `RESEND_API_KEY`: server-only env vars — never `NEXT_PUBLIC_*`, never in client bundles (verify with a production build grep once).
- Webhook: raw-body HMAC before parsing; receipt tokens: constant-time compare; both secrets rotate independently.
- Card data never touches our servers — Razorpay's hosted modal handles collection (keeps us in the lightest PCI posture).
- Zod validation on every mutation input, shared schemas client/server; qty/line caps enforced server-side.
- Admin: middleware gate + per-action email allowlist re-check; server actions get Next's origin/CSRF protections; sessions are httpOnly cookies.
- Rate limits per §2 table. Vercel platform DDoS protection in front.
- Logs: order numbers as correlation ids; never log full addresses, tokens, or hashes-preimages. `webhook_events.payload` retains raw events (contains email/phone from Razorpay) — service-role only, acceptable; revisit retention post-launch.
- Privacy (India DPDP): privacy policy names Supabase/Vercel/Meta/PostHog/Razorpay/Resend as processors; checkout data used transactionally; marketing email only with the §3 consent checkbox; replay masking per §8.3.
- Backups: enable Supabase PITR/daily backups when upgrading to paid at launch.

---

## 11. Repository structure

```
/opt/ecom
├─ app/
│  ├─ (store)/
│  │  ├─ layout.tsx                    # header/cart-drawer/footer, pixel + posthog init
│  │  ├─ page.tsx                      # home
│  │  ├─ prints/page.tsx               # grid + filters
│  │  ├─ prints/[slug]/page.tsx        # product page (ISR, revalidateTag)
│  │  ├─ cart/page.tsx
│  │  ├─ checkout/page.tsx
│  │  ├─ order/[number]/page.tsx       # token-gated RSC + status polling island
│  │  ├─ about/page.tsx
│  │  └─ (policies)/privacy|terms|refunds|shipping|contact/page.tsx
│  ├─ admin/
│  │  ├─ login/page.tsx
│  │  ├─ page.tsx                      # dashboard
│  │  ├─ orders/page.tsx  orders/[id]/page.tsx
│  │  └─ products/page.tsx products/[id]/page.tsx
│  └─ api/
│     ├─ cart/validate/route.ts
│     ├─ checkout/route.ts
│     ├─ payment/verify/route.ts
│     ├─ orders/[number]/status/route.ts
│     ├─ webhooks/razorpay/route.ts
│     ├─ webhooks/nimbuspost/route.ts
│     ├─ track/route.ts                # export const runtime = 'edge'
│     └─ meta-feed/route.ts
├─ components/ ui/ store/ admin/
├─ lib/
│  ├─ supabase/ server.ts admin.ts client.ts
│  ├─ razorpay.ts  nimbuspost.ts  meta-capi.ts  posthog-server.ts
│  ├─ email/ send.ts
│  ├─ validation.ts                    # shared zod schemas
│  ├─ orders.ts                        # transitions, effects, receipt tokens
│  ├─ money.ts  config.ts
├─ emails/                             # react-email templates
├─ supabase/
│  ├─ migrations/ 001_core.sql 002_lifecycle.sql 003_shipping.sql
│  └─ seed.sql
├─ middleware.ts                       # anon_id, first_touch, admin gate
└─ next.config.ts                      # /ingest rewrites, image remotePatterns
```

---

## 12. Config constants (`lib/config.ts`)

| Constant | v1 value | Notes |
|---|---|---|
| `SHIPPING_FLAT_PAISE` | TBD (₹99–199 typical) | §2.2 step 7 |
| `FREE_SHIP_THRESHOLD_PAISE` | TBD | free-shipping nudge |
| `MAX_QTY_PER_LINE` | 10 | cart + zod |
| `MAX_CART_LINES` | 20 | cart + zod |
| `PENDING_ORDER_TTL_HOURS` | 24 | pg_cron expiry |
| `CONFIRMATION_POLL_SECONDS` | 60 | §2.3 |
| `LOW_STOCK_THRESHOLD` | 2 | admin dashboard |
| `SERVICEABILITY_TIMEOUT_MS` | 1500 | fail-open beyond this (§2.2 step 6) |
| `SERVICEABILITY_CACHE_HOURS` | 24 | §5.2 |
| `TRACKING_SWEEP_HOURS` | 6 | §5.4 reconciliation |

---

## 13. Open items that touch this spec

1. **GST registration** → invoice fields, tax-inclusive display, future invoice-PDF admin feature.
2. **PostHog region** (US/EU) → §2.9 rewrite hosts.
3. **Return window** → refund policy page + whether `shipped → refunded` needs a formal "return requested" state (v1: handled via notes + refund flow).
4. **Store domain** — brand is **Print Company** and mail sends from `info@swapnilsharma.in`, but where does the site live: `swapnilsharma.in`, a subdomain like `prints.swapnilsharma.in`, or a new Print Company domain? Needed for Vercel, canonical URLs, and OG links (email sending works regardless).
5. **Print-to-order vs stock** → if print-to-order: set `stock_qty` high, surface "ships in X days" on product page; oversold path becomes irrelevant.
6. **NimbusPost payload field names** — base URL, auth, and endpoints are verified against NimbusPost's official PHP SDK; exact create-shipment/serviceability request fields get locked from their Postman collection with one real test booking in Phase 3.
