import { Elysia, t } from "elysia";
import { userService, type NewUser } from "../services/user"; // Import NewUser type
import { success } from "../utils/response";

/**
 * Setup user routes
 */
export function setupUserRoutes() {
  return (
    new Elysia({ prefix: "/user" })
      // Get current user
      .get(
        "/me",
        async () => {
          // Auth check removed
          // Get the first user from database instead of using JWT
          const users = await userService.getAllUsers();
          const userData = users.length > 0 ? users[0] : {};
          return success(userData);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Get current user profile",
            description: "Retrieve the profile of the currently authenticated user",
            responses: {
              "200": {
                description: "User profile retrieved successfully",
              }
            },
          },
        }
      )
      // Get user by ID
      .get(
        "/get/:userId",
        async ({ params }) => {
          // Auth check removed
          const userId = parseInt(params.userId, 10);
          const userResult = await userService.getUserById(userId);
          return success(userResult);
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
        async ({ params }) => {
          // Auth check removed
          const userResult = await userService.getUserByEmail(params.email);
          return success(userResult);
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
      // Create user (admin check removed)
      .post(
        "/create",
        async ({ body, set }) => {
          // Auth check removed
          // Explicitly cast body to NewUser after validation by Elysia's `t.Object`
          const newUser = await userService.createUser(body as NewUser);
          set.status = 201;
          return success(newUser, 201);
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
      )
      // List all users (admin check removed)
      .get(
        "/list",
        async () => {
          // Auth check removed
          const users = await userService.getAllUsers();
          return success(users);
        },
        {
          detail: {
            tags: ["Users"],
            summary: "List all users",
            description: "Get a list of all users in the system",
            responses: {
              "200": {
                description: "List of users retrieved successfully",
              },
            },
          },
        }
      )
      // Delete user (admin check removed)
      .delete(
        "/delete/:userId",
        async ({ params }) => {
          // Auth check removed
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
      )
      // Update user (auth check removed)
      .put(
        "/update/:userId",
        async ({ params, body }) => {
          // Auth check removed
          const userIdToUpdate = parseInt(params.userId, 10);

          // Explicitly cast body to Partial<NewUser> after validation by Elysia's `t.Object`
          const updatedUser = await userService.updateUser(userIdToUpdate, body as Partial<NewUser>);
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
