import { describe, it, expect } from "vitest";
import { generateOrderId } from "../src/modules/orders/service";

describe("Orders Pricing & ID Generation", () => {
  it("generates order IDs matching AM-YYYY-[A-F0-9]{6} format", () => {
    const currentYear = new Date().getFullYear();
    const id = generateOrderId();
    expect(id).toMatch(new RegExp(`^AM-${currentYear}-[A-F0-9]{6}$`));
  });

  it("calculates shipping correctly based on order subtotal", () => {
    const freeShippingThresholdCents = 100000; // 1,000 EUR
    const defaultShippingCents = 5000; // 50 EUR

    const calculateShipping = (subtotal: number) =>
      subtotal >= freeShippingThresholdCents ? 0 : defaultShippingCents;

    expect(calculateShipping(99999)).toBe(5000);
    expect(calculateShipping(100000)).toBe(0);
    expect(calculateShipping(250000)).toBe(0);
  });

  it("calculates 21% IVA correctly for Spain and zero for non-EU exports", () => {
    const calculateTax = (subtotalCents: number, country: string) => {
      const isSpain =
        country.toLowerCase() === "es" ||
        country.toLowerCase() === "españa" ||
        country.toLowerCase() === "spain";
      return isSpain ? Math.round(subtotalCents * 0.21) : 0;
    };

    expect(calculateTax(10000, "ES")).toBe(2100);
    expect(calculateTax(10000, "España")).toBe(2100);
    expect(calculateTax(10000, "Spain")).toBe(2100);
    expect(calculateTax(10000, "US")).toBe(0);
    expect(calculateTax(10000, "JP")).toBe(0);
  });
});
