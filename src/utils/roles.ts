
/**
 * Role definitions for the application
 * 
 * This module defines the available roles and their corresponding permissions.
 * Supporting multiple roles per user with a flexible permission system.
 */

// Standard role names
export const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    CONTENT_CREATOR: 'content_creator',
    MODERATOR: 'moderator'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Permission definitions for clarity and reuse
export const PERMISSIONS = {
    // Profile permissions
    READ_OWN_PROFILE: 'read:own_profile',
    UPDATE_OWN_PROFILE: 'update:own_profile',

    // Content permissions
    READ_PUBLIC_CONTENT: 'read:public_content',
    CREATE_OWN_CONTENT: 'create:own_content',
    UPDATE_OWN_CONTENT: 'update:own_content',
    DELETE_OWN_CONTENT: 'delete:own_content',

    // Admin permissions
    READ_ALL_USERS: 'read:all_users',
    CREATE_USER: 'create:user',
    UPDATE_ANY_USER: 'update:any_user',
    DELETE_USER: 'delete:user',
    UPDATE_SYSTEM_INFO: 'update:system_info',

    // Teacher permissions
    CREATE_COURSE: 'create:course',
    GRADE_STUDENTS: 'grade:students',

    // Content creator permissions
    CREATE_PREMIUM_CONTENT: 'create:premium_content',

    // Moderator permissions
    MODERATE_CONTENT: 'moderate:content',
    MODERATE_COMMENTS: 'moderate:comments'
} as const;

// Define permissions for each role type
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    [ROLES.USER]: [
        PERMISSIONS.READ_OWN_PROFILE,
        PERMISSIONS.UPDATE_OWN_PROFILE,
        PERMISSIONS.READ_PUBLIC_CONTENT,
        PERMISSIONS.CREATE_OWN_CONTENT,
        PERMISSIONS.UPDATE_OWN_CONTENT,
        PERMISSIONS.DELETE_OWN_CONTENT,
    ],
    [ROLES.ADMIN]: [
        PERMISSIONS.READ_OWN_PROFILE,
        PERMISSIONS.UPDATE_OWN_PROFILE,
        PERMISSIONS.READ_PUBLIC_CONTENT,
        PERMISSIONS.CREATE_OWN_CONTENT,
        PERMISSIONS.UPDATE_OWN_CONTENT,
        PERMISSIONS.DELETE_OWN_CONTENT,
        PERMISSIONS.READ_ALL_USERS,
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.UPDATE_ANY_USER,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.UPDATE_SYSTEM_INFO,
        PERMISSIONS.MODERATE_CONTENT,
        PERMISSIONS.MODERATE_COMMENTS
    ],
    [ROLES.TEACHER]: [
        PERMISSIONS.READ_OWN_PROFILE,
        PERMISSIONS.UPDATE_OWN_PROFILE,
        PERMISSIONS.READ_PUBLIC_CONTENT,
        PERMISSIONS.CREATE_OWN_CONTENT,
        PERMISSIONS.UPDATE_OWN_CONTENT,
        PERMISSIONS.DELETE_OWN_CONTENT,
        PERMISSIONS.CREATE_COURSE,
        PERMISSIONS.GRADE_STUDENTS
    ],
    [ROLES.CONTENT_CREATOR]: [
        PERMISSIONS.READ_OWN_PROFILE,
        PERMISSIONS.UPDATE_OWN_PROFILE,
        PERMISSIONS.READ_PUBLIC_CONTENT,
        PERMISSIONS.CREATE_OWN_CONTENT,
        PERMISSIONS.UPDATE_OWN_CONTENT,
        PERMISSIONS.DELETE_OWN_CONTENT,
        PERMISSIONS.CREATE_PREMIUM_CONTENT
    ],
    [ROLES.MODERATOR]: [
        PERMISSIONS.READ_OWN_PROFILE,
        PERMISSIONS.UPDATE_OWN_PROFILE,
        PERMISSIONS.READ_PUBLIC_CONTENT,
        PERMISSIONS.CREATE_OWN_CONTENT,
        PERMISSIONS.UPDATE_OWN_CONTENT,
        PERMISSIONS.DELETE_OWN_CONTENT,
        PERMISSIONS.MODERATE_CONTENT,
        PERMISSIONS.MODERATE_COMMENTS
    ]
};

// Helper functions
export function isValidRole(role: string): role is RoleType {
    return Object.values(ROLES).includes(role as RoleType);
}

export function getDefaultRole(): RoleType {
    return ROLES.USER;
}

/**
 * Check if a user has a specific permission based on their roles
 * @param userRoles Array of role names the user has
 * @param permission The permission to check
 * @returns Boolean indicating if the user has the permission
 */
export function hasPermission(userRoles: string[], permission: string): boolean {
    // If no roles, no permissions
    if (!userRoles || userRoles.length === 0) {
        return false;
    }

    // Check each role the user has for the permission
    for (const role of userRoles) {
        if (ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role].includes(permission)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a user has any of the required roles
 * @param userRoles Array of roles the user has
 * @param allowedRoles Array of roles that are allowed
 * @returns Boolean indicating if the user has permission
 */
export function hasRole(userRoles: string[], allowedRoles: RoleType[]): boolean {
    // If no roles, no permissions
    if (!userRoles || userRoles.length === 0) {
        return false;
    }

    // Check if any of the user's roles are in the allowed roles list
    return userRoles.some(role => allowedRoles.includes(role as RoleType));
}

/**
 * Get all permissions a user has based on their roles
 * @param userRoles Array of role names the user has
 * @returns Array of permission strings
 */
export function getAllPermissions(userRoles: string[]): string[] {
    // Create a Set to automatically handle duplicates
    const permissionSet = new Set<string>();

    // Add all permissions from each role
    for (const role of userRoles) {
        if (ROLE_PERMISSIONS[role]) {
            ROLE_PERMISSIONS[role].forEach(permission => permissionSet.add(permission));
        }
    }

    return Array.from(permissionSet);
}
