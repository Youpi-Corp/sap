import { Elysia, t } from "elysia";
import { userService, LoginRequest } from "../services/user";
import { success, error } from "../utils/response";

/**
 * Setup auth routes
 */
export function setupAuthRoutes() {
  return new Elysia({ prefix: "/auth" })
    .post(
      "/login",
      async ({ body, set }) => {
        try {
          // Validate request
          const { email, password } = body as LoginRequest;

          // Authenticate user
          const user = await userService.authenticate(email, password);

          // Return success response
          set.status = 200;
          return success({
            userId: user.id,
            // No tokens needed anymore
          });
        } catch (err: unknown) {
          // Set correct status code for authentication failures
          set.status = 401;
          return error((err as Error).message || "Invalid credentials", 401);
        }
      },
      {
        body: t.Object({
          email: t.String(),
          password: t.String(),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "User login",
          description: "Authenticate a user with email and password",
          responses: {
            "200": {
              description: "Login successful",
            },
            "401": {
              description: "Invalid credentials",
            },
          },
        },
      }
    )
    .post(
      "/register",
      async ({ body, set }) => {
        try {
          // Create user
          const user = await userService.createUser(body);

          set.status = 201;
          return success(user, 201);
        } catch (err: unknown) {
          console.error("Error creating user:", err);

          // Set appropriate status code based on error
          if ((err as Error).message && (err as Error).message.includes("already in use")) {
            set.status = 409;
            return error((err as Error).message, 409);
          }

          set.status = 400;
          return error((err as Error).message || "Failed to create user", 400);
        }
      },
      {
        body: t.Object({
          pseudo: t.Optional(t.String()),
          email: t.String(),
          password: t.String(),
          role: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "User registration",
          description: "Register a new user account",
          responses: {
            "201": {
              description: "User created successfully",
            },
            "400": {
              description: "Invalid request data",
            },
            "409": {
              description: "Email already in use",
            },
          },
        },
      }
    )
    .post(
      "/logout",
      async () => {
        // No auth check needed, just return success
        return success({ message: "Logged out successfully" });
      },
      {
        detail: {
          tags: ["Authentication"],
          summary: "Logout",
          description: "Logout the current user",
          responses: {
            "200": {
              description: "Successfully logged out",
            },
          },
        },
      }
    );
}
