import { Elysia, t } from "elysia";
import { userService, LoginRequest } from "../services/user";
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES } from "../utils/roles";
import { githubOAuthService } from "../services/github-oauth";

/**
 * Setup auth routes
 */
export function setupAuthRoutes() {
  const auth = setupAuth();

  return new Elysia({ prefix: "/auth" })
    .use(auth)
    .post(
      "/login",
      async ({ body, set, setAuthCookie }) => {
        try {          // Validate request
          const { email, password } = body as LoginRequest;          // Authenticate user
          const user = await userService.authenticate(email, password);

          // Set JWT token in HTTP-only cookie with user's roles
          await setAuthCookie(user.id);

          // Get user's roles from the database for the response
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(user.id);

          // Return success response
          set.status = 200;
          return success({
            userId: user.id,
            roles: userRoles.length > 0 ? userRoles : [ROLES.USER]
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
    ).post(
      "/register",
      async ({ body, set }) => {
        try {
          // Ensure new registrants get the USER role, not admin
          const userData = { ...body };

          // Create user with isAdmin=false to prevent role escalation
          const user = await userService.createUser(userData, false);

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
          biography: t.Optional(t.String()),
          profile_picture: t.Optional(t.String())
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
    ).post(
      "/logout",
      async ({ clearAuthCookie }) => {
        // Clear auth cookie
        clearAuthCookie();
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
    )
    .get(
      "/me",
      async ({ getCurrentUserId, set }) => {
        const userId = await getCurrentUserId();

        if (!userId) {
          set.status = 401;
          return error("Not authenticated", 401);
        }

        try {
          const userIdNum = parseInt(userId);
          const user = await userService.getUserById(userIdNum);

          // Don't return password hash
          const { password_hash, ...userInfo } = user;

          return success(userInfo);
        } catch (err) {
          set.status = 404;
          console.error("Error fetching user:", err);
          return error("User not found", 404);
        }
      },
      {
        detail: {
          tags: ["Authentication"],
          summary: "Get current user",
          description: "Get the profile of the currently authenticated user",
          responses: {
            "200": {
              description: "User profile retrieved successfully",
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
    .get(
      "/github",
      async ({ set }) => {
        try {
          // Generate GitHub OAuth authorization URL
          const authUrl = githubOAuthService.getAuthorizationUrl();

          return success({ url: authUrl });
        } catch (err: unknown) {
          console.error("Error generating GitHub OAuth URL:", err);
          set.status = 500;
          return error("Failed to initiate GitHub authentication", 500);
        }
      },
      {
        detail: {
          tags: ["Authentication"],
          summary: "Initiate GitHub OAuth",
          description: "Get GitHub OAuth authorization URL",
          responses: {
            "200": {
              description: "Authorization URL generated successfully",
            },
            "500": {
              description: "Failed to generate authorization URL",
            },
          },
        },
      }
    )
    .get(
      "/github/callback",
      async ({ query, set, setAuthCookie }) => {
        try {
          const { code } = query;

          if (!code) {
            set.status = 400;
            return error("Missing authorization code", 400);
          }

          // Exchange code for GitHub user info
          const githubUser = await githubOAuthService.authenticate(code);

          if (!githubUser.id) {
            set.status = 400;
            return error("Failed to get GitHub user information", 400);
          }

          // Find or create user
          const user = await userService.findOrCreateByGitHub(
            githubUser.id.toString(),
            {
              pseudo: githubUser.login || githubUser.name || undefined,
              email: githubUser.email || undefined,
              profile_picture: githubUser.avatar_url || undefined,
              biography: githubUser.bio || undefined,
            }
          );

          // Set JWT token in HTTP-only cookie
          await setAuthCookie(user.id);

          // Get user's roles from the database for the response
          const { roleService } = await import("../services/role");
          const userRoles = await roleService.getUserRoleNames(user.id);

          // Return success response
          set.status = 200;
          return success({
            userId: user.id,
            roles: userRoles.length > 0 ? userRoles : [ROLES.USER]
          });
        } catch (err: unknown) {
          console.error("GitHub OAuth callback error:", err);
          set.status = 401;
          return error((err as Error).message || "GitHub authentication failed", 401);
        }
      },
      {
        query: t.Object({
          code: t.String(),
          state: t.Optional(t.String()),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "GitHub OAuth callback",
          description: "Handle GitHub OAuth callback and authenticate user",
          responses: {
            "200": {
              description: "Authentication successful",
            },
            "400": {
              description: "Missing or invalid parameters",
            },
            "401": {
              description: "Authentication failed",
            },
          },
        },
      }
    );
}
