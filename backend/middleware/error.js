import multer from "multer";
import { ApiError } from "../utils/http.js";
export function notFound(req, res) {
  res
    .status(404)
    .json({
      success: false,
      data: null,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      error: "NOT_FOUND",
    });
}
export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error instanceof multer.MulterError)
    return res
      .status(400)
      .json({
        success: false,
        data: null,
        message: error.message,
        error: error.code,
      });
  if (error?.name === "ValidationError")
    return res
      .status(422)
      .json({
        success: false,
        data: null,
        message: "Validation failed.",
        error: Object.values(error.errors).map((e) => e.message),
      });
  if (error?.code === 11000)
    return res
      .status(409)
      .json({
        success: false,
        data: null,
        message: "A record with the same unique value already exists.",
        error: error.keyValue,
      });
  const status = error instanceof ApiError ? error.status : 500;
  res
    .status(status)
    .json({
      success: false,
      data: null,
      message: error.message || "Internal server error.",
      error: error.details || (status === 500 ? "INTERNAL_SERVER_ERROR" : null),
    });
}
