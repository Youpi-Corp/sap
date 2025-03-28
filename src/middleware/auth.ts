import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { UNAUTHORIZED, FORBIDDEN } from "../utils/response";

// JWT claims interface
export interface JwtClaims {
  sub: string; // User email
  role: string; // User role as a string like "1000"
  exp: number; // Expiration time
}

// Role enum for readability
export enum Role {
  Learner = 0,
  Teacher = 1,
  Conceptor = 2,
  Admin = 3,
}

/**
 * Check if user has required roles
 * @param userRole User role string (e.g., "1000")
 * @param requiredRoles Array of required roles
 * @returns True if authorized, false otherwise
 */
function hasRequiredRoles(userRole: string, requiredRoles: Role[]): boolean {
  // Validate role string format
  if (!userRole || userRole.length !== 4 || !/^[01]{4}$/.test(userRole)) {
    return false;
  }

  // Admin check (position 3)
  if (userRole.charAt(3) === "1") {
    return true;
  }

  // Check specific roles
  return requiredRoles.some((role) => userRole.charAt(role) === "1");
}

/**
 * Set up auth middleware plugin for Elysia
 */
export function setupAuth() {
  const jwtSecret = process.env.JWT_SECRET || "default-secret-change-me";

  return (
    new Elysia({ name: "auth" })
      // Set up JWT plugin
      .use(
        jwt({
          name: "jwt",
          secret: jwtSecret,
          exp: "15m", // 15 minutes
        })
      )
      // Set up cookie plugin
      .use(cookie())
      // Add auth guard
      .derive(async ({ jwt, cookie, headers }) => {
        try {
          // Get token from cookie or Authorization header
          const tokenFromCookie = cookie.auth_token;

          const authHeader = headers.authorization;
          const tokenFromHeader =
            authHeader && authHeader.startsWith("Bearer ")
              ? authHeader.substring(7)
              : null;

          const token = tokenFromCookie || tokenFromHeader;

          if (!token) {
            return { user: null };
          }

          // Verify token
          const verifyResult = await jwt.verify(token);

          // Handle boolean result (verification failure)
          if (!verifyResult || typeof verifyResult === "boolean") {
            console.log("Token verification failed");
            return { user: null };
          }

          // Safe type casting after validation
          const user = verifyResult as unknown as JwtClaims;

          if (!user) {
            console.log("Token verification failed");
            return { user: null };
          }

          if (!user.sub) {
            console.log("Token missing subject (email)");
            return { user: null };
          }

          // Token is valid
          return { user };
        } catch (error) {
          console.error("Auth error:", error);
          return { user: null };
        }
      })
      // Add auth check functions
      .derive((ctx) => {
        return {
          // Check if user is authenticated
          isAuthenticated: () => {
            return !!ctx.user && !!ctx.user.sub;
          },

          // Check if user has any of the required roles
          hasRoles: (roles: Role[]) => {
            const user = ctx.user;
            if (!user || !user.role) return false;
            return hasRequiredRoles(user.role, roles);
          },
        };
      })
      // Guard middleware creator for routes
      .derive((ctx) => {
        return {
          // Middleware to require authentication
          guard: () => {
            if (!ctx.isAuthenticated()) {
              // Return the error response but don't set the status here
              // The route handler will use this response and set the status code
              return UNAUTHORIZED;
            }
            return null; // No error
          },

          // Middleware to require specific roles
          guardRoles: (roles: Role[]) => {
            if (!ctx.isAuthenticated()) {
              return UNAUTHORIZED;
            }

            if (!ctx.hasRoles(roles)) {
              return FORBIDDEN;
            }

            return null; // No error
          },
        };
      })
  );
}
