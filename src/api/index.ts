import { Elysia } from "elysia";
import { setupAuthRoutes } from "./auth";
import { setupUserRoutes } from "./user";
import { setupInfoRoutes } from "./info";
import { setupModuleRoutes } from "./module";
import { setupCourseRoutes } from "./course";
import { setupRoleRoutes } from "./role";
import { setupModuleCommentRoutes } from "./moduleComment";

/**
 * Register all API routes
 */
export function setupRoutes(app: Elysia) {
  return app
    .use(setupAuthRoutes())
    .use(setupUserRoutes())
    .use(setupInfoRoutes())
    .use(setupModuleRoutes())
    .use(setupModuleCommentRoutes())
    .use(setupCourseRoutes())
    .use(setupRoleRoutes());
}
