import { Elysia } from "elysia";
import { setupAuthRoutes } from "./auth";
import { setupUserRoutes } from "./user";
import { setupInfoRoutes } from "./info";

/**
 * Register all API routes
 */
export function setupRoutes(app: Elysia) {
  return app
    .use(setupAuthRoutes())
    .use(setupUserRoutes())
    .use(setupInfoRoutes());
}
