import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { config } from "../config";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Error de validacion",
      details: err.errors,
    });
    return;
  }

  const statusCode =
    typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  const isProduction = config.NODE_ENV === "production";
  const errorMessage =
    isProduction && statusCode === 500
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor";

  res.status(statusCode).json({
    error: errorMessage,
  });
};

