import { describe, it, expect } from "vitest";
import { hashToken, SESSION_LIFETIME_MS } from "../src/lib/auth-store";

describe("Auth Store & Security Tokens", () => {
  it("computes deterministic SHA-256 token hash", () => {
    const rawToken = "amal_test_session_token_1234567890";
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 output is 64 hex characters
    expect(hash1).not.toBe(rawToken);
  });

  it("produces distinct hashes for different tokens", () => {
    const hashA = hashToken("token_alpha");
    const hashB = hashToken("token_beta");

    expect(hashA).not.toBe(hashB);
  });

  it("defines standard 7-day session lifetime", () => {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    expect(SESSION_LIFETIME_MS).toBe(sevenDaysInMs);
  });
});
