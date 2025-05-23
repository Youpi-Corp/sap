import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { AuthError } from "./error";
import { UNAUTHORIZED, FORBIDDEN } from "../utils/response";
import { ROLES, RoleType, hasRole } from "../utils/roles";
import { roleService } from "../services/role";

// Role enum for backwards compatibility with old code 
// This will be removed in the future
export enum LegacyRole {
    Learner = 0,
    Teacher = 1,
    Conceptor = 2,
    Admin = 3,
}

// JWT claims interface 
export interface JwtClaims {
    sub: string; // User ID
    roles: string[]; // Array of user role names
    exp: number; // Expiration time
    iat: number; // Issued at time
}

// Environment variables with fallbacks for development
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const COOKIE_NAME = "auth_token";
const TOKEN_EXPIRY = "1d"; // 1 day

/**
 * Setup auth middleware plugin for Elysia
 * Adds authentication handling via JWT stored in HTTP-only cookies
 */
export function setupAuth() {
    return new Elysia({ name: "auth" })
        .use(cookie())
        .use(
            jwt({
                name: "jwt",
                secret: JWT_SECRET,
                exp: TOKEN_EXPIRY
            })
        ).derive({ as: 'global' }, ({ jwt, cookie, set }) => {
            return {                // Set JWT token as HTTP-only cookie
                setAuthCookie: async (userId: string | number) => {
                    // Get user's roles from the database
                    const userRoles = await roleService.getUserRoleNames(Number(userId));

                    // If user has no roles, assign default USER role
                    const roles = userRoles.length > 0 ? userRoles : [ROLES.USER];

                    // Create token with roles array
                    const token = await jwt.sign({
                        sub: userId.toString(),
                        roles: roles,
                        iat: Math.floor(Date.now() / 1000)
                    });

                    cookie[COOKIE_NAME].set({
                        value: token,
                        httpOnly: true,
                        path: "/",
                        maxAge: 86400, // 1 day in seconds
                        secure: true,
                        sameSite: "none"
                    });

                    return token;
                },

                // Remove auth cookie
                clearAuthCookie: () => {
                    cookie[COOKIE_NAME].remove();
                },

                // Get current user ID from token
                getCurrentUserId: async (): Promise<string | null> => {
                    try {
                        const token = cookie[COOKIE_NAME]?.value;

                        if (!token) return null;

                        const payload = await jwt.verify(token);
                        if (!payload || typeof payload !== "object") return null;

                        return payload.sub?.toString() || null;
                    } catch (err) {
                        console.error("Error verifying token:", err);
                        return null;
                    }
                },                // Middleware to require authentication
                requireAuth: async () => {
                    const token = cookie[COOKIE_NAME]?.value;

                    if (!token) {
                        set.status = 401;
                        throw new AuthError("Authentication required");
                    }

                    const payload = await jwt.verify(token);
                    if (!payload || typeof payload !== "object") {
                        cookie[COOKIE_NAME].remove();
                        set.status = 401;
                        throw new AuthError("Invalid authentication token");
                    }

                    // Handle both new format (roles array) and old format (single role)
                    let roles: string[];
                    if (Array.isArray(payload.roles)) {
                        roles = payload.roles;
                    } else if (payload.role) {
                        roles = [String(payload.role)];
                    } else {
                        roles = [ROLES.USER]; // Default
                    }

                    return {
                        sub: String(payload.sub || ''),
                        roles: roles,
                        exp: Number(payload.exp || 0),
                        iat: Number(payload.iat || 0)
                    };
                },// Helper to check if user has required roles
                guardRoles: (allowedRoles: RoleType[]) => {
                    const token = cookie[COOKIE_NAME]?.value;

                    if (!token) {
                        return UNAUTHORIZED;
                    }

                    // This is a synchronous check - we already have the token 
                    // We only check if user has the required role
                    try {
                        // We're just doing a basic check, actual verification is done in requireAuth
                        const parts = token.split('.');
                        if (parts.length !== 3) return UNAUTHORIZED;

                        // Very basic payload extraction - not for actual verification
                        const payload = JSON.parse(
                            Buffer.from(parts[1], 'base64').toString()
                        );

                        // Get user's roles from token
                        const userRoles = Array.isArray(payload.roles) ? payload.roles :
                            (payload.role ? [payload.role] : [ROLES.USER]); // Handle both new and old format

                        if (!hasRole(userRoles, allowedRoles)) {
                            return FORBIDDEN;
                        }
                    } catch (err) {
                        console.error("Error parsing token:", err);
                        return UNAUTHORIZED;
                    }

                    return null;
                }
            };
        })        // Add validation schema for token verification
        .model({
            authToken: t.Object({
                sub: t.String(),
                roles: t.Array(t.String()),
                exp: t.Number(),
                iat: t.Optional(t.Number())
            })
        });
}
