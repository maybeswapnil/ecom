import { describe, it, expect } from "vitest";
import { computeShippingQuote, type FreeShippingOffer } from "./offers";

const FLAT = 14900;
const NOW = new Date("2026-07-12T12:00:00Z").getTime();

const offer = (overrides: Partial<FreeShippingOffer> = {}): FreeShippingOffer => ({
  id: "offer-1",
  min_subtotal_paise: 750000,
  starts_at: null,
  ends_at: null,
  ...overrides,
});

describe("computeShippingQuote", () => {
  it("charges flat rate below the threshold", () => {
    const q = computeShippingQuote(749999, FLAT, offer(), NOW);
    expect(q.shippingPaise).toBe(FLAT);
    expect(q.freeShipThresholdPaise).toBe(750000);
    expect(q.appliedOfferId).toBeNull();
  });

  it("ships free exactly at the threshold", () => {
    const q = computeShippingQuote(750000, FLAT, offer(), NOW);
    expect(q.shippingPaise).toBe(0);
    expect(q.appliedOfferId).toBe("offer-1");
  });

  it("ships free above the threshold", () => {
    const q = computeShippingQuote(1000000, FLAT, offer(), NOW);
    expect(q.shippingPaise).toBe(0);
    expect(q.appliedOfferId).toBe("offer-1");
  });

  it("charges flat rate when no offer exists, with no threshold exposed", () => {
    const q = computeShippingQuote(1000000, FLAT, null, NOW);
    expect(q.shippingPaise).toBe(FLAT);
    expect(q.freeShipThresholdPaise).toBeNull();
    expect(q.appliedOfferId).toBeNull();
  });

  it("ignores an offer whose window has not started", () => {
    const q = computeShippingQuote(
      1000000,
      FLAT,
      offer({ starts_at: "2026-08-01T00:00:00Z" }),
      NOW
    );
    expect(q.shippingPaise).toBe(FLAT);
    expect(q.freeShipThresholdPaise).toBeNull();
  });

  it("ignores an offer whose window has ended", () => {
    const q = computeShippingQuote(1000000, FLAT, offer({ ends_at: "2026-07-01T00:00:00Z" }), NOW);
    expect(q.shippingPaise).toBe(FLAT);
    expect(q.freeShipThresholdPaise).toBeNull();
  });

  it("applies an offer inside its window", () => {
    const q = computeShippingQuote(
      800000,
      FLAT,
      offer({ starts_at: "2026-07-01T00:00:00Z", ends_at: "2026-08-01T00:00:00Z" }),
      NOW
    );
    expect(q.shippingPaise).toBe(0);
    expect(q.appliedOfferId).toBe("offer-1");
  });

  it("keeps the threshold visible below it so the progress bar can render", () => {
    const q = computeShippingQuote(100000, FLAT, offer(), NOW);
    expect(q.freeShipThresholdPaise).toBe(750000);
    expect(q.shippingPaise).toBe(FLAT);
  });

  it("treats a zero-subtotal cart as not qualifying", () => {
    const q = computeShippingQuote(0, FLAT, offer(), NOW);
    expect(q.shippingPaise).toBe(FLAT);
    expect(q.appliedOfferId).toBeNull();
  });
});
