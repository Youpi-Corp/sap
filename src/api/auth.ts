import { Elysia, t, type Context } from "elysia"; // Added 'type Context'
import { userService, LoginRequest } from "../services/user";
import { setupAuth } from "../middleware/auth";
import { success, error } from "../utils/response";
import crypto from "crypto";
import { cookie as cookiePlugin } from "@elysiajs/cookie"; // Renamed import

// Define types for properties expected on the context but not recognized by TS
type ElysiaJwtSigner = {
  sign: (payload: { sub: string | undefined; role: string | number }) => Promise<string>;
};

type ContextUser = {
  sub: string;
  email?: string;
  role?: string | number;
};

// Extend Elysia's base Context with jwt and user
interface HandlerContext extends Context {
  jwt: ElysiaJwtSigner;
  user?: ContextUser;
  // The 'cookie' store (Record<string, CookieType>) is expected to be on Context via @elysiajs/cookie
}

/**
 * Setup auth routes
 */
export function setupAuthRoutes() {
  const authPlugin = setupAuth();

  return new Elysia({ prefix: "/auth" })
    .use(authPlugin)
    .use(cookiePlugin()) // Use the renamed import
    .post(
      "/login",
      async ({ body, jwt, cookie, set }: HandlerContext) => { // Use HandlerContext, destructure cookie store
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
          const accessToken = await jwt.sign({ // jwt from HandlerContext
            sub: user.email, // sub must be string | undefined
            role: user.role || "1000", // role must be string | number
          });

          // Set cookie with the JWT using the cookie store from context
          cookie.auth_token.set({ // Use cookie store's .set() method
            value: accessToken,
            httpOnly: true,
            path: "/",
            maxAge: 900, // 15 minutes
            sameSite: "none", // Allow cross-domain use
            secure: process.env.NODE_ENV === 'production', // Conditional secure flag
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
      "/refresh",
      async ({ body, jwt, cookie, set }: HandlerContext) => { // Use HandlerContext, destructure cookie store
        try {
          const { refreshToken } = body as { refreshToken: string };

          // Validate refresh token
          const userId = await userService.validateRefreshToken(refreshToken);

          // Get user (renamed to avoid conflict with context.user if destructured)
          const userFromDb = await userService.getUserByEmail(userId);

          // Generate new refresh token
          const newRefreshToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(); // 7 days

          // Make sure email exists before using it
          if (!userFromDb.email) {
            throw new Error("User email is missing");
          }

          // Store new refresh token
          await userService.storeRefreshToken(
            userFromDb.email,
            newRefreshToken,
            expiresAt
          );

          // Generate new JWT - handle null values to match expected types
          const accessToken = await jwt.sign({ // jwt from HandlerContext
            sub: userFromDb.email, // sub must be string | undefined
            role: userFromDb.role || "1000", // role must be string | number
          });

          // Set cookie with the new JWT using the cookie store
          cookie.auth_token.set({ // Use cookie store's .set() method
            value: accessToken,
            httpOnly: true,
            path: "/",
            maxAge: 900, // 15 minutes
            sameSite: "none", // Allow cross-domain use
            secure: process.env.NODE_ENV === 'production', // Conditional secure flag
          });

          // Return success response
          return success({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900, // 15 minutes
          });
        } catch (err: unknown) {
          // Set correct status code for token errors
          set.status = 401;
          return error((err as Error).message || "Invalid refresh token", 401);
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
      async ({ user, cookie }: HandlerContext) => { // Use HandlerContext, destructure cookie store and user
        // Only process if user is authenticated (user from HandlerContext)
        if (user && user.sub) { // user.sub should contain the identifier (e.g., email)
          // Delete refresh tokens
          await userService.deleteRefreshTokens(user.sub);
        }

        // Clear the auth cookie using the cookie store
        cookie.auth_token.set({ // Use cookie store's .set() method
          value: "",
          httpOnly: true,
          path: "/",
          maxAge: 0, // Expire immediately
          sameSite: "none", // Allow cross-domain use
          secure: process.env.NODE_ENV === 'production', // Conditional secure flag
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
