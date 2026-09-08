import app from "./app";
import { logger } from "./lib/logger";
import { supabaseEnabled } from "./lib/auth-store";

if (!supabaseEnabled) {
  throw new Error(
    "Supabase is not configured. Copy .env.example to .env and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const rawPort = process.env["PORT"] || "4000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
