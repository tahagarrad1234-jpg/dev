// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "../src/pages/forgot-password";
import ResetPasswordPage from "../src/pages/reset-password";
import CheckoutPage from "../src/pages/checkout";
import { Providers } from "../src/app/providers";

describe("Password Recovery & Checkout Buttons Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("submits forgot password form and reveals success state", async () => {
    // Mock fetch for /api/auth/forgot-password
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Instrucciones enviadas",
        resetLink: "http://localhost:5173/reset-password?token=mock_test_token_123",
      }),
    } as any);

    render(
      <Providers>
        <ForgotPasswordPage />
      </Providers>,
    );

    const emailInput = screen.getByPlaceholderText("tu@ejemplo.com");
    fireEvent.change(emailInput, { target: { value: "atelier@amalwatches.com" } });

    const submitBtn = screen.getByRole("button", { name: /Enviar enlace de recuperación/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Instrucciones enviadas/i)).toBeDefined();
      expect(screen.getByText(/Abrir enlace de restablecimiento/i)).toBeDefined();
    });
  });

  it("shows error on reset password page if passwords do not match", async () => {
    // Simulate token query param
    window.history.pushState({}, "Reset", "/reset-password?token=mock_test_token_123");

    render(
      <Providers>
        <ResetPasswordPage />
      </Providers>,
    );

    const passInput = screen.getByPlaceholderText("Mínimo 10 caracteres");
    const confirmInput = screen.getByPlaceholderText("Repite tu nueva contraseña");

    fireEvent.change(passInput, { target: { value: "SuperSecurePass123" } });
    fireEvent.change(confirmInput, { target: { value: "DifferentPass456" } });

    const submitBtn = screen.getByRole("button", { name: /Actualizar contraseña/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeDefined();
    });
  });

  it("applies luxury promo code in checkout summary and computes discount", async () => {
    // Populate cart in localStorage with proper key
    localStorage.setItem(
      "amal_cart_v1",
      JSON.stringify([
        {
          id: 1,
          name: "Amal Chrono Sovereign",
          collection: "Haute Horlogerie",
          price: 2400,
          quantity: 1,
          image: "/images/sovereign.jpg",
        },
      ]),
    );

    render(
      <Providers>
        <CheckoutPage />
      </Providers>,
    );

    const promoInput = screen.getByPlaceholderText(/Código de cortesía/i);
    const applyBtn = screen.getByRole("button", { name: /Aplicar/i });

    // Test valid code: ATELIER10 (10% of 2400 = 240€)
    fireEvent.change(promoInput, { target: { value: "ATELIER10" } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/10% Cortesía Atelier/i)).toBeDefined();
      expect(screen.getByText(/-240\s?€/i)).toBeDefined();
    });
  });
});
