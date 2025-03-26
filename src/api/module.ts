import { Elysia, t } from "elysia";
import { moduleService } from "../services/module";
import { setupAuth, Role } from "../middleware/auth";
import { success, UNAUTHORIZED } from "../utils/response";
import { ForbiddenError } from "../middleware/error";

/**
 * Setup module routes
 */
export function setupModuleRoutes() {
  const authPlugin = setupAuth();

  return (
    new Elysia({ prefix: "/module" })
      .use(authPlugin)
      // Get all modules
      .get(
        "/list",
        async ({ guardRoles, set }) => {
          const authResult = guardRoles([Role.Learner, Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const modules = await moduleService.getAllModules();
          return success(modules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "List all modules",
            description: "Retrieve a list of all modules",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "List of modules retrieved successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
              },
            },
          },
        }
      )
      // Get module by ID
      .get(
        "/get/:moduleId",
        async ({ params, guardRoles, set }) => {
          const authResult = guardRoles([Role.Learner, Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const moduleId = parseInt(params.moduleId, 10);
          const module = await moduleService.getModuleById(moduleId);
          return success(module);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Get module by ID",
            description: "Retrieve a module by its ID",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Module found",
              },
              "401": {
                description: "Not authenticated",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
      // Create a new module (Admin or Teacher only)
      .post(
        "/create",
        async ({ body, guardRoles, set }) => {
          const authResult = guardRoles([Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const module = await moduleService.createModule(body);
          set.status = 201;
          return success(module, 201);
        },
        {
          body: t.Object({
            name: t.String(),
            content: t.String(),
            user_id: t.Number(),
          }),
          detail: {
            tags: ["Modules"],
            summary: "Create a new module",
            description: "Create a new module (Admin or Teacher only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "201": {
                description: "Module created successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
              },
            },
          },
        }
      )
      // Update a module (Admin or Teacher only)
      .put(
        "/update/:moduleId",
        async ({ params, body, guardRoles, set }) => {
          const authResult = guardRoles([Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

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
            description: "Update a module by its ID (Admin or Teacher only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Module updated successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
      // Delete a module (Admin only)
      .delete(
        "/delete/:moduleId",
        async ({ params, guardRoles, set }) => {
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const moduleId = parseInt(params.moduleId, 10);
          await moduleService.deleteModule(moduleId);
          return success({ message: "Module deleted" });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Delete a module",
            description: "Delete a module by its ID (Admin only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Module deleted successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
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