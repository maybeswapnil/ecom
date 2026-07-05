# Framed Prints Store — Build Plan

**Print Company** — a direct-to-consumer store selling framed prints of your photographs. Customers browse prints, pick a size and frame, pay through Razorpay (UPI / cards / netbanking); shipping is booked and tracked through NimbusPost; every sale reports back to Meta with clean attribution and into PostHog for funnel analysis. The site is **mobile-first responsive** (most Meta-ad clicks are phones; desktop inherits) with **SEO as a launch gate**, not an afterthought.

Written 2026-07-04. Project root: `/opt/ecom` (currently empty — greenfield).

> **Companion doc:** [`SPEC.md`](SPEC.md) is the implementation-level contract — every API endpoint (request/response/errors), the auth & session model, cart rules, the order state machine, the NimbusPost shipping integration, the admin spec, emails, exact tracking payloads, and responsive/SEO acceptance criteria. This file stays at roadmap level; when building, SPEC.md wins on detail.

---

## 1. Stack and who does what

| Layer | Tech | Responsibility |
|---|---|---|
| Storefront + hosting | **Next.js (App Router) on Vercel** | Pages, API route handlers, edge functions, image optimization |
| Database / storage / auth | **Supabase** | Catalog, orders, product images (Storage), admin login (Auth) |
| Payments | **Razorpay** | Checkout modal, Orders API, webhooks — INR |
| Product analytics | **PostHog** | Funnels, session replay, server-side purchase events |
| Ads + attribution | **Meta Pixel + Conversions API** | Browser events + server postbacks, deduplicated |
| Shipping | **NimbusPost** | Pincode serviceability at checkout, booking + labels from admin, tracking webhooks → order status |
| Transactional email | **Resend** | Order/shipping/refund emails, all sent as `info@swapnilsharma.in` |

Next.js and Resend are the two pieces not on your list — Next.js because it's the default framework for Vercel and what everything above integrates with most cleanly; Resend because the stack otherwise has no way to send order emails. UI: Tailwind CSS + shadcn/ui.

Email sends from **`info@swapnilsharma.in`**: the domain gets verified in Resend with additive DNS records (DKIM + a return-path subdomain), so any existing mailbox on swapnilsharma.in keeps working untouched. Shipping is **NimbusPost via API from day one** — serviceability check at checkout, one-click booking + label from the admin, tracking webhooks advancing order status automatically — with a manual-AWB fallback whenever the aggregator is down (details in SPEC.md §5).

---

## 2. Architecture

```
                         ┌────────────────── Vercel ──────────────────┐
Shopper ───────────────► │ Next.js storefront (ISR product pages)     │◄── Supabase (catalog, images)
   │ browse / cart       │                                            │
   │                     │ /api/checkout          (Node runtime) ─────┼──► Supabase: order (pending)
   │                     │                                        └───┼──► Razorpay: create Order
   │ pays in modal ────► │ Razorpay Checkout (client-side modal)      │
   │                     │ /api/payment/verify    (Node) — optimistic │
   │ every event ──────► │ /api/track             (EDGE runtime) ─────┼──► Meta CAPI + PostHog
   │                     └────────────────────────────────────────────┘
   │
Razorpay ── webhook ───► /api/webhooks/razorpay (Node) ── SOURCE OF TRUTH
                             ├─► mark order paid, decrement stock
                             ├─► Meta CAPI `Purchase` (dedup via event_id)
                             ├─► PostHog `purchase` (server-side)
                             └─► confirmation email (Resend, from info@swapnilsharma.in)

Admin "Book shipment" ─────► NimbusPost API (rates → create shipment → AWB + label)
NimbusPost ── tracking ────► /api/webhooks/nimbuspost (Node) ── verified by re-polling
                webhook          └─► order packed → shipped → delivered (+ shipping email)

Supabase pg_cron / Edge Functions: tracking reconciliation sweep (6 h), stale-order
expiry, Meta catalog feed refresh, abandoned-checkout emails (post-launch).
```

Where the "edge functions" requirement lands:

- **`/api/track` runs on the Vercel Edge runtime** — the client-event postback endpoint. It has direct access to the visitor's IP and user-agent headers (needed for Meta match quality) and is low-latency.
- **The Razorpay webhook runs on the Node runtime** — it needs the raw request body for HMAC signature verification, which is awkward on edge.
- **Supabase Edge Functions** are reserved for scheduled/async jobs later (feed regeneration, abandoned-cart emails via pg_cron).

---

## 3. Decisions (recommended defaults — flag anything you disagree with)

| Decision | Default | Why |
|---|---|---|
| Customer accounts | **Guest checkout only** at launch | Accounts add friction and build time; email+phone is enough to fulfil orders. Supabase Auth is used only to gate `/admin`. |
| Cart | Client-side (localStorage, e.g. zustand) | No login needed; server **re-prices everything from the DB at checkout** — client totals are never trusted. |
| Market | India only, INR only | Matches Razorpay. International is a later toggle. |
| Shipping fee (buyer-facing) | Flat rate + free above ₹X | Simple to advertise; NimbusPost's actual per-shipment cost is stored on each order, so margin stays visible. |
| Shipping ops | NimbusPost API: serviceability at checkout, booking from admin, webhook tracking | One aggregator, many couriers; manual-AWB fallback stays. |
| Layout | Mobile-first responsive, one codebase | Meta ad traffic is mostly phones; desktop inherits. Acceptance criteria in SPEC.md §9. |
| COD | **No** | Fragile, high-value product; COD refusals are expensive. |
| Prices | Stored in **paise** (integers) | Avoids float bugs; Razorpay wants paise anyway. |
| Admin | Supabase Studio for product entry at first; minimal `/admin` for orders (Phase 2) + NimbusPost booking (Phase 3) | Don't build an admin panel before the store sells. |
| Stock model | `stock_qty` per variant | If you actually print-to-order, set high qty and show "ships in X days" instead (open question #2). |

---

## 4. Data model (Supabase Postgres)

```sql
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  story       text,                         -- where/how the photo was shot; sells art
  tags        text[] default '{}',
  images      jsonb not null default '[]',  -- storage paths; first = hero
  status      text not null default 'draft',-- draft | live | archived
  created_at  timestamptz default now()
);

create table product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products,
  sku           text unique not null,       -- also the Meta catalog id — keep stable
  size_label    text not null,              -- '12×18 in', 'A3', ...
  frame_finish  text not null,              -- black | white | oak | walnut
  price_paise   int  not null,
  compare_at_paise int,
  stock_qty     int  not null default 0,
  weight_g      int, width_mm int, height_mm int, depth_mm int,  -- for shipping
  active        boolean not null default true
);

create table orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text unique not null,        -- human-readable, e.g. FP-1042
  status             text not null default 'pending',
                     -- pending | paid | packed | shipped | delivered | cancelled | refunded
  email              text not null,
  phone              text not null,
  shipping_address   jsonb not null,
  subtotal_paise     int not null,
  shipping_paise     int not null default 0,
  discount_paise     int not null default 0,
  total_paise        int not null,
  razorpay_order_id  text unique,
  razorpay_payment_id text,
  purchase_event_id  text not null,               -- Meta dedup: shared by Pixel + CAPI
  attribution        jsonb default '{}',          -- fbp, fbc, fbclid, utm_*, ph_distinct_id,
                                                  -- ip, ua, landing_page
  created_at         timestamptz default now(),
  paid_at            timestamptz
);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders,
  variant_id       uuid not null references product_variants,
  title_snapshot   text not null,
  sku_snapshot     text not null,
  unit_price_paise int not null,
  qty              int not null
);

create table webhook_events (          -- idempotency ledger: Razorpay retries deliveries
  id           text primary key,      -- razorpay event id
  payload      jsonb not null,
  processed_at timestamptz default now()
);
```

**Row Level Security:** enabled on every table. Anon role may `select` only `products` with `status = 'live'` and `product_variants` with `active = true`. Orders and everything else have **no anon policies** — all writes and order reads go through server code using the service-role key. The order confirmation page authenticates with a signed token (`HMAC(order_number, ORDER_TOKEN_SECRET)`) generated at checkout, so only the buyer's link works.

**Storage:** bucket `product-images` (public read). Upload originals ~2048px; `next/image` on Vercel handles resizing/AVIF. Store paths in `products.images`.

---

## 5. Site map (MVP)

| Route | Notes |
|---|---|
| `/` | Hero (your best framed-in-room shot), featured prints, trust strip, about teaser |
| `/prints` | Grid + filters (orientation, size, tone/theme, price) |
| `/prints/[slug]` | **The ad landing page — most important page on the site.** Gallery: framed room-scale mockup, straight-on shot, frame-corner detail, side profile. Variant picker (size → frame finish) with live price. Size guide with wall context (cm + inches). Paper/ink/frame specs. Delivery estimate. Trust row (secure payment, insured shipping, return window). |
| `/cart` | Plus a slide-out drawer from the header |
| `/checkout` | Single page: contact → address → shipping → Razorpay modal. Guest only. |
| `/order/[number]?t=<token>` | Confirmation + live status, with courier checkpoint + tracking link once shipped |
| `/about` | The photographer's story — a real conversion lever when selling art |
| `/contact`, `/privacy`, `/terms`, `/refunds`, `/shipping` | **Required** — Razorpay live-mode approval reviews these, and Meta ad review checks them too |
| `/admin` | Phases 2–3, Supabase-Auth-gated: orders list, one-click NimbusPost booking (rates → AWB → label), status timeline, product quick-edit |

API routes: `/api/checkout`, `/api/payment/verify`, `/api/webhooks/razorpay`, `/api/webhooks/nimbuspost`, `/api/track` (edge), `/api/meta-feed` (post-launch), `/ingest/*` (PostHog proxy rewrite).

**Responsive & SEO baked in:** every page mobile-first and server-rendered; Product JSON-LD (`Product` + `Offer`, INR, availability), per-product OG images (the photo itself), `sitemap.xml` + Search Console/Bing submission, canonical URLs (filter params canonicalize to the clean URL), descriptive alt text, ISR with on-demand revalidation. Photography sites live or die by LCP — Core Web Vitals budgets (LCP < 2.5 s on mobile) are a Phase 1 gate. Full acceptance criteria: SPEC.md §9.

---

## 6. Payments — Razorpay flow

1. **`POST /api/checkout`** — client sends cart (SKUs + quantities) and contact/address. Server re-fetches prices from the DB, validates stock, computes total, creates the `orders` row (`status = pending`, generates `order_number`, `purchase_event_id`, signed token), creates a **Razorpay Order** (amount in paise, `receipt = order_number`), stores `razorpay_order_id`. Returns order id + Razorpay key id.
2. Client opens **Razorpay Checkout** (`checkout.razorpay.com/v1/checkout.js`) with that `order_id`, prefilled email/phone.
3. On success handler → **`POST /api/payment/verify`** with `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`. Server verifies the HMAC-SHA256 signature and optimistically shows the confirmation page. *This is UX only, not the source of truth.*
4. **`POST /api/webhooks/razorpay`** — verify `X-Razorpay-Signature` against the webhook secret on the **raw body**. Handle `payment.captured` / `order.paid`, `payment.failed`, `refund.processed`. Insert event id into `webhook_events` first — if it already exists, exit (Razorpay retries deliveries). On paid: set `paid_at`, decrement stock, send confirmation email, fire CAPI `Purchase` + PostHog `purchase`. The webhook catches buyers who pay and close the tab before redirect.

**Razorpay config checklist:** live KYC approved · webhook URL + secret set (test and live are separate) · payment methods enabled (UPI, cards, netbanking, wallets) · **auto-capture** on · test keys during development.

**Test matrix (all must pass in test mode before going live):**

- UPI success · card success · payment failure → order stays `pending`, cart intact
- User closes modal without paying → nothing charged, no email
- User pays, kills tab before redirect → webhook still marks paid + email sent
- Duplicate webhook delivery → processed once
- Refund from Razorpay dashboard → `refund.processed` → status `refunded`

---

## 7. Tracking — Meta Pixel + CAPI + PostHog

Three principles: **the Purchase truth lives server-side** (browser events lose 20–40% to iOS/ad-blockers), **every event carries an `event_id`** shared between Pixel and CAPI so Meta deduplicates, and **attribution is captured early** so the webhook can fire a rich Purchase even if the buyer never returns to the site.

### Event map

| Event | Pixel (browser) | CAPI (server, via `/api/track` edge) | PostHog | Fires when |
|---|---|---|---|---|
| `PageView` | ✅ | — | `$pageview` (auto) | every page |
| `ViewContent` | ✅ | ✅ | `product_viewed` | product page |
| `AddToCart` | ✅ | ✅ | `add_to_cart` | add to cart |
| `InitiateCheckout` | ✅ | ✅ | `checkout_started` | checkout page |
| `AddPaymentInfo` | ✅ | ✅ | `payment_opened` | Razorpay modal opens |
| `Purchase` | ✅ on confirmation page (`event_id = purchase_event_id`) | ✅ **from the Razorpay webhook** — source of truth, same `event_id` | `purchase` (server, posthog-node) | payment captured |

All commerce events carry `content_ids: [sku]`, `content_type: 'product'`, `value`, `currency: 'INR'`; Purchase adds `contents` + `num_items`. **SKU is the id everywhere** — it must match the catalog feed later or dynamic ads won't map.

### Attribution capture

On first landing, persist `fbclid` + `utm_*` + landing page. At checkout submit, snapshot onto `orders.attribution`: `_fbp`, `_fbc` cookies, `fbclid`, UTMs, PostHog `distinct_id`, client IP, user agent. The webhook builds the CAPI Purchase from this row: `user_data` with SHA-256-hashed email, phone (E.164), first/last name, city, state, pincode, country + raw `client_ip_address`, `client_user_agent`, `fbp`, `fbc`; `action_source: 'website'`, `event_source_url`. **Target Event Match Quality ≥ 6** on Purchase.

### PostHog specifics

- `posthog-js` loaded through a **reverse proxy**: Vercel rewrite `/ingest/*` → PostHog cloud (pick US or EU region — open question). Ad-blockers kill direct calls.
- **Session replay on, with input masking on `/checkout`** — never record addresses/phones.
- Server-side `purchase` from the webhook via `posthog-node`, using the `distinct_id` stored on the order — the funnel `product_viewed → add_to_cart → checkout_started → purchase` then closes even for tab-killers.
- Post-launch: feature flags for A/B tests (hero images, price anchoring).

### Verification (Phase 3 gate)

Meta Events Manager → Test Events (use `test_event_code` in dev): every event appears once with the "Deduplicated" label; one test-mode order produces **exactly one** Purchase. PostHog Live Events shows the same flow under one person.

### Meta business setup checklist

Business Manager · FB page + Instagram linked · ad account · **domain verified** · Pixel/dataset created · CAPI access token generated · web events configured (prioritize Purchase) · payment method on the ad account · catalog feed = post-launch (see §10).

---

## 8. Content you need to prepare (your side)

- **Per product:** framed lifestyle shot (in a room), straight-on shot, corner detail, side profile — consistent aspect ratio, sRGB, ~2048px longest edge. Title, 2–3 sentence story, tags.
- **Once:** paper + ink spec (archival?), frame material/glazing spec (glass vs acrylic — acrylic ships far safer), size chart, logo (brand: **Print Company**), store-domain decision (open question #1), About page text/portrait, policy texts (privacy, terms, refund window, shipping times), support contact (`info@swapnilsharma.in` + phone?).
- **Pricing:** per size × frame-finish combo, packed weight + box dimensions per size (for courier rates), flat shipping fee + free-shipping threshold.

---

## 9. Build order

**Phase 0 — Setup (~half a day + account lead times).** Scaffold Next.js + Tailwind + shadcn/ui in `/opt/ecom`, git init, deploy to Vercel with the store domain (open question #1) + coming-soon page. Create Supabase project (migrations 001–003, RLS, storage bucket). PostHog project + `/ingest` proxy. Meta BM + pixel + domain verification (just DNS — do it now, verification can lag). Razorpay test keys. **Resend: verify `swapnilsharma.in`** (additive DNS records — existing mail untouched). **NimbusPost: KYC, wallet top-up, register the pickup address, configure the tracking webhook URL, confirm API login works.** All env vars in Vercel.
*Done when: domain serves the app, Supabase reachable, PostHog receives a pageview, a test email arrives from `info@swapnilsharma.in`, and one NimbusPost serviceability call succeeds.*

**Phase 1 — Catalog (2–3 days).** Products + variants seeded with your real images and copy. Shop grid with filters, product page with variant picker, cart drawer + page — built to the SPEC.md §9 responsive/SEO criteria.
*Done when: full launch catalog is live-browsable, product-page Lighthouse mobile ≥ 90 in all four categories, and no page scrolls horizontally at 360 px.*

**Phase 2 — Checkout & payments (2–3 days).** Checkout page, `/api/checkout`, Razorpay modal, verify endpoint, webhook with idempotency, stock decrement, Resend confirmation email, tokened confirmation page, minimal `/admin` orders list.
*Done when: every row of the §6 test matrix passes in test mode.*

**Phase 3 — Shipping via NimbusPost (1–2 days).** `lib/nimbuspost.ts` client, serviceability gate at checkout (cached, fail-open), admin booking flow (rate table → book → label download), tracking webhook + verify-by-re-poll + 6-hour reconciliation sweep, shipping email on pickup, RTO alerts, manual-AWB fallback. **Apply for Razorpay live mode now** — policies and catalog are live, and approval takes days.
*Done when: a test order books a real shipment (cancelled afterwards), the label downloads, a simulated tracking webhook advances packed → shipped → delivered, and the sweep converges with webhooks disabled.*

**Phase 4 — Tracking & attribution (1–2 days).** Pixel snippet + `/api/track` edge forwarder + dedup, attribution capture, webhook-driven CAPI Purchase + PostHog server purchase, replay masking.
*Done when: §7 verification passes, EMQ ≥ 6.*

**Phase 5 — Launch hardening (1–2 days).** JSON-LD validates (Rich Results test), sitemap submitted to Search Console + Bing, OG images, alt-text pass, 404/error pages, rate limits verified, swap to Razorpay live keys + live webhook secret, place one real ₹-small order end-to-end — payment, booking, delivery tracking — and refund it.
*Done when: real money went through the whole pipeline — DB, email, Meta, PostHog, NimbusPost — exactly once, and the refund flowed back.*

**Phase 6 — Ads & iteration (ongoing).** `/api/meta-feed` product feed (SKU-matched) → Meta catalog → Advantage+ / DPA retargeting. First campaigns. PostHog funnel review after ~2 weeks of traffic. Then: discount codes, abandoned-checkout emails (Supabase Edge Function + pg_cron), reviews, delivered-notification email, international.

**Total to launch-ready: roughly 8–13 focused days.**

---

## 10. Environment variables

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | anon key is RLS-bound, safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | never ships to the client bundle |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | client | key id is public |
| `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | server only | test + live pairs differ |
| `META_PIXEL_ID` | client | |
| `META_CAPI_TOKEN` / `META_TEST_EVENT_CODE` | server only | test code only in dev |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | client | host = `/ingest` proxy |
| `RESEND_API_KEY` | server only | |
| `ORDER_TOKEN_SECRET` | server only | signs confirmation-page tokens |
| `NIMBUSPOST_EMAIL` / `NIMBUSPOST_PASSWORD` | server only | mints the NimbusPost Bearer token (cached; re-login on 401) |
| `NIMBUSPOST_WEBHOOK_KEY` | server only | secret key in the tracking-webhook URL |
| `PICKUP_PINCODE` | server | origin pincode for serviceability checks |
| `EMAIL_FROM` | server | `Print Company <info@swapnilsharma.in>` |
| `ADMIN_NOTIFY_EMAIL` | server | `info@swapnilsharma.in` — new-order + RTO/exception alerts |
| `NEXT_PUBLIC_SITE_URL` | both | canonical URLs, CAPI `event_source_url` |

---

## 11. Gotchas & risks

- **Razorpay live approval is a chicken-and-egg**: they review a live site with policies and real catalog. Sequence: deploy catalog + policies first, apply during Phase 3.
- **Never trust the client's total.** Re-price from the DB in `/api/checkout`. The client sends SKUs and quantities, nothing else that matters.
- **Webhooks retry.** Idempotency via `webhook_events` before any side effect.
- **The verify endpoint is UX, the webhook is truth.** Buyers pay and vanish; the webhook still lands.
- **Meta dedup:** generate `purchase_event_id` at checkout-create time, store it, use the *same id* on the confirmation-page Pixel fire and the webhook CAPI fire.
- **Fragile product:** prefer acrylic glazing for shipping, corner protectors + double-box, insure above a threshold. Budget packaging cost into pricing.
- **Free-tier fine print:** Vercel Hobby disallows commercial use — move to Pro at launch. Supabase free pauses after a week idle — fine while building, upgrade at launch. PostHog free tier (1M events/mo) is plenty.
- **GST:** if you're registered, prices display tax-inclusive and invoices need your GSTIN (open question #3).
- **Session replay privacy:** mask checkout inputs; don't send raw PII as PostHog properties.
- **Refunds:** decide restock-on-refund policy before it first happens.
- **Volumetric weight:** couriers bill max(dead weight, length×breadth×height in cm ÷ 5000). Framed prints are light but bulky — volumetric almost always wins. Measure boxes honestly or eat weight-discrepancy penalties later.
- **NimbusPost wallet is prepaid** — bookings fail quietly at ₹0 balance; keep it topped up.
- **NimbusPost webhooks are hints, not truth** — they're unsigned, so each one is verified by re-polling the tracking API, and a 6-hour sweep converges even if every webhook is missed (SPEC.md §5.4).
- **RTO happens even on prepaid** (bad pincode, refused delivery). Return shipping is your cost, and `returned` orders need a manual refund/restock decision.
- **Don't break your personal email:** Resend's records for `swapnilsharma.in` are additive (DKIM + return-path subdomain). Leave existing MX/SPF alone; add DMARC `p=none` if the domain has none.

---

## 12. Open questions (defaults assumed; answer whenever)

1. **Store domain?** Brand is **Print Company** and email sends from `info@swapnilsharma.in` — but does the site live at `swapnilsharma.in`, `prints.swapnilsharma.in`, or a new Print Company domain? Needed for the Phase 0 deploy, canonical URLs, and Meta domain verification.
2. **Print-to-order or from stock?** Changes stock handling and the delivery promise shown on product pages.
3. **GST registered?** Invoice + price display implications.
4. **Launch catalog size** — how many photographs × how many sizes/finishes? (Seeding effort and shop-grid design.)
5. **PostHog region** — US or EU?
6. **Return window** — offer returns on framed art? Needed for the refund policy and Razorpay approval.
