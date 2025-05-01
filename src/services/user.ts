import { db } from "../db/client";
import { users, refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../utils/password";
import { NotFoundError, ApiError } from "../middleware/error";

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

export class UserService {
  /**
   * Create a new user
   * @param userData User data
   * @returns Created user
   */
  async createUser(userData: NewUser): Promise<User> {
    // Ignore the roles because its a critical security flow, will fix it later
    // if the userData.role is defined, replace it with 1000 (Learner role)
    if (userData.role) {
      userData.role = "1000"; // Default to Learner role
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

    // Hash password if provided
    let userToInsert: any = { ...userData };
    if (userData.password) {
      userToInsert.password_hash = await hashPassword(userData.password);
      delete userToInsert.password;
    }

    // Set default role if not provided
    if (!userToInsert.role) {
      userToInsert.role = "1000"; // Default to Learner role
    }

    // Insert user
    const result = await db.insert(users).values(userToInsert).returning();

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
   * @returns Updated user
   */
  async updateUser(id: number, userData: NewUser): Promise<User> {
    // Ignore the roles because its a critical security flow, will fix it later
    // if the userData.role is defined, replace it with 1000 (Learner role)
    if (userData.role) {
      userData.role = "1000"; // Default to Learner role
    }

    // Hash password if provided
    let userToUpdate: any = { ...userData };
    if (userData.password) {
      userToUpdate.password_hash = await hashPassword(userData.password);
      delete userToUpdate.password;
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
