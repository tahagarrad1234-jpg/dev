import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

describe("Health Endpoints (Liveness)", () => {
  let app: any;

  beforeAll(async () => {
    // Provide test fallback env if not present
    process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_key";
    process.env.NODE_ENV = "test";

    const appModule = await import("../src/app");
    app = appModule.default;
  });

  it("GET /api/healthz returns 200 with status ok and uptime", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptimeSeconds");
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });

  it("GET /api/unmatched-route returns 404 with JSON error message", async () => {
    const res = await request(app).get("/api/unmatched-nonexistent-path");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Ruta no encontrada");
  });
});
