import { Elysia, t } from "elysia";
import { userService, LoginRequest } from "../services/user";
import { setupAuth } from "../middleware/auth";
import { success, error } from "../utils/response";
import crypto from "crypto";
import { cookie } from "@elysiajs/cookie";

// Modified JWT payload to be compatible with Elysia's JWT type requirements
type JwtPayload = Record<string, string | number> & {
  sub: string;
  role: string;
  exp?: number;
};

/**
 * Setup auth routes
 */
export function setupAuthRoutes() {
  const authPlugin = setupAuth();

  return new Elysia({ prefix: "/auth" })
    .use(authPlugin)
    .use(cookie()) // Add cookie plugin explicitly
    .post(
      "/login",
      async ({ body, jwt, setCookie, set }) => {
        try {
          // Validate request
          const { email, password } = body as LoginRequest;

          // Authenticate user
          const user = await userService.authenticate(email, password);

          // Make sure email exists before using it
          if (!user.email) {
            throw new Error("User email is missing");
          }

          // Get user roles for JWT
          const userRoles = await userService.getUserRoles(user.id);

          // Generate refresh token
          const refreshToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(); // 7 days

          // Store refresh token
          await userService.storeRefreshToken(
            user.email,
            refreshToken,
            expiresAt
          );

          // Store roles as comma-separated string in JWT
          const payload: JwtPayload = {
            sub: user.email,
            role: userRoles.join(","),
          };

          const accessToken = await jwt.sign(payload);

          // Set cookie with the JWT using the setCookie function
          setCookie("auth_token", accessToken, {
            httpOnly: true,
            path: "/",
            maxAge: 900, // 15 minutes
            sameSite: "none", // Allow cross-domain use
            // Secure should be true in production but false in development to work on http localhost
            secure: process.env.NODE_ENV === "production",
          });

          console.log(
            "Set cookie auth_token with token:",
            accessToken.substring(0, 10) + "..."
          );

          // Return success response
          set.status = 200;
          return success({
            userId: user.id,
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes
            roles: userRoles, // Include roles in response
          });
        } catch (err: any) {
          // Set correct status code for authentication failures
          set.status = 401;
          return error(err.message || "Invalid credentials", 401);
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
        } catch (err: any) {
          // Set appropriate status code based on error
          if (err.message && err.message.includes("already in use")) {
            set.status = 409;
            return error(err.message, 409);
          }

          set.status = 400;
          return error(err.message || "Failed to create user", 400);
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
      "/refresh",
      async ({ body, jwt, setCookie, set }) => {
        try {
          const { refreshToken } = body as { refreshToken: string };
          const userId = await userService.validateRefreshToken(refreshToken);
          const user = await userService.getUserByEmail(userId);

          if (!user.email) {
            throw new Error("User email is missing");
          }

          // Get user roles for new JWT
          const userRoles = await userService.getUserRoles(user.id);

          const newRefreshToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString();

          await userService.storeRefreshToken(
            user.email,
            newRefreshToken,
            expiresAt
          );

          // Store roles as comma-separated string in JWT
          const payload: JwtPayload = {
            sub: user.email,
            role: userRoles.join(","),
          };

          const accessToken = await jwt.sign(payload);

          setCookie("auth_token", accessToken, {
            httpOnly: true,
            path: "/",
            maxAge: 900,
            sameSite: "none",
            secure: process.env.NODE_ENV === "production",
          });

          return success({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
            roles: userRoles, // Include roles in response
          });
        } catch (err: any) {
          set.status = 401;
          return error(err.message || "Invalid refresh token", 401);
        }
      },
      {
        body: t.Object({
          refreshToken: t.String(),
        }),
        detail: {
          tags: ["Authentication"],
          summary: "Refresh authentication token",
          description: "Get a new access token using a refresh token",
          responses: {
            "200": {
              description: "Token refreshed successfully",
            },
            "401": {
              description: "Invalid or expired refresh token",
            },
          },
        },
      }
    )
    .post(
      "/logout",
      async ({ user, setCookie }) => {
        // Only process if user is authenticated
        if (user) {
          // Delete refresh tokens
          await userService.deleteRefreshTokens(user.sub);
        }

        // Clear the auth cookie
        setCookie("auth_token", "", {
          httpOnly: true,
          path: "/",
          maxAge: 0, // Expire immediately
          sameSite: "none", // Allow cross-domain use
          secure: process.env.NODE_ENV === "production",
        });

        return success({ message: "Logged out successfully" });
      },
      {
        detail: {
          tags: ["Authentication"],
          summary: "Logout",
          description: "Logout the current user and invalidate their tokens",
          responses: {
            "200": {
              description: "Successfully logged out",
            },
          },
        },
      }
    );
}
