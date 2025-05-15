import { Elysia, t } from "elysia";
import { userService, LoginRequest } from "../services/user";
import { setupAuth } from "../middleware/auth";
import { success, error } from "../utils/response";
import crypto from "crypto";
import { cookie } from "@elysiajs/cookie";

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

          // Generate refresh token
          const refreshToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(); // 7 days

          // Make sure email exists before using it
          if (!user.email) {
            throw new Error("User email is missing");
          }

          // Store refresh token
          await userService.storeRefreshToken(
            user.email,
            refreshToken,
            expiresAt
          );

          // Generate JWT - handle null values to match expected types
          const accessToken = await jwt.sign({
            sub: user.email, // sub must be string | undefined
            role: user.role || "1000", // role must be string | number
          });

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

        console.log("Registering user with body:", body);

        try {
          // Create user
          const user = await userService.createUser(body);

          console.log("User created:", user);

          set.status = 201;
          return success(user, 201);
        } catch (err: any) {

          console.error("Error creating user:", err);

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

          // Validate refresh token
          const userId = await userService.validateRefreshToken(refreshToken);

          // Get user
          const user = await userService.getUserByEmail(userId);

          // Generate new refresh token
          const newRefreshToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(); // 7 days

          // Make sure email exists before using it
          if (!user.email) {
            throw new Error("User email is missing");
          }

          // Store new refresh token
          await userService.storeRefreshToken(
            user.email,
            newRefreshToken,
            expiresAt
          );

          // Generate new JWT - handle null values to match expected types
          const accessToken = await jwt.sign({
            sub: user.email, // sub must be string | undefined
            role: user.role || "1000", // role must be string | number
          });

          // Set cookie with the new JWT
          setCookie("auth_token", accessToken, {
            httpOnly: true,
            path: "/",
            maxAge: 900, // 15 minutes
            sameSite: "none", // Allow cross-domain use
            secure: process.env.NODE_ENV === "production",
          });

          // Return success response
          return success({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900, // 15 minutes
          });
        } catch (err: any) {
          // Set correct status code for token errors
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
