import { db } from "../db/client";
import { users, refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../utils/password";
import { NotFoundError, ApiError } from "../middleware/error";
import { isValidRole, getDefaultRoles, RoleType } from "../utils/roles";

// User types
export interface User {
  id: number;
  pseudo: string | null;
  email: string | null;
  password_hash: string | null;
  biography: string | null;
  profile_picture: string | null;
}

export interface NewUser {
  pseudo?: string | null;
  email?: string | null;
  password?: string | null;
  roles?: string[]; // Array of role names instead of a single role
  biography?: string | null;
  profile_picture?: string | null;
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
   */  async createUser(userData: NewUser, isAdmin: boolean = false): Promise<User> {
    // Check if email already exists
    if (userData.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingUser.length > 0) {
        throw new ApiError("Email already in use", 409);
      }
    }    // Hash password if provided
    const userToInsert: Partial<User & { password_hash?: string | null }> = { ...userData };
    if (userData.password) {
      userToInsert.password_hash = await hashPassword(userData.password);
      // Create a typed record before deleting a property
      const userRecord = userToInsert as Partial<User & { password_hash?: string | null } & { password?: string }>;
      delete userRecord.password;
    }

    // Remove roles from insert data (will be handled separately)
    const userRoles = userData.roles || [];
    // Create a typed record before deleting a property
    const userRecordWithRoles = userToInsert as Partial<User & { password_hash?: string | null } & { roles?: string[] }>;
    delete userRecordWithRoles.roles;

    // Insert user
    const result = await db.insert(users).values(userToInsert).returning();

    // Assign roles to the new user in the user_roles table
    const { roleService } = await import("./role");
    try {
      // Get the default roles (USER and TEACHER)
      const defaultRoles = getDefaultRoles();
      
      for (const defaultRoleName of defaultRoles) {
        const defaultRole = await roleService.getRoleByName(defaultRoleName);
        await roleService.assignRoleToUser(result[0].id, defaultRole.id);
      }

      // If the user should have additional roles and the creator is an admin
      if (isAdmin && userRoles.length > 0) {
        for (const roleName of userRoles) {
          // Skip if it's already assigned as a default role
          if (defaultRoles.includes(roleName as RoleType)) continue;

          // Validate the role
          if (!isValidRole(roleName)) {
            console.warn(`Invalid role specified: ${roleName}`);
            continue;
          }

          try {
            const role = await roleService.getRoleByName(roleName);
            await roleService.assignRoleToUser(result[0].id, role.id);
          } catch (err) {
            // Log but don't fail if the additional role cannot be assigned
            console.error(`Could not assign role ${roleName} to new user:`, err);
          }
        }
      }
    } catch (err) {
      // Log role assignment error but don't fail user creation
      console.error("Error assigning default roles to new user:", err);
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
   */  async updateUser(
    id: number,
    userData: NewUser,
    isAdmin: boolean = false,): Promise<User> {
    // Extract roles to update separately if provided
    const rolesToUpdate = userData.roles || [];
    // Create a typed record before deleting a property
    const userDataWithRoles = userData as NewUser & { roles?: string[] };
    delete userDataWithRoles.roles;

    // Hash password if provided
    const userToUpdate: Partial<User & { password_hash?: string | null }> = { ...userData };
    if (userData.password) {
      userToUpdate.password_hash = await hashPassword(userData.password);
      // Create a typed record before deleting a property
      const userRecord = userToUpdate as Partial<User & { password_hash?: string | null } & { password?: string }>;
      delete userRecord.password;
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

    // Update roles if admin and roles provided
    if (isAdmin && rolesToUpdate.length > 0) {
      const { roleService } = await import("./role");

      try {
        // Get current user roles
        const currentRoles = await roleService.getUserRoles(id);
        const currentRoleNames = currentRoles.map(r => r.name);

        // Get default roles that should always be assigned
        const defaultRoles = getDefaultRoles();

        // Determine roles to add and roles to remove
        const rolesToAdd = rolesToUpdate.filter(r => !currentRoleNames.includes(r));
        const rolesToRemove = currentRoles.filter(r => !rolesToUpdate.includes(r.name) && !defaultRoles.includes(r.name as RoleType));

        // Add new roles
        for (const roleName of rolesToAdd) {
          if (!isValidRole(roleName)) {
            console.warn(`Invalid role specified: ${roleName}, skipping assignment`);
            continue;
          }

          try {
            const role = await roleService.getRoleByName(roleName);
            await roleService.assignRoleToUser(id, role.id);
          } catch (err) {
            console.error(`Could not assign role ${roleName} to user:`, err);
          }
        }

        // Remove roles no longer needed
        for (const role of rolesToRemove) {
          // Never remove default roles
          if (defaultRoles.includes(role.name as RoleType)) continue;

          try {
            await roleService.removeRoleFromUser(id, role.id);
          } catch (err) {
            console.error(`Could not remove role ${role.name} from user:`, err);
          }
        }
      } catch (err) {
        console.error("Error updating user roles:", err);
      }
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
