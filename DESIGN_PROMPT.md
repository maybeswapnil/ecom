# Design prompt — Print Company storefront

Paste everything below to Claude (design mode).

---

I'm building a direct-to-consumer store that sells **framed prints of my own photographs**, shipping within India. Brand name: **Print Company**. I need a complete visual design for the customer-facing storefront — not a generic e-commerce template, something that feels like it belongs to a photographer selling fine-art prints.

## What this is

- Guest checkout only (no accounts), pay via Razorpay (UPI/cards/netbanking), ship via a courier aggregator.
- Catalog: photographs, each available in multiple sizes and frame finishes (e.g. black/white/oak/walnut), priced per size×finish combo.
- Most traffic arrives from Meta ads directly onto a single product's page — that page carries the whole conversion burden.
- Single locale (English), India-only, INR pricing.

## Pages to design (one cohesive system, not one-offs)

1. **Home (`/`)** — hero using the best framed-in-room shot, featured prints, a trust strip (secure payment / insured shipping / return window), a teaser into the photographer's story.
2. **Prints grid (`/prints`)** — filterable by orientation, size, tone/theme, price.
3. **Product page (`/prints/[slug]`)** — the most important page on the site. Needs:
   - Gallery: framed room-scale mockup, straight-on shot, frame-corner detail, side profile. Swipeable/scroll-snap on touch, thumbnails on desktop.
   - Variant picker (size → frame finish) with live price update.
   - Size guide with real-world wall context (cm + inches).
   - Paper/ink/frame spec block, delivery estimate, trust row.
   - Sticky add-to-cart bar once the primary CTA scrolls out of view on mobile.
4. **Cart** — full-screen sheet on phone, side drawer on desktop; free-shipping progress nudge; per-line states for price-changed/out-of-stock/unavailable.
5. **Checkout** — single page, single column on phone: contact → address → shipping → payment. Guest only, no account prompts.
6. **Order confirmation (`/order/[number]`)** — "confirming payment" state, then confirmed state with items, courier tracking checkpoint once shipped.
7. **About** — the photographer's story (real conversion lever for art sales).
8. Lightweight treatment for **policy pages** (privacy/terms/refunds/shipping/contact) — don't over-invest, but make them not look abandoned.

## Constraints that shape the design

- **Mobile-first, one codebase** — most ad clicks are phones; desktop is an enhancement, not a separate design. No horizontal scroll at 360px width, anywhere.
- **Performance is a design constraint, not just an engineering one**: LCP < 2.5s on mobile, so the hero/gallery treatment must work with one prioritized image, not a heavy hero video or a stack of blocking assets. Max two font families.
- **Tap targets ≥ 44px**, forms use correct mobile keyboards (numeric for pincode, tel for phone).
- Cards/photography need **real depth** — this is a product where the photograph itself is the hero; the UI should recede and let the image lead, but not go so minimal it becomes a generic template.

## Design direction

Propose a specific, opinionated visual direction — don't default to "clean minimal." Good candidates given the product (framed fine-art photography, gallery-quality feel): **editorial/magazine**, **gallery/museum presentation**, or **light luxury with disciplined contrast**. Pick one (or a deliberate blend), justify it in one paragraph, then commit to it consistently: palette, type pairing, spacing rhythm, and how imagery is framed/bordered/shadowed across every page — not just the hero.

Explicitly avoid: default centered-hero-with-gradient-blob, uniform card grids with no hierarchy, safe gray-on-white with one accent color, unmodified shadcn/ui defaults passed off as finished.

Show me, for each of the following, at least one concrete design decision (not just a description):
- Color palette (with real values, not "a warm neutral")
- Type pairing (specific families, one for display/editorial voice, one for UI/body)
- How the product photo is presented as an object (frame/mat/shadow treatment around the image itself — since these are literally framed prints, the site chrome can echo that)
- Hover/focus/active states for the variant picker and add-to-cart
- How price, size, and frame-finish selection are laid out together without feeling like a spec sheet

## Deliverable

Give me: the style direction and rationale, the token set (colors/type/spacing scale), and a full design pass on the home page and product page in detail (these two carry the most weight), with the other pages described at a level that lets me extend the same system consistently.
