import { Elysia, t } from "elysia";
import { roleService } from "../services/role";
import { success } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES } from "../utils/roles";

/**
 * Setup role management routes
 */
export function setupRoleRoutes() {
    const auth = setupAuth();

    return new Elysia({ prefix: "/role" })
        .use(auth)
        // Get all roles
        .get(
            "/list",
            async ({ requireAuth, guardRoles, set }) => {
                // Only admins can view all roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const allRoles = await roleService.getAllRoles();
                return success(allRoles);
            },
            {
                detail: {
                    tags: ["Roles"],
                    summary: "List all roles",
                    description: "Get a list of all available roles (Admin only)",
                    responses: {
                        "200": {
                            description: "List of roles retrieved successfully",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                    },
                },
            }
        )
        // Get role by ID
        .get(
            "/get/:roleId",
            async ({ params, requireAuth, guardRoles, set }) => {
                // Only admins can access role details
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const roleId = parseInt(params.roleId, 10);
                const role = await roleService.getRoleById(roleId);
                return success(role);
            },
            {
                detail: {
                    tags: ["Roles"],
                    summary: "Get role by ID",
                    description: "Retrieve role details by ID (Admin only)",
                    responses: {
                        "200": {
                            description: "Role details retrieved successfully",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "404": {
                            description: "Role not found",
                        },
                    },
                },
            }
        )
        // Create a new role
        .post(
            "/create",
            async ({ body, requireAuth, guardRoles, set }) => {
                // Only admins can create roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const newRole = await roleService.createRole(body);
                set.status = 201;
                return success(newRole, 201);
            },
            {
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                }),
                detail: {
                    tags: ["Roles"],
                    summary: "Create a new role",
                    description: "Create a new role in the system (Admin only)",
                    responses: {
                        "201": {
                            description: "Role created successfully",
                        },
                        "400": {
                            description: "Invalid role data",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "409": {
                            description: "Role with this name already exists",
                        },
                    },
                },
            }
        )
        // Update a role
        .put(
            "/update/:roleId",
            async ({ params, body, requireAuth, guardRoles, set }) => {
                // Only admins can update roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const roleId = parseInt(params.roleId, 10);
                const updatedRole = await roleService.updateRole(roleId, body);
                return success(updatedRole);
            },
            {
                body: t.Object({
                    name: t.Optional(t.String()),
                    description: t.Optional(t.String()),
                }),
                detail: {
                    tags: ["Roles"],
                    summary: "Update a role",
                    description: "Update an existing role (Admin only)",
                    responses: {
                        "200": {
                            description: "Role updated successfully",
                        },
                        "400": {
                            description: "Invalid role data or cannot modify predefined role",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "404": {
                            description: "Role not found",
                        },
                    },
                },
            }
        )
        // Delete a role
        .delete(
            "/delete/:roleId",
            async ({ params, requireAuth, guardRoles, set }) => {
                // Only admins can delete roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const roleId = parseInt(params.roleId, 10);
                await roleService.deleteRole(roleId);
                return success({ message: "Role deleted" });
            },
            {
                detail: {
                    tags: ["Roles"],
                    summary: "Delete a role",
                    description: "Delete a role by ID (Admin only, cannot delete predefined roles)",
                    responses: {
                        "200": {
                            description: "Role deleted successfully",
                        },
                        "400": {
                            description: "Cannot delete a predefined role",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "404": {
                            description: "Role not found",
                        },
                    },
                },
            }
        )
        // Assign role to user
        .post(
            "/assign",
            async ({ body, requireAuth, guardRoles, set }) => {
                // Only admins can assign roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const { userId, roleId } = body;
                const assigned = await roleService.assignRoleToUser(userId, roleId);
                return success({ assigned });
            },
            {
                body: t.Object({
                    userId: t.Number(),
                    roleId: t.Number(),
                }),
                detail: {
                    tags: ["Roles"],
                    summary: "Assign role to user",
                    description: "Assign a role to a specific user (Admin only)",
                    responses: {
                        "200": {
                            description: "Role assignment status",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "404": {
                            description: "User or role not found",
                        },
                    },
                },
            }
        )
        // Remove role from user
        .delete(
            "/remove",
            async ({ body, requireAuth, guardRoles, set }) => {
                // Only admins can remove roles
                const authResult = guardRoles([ROLES.ADMIN]);
                if (authResult) {
                    set.status = authResult.statusCode;
                    return authResult;
                }

                // Verify authentication
                await requireAuth();

                const { userId, roleId } = body;
                const removed = await roleService.removeRoleFromUser(userId, roleId);
                return success({ removed });
            },
            {
                body: t.Object({
                    userId: t.Number(),
                    roleId: t.Number(),
                }),
                detail: {
                    tags: ["Roles"],
                    summary: "Remove role from user",
                    description: "Remove a role from a specific user (Admin only)",
                    responses: {
                        "200": {
                            description: "Role removal status",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Admin role required",
                        },
                        "404": {
                            description: "User or role not found",
                        },
                    },
                },
            }
        )
        // Get roles for a user
        .get(
            "/user/:userId",
            async ({ params, requireAuth, guardRoles, set }) => {
                const userIdParam = parseInt(params.userId, 10);

                // Get authenticated user
                const claims = await requireAuth();
                const currentUserId = parseInt(claims.sub);

                // Users can view their own roles, admins can view anyone's roles
                if (userIdParam !== currentUserId) {
                    const authResult = guardRoles([ROLES.ADMIN]);
                    if (authResult) {
                        set.status = authResult.statusCode;
                        return authResult;
                    }
                }

                const userRoles = await roleService.getUserRoles(userIdParam);
                return success(userRoles);
            },
            {
                detail: {
                    tags: ["Roles"],
                    summary: "Get user's roles",
                    description: "Get all roles assigned to a specific user (Users can view their own roles, admin can view any user's roles)",
                    responses: {
                        "200": {
                            description: "List of roles retrieved successfully",
                        },
                        "401": {
                            description: "Authentication required",
                        },
                        "403": {
                            description: "Forbidden - Not authorized to view this user's roles",
                        },
                        "404": {
                            description: "User not found",
                        },
                    },
                },
            }
        );
}
