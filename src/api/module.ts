import { Elysia, t } from "elysia";
import { moduleService } from "../services/module";
import { userService } from "../services/user";
import { success } from "../utils/response";

/**
 * Setup module routes
 */
export function setupModuleRoutes() {
  type SetContextObj = {
    status: number | string;
    headers?: Record<string, string>;
    [key: string]: any; // Allow other properties on set if any
  };

  return (
    new Elysia({ prefix: "/module" })
      // Get all modules
      .get(
        "/list",
        async () => {
          // Auth check removed
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
              }
            },
          },
        }
      )
      // Get module by ID
      .get(
        "/get/:moduleId",
        async ({ params }) => {
          // Auth check removed
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
        async ({ body, set }) => {
          // Auth check removed
          // For creating a module, we'll use the first user as the owner
          const users = await userService.getAllUsers();
          if (!users.length || typeof users[0].id !== 'number') {
            set.status = 404;
            return { success: false, error: "No users available to create module", statusCode: 404 };
          }

          const creatingUser = users[0];
          const module = await moduleService.createModule({ ...body, owner_id: creatingUser.id });
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
              "404": {
                description: "No users available to create module",
              }
            },
          },
        }
      )
      // Update a module
      .put(
        "/update/:moduleId",
        async ({ params, body }) => {
          // Auth check removed
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
        async ({ params }) => {
          // Auth check removed
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
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
  );
}