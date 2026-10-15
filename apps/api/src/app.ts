import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { config } from "./config";
import { errorHandler } from "./middlewares/error-handler";

const app: Express = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: config.WEB_ORIGIN,
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "100kb",
    verify: (req: any, _res, buf) => {
      if (req.originalUrl?.includes("webhook")) {
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.use("/api", router);

// JSON 404 handler for unmatched /api/* routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Global error handler
app.use(errorHandler);

export default app;

