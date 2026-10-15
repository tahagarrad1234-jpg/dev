import app from "./app";
import { logger } from "./lib/logger";
import { config } from "./config";

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "Server listening");
});

