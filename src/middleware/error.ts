import { Elysia } from "elysia";
import { error, INTERNAL_ERROR } from "../utils/response";

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// Error for not found resources
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// Error for authentication failures
export class AuthError extends ApiError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

// Error for authorization failures
export class ForbiddenError extends ApiError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

/**
 * Set up error handling middleware for Elysia
 */
export function setupErrorHandler() {
  return new Elysia({ name: "errorHandler" }).onError(
    ({ code, error: err, path, set }) => {
      // Different error codes with specific handling
      switch (code) {
        case "NOT_FOUND":
          set.status = 404;
          console.log(`404 Not Found: ${path}`);
          return error(`Route not found: ${path}`, 404);

        case "VALIDATION":
          set.status = 400;
          console.error(`Validation Error:`, err.message);
          return error(err.message, 400);

        case "PARSE":
          set.status = 400;
          console.error(`Parse Error:`, err.message);
          return error("Invalid request format", 400);

        default:
          // Handle API errors
          if (err instanceof ApiError) {
            set.status = err.statusCode;
            return error(err.message, err.statusCode);
          }

          // Handle all other errors
          set.status = 500;
          const isProduction = process.env.NODE_ENV === "production";

          // In production, don't expose error details
          const message = isProduction
            ? "Internal server error"
            : err.message || "Unknown error";

          console.error(`Unhandled Error [${code}]:`, err);
          return error(message, 500);
      }
    }
  );
}
