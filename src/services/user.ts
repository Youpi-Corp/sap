import { db } from "../db/client";
import { users, refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../utils/password";
import { NotFoundError, ApiError } from "../middleware/error";
import { isValidRole, getDefaultRole, ROLES } from "../utils/roles";

// User types
export interface User {
  id: number;
  pseudo: string | null;
  email: string | null;
  password_hash: string | null;
  role: string | null;
}

export interface NewUser {
  pseudo?: string | null;
  email?: string | null;
  password?: string | null;
  role?: string | null;
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

export class UserService {  /**
   * Create a new user
   * @param userData User data
   * @param isAdmin Whether the creator is an admin (determines if role can be set)
   * @returns Created user
   */
  async createUser(userData: NewUser, isAdmin: boolean = false): Promise<User> {
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

    // Hash password if provided
    const userToInsert: Partial<User & { password_hash?: string | null }> = { ...userData };
    if (userData.password) {
      userToInsert.password_hash = await hashPassword(userData.password);
      delete (userToInsert as NewUser).password;
    }    // Handle legacy role field
    if (isAdmin && userData.role) {
      // Only admins can set specific roles
      if (!isValidRole(userData.role)) {
        throw new ApiError("Invalid role specified", 400);
      }
      userToInsert.role = userData.role;
    } else {
      // Non-admins can only create regular users
      userToInsert.role = getDefaultRole();
    }

    // Insert user
    const result = await db.insert(users).values(userToInsert).returning();

    // Assign default role to the new user in the user_roles table
    const { roleService } = await import("./role");
    try {
      // Get the default USER role
      const userRole = await roleService.getRoleByName(getDefaultRole());
      await roleService.assignRoleToUser(result[0].id, userRole.id);

      // If the user should have additional roles (admin creating with specific role)
      if (isAdmin && userData.role && userData.role !== getDefaultRole()) {
        // Get that role and assign it too
        try {
          const additionalRole = await roleService.getRoleByName(userData.role);
          await roleService.assignRoleToUser(result[0].id, additionalRole.id);
        } catch (err) {
          // Log but don't fail if the additional role cannot be assigned
          console.error(`Could not assign role ${userData.role} to new user:`, err);
        }
      }
    } catch (err) {
      // Log role assignment error but don't fail user creation
      console.error("Error assigning default role to new user:", err);
    }

    return result[0];
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
   * @param isAdmin Whether the updater is an admin (determines if role can be changed)
   * @param currentUserId ID of the user performing the update
   * @returns Updated user
   */
  async updateUser(
    id: number,
    userData: NewUser,
    isAdmin: boolean = false,
    currentUserId?: number
  ): Promise<User> {
    // Security checks
    const isSelfUpdate = currentUserId === id;

    // Only admins can change roles
    if (userData.role && !isAdmin) {
      // Remove role from update data for non-admins
      delete userData.role;
    } else if (userData.role && isAdmin) {
      // Admins can only set valid roles
      if (!isValidRole(userData.role)) {
        throw new ApiError("Invalid role specified", 400);
      }
    }

    // Hash password if provided
    const userToUpdate: Partial<User & { password_hash?: string | null }> = { ...userData };
    if (userData.password) {
      userToUpdate.password_hash = await hashPassword(userData.password);
      delete (userToUpdate as NewUser).password;
    }

    // Update user
    const result = await db
      .update(users)
      .set(userToUpdate)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("User not found");
    }

    return result[0];
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
