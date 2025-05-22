import { Elysia } from "elysia";
import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { cookie as cookiePlugin } from "@elysiajs/cookie";
import { UNAUTHORIZED, FORBIDDEN, type ApiResponse } from "../utils/response";

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

  // Admin check (position Role.Admin which is 3)
  if (userRole.charAt(Role.Admin) === "1") {
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
    new Elysia({ name: "auth" }) // Using name for robust type handling, removed seed: {}
      .use(
        jwtPlugin({
          name: "jwt", // This is crucial for context.jwt typing
          secret: jwtSecret,
          exp: "15m",
        })
      )
      .use(cookiePlugin())
      .derive(async ({ jwt, cookie, headers }) => {
        // Elysia should infer jwt and cookie from the plugins above
        // If 'jwt' is not found on the destructured context, type inference is failing.
        try {
          const tokenFromCookie = cookie.auth_token?.value;
          const authHeader = headers.authorization;
          const tokenFromHeader =
            authHeader && authHeader.startsWith("Bearer ")
              ? authHeader.substring(7)
              : null;
          const token = tokenFromCookie || tokenFromHeader;

          if (!token) {
            return { user: null };
          }

          // verify can return false if verification fails, or the payload (JwtClaims)
          const verifyResult = await jwt.verify(token);

          if (!verifyResult) {
            // This handles cases where verifyResult is false or null
            console.log("Token verification failed (jwt.verify returned falsy)");
            return { user: null };
          }

          // At this point, verifyResult should be JwtClaims if not falsy
          const user = verifyResult as unknown as JwtClaims;

          if (!user.sub) {
            console.log("Token missing subject (email)");
            return { user: null };
          }
          return { user };
        } catch (error) {
          // Catch errors from jwt.verify (e.g., malformed token, signature mismatch)
          console.error("Auth error during token verification:", error);
          return { user: null };
        }
      })
      .derive(({ user }) => {
        // user is inferred from the previous derive: JwtClaims | null
        const isAuthenticatedUser = !!user && !!user.sub;
        const currentUserRole = user?.role;

        const checkHasRoles = (requiredRoles: Role[]): boolean => {
          if (!isAuthenticatedUser || !currentUserRole) return false;
          return hasRequiredRoles(currentUserRole, requiredRoles);
        };

        return {
          isAuthenticated: (): boolean => isAuthenticatedUser,
          hasRoles: checkHasRoles,
          guardRoles: (requiredRoles: Role[]): ApiResponse<null> | undefined => {
            if (!isAuthenticatedUser) {
              return UNAUTHORIZED; // Assumes UNAUTHORIZED is an ApiResponse object
            }
            if (!checkHasRoles(requiredRoles)) {
              return FORBIDDEN; // Assumes FORBIDDEN is an ApiResponse object
            }
            return undefined; // Authorized
          },
        };
      })
  );
}
