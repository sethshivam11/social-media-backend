import { ApiError } from "../utils/ApiError";
import { Error } from "mongoose";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

interface ApiErrorInterface extends Error {
  statusCode: number;
  message: string;
  data: null;
  success: boolean;
  errors: string[];
  stack?: string;
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || Error ? 400 : 500;
    const message = error.message || "Something went wrong!";

    error = new ApiError(statusCode, message, error?.errors || [], err?.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
