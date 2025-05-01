import { db } from "../db/client";
import {
  users,
  roles,
  userRoles,
  permissions,
  rolePermissions,
  refreshTokens,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../utils/password";
import { NotFoundError, ApiError, ForbiddenError } from "../middleware/error";

// User types
export interface User {
  id: number;
  pseudo: string | null;
  email: string | null;
  password_hash: string | null;
  roles?: string[]; // Array of role names
}

// Type for creating a new user
export interface NewUser {
  pseudo?: string | null;
  email?: string | null;
  password?: string | null;
  roles?: string[]; // Array of role names
}

// Type for database insert that matches schema
interface DbUser {
  pseudo?: string | null;
  email?: string | null;
  password_hash?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserService {
  /**
   * Create a new user
   * @param userData User data
   * @param creatorRoles Roles of the user creating this user
   * @returns Created user
   */
  async createUser(userData: NewUser, creatorRoles?: string[]): Promise<User> {
    // Validate roles if provided
    if (userData.roles && userData.roles.length > 0) {
      // Only admin can assign roles other than 'learner'
      if (!creatorRoles?.includes("admin")) {
        userData.roles = ["learner"]; // Force learner role for non-admin creators
      }

      // Verify all roles exist
      const existingRoles = await db
        .select({ name: roles.name })
        .from(roles)
        .where(and(...userData.roles.map((role) => eq(roles.name, role))));

      if (existingRoles.length !== userData.roles.length) {
        throw new ApiError("Invalid role(s) specified", 400);
      }
    } else {
      userData.roles = ["learner"]; // Default role
    }

    // Check if email already exists
    if (userData.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingUser.length > 0) {
        throw new ApiError("Email already in use", 409);
      }
    }

    // Prepare user data for database insert
    const dbUser: DbUser = {
      pseudo: userData.pseudo,
      email: userData.email,
    };

    // Hash password if provided
    if (userData.password) {
      dbUser.password_hash = await hashPassword(userData.password);
    }

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert user
      const [user] = await tx.insert(users).values(dbUser).returning();

      // Get role IDs
      const roleRecords = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(...userData.roles!.map((role) => eq(roles.name, role))));

      // Insert user roles
      await tx.insert(userRoles).values(
        roleRecords.map((role) => ({
          user_id: user.id,
          role_id: role.id,
        }))
      );

      // Return user with roles
      return {
        ...user,
        roles: userData.roles,
      };
    });
  }

  /**
   * Get user roles
   * @param userId User ID
   * @returns Array of role names
   */
  async getUserRoles(userId: number): Promise<string[]> {
    const result = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.role_id, roles.id))
      .where(eq(userRoles.user_id, userId));

    return result.map((r) => r.name);
  }

  /**
   * Check if user has permission
   * @param userId User ID
   * @param permissionName Permission to check
   */
  async hasPermission(
    userId: number,
    permissionName: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(userRoles)
      .innerJoin(
        rolePermissions,
        eq(userRoles.role_id, rolePermissions.role_id)
      )
      .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(
        and(eq(userRoles.user_id, userId), eq(permissions.name, permissionName))
      );

    return result.length > 0;
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns User
   */
  async getUserById(id: number): Promise<User> {
    const result = await db.select().from(users).where(eq(users.id, id));

    if (result.length === 0) {
      throw new NotFoundError("User not found");
    }

    return result[0];
  }

  /**
   * Get a user by email
   * @param email User email
   * @returns User
   */
  async getUserByEmail(email: string): Promise<User> {
    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) {
      throw new NotFoundError("User not found");
    }

    return result[0];
  }

  /**
   * Get all users
   * @returns Array of users
   */
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  /**
   * Update a user
   * @param id User ID
   * @param userData User data to update
   * @param updaterRoles Roles of the user making the update
   * @returns Updated user
   */
  async updateUser(
    id: number,
    userData: NewUser,
    updaterRoles?: string[]
  ): Promise<User> {
    // Get current user roles
    const currentRoles = await this.getUserRoles(id);

    // Validate role changes
    if (userData.roles) {
      // Only admin can modify roles
      if (!updaterRoles?.includes("admin")) {
        throw new ForbiddenError("Only administrators can modify roles");
      }

      // Verify all roles exist
      const existingRoles = await db
        .select({ name: roles.name })
        .from(roles)
        .where(and(...userData.roles.map((role) => eq(roles.name, role))));

      if (existingRoles.length !== userData.roles.length) {
        throw new ApiError("Invalid role(s) specified", 400);
      }
    }

    // Prepare user data for database update
    const dbUser: DbUser = {
      pseudo: userData.pseudo,
      email: userData.email,
    };

    // Hash password if provided
    if (userData.password) {
      dbUser.password_hash = await hashPassword(userData.password);
    }

    return await db.transaction(async (tx) => {
      // Update user
      const [updatedUser] = await tx
        .update(users)
        .set(dbUser)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError("User not found");
      }

      // Update roles if provided
      if (userData.roles) {
        // Delete existing roles
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));

        // Get role IDs
        const roleRecords = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(and(...userData.roles.map((role) => eq(roles.name, role))));

        // Insert new roles
        await tx.insert(userRoles).values(
          roleRecords.map((role) => ({
            user_id: id,
            role_id: role.id,
          }))
        );
      }

      // Return updated user with roles
      return {
        ...updatedUser,
        roles: userData.roles || currentRoles,
      };
    });
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns True if user was deleted
   */
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return result.length > 0;
  }

  /**
   * Check if email is used
   * @param email Email to check
   * @returns True if email is in use
   */
  async isEmailUsed(email: string): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.email, email));

    return result.length > 0;
  }

  /**
   * Authenticate a user
   * @param email User email
   * @param password User password
   * @returns User if authentication is successful
   */
  async authenticate(email: string, password: string): Promise<User> {
    // Find user by email
    const user = await this.getUserByEmail(email);

    // Verify password
    if (!user.password_hash) {
      throw new ApiError("Invalid credentials", 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new ApiError("Invalid credentials", 401);
    }

    return user;
  }

  /**
   * Store a refresh token
   * @param userId User ID
   * @param token Refresh token
   * @param expiresAt Expiration date
   */
  async storeRefreshToken(
    userId: string,
    token: string,
    expiresAt: string
  ): Promise<void> {
    await db.insert(refreshTokens).values({
      token,
      user_id: userId,
      expires_at: expiresAt,
    });
  }

  /**
   * Validate a refresh token
   * @param token Refresh token
   * @returns User ID if token is valid
   */
  async validateRefreshToken(token: string): Promise<string> {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token));

    if (result.length === 0) {
      throw new ApiError("Invalid refresh token", 401);
    }

    const refreshToken = result[0];

    // Check if token has expired
    if (new Date(refreshToken.expires_at) < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, token));

      throw new ApiError("Refresh token expired", 401);
    }

    return refreshToken.user_id;
  }

  /**
   * Delete all refresh tokens for a user
   * @param userId User ID
   */
  async deleteRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.user_id, userId));
  }
}

// Export a singleton instance
export const userService = new UserService();
