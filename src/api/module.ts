import { Elysia, t } from "elysia";
import { moduleService } from "../services/module";
import { success } from "../utils/response";
import { setupAuth } from "../middleware/auth";

/**
 * Setup module routes
 */
export function setupModuleRoutes() {
  const auth = setupAuth();

  return (
    new Elysia({ prefix: "/module" })
      .use(auth)
      // Get all modules
      .get(
        "/list",
        async ({ requireAuth }) => {
          // Require authentication
          await requireAuth();

          const modules = await moduleService.getAllModules();
          return success(modules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "List all modules",
            description: "Retrieve a list of all modules",
            responses: {
              "200": {
                description: "List of modules retrieved successfully",
              },
              "401": {
                description: "Authentication required",
              }
            },
          },
        }
      )      // Get module by ID
      .get(
        "/get/:moduleId",
        async ({ params, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const moduleId = parseInt(params.moduleId, 10);
          const module = await moduleService.getModuleById(moduleId);
          return success(module);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Get module by ID",
            description: "Retrieve a module by its ID",
            responses: {
              "200": {
                description: "Module found",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
      // Create a new module
      .post(
        "/create",
        async ({ body, set, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          // Create the module with the authenticated user as owner
          const module = await moduleService.createModule({ ...body, owner_id: userId });
          set.status = 201;
          return success(module, 201);
        },
        {
          body: t.Object({
            name: t.String(),
            content: t.String(),
          }),
          detail: {
            tags: ["Modules"],
            summary: "Create a new module",
            description: "Create a new module",
            responses: {
              "201": {
                description: "Module created successfully",
              },
              "401": {
                description: "Authentication required",
              }
            },
          },
        }
      )      // Update a module
      .put(
        "/update/:moduleId",
        async ({ params, body, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const moduleId = parseInt(params.moduleId, 10);
          const updatedModule = await moduleService.updateModule(moduleId, body);
          return success(updatedModule);
        },
        {
          body: t.Object({
            name: t.Optional(t.String()),
            content: t.Optional(t.String()),
            user_id: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Modules"],
            summary: "Update a module",
            description: "Update a module by its ID",
            responses: {
              "200": {
                description: "Module updated successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
      // Delete a module
      .delete(
        "/delete/:moduleId",
        async ({ params, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const moduleId = parseInt(params.moduleId, 10);
          await moduleService.deleteModule(moduleId);
          return success({ message: "Module deleted" });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Delete a module",
            description: "Delete a module by its ID",
            responses: {
              "200": {
                description: "Module deleted successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
  );
}