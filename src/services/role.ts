import { db } from "../db/client";
import { roles, userRoles, users } from "../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { ROLES, ROLE_PERMISSIONS, isValidRole, RoleType } from "../utils/roles";
import { NotFoundError, ApiError } from "../middleware/error";

// Role entity types
export interface Role {
    id: number;
    name: string;
    description: string | null;
}

export interface NewRole {
    name: string;
    description?: string | null;
}

export class RoleService {
    /**
     * Initialize default roles in the database
     * This should be run during application startup or initial setup
     */
    async initializeDefaultRoles(): Promise<void> {
        // Get existing roles
        const existingRoles = await db.select().from(roles);
        const existingRoleNames = existingRoles.map(r => r.name);

        // Default roles to create if they don't exist
        const defaultRoles: NewRole[] = [
            {
                name: ROLES.USER,
                description: "Standard user with basic permissions"
            },
            {
                name: ROLES.ADMIN,
                description: "Administrator with full system access"
            },
            {
                name: ROLES.TEACHER,
                description: "Teacher with course management capabilities"
            },
            {
                name: ROLES.CONTENT_CREATOR,
                description: "Can create and manage premium content"
            },
            {
                name: ROLES.MODERATOR,
                description: "Can moderate user content and comments"
            }
        ];

        // Create any missing default roles
        for (const role of defaultRoles) {
            if (!existingRoleNames.includes(role.name)) {
                await db.insert(roles).values(role);
                console.log(`Created default role: ${role.name}`);
            }
        }
    }

    /**
     * Get all roles
     * @returns Array of all roles
     */
    async getAllRoles(): Promise<Role[]> {
        return await db.select().from(roles);
    }

    /**
     * Get a role by ID
     * @param id Role ID
     * @returns Role
     */
    async getRoleById(id: number): Promise<Role> {
        const result = await db.select().from(roles).where(eq(roles.id, id));

        if (result.length === 0) {
            throw new NotFoundError("Role not found");
        }

        return result[0];
    }

    /**
     * Get a role by name
     * @param name Role name
     * @returns Role
     */
    async getRoleByName(name: string): Promise<Role> {
        const result = await db.select().from(roles).where(eq(roles.name, name));

        if (result.length === 0) {
            throw new NotFoundError("Role not found");
        }

        return result[0];
    }

    /**
     * Create a new role
     * @param roleData Role data
     * @returns Created role
     */
    async createRole(roleData: NewRole): Promise<Role> {
        // Validate role name
        if (!isValidRole(roleData.name)) {
            throw new ApiError(`Invalid role name: ${roleData.name}`, 400);
        }

        // Check if role already exists
        try {
            await this.getRoleByName(roleData.name);
            throw new ApiError("Role with this name already exists", 409);
        } catch (error) {
            // If NotFoundError, proceed with creation
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }

        const result = await db.insert(roles).values(roleData).returning();

        return result[0];
    }

    /**
     * Update a role
     * @param id Role ID
     * @param roleData Role data
     * @returns Updated role
     */
    async updateRole(id: number, roleData: Partial<NewRole>): Promise<Role> {
        // Check if role exists
        await this.getRoleById(id);        // Don't allow changing the role name for predefined roles
        if (roleData.name) {
            const existingRole = await this.getRoleById(id);
            if (Object.values(ROLES).includes(existingRole.name as RoleType) &&
                roleData.name !== existingRole.name) {
                throw new ApiError("Cannot change the name of a predefined role", 400);
            }

            if (!isValidRole(roleData.name)) {
                throw new ApiError(`Invalid role name: ${roleData.name}`, 400);
            }
        }

        const result = await db
            .update(roles)
            .set(roleData)
            .where(eq(roles.id, id))
            .returning();

        return result[0];
    }

    /**
     * Delete a role
     * @param id Role ID
     * @returns True if role was deleted
     */
    async deleteRole(id: number): Promise<boolean> {
        // Check if role exists
        const roleToDelete = await this.getRoleById(id);        // Don't allow deleting predefined roles
        if (Object.values(ROLES).includes(roleToDelete.name as RoleType)) {
            throw new ApiError("Cannot delete a predefined role", 400);
        }

        const result = await db
            .delete(roles)
            .where(eq(roles.id, id))
            .returning({ id: roles.id });

        return result.length > 0;
    }

    /**
     * Assign a role to a user
     * @param userId User ID
     * @param roleId Role ID
     * @returns True if successful
     */
    async assignRoleToUser(userId: number, roleId: number): Promise<boolean> {
        // Check if user exists
        const userResult = await db.select().from(users).where(eq(users.id, userId));
        if (userResult.length === 0) {
            throw new NotFoundError("User not found");
        }

        // Check if role exists
        await this.getRoleById(roleId);

        // Check if user already has this role
        const existingAssignment = await db
            .select()
            .from(userRoles)
            .where(and(
                eq(userRoles.user_id, userId),
                eq(userRoles.role_id, roleId)
            ));

        if (existingAssignment.length > 0) {
            // User already has this role
            return false;
        }

        // Assign the role
        const result = await db
            .insert(userRoles)
            .values({ user_id: userId, role_id: roleId })
            .returning();

        return result.length > 0;
    }

    /**
     * Remove a role from a user
     * @param userId User ID
     * @param roleId Role ID
     * @returns True if successful
     */
    async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
        // Check if user exists
        const userResult = await db.select().from(users).where(eq(users.id, userId));
        if (userResult.length === 0) {
            throw new NotFoundError("User not found");
        }

        // Check if role exists
        await this.getRoleById(roleId);

        // Remove the role
        const result = await db
            .delete(userRoles)
            .where(and(
                eq(userRoles.user_id, userId),
                eq(userRoles.role_id, roleId)
            ))
            .returning();

        return result.length > 0;
    }

    /**
     * Get all roles for a user
     * @param userId User ID
     * @returns Array of roles
     */
    async getUserRoles(userId: number): Promise<Role[]> {
        // Check if user exists
        const userResult = await db.select().from(users).where(eq(users.id, userId));
        if (userResult.length === 0) {
            throw new NotFoundError("User not found");
        }

        // Get user's roles
        const userRolesResult = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.user_id, userId));

        if (userRolesResult.length === 0) {
            return [];
        }

        // Get role details
        const roleIds = userRolesResult.map(ur => ur.role_id);
        const rolesResult = await db
            .select()
            .from(roles)
            .where(inArray(roles.id, roleIds));

        return rolesResult;
    }

    /**
     * Get all users with a specific role
     * @param roleId Role ID
     * @returns Array of user IDs
     */
    async getUsersWithRole(roleId: number): Promise<number[]> {
        // Check if role exists
        await this.getRoleById(roleId);

        // Get users with this role
        const userRolesResult = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.role_id, roleId));

        return userRolesResult.map(ur => ur.user_id);
    }

    /**
     * Get user role names
     * @param userId User ID
     * @returns Array of role names
     */
    async getUserRoleNames(userId: number): Promise<string[]> {
        const userRoles = await this.getUserRoles(userId);
        return userRoles.map(role => role.name);
    }

    /**
     * Check if a user has a specific role
     * @param userId User ID
     * @param roleName Role name
     * @returns Boolean indicating if user has the role
     */
    async userHasRole(userId: number, roleName: string): Promise<boolean> {
        const userRoles = await this.getUserRoleNames(userId);
        return userRoles.includes(roleName);
    }

    /**
     * Check if a user has a specific permission based on their roles
     * @param userId User ID
     * @param permission Permission to check
     * @returns Boolean indicating if user has the permission
     */
    async userHasPermission(userId: number, permission: string): Promise<boolean> {
        const userRoleNames = await this.getUserRoleNames(userId);

        for (const roleName of userRoleNames) {
            const permissions = ROLE_PERMISSIONS[roleName] || [];
            if (permissions.includes(permission)) {
                return true;
            }
        }

        return false;
    }
}

// Export a singleton instance
export const roleService = new RoleService();
