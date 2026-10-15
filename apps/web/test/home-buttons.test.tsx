// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../src/features/catalog/home";
import { Providers } from "../src/app/providers";

// Mock IntersectionObserver for scroll-reveal
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe("Landing Page — All Buttons & Interactive Features", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the landing page with authentic luxury layout and hero", () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    expect(screen.getByTestId("link-home")).toBeDefined();
    expect(screen.getByTestId("link-explore-collection")).toBeDefined();
    expect(screen.getByText(/Mide el tiempo/i)).toBeDefined();
  });

  it("tests category filter tabs and filtering", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const dressTab = screen.getByTestId("button-category-dress");
    expect(dressTab).toBeDefined();
    fireEvent.click(dressTab);
    expect(dressTab.classList.contains("active")).toBe(true);

    const allTab = screen.getByTestId("button-category-all-pieces");
    fireEvent.click(allTab);
    expect(allTab.classList.contains("active")).toBe(true);
  });

  it("tests search input and sort select", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const searchInput = screen.getByTestId("input-search");
    fireEvent.change(searchInput, { target: { value: "Meridian" } });
    expect((searchInput as HTMLInputElement).value).toBe("Meridian");

    const sortSelect = screen.getByTestId("select-sort");
    fireEvent.change(sortSelect, { target: { value: "Price: low to high" } });
    expect((sortSelect as HTMLSelectElement).value).toBe("Price: low to high");
  });

  it("tests adding a watch to cart and cart drawer controls (+, -, checkout)", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    // Click quick add on product 1
    const addBtn = screen.getByTestId("button-add-product-1");
    fireEvent.click(addBtn);

    // Cart drawer should open with 1 item
    await waitFor(() => {
      expect(screen.getByTestId("button-close-cart")).toBeDefined();
    });

    // Check quantity increase button
    const increaseBtn = screen.getByTestId("button-increase-1");
    fireEvent.click(increaseBtn);

    // Check quantity decrease button
    const decreaseBtn = screen.getByTestId("button-decrease-1");
    fireEvent.click(decreaseBtn);

    // Check checkout button
    const checkoutBtn = screen.getByTestId("button-checkout");
    expect(checkoutBtn).toBeDefined();

    // Close cart button
    const closeBtn = screen.getByTestId("button-close-cart");
    fireEvent.click(closeBtn);
  });

  it("tests favorite heart button and header favorites badge", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const favBtn = screen.getByTestId("button-favorite-1");
    fireEvent.click(favBtn);

    // Header counter should update to at least 1
    await waitFor(() => {
      const favBadge = screen.getByTestId("text-favorites-count");
      expect(favBadge.textContent).toBe("1");
    });
  });

  it("tests newsletter subscription button", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as any);

    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const emailInput = screen.getByTestId("input-newsletter-email");
    const subscribeBtn = screen.getByTestId("button-join-notes");

    fireEvent.change(emailInput, { target: { value: "atelier@amalwatches.com" } });
    fireEvent.click(subscribeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("status-notice")).toBeDefined();
    });
  });

  it("tests footer contact announcement button", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const contactBtn = screen.getByTestId("button-contact");
    fireEvent.click(contactBtn);

    await waitFor(() => {
      expect(screen.getByTestId("status-notice").textContent).toContain("info@amalwatches.com");
    });
  });

  it("tests mobile menu toggle button and navigation links", () => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const toggleBtn = screen.getByTestId("button-open-navigation");
    fireEvent.click(toggleBtn);

    const collLink = screen.getByTestId("link-collection");
    fireEvent.click(collLink);

    const atelierLink = screen.getByTestId("link-atelier");
    fireEvent.click(atelierLink);

    const journalLink = screen.getByTestId("link-journal");
    fireEvent.click(journalLink);
  });

  it("tests hero and manifesto explore links with smooth scrolling", () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const exploreBtn = screen.getByTestId("link-explore-collection");
    fireEvent.click(exploreBtn);

    const readStoryBtn = screen.getByTestId("link-read-story");
    fireEvent.click(readStoryBtn);
  });

  it("tests empty search state and clear filters button", async () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const searchInput = screen.getByTestId("input-search");
    fireEvent.change(searchInput, { target: { value: "xyznonexistentwatch" } });

    await waitFor(() => {
      expect(screen.getByTestId("button-clear-filters")).toBeDefined();
    });

    const clearBtn = screen.getByTestId("button-clear-filters");
    fireEvent.click(clearBtn);

    expect((searchInput as HTMLInputElement).value).toBe("");
  });

  it("tests opening empty cart drawer and clicking discover pieces button", async () => {
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <Providers>
        <Home />
      </Providers>,
    );

    const openCartBtn = screen.getByTestId("button-open-cart");
    fireEvent.click(openCartBtn);

    const discoverBtn = screen.getByTestId("button-discover-pieces");
    expect(discoverBtn).toBeDefined();
    fireEvent.click(discoverBtn);
  });
});

