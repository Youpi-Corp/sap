import { Elysia } from "elysia";
import { setupAuthRoutes } from "./auth";
import { setupUserRoutes } from "./user";
import { setupInfoRoutes } from "./info";
import { setupModuleRoutes } from "./module";

/**
 * Register all API routes
 */
export function setupRoutes(app: Elysia) {
  return app
    .use(setupAuthRoutes())
    .use(setupUserRoutes())
    .use(setupInfoRoutes())
    .use(setupModuleRoutes());
}
