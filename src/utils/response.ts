/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Create a success response
 * @param data Response data
 * @param statusCode HTTP status code
 * @returns Formatted API response
 */
export function success<T>(data: T, statusCode = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

/**
 * Create an error response
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Formatted API error response
 */
export function error(message: string, statusCode = 400): ApiResponse<null> {
  return {
    success: false,
    error: message,
    statusCode,
  };
}

// Common error responses
export const UNAUTHORIZED = error("Unauthorized", 401);
export const FORBIDDEN = error("Forbidden", 403);
export const NOT_FOUND = error("Resource not found", 404);
export const INTERNAL_ERROR = error("Internal server error", 500);
