import { Elysia, t } from "elysia";
import { userService, type NewUser } from "../services/user"; // Import NewUser type
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES } from "../utils/roles";
import { reportService } from "../services/report";

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
        async ({ params, requireAuth }) => {          // Require authentication
          await requireAuth();
          const user = await userService.getUserById(parseInt(params.userId));

          // Get user's roles
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(parseInt(params.userId));

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
            biography: t.Optional(t.String()),
            profile_picture: t.Optional(t.String()),
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

            // Fix created_at and updated_at if they are 'NOW()' string or missing
            const now = new Date().toISOString();
            const fixedUserData = {
              ...userData,
              created_at: userData.created_at === 'NOW()' || !userData.created_at ? now : userData.created_at,
              updated_at: userData.updated_at === 'NOW()' || !userData.updated_at ? now : userData.updated_at,
            };

            // Get user's roles
            try {
              const roles = await roleService.getUserRoleNames(user.id);
              return { ...fixedUserData, roles };
            } catch (err) {
              console.error(`Error fetching roles for user ${user.id}:`, err);
              return { ...fixedUserData, roles: [] };
            }
          }));

          const reportCounts = await reportService.getReportCountsByTargetType("user");
          const safeUsersWithReports = safeUsers.map(user => ({
            ...user,
            report_count: reportCounts[user.id] ?? 0,
          }));

          return success(safeUsersWithReports);
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
            biography: t.Optional(t.String()),
            profile_picture: t.Optional(t.String()),
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
        })
      // Update the current user's profile (simplified for frontend)
      .put("/update/me",
        async ({ body, requireAuth, set }) => {
          const claims = await requireAuth();
          const currentUserId = parseInt(claims.sub);

          // Check profile picture size if it's being updated
          // Base64 strings are ~33% larger than the original binary
          // 2MB file size limit: 2 * 1024 * 1024 * 1.33 ≈ 2,796,202 characters
          const MAX_PROFILE_PICTURE_SIZE = 2.8 * 1024 * 1024;
          if (body.profile_picture && body.profile_picture.length > MAX_PROFILE_PICTURE_SIZE) {
            set.status = 413; // Payload Too Large
            return error("Profile picture exceeds maximum size of 2MB", 413);
          }

          // Only allow updating certain fields for self-updates
          const allowedFields: Partial<NewUser> = {};
          if (body.pseudo !== undefined) allowedFields.pseudo = body.pseudo;
          if (body.biography !== undefined) allowedFields.biography = body.biography;
          if (body.profile_picture !== undefined) allowedFields.profile_picture = body.profile_picture;
          if (body.password !== undefined) allowedFields.password = body.password;

          // Update the user with isAdmin=false since this is a self-update
          const updatedUser = await userService.updateUser(
            currentUserId,
            allowedFields,
            false
          );

          // Remove sensitive data from response
          const { password_hash, ...userData } = updatedUser;

          // Get user's roles
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(currentUserId);

          return success({ ...userData, roles: userRoles });
        },
        {
          body: t.Object({
            pseudo: t.Optional(t.String()),
            password: t.Optional(t.String()),
            biography: t.Optional(t.String()),
            profile_picture: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update current user's profile",
            description: "Update the current user's profile information (simplified route for frontend)",
            responses: {
              "200": {
                description: "Profile updated successfully",
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

      // Export user data (self-export for transparency/GDPR)
      .get("/export-data/me",
        async ({ requireAuth, set }) => {
          const claims = await requireAuth();
          const currentUserId = parseInt(claims.sub);

          try {
            console.log(`[export-data] Starting data export for user ${currentUserId}`);
            const exportData = await userService.exportUserData(currentUserId);
            console.log(`[export-data] Successfully exported data for user ${currentUserId}`);
            return success(exportData);
          } catch (err) {
            console.error(`[export-data] Error exporting data for user ${currentUserId}:`, err);
            set.status = 500;
            return error(`Failed to export user data: ${(err as Error).message}`, 500);
          }
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Export current user's data",
            description: "Export all data associated with the current user for transparency/GDPR compliance",
            responses: {
              "200": {
                description: "User data exported successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "500": {
                description: "Failed to export data",
              },
            },
          },
        }
      )

      // Delete user account (self-deletion with password or validation phrase verification)
      .delete("/delete/me",
        async ({ body, requireAuth, set }) => {
          const claims = await requireAuth();
          const currentUserId = parseInt(claims.sub);

          try {
            await userService.deleteUserAccount(currentUserId, body.password || "", body.validationPhrase);

            // Clear the auth cookie after successful deletion
            set.headers["Set-Cookie"] = "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";

            return success({ message: "Account deleted successfully" });
          } catch (err) {
            const errorMessage = (err as Error).message;
            if (errorMessage.includes("Invalid password") || errorMessage.includes("validation phrase")) {
              set.status = 401;
              return error(errorMessage, 401);
            }
            set.status = 500;
            return error("Failed to delete account", 500);
          }
        },
        {
          body: t.Object({
            password: t.Optional(t.String()),
            validationPhrase: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Delete current user's account",
            description: "Permanently delete the current user's account with password verification (for regular users) or validation phrase (for OAuth users). All user data will be removed.",
            responses: {
              "200": {
                description: "Account deleted successfully",
              },
              "401": {
                description: "Invalid password/validation phrase or authentication required",
              },
              "500": {
                description: "Failed to delete account",
              },
            },
          },
        }
      )

      // Update privacy settings
      .put("/privacy-settings",
        async ({ body, requireAuth, set }) => {
          const claims = await requireAuth();
          const currentUserId = parseInt(claims.sub);

          try {
            const updatedUser = await userService.updateUser(
              currentUserId,
              { community_updates: body.community_updates },
              false
            );

            // Remove sensitive data
            const { password_hash, ...userData } = updatedUser;

            // Get user's roles
            const { roleService } = await import("../services/role");
            const userRoles = await roleService.getUserRoleNames(currentUserId);

            return success({ ...userData, roles: userRoles });
          } catch {
            set.status = 500;
            return error("Failed to update privacy settings", 500);
          }
        },
        {
          body: t.Object({
            community_updates: t.Boolean(),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update privacy settings",
            description: "Update the current user's privacy preferences",
            responses: {
              "200": {
                description: "Privacy settings updated successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "500": {
                description: "Failed to update settings",
              },
            },
          },
        }
      )
  );
}
