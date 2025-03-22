import { Elysia, t } from "elysia";
import { userService } from "../services/user";
import { setupAuth, Role } from "../middleware/auth";
import { success, UNAUTHORIZED } from "../utils/response";
import { ForbiddenError } from "../middleware/error";

/**
 * Setup user routes
 */
export function setupUserRoutes() {
  const authPlugin = setupAuth();

  return (
    new Elysia({ prefix: "/user" })
      .use(authPlugin)
      // Get current user
      .get(
        "/me",
        async ({ user, isAuthenticated, set }) => {
          // Check authentication
          if (!isAuthenticated() || !user) {
            // Set the HTTP status code to match the response body status code
            set.status = 401;
            return UNAUTHORIZED;
          }

          // Get user by email from JWT
          const userData = await userService.getUserByEmail(user.sub);
          return success(userData);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get current user profile",
            description:
              "Retrieve the profile of the currently authenticated user",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "User profile retrieved successfully",
              },
              "401": {
                description: "Not authenticated",
              },
            },
          },
        }
      )
      // Get user by ID
      .get(
        "/get/:userId",
        async ({ params, guard, set }) => {
          // Check authentication
          const authResult = guard();
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const userId = parseInt(params.userId, 10);
          const user = await userService.getUserById(userId);
          return success(user);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get user by ID",
            description: "Retrieve a user's profile by their ID",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "User found",
              },
              "401": {
                description: "Not authenticated",
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
        async ({ params, guard, set }) => {
          // Check authentication
          const authResult = guard();
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const user = await userService.getUserByEmail(params.email);
          return success(user);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get user by email",
            description: "Retrieve a user's profile by their email address",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "User found",
              },
              "401": {
                description: "Not authenticated",
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
      )
      // Create user (admin only)
      .post(
        "/create",
        async ({ body, guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const user = await userService.createUser(body);
          set.status = 201;
          return success(user, 201);
        },
        {
          body: t.Object({
            pseudo: t.Optional(t.String()),
            email: t.String(),
            password: t.String(),
            role: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Create user (Admin only)",
            description: "Create a new user (Admin role required)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "201": {
                description: "User created successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized (Admin role required)",
              },
              "409": {
                description: "Email already in use",
              },
            },
          },
        }
      )
      // List all users (admin only)
      .get(
        "/list",
        async ({ guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const users = await userService.getAllUsers();
          return success(users);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "List all users (Admin only)",
            description:
              "Get a list of all users in the system (Admin role required)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "List of users retrieved successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized (Admin role required)",
              },
            },
          },
        }
      )
      // Delete user (admin only)
      .delete(
        "/delete/:userId",
        async ({ params, guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const userId = parseInt(params.userId, 10);
          await userService.deleteUser(userId);
          return success({ message: "User deleted" });
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Delete user (Admin only)",
            description: "Delete a user by ID (Admin role required)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "User deleted successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized (Admin role required)",
              },
              "404": {
                description: "User not found",
              },
            },
          },
        }
      )
      // Update user
      .put(
        "/update/:userId",
        async ({ params, body, user, isAuthenticated, hasRoles, set }) => {
          // Check authentication
          if (!isAuthenticated() || !user) {
            set.status = 401;
            return UNAUTHORIZED;
          }

          const userId = parseInt(params.userId, 10);
          const userData = await userService.getUserById(userId);

          // Check if user is updating their own profile or is an admin
          if (userData.email !== user.sub && !hasRoles([Role.Admin])) {
            set.status = 403;
            throw new ForbiddenError("Cannot update other users");
          }

          const updatedUser = await userService.updateUser(userId, body);
          return success(updatedUser);
        },
        {
          body: t.Object({
            pseudo: t.Optional(t.String()),
            email: t.Optional(t.String()),
            password: t.Optional(t.String()),
            role: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Users"],
            summary: "Update user",
            description:
              "Update a user's profile (Users can update their own profile, Admin can update any profile)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "User updated successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized to update this user",
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
