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
      )
      // Get module by ID
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
      // Get modules by owner ID
      .get(
        "/owner/:ownerId",
        async ({ params, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const ownerId = parseInt(params.ownerId, 10);
          const modules = await moduleService.getModulesByOwnerId(ownerId);
          return success(modules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Get modules by owner ID",
            description: "Retrieve all modules created by a specific owner",
            responses: {
              "200": {
                description: "Modules found",
              },
              "401": {
                description: "Authentication required",
              },
            },
          },
        }
      )
      // Get modules user is subscribed to
      .get(
        "/subscribed",
        async ({ requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          const modules = await moduleService.getSubscribedModules(userId);
          return success(modules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Get subscribed modules",
            description: "Retrieve all modules the authenticated user is subscribed to",
            responses: {
              "200": {
                description: "Subscribed modules found",
              },
              "401": {
                description: "Authentication required",
              },
            },
          },
        }
      )
      // Check if user is subscribed to a module
      .get(
        "/is-subscribed/:moduleId",
        async ({ params, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          const moduleId = parseInt(params.moduleId, 10);
          const isSubscribed = await moduleService.isUserSubscribed(userId, moduleId);
          return success({ isSubscribed });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Check subscription status",
            description: "Check if the authenticated user is subscribed to a specific module",
            responses: {
              "200": {
                description: "Subscription status retrieved",
              },
              "401": {
                description: "Authentication required",
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
      )
      // Update a module
      .put(
        "/update/:moduleId",
        async ({ params, body, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const moduleId = parseInt(params.moduleId, 10);
          // Check if the user is the owner of the module or an admin
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const module = await moduleService.getModuleById(moduleId);
          if (module.owner_id !== userId) {
            throw new Error("You are not authorized to delete this module");
          }

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
      // Subscribe to a module
      .post(
        "/subscribe/:moduleId",
        async ({ params, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          const moduleId = parseInt(params.moduleId, 10);
          const subscribed = await moduleService.subscribeToModule(userId, moduleId);
          return success({ subscribed });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Subscribe to a module",
            description: "Subscribe the authenticated user to a specific module",
            responses: {
              "200": {
                description: "Subscription status",
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
      // Unsubscribe from a module
      .delete(
        "/unsubscribe/:moduleId",
        async ({ params, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          const moduleId = parseInt(params.moduleId, 10);
          const unsubscribed = await moduleService.unsubscribeFromModule(userId, moduleId);
          return success({ unsubscribed });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Unsubscribe from a module",
            description: "Unsubscribe the authenticated user from a specific module",
            responses: {
              "200": {
                description: "Unsubscription status",
              },
              "401": {
                description: "Authentication required",
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

          // Check if the user is the owner of the module or an admin
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const module = await moduleService.getModuleById(moduleId);
          if (module.owner_id !== userId) {
            throw new Error("You are not authorized to delete this module");
          }

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