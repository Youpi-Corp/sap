import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { UNAUTHORIZED, FORBIDDEN } from "../utils/response";
import { db } from "../db/client";
import {
  roles,
  userRoles,
  permissions,
  rolePermissions,
  users,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

// JWT claims interface
export interface JwtClaims {
  sub: string; // User email
  role: string; // Comma-separated role string
  exp?: number; // Expiration time
}

// Role enum for readability
export enum Role {
  Learner = "learner",
  Teacher = "teacher",
  Conceptor = "conceptor",
  Admin = "admin",
}

// Permission enum for readability
export enum Permission {
  ManageUsers = "manage_users",
  ManageRoles = "manage_roles",
  CreateModule = "create_module",
  EditModule = "edit_module",
  DeleteModule = "delete_module",
  CreateCourse = "create_course",
  EditCourse = "edit_course",
  DeleteCourse = "delete_course",
  ViewContent = "view_content",
  EditContent = "edit_content",
}

/**
 * Check if user has required roles
 * @param userRoleNames Array of user's role names
 * @param requiredRoles Array of required roles
 * @returns True if authorized, false otherwise
 */
function hasRequiredRoles(
  userRoleNames: string[],
  requiredRoles: Role[]
): boolean {
  // Admin always has access
  if (userRoleNames.includes(Role.Admin)) {
    return true;
  }

  // Check if user has any of the required roles
  return requiredRoles.some((role) => userRoleNames.includes(role));
}

/**
 * Set up auth middleware plugin for Elysia
 */
export function setupAuth() {
  const jwtSecret = process.env.JWT_SECRET || "default-secret-change-me";

  return new Elysia({ name: "auth" })
    .use(
      jwt({
        name: "jwt",
        secret: jwtSecret,
        exp: "15m", // 15 minutes
      })
    )
    .use(cookie())
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

        if (!verifyResult || typeof verifyResult === "boolean") {
          console.log("Token verification failed");
          return { user: null };
        }

        // Safe type casting after validation
        const user = verifyResult as unknown as JwtClaims;

        if (!user || !user.sub) {
          console.log("Token missing subject (email)");
          return { user: null };
        }

        // Parse roles from comma-separated string
        const userRoles = user.role ? user.role.split(",") : [];

        return {
          user: {
            ...user,
            roles: userRoles,
          },
        };
      } catch (error) {
        console.error("Auth error:", error);
        return { user: null };
      }
    })
    .derive((ctx) => {
      return {
        // Check if user is authenticated
        isAuthenticated: () => {
          return !!ctx.user && !!ctx.user.sub;
        },

        // Check if user has any of the required roles
        hasRoles: (requiredRoles: Role[]) => {
          const user = ctx.user;
          if (!user || !user.roles) return false;
          return hasRequiredRoles(user.roles, requiredRoles);
        },

        // Check if user has a specific permission
        hasPermission: async (permission: Permission) => {
          if (!ctx.user?.sub) return false;

          // Get user ID from email first
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, ctx.user.sub))
            .limit(1);

          if (!user[0]) return false;

          const result = await db
            .select()
            .from(userRoles)
            .innerJoin(
              rolePermissions,
              eq(userRoles.role_id, rolePermissions.role_id)
            )
            .innerJoin(
              permissions,
              eq(rolePermissions.permission_id, permissions.id)
            )
            .where(
              and(
                eq(userRoles.user_id, user[0].id),
                eq(permissions.name, permission)
              )
            );

          return result.length > 0;
        },
      };
    })
    .derive((ctx) => {
      return {
        // Middleware to require authentication
        guard: () => {
          if (!ctx.isAuthenticated()) {
            return UNAUTHORIZED;
          }
          return null;
        },

        // Middleware to require specific roles
        guardRoles: (roles: Role[]) => {
          if (!ctx.isAuthenticated()) {
            return UNAUTHORIZED;
          }

          if (!ctx.hasRoles(roles)) {
            return FORBIDDEN;
          }

          return null;
        },

        // Middleware to require specific permission
        guardPermission: async (permission: Permission) => {
          if (!ctx.isAuthenticated()) {
            return UNAUTHORIZED;
          }

          if (!(await ctx.hasPermission(permission))) {
            return FORBIDDEN;
          }

          return null;
        },
      };
    });
}

/**
 * Get user roles from database
 * @param email User email
 * @returns Array of role names
 */
async function getUserRoles(email: string): Promise<string[]> {
  const result = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.role_id, roles.id))
    .innerJoin(users, eq(userRoles.user_id, users.id))
    .where(eq(users.email, email));

  return result.map((r) => r.name);
}
