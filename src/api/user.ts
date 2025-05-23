import { Elysia, t } from "elysia";
import { userService, type NewUser } from "../services/user"; // Import NewUser type
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES } from "../utils/roles";

/**
 * Setup user routes
 */
export function setupUserRoutes() {
  const auth = setupAuth();

  return (
    new Elysia({ prefix: "/user" })
      .use(auth)
      // Get current user
      .get(
        "/me",
        async ({ requireAuth, set }) => {
          try {
            // Get user ID from JWT token
            const claims = await requireAuth();
            const userId = parseInt(claims.sub);            // Get user data
            const user = await userService.getUserById(userId);

            // Get user's roles
            const { roleService } = await import("../services/role");
            const userRoles = await roleService.getUserRoleNames(userId);

            // Remove sensitive data
            const { password_hash, ...userData } = user; // ESLint: disable-line @typescript-eslint/no-unused-vars

            return success({ ...userData, roles: userRoles });
          } catch (err) {
            set.status = 401;
            return error((err as Error).message || "Authentication required", 401);
          }
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get current user profile",
            description: "Retrieve the profile of the currently authenticated user",
            responses: {
              "200": {
                description: "User profile retrieved successfully",
              },
              "401": {
                description: "Authentication required",
              }
            },
          },
        }
      )      // Get user by ID
      .get(
        "/get/:userId",
        async ({ params, requireAuth }) => {          // Require authentication          await requireAuth(); const userId = parseInt(params.userId, 10);
          const user = await userService.getUserById(userId);

          // Get user's roles
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(userId);

          // Remove sensitive data
          const { password_hash, ...userData } = user; // ESLint: disable-line @typescript-eslint/no-unused-vars

          return success({ ...userData, roles: userRoles });
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get user by ID",
            description: "Retrieve a user's profile by their ID",
            responses: {
              "200": {
                description: "User found",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "User not found",
              },
            },
          },
        }
      )
      // Get user by email
      .get(
        "/get_by_email/:email",
        async ({ params, requireAuth }) => {          // Require authentication
          await requireAuth();
          const user = await userService.getUserByEmail(params.email);

          // Get user's roles
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(user.id);

          // Remove sensitive data
          const { password_hash, ...userData } = user; // ESLint: disable-line @typescript-eslint/no-unused-vars

          return success({ ...userData, roles: userRoles });
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get user by email",
            description: "Retrieve a user's profile by their email address",
            responses: {
              "200": {
                description: "User found",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "User not found",
              },
            },
          },
        }
      )
      // Check if email is used
      .get(
        "/get_email_used/:email",
        async ({ params, set }) => {
          const isUsed = await userService.isEmailUsed(params.email);

          if (isUsed) {
            return success("Email already used");
          }

          // Set correct status code for "not found" response
          set.status = 404;
          return success("Email not used", 404);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Check if email is in use",
            description: "Check if an email address is already registered",
            responses: {
              "200": {
                description: "Email is already in use",
              },
              "404": {
                description: "Email is not in use",
              },
            },
          },
        }
      )      // Create user (admin only)
      .post(
        "/create",
        async ({ body, set, requireAuth, guardRoles }) => {
          // Check if user has admin role
          const authResult = guardRoles([ROLES.ADMIN]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }          // Admin is creating the user, so pass isAdmin=true
          await requireAuth();
          const createdUser = await userService.createUser(body as NewUser, true);
          set.status = 201;
          return success(createdUser, 201);
        },
        {
          body: t.Object({
            pseudo: t.Optional(t.String()),
            email: t.String(),
            password: t.String(),
            roles: t.Optional(t.Array(t.String())),
          }),
          detail: {
            tags: ["Users"],
            summary: "Create user",
            description: "Create a new user",
            responses: {
              "201": {
                description: "User created successfully",
              },
              "409": {
                description: "Email already in use",
              },
            },
          },
        }
      )      // List all users (admin only)
      .get(
        "/list",
        async ({ requireAuth, guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([ROLES.ADMIN]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }          // If we get here, the user is authenticated and has admin role
          await requireAuth();
          const users = await userService.getAllUsers();

          // Get roles for each user and remove sensitive data
          const { roleService } = await import("../services/role");
          const safeUsers = await Promise.all(users.map(async user => {
            const { password_hash, ...userData } = user; // ESLint: disable-line @typescript-eslint/no-unused-vars

            // Get user's roles
            try {
              const roles = await roleService.getUserRoleNames(user.id);
              return { ...userData, roles };
            } catch (err) {
              console.error(`Error fetching roles for user ${user.id}:`, err);
              return { ...userData, roles: [] };
            }
          }));

          return success(safeUsers);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "List all users",
            description: "Get a list of all users in the system (Admin only)",
            responses: {
              "200": {
                description: "List of users retrieved successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Forbidden - Admin role required",
              }
            },
          },
        }
      )      // Delete user (admin only)
      .delete(
        "/delete/:userId",
        async ({ params, requireAuth, guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([ROLES.ADMIN]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          await requireAuth();
          const userId = parseInt(params.userId, 10);
          await userService.deleteUser(userId);
          return success({ message: "User deleted" });
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Delete user",
            description: "Delete a user by ID",
            responses: {
              "200": {
                description: "User deleted successfully",
              },
              "404": {
                description: "User not found",
              },
            },
          },
        }
      )      // Update user (with proper auth checks)
      .put("/update/:userId",
        async ({ params, body, requireAuth, set }) => {
          const userIdToUpdate = parseInt(params.userId, 10);
          const claims = await requireAuth();
          const currentUserId = parseInt(claims.sub);

          // Determine if this is a self-update or if admin is updating someone else
          const isSelfUpdate = currentUserId === userIdToUpdate;
          const isAdmin = claims.roles.includes(ROLES.ADMIN);

          // Only allow users to update themselves, unless they're an admin
          if (!isSelfUpdate && !isAdmin) {
            set.status = 403;
            return error("You can only update your own profile", 403);
          }

          // Explicitly cast body to Partial<NewUser> after validation by Elysia's `t.Object`
          const updatedUser = await userService.updateUser(
            userIdToUpdate,
            body as Partial<NewUser>,
            isAdmin
          );
          return success(updatedUser);
        },
        {
          body: t.Object({
            pseudo: t.Optional(t.String()),
            email: t.Optional(t.String()),
            password: t.Optional(t.String()),
            roles: t.Optional(t.Array(t.String())),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update user",
            description: "Update a user's profile",
            responses: {
              "200": {
                description: "User updated successfully",
              },
              "404": {
                description: "User not found",
              },
            },
          },
        }
      )
  );
}
