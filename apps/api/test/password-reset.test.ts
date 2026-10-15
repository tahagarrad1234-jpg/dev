import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { config } from "../src/config";
import { sendPasswordResetEmail } from "../src/lib/email";

describe("Password Recovery & Reset Security", () => {
  const secretKey = config.SUPABASE_SERVICE_ROLE_KEY;

  function createTestToken(userId: string, email: string, expiresInMs: number = 3600000): string {
    const expiresAt = Date.now() + expiresInMs;
    const payload = `${userId}:${email.toLowerCase()}:${expiresAt}`;
    const sig = createHmac("sha256", secretKey).update(payload).digest("hex");
    return Buffer.from(`${payload}:${sig}`).toString("base64url");
  }

  function verifyTestToken(token: string): { userId: string; email: string } | null {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf-8");
      const parts = raw.split(":");
      if (parts.length !== 4) return null;
      const [userId, email, expiresAtStr, sig] = parts;
      const expiresAt = Number(expiresAtStr);
      if (!expiresAt || Date.now() > expiresAt) return null;

      const payload = `${userId}:${email}:${expiresAtStr}`;
      const expectedSig = createHmac("sha256", secretKey).update(payload).digest("hex");
      if (sig !== expectedSig) return null;

      return { userId, email };
    } catch {
      return null;
    }
  }

  it("generates and verifies a valid password reset token", () => {
    const token = createTestToken("user-12345", "client@amalwatches.com");
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = verifyTestToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("user-12345");
    expect(verified?.email).toBe("client@amalwatches.com");
  });

  it("rejects an expired password reset token", () => {
    // Generate token that expired 1 second ago
    const expiredToken = createTestToken("user-12345", "client@amalwatches.com", -1000);
    const verified = verifyTestToken(expiredToken);
    expect(verified).toBeNull();
  });

  it("rejects a tampered password reset token with altered email or userId", () => {
    const validToken = createTestToken("user-12345", "client@amalwatches.com");
    const raw = Buffer.from(validToken, "base64url").toString("utf-8");
    const parts = raw.split(":");

    // Tamper with userId
    const tamperedPayload = `user-hacker:${parts[1]}:${parts[2]}:${parts[3]}`;
    const tamperedToken = Buffer.from(tamperedPayload).toString("base64url");

    expect(verifyTestToken(tamperedToken)).toBeNull();
  });

  it("sends password reset email successfully with valid reset link", async () => {
    const link = "http://localhost:5173/reset-password?token=test_token_abc";
    const result = await sendPasswordResetEmail(
      "test@amalwatches.com",
      "Carlos Atelier",
      link,
    );

    expect(result).toBe(true);
  });
});
