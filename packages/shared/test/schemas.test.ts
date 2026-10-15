import { describe, it, expect } from "vitest";
import {
  ProductSchema,
  OrderSchema,
  OrderItemSchema,
  SEED_PRODUCTS,
  centsToEuros,
  eurosToCents,
  money,
} from "../src/index";

describe("Shared Contracts & Schemas", () => {
  describe("ProductSchema", () => {
    it("validates a complete product payload", () => {
      const validProduct = {
        id: 1,
        slug: "the-meridian",
        name: "The Meridian",
        collection: "No. 01 / Automatic",
        category: "Dress",
        priceCents: 124000,
        price: 1240,
        image: "https://example.com/watch.webp",
        tone: "bone",
        description: "A quietly proportioned automatic in brushed steel.",
        stock: 12,
        isPublished: true,
      };

      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("rejects invalid categories", () => {
      const invalidProduct = {
        id: 2,
        slug: "invalid-watch",
        name: "Test Watch",
        collection: "Test",
        category: "DigitalSmartWatch",
        priceCents: 10000,
        price: 100,
        image: "/test.webp",
        tone: "Steel",
        description: "Test description",
        stock: 1,
      };

      const result = ProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it("validates all SEED_PRODUCTS match the ProductSchema", () => {
      for (const product of SEED_PRODUCTS) {
        const parsed = ProductSchema.safeParse(product);
        expect(parsed.success).toBe(true);
      }
    });
  });

  describe("Order & Item Schemas", () => {
    it("validates valid order items", () => {
      const item = {
        productId: 1,
        productName: "The Meridian",
        unitPriceCents: 124000,
        quantity: 2,
      };
      const result = OrderItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it("rejects non-positive quantities", () => {
      const item = {
        productId: 1,
        productName: "The Meridian",
        unitPriceCents: 124000,
        quantity: 0,
      };
      const result = OrderItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it("validates complete order object", () => {
      const order = {
        id: "AM-2026-AB12CD",
        customerName: "Carlos Gómez",
        email: "carlos@example.com",
        phone: "+34 600 000 000",
        address: "Paseo de Gracia 42",
        city: "Barcelona",
        postalCode: "08007",
        country: "ES",
        paymentMethod: "card",
        status: "pending",
        subtotalCents: 124000,
        shippingCents: 0,
        taxCents: 26040,
        totalCents: 124000,
        total: 1240,
        createdAt: new Date().toISOString(),
      };
      const result = OrderSchema.safeParse(order);
      expect(result.success).toBe(true);
    });
  });

  describe("Money and currency formatting helpers", () => {
    it("converts cents to euros correctly", () => {
      expect(centsToEuros(124000)).toBe(1240);
      expect(centsToEuros(98050)).toBe(980.5);
    });

    it("converts euros to cents correctly", () => {
      expect(eurosToCents(1240)).toBe(124000);
      expect(eurosToCents(980.5)).toBe(98050);
    });

    it("formats money with Intl.NumberFormat es-ES", () => {
      const formatted = money(1240);
      expect(formatted).toContain("1240");
      expect(formatted).toContain("€");

      const formattedLarge = money(12500);
      expect(formattedLarge).toContain("12");
      expect(formattedLarge).toContain("€");
    });
  });
});
