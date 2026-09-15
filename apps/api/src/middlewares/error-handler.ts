import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  req.log.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Error de validacion",
      details: err.errors,
    });
    return;
  }

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
};
