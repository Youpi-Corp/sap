import { Elysia, t } from "elysia";
import { moduleService } from "../services/module";
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES } from "../utils/roles";
import { NotFoundError } from "../middleware/error";
import { courseService } from "../services/course";

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
          const claims = await requireAuth();
          const userRoles = claims.roles || [];
          const isAdmin = userRoles.includes(ROLES.ADMIN);

          // Admins see all modules, regular users see only public modules
          const modules = isAdmin 
            ? await moduleService.getAllModulesIncludingPrivate()
            : await moduleService.getAllModules();
          
          // Map dtc and dtm to created_at and updated_at for frontend compatibility
          const mappedModules = modules.map(module => ({
            ...module,
            created_at: module.dtc,
            updated_at: module.dtm
          }));
          return success(mappedModules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "List all modules",
            description: "Retrieve a list of modules. Admins see all modules (public and private), regular users see only public modules.",
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
      // Get public modules
      .get(
        "/public",
        async () => {
          // No authentication required for public modules
          const modules = await moduleService.getPublicModules();
          return success(modules);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "List public modules",
            description: "Retrieve a list of all public modules (no authentication required)",
            responses: {
              "200": {
                description: "List of public modules retrieved successfully",
              }
            },
          },
        }
      )      // Get module by ID
      .get(
        "/get/:moduleId",
        async ({ params, requireAuth, set }) => {
          try {
            // Get user from JWT token if available
            let userId: number | null = null;
            let userRoles: string[] = []; try {
              const claims = await requireAuth();
              userId = parseInt(claims.sub);
              userRoles = claims.roles;
            } catch {
              // Continue without auth - will only allow access to public modules
            }

            const moduleId = parseInt(params.moduleId, 10);
            const module = await moduleService.getModuleById(moduleId);

            // Check if the user can access this module
            // Allow access if:
            // 1. Module is public, OR
            // 2. User is the module owner, OR
            // 3. User has the ADMIN role
            const isOwner = userId && module.owner_id === userId;
            const isAdmin = userRoles.includes(ROLES.ADMIN);
            const isPublic = module.public === true;

            if (!isPublic && !isOwner && !isAdmin) {
              set.status = 403;
              return error("You are not authorized to access this module", 403);
            }

            return success(module);
          } catch (err) {
            if (err instanceof NotFoundError) {
              set.status = 404;
              return error("Module not found", 404);
            }
            throw err;
          }
        }, {
        detail: {
          tags: ["Modules"],
          summary: "Get module by ID",
          description: "Retrieve a module by its ID. If the module is private, only the owner or admin can access it. Public modules can be accessed by anyone.",
          responses: {
            "200": {
              description: "Module found",
            },
            "401": {
              description: "Authentication required",
            },
            "403": {
              description: "Not authorized to access this module",
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
        }, {
        body: t.Object({
          title: t.String(), // Changed from 'name'
          description: t.Optional(t.String()), // Added description
          public: t.Optional(t.Boolean()), // Added public flag with default value
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
        }, {
        body: t.Object({
          title: t.Optional(t.String()), // Changed from 'name'
          description: t.Optional(t.String()), // Added description
          public: t.Optional(t.Boolean()), // Added public flag
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
      // Add a course to a module
      .post(
        "/add-course/:moduleId/:courseId",
        async ({ params, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const userRoles = claims.roles;

          const moduleId = parseInt(params.moduleId, 10);
          const courseId = parseInt(params.courseId, 10);

          // Get the module to check ownership
          const module = await moduleService.getModuleById(moduleId);
          const isOwner = module.owner_id === userId;
          const isAdmin = userRoles.includes(ROLES.ADMIN);

          if (!isOwner && !isAdmin) {
            throw new Error("You are not authorized to modify this module");
          }

          const added = await moduleService.addCourseToModule(moduleId, courseId);
          return success({ added });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Add a course to a module",
            description: "Associate a course with a module",
            responses: {
              "200": {
                description: "Course added successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Not authorized to modify this module",
              },
              "404": {
                description: "Module or course not found",
              },
            },
          },
        }
      )
      // Remove a course from a module
      .delete(
        "/remove-course/:moduleId/:courseId",
        async ({ params, requireAuth }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const userRoles = claims.roles;

          const moduleId = parseInt(params.moduleId, 10);
          const courseId = parseInt(params.courseId, 10);

          // Get the module to check ownership
          const module = await moduleService.getModuleById(moduleId);
          const isOwner = module.owner_id === userId;
          const isAdmin = userRoles.includes(ROLES.ADMIN);

          if (!isOwner && !isAdmin) {
            throw new Error("You are not authorized to modify this module");
          }

          const removed = await moduleService.removeCourseFromModule(moduleId, courseId);
          return success({ removed });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Remove a course from a module",
            description: "Remove a course association from a module",
            responses: {
              "200": {
                description: "Course removed successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Not authorized to modify this module",
              },
              "404": {
                description: "Module or course not found",
              },
            },
          },
        }
      )
      // Get all courses for a module
      .get(
        "/courses/:moduleId",
        async ({ params, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const moduleId = parseInt(params.moduleId, 10);
          const courses = await moduleService.getModuleCourses(moduleId);
          return success(courses);
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Get module courses",
            description: "Get all courses associated with a module",
            responses: {
              "200": {
                description: "Courses retrieved successfully",
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
        async ({ params, requireAuth, set }) => {
          // Require authentication
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const userRoles = claims.roles;

          const moduleId = parseInt(params.moduleId, 10);
          const module = await moduleService.getModuleById(moduleId);

          // Allow deletion if:
          // 1. User is the module owner, OR
          // 2. User has the ADMIN role
          const isOwner = module.owner_id === userId;
          const isAdmin = userRoles.includes(ROLES.ADMIN);

          if (!isOwner && !isAdmin) {
            set.status = 403;
            return error("You are not authorized to delete this module", 403);
          }

          // Get all courses in the module and delete them first
          const moduleCourses = await moduleService.getModuleCourses(moduleId);
          
          // Delete each course with its associated likes using our course service
          for (const course of moduleCourses) {
            await courseService.deleteCourseAndUpdateModule(course.id);
          }

          // Unsubscribe all users from this module
          await moduleService.unsubscribeAllUsersFromModule(moduleId);

          // Now delete the module (courses_count will already be 0)
          await moduleService.deleteModule(moduleId);
          return success({ message: "Module and all its courses deleted successfully" });
        },
        {
          detail: {
            tags: ["Modules"],
            summary: "Delete a module",
            description: "Delete a module by its ID along with all its associated courses and course likes",
            responses: {
              "200": {
                description: "Module and courses deleted successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Not authorized to delete this module",
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