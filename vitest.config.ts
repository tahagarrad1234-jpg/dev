import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@workspace/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environmentMatchGlobs: [
      ["apps/web/**", "jsdom"],
      ["**", "node"],
    ],
    env: {
      NODE_ENV: "test",
      SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-1234567890",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/amal_test",
      DATABASE_SSL: "disable",
      WEB_ORIGIN: "http://localhost:5173",
      PORT: "4000",
    },
  },
});
