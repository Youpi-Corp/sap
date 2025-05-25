import { Elysia, t } from "elysia";
import { courseService } from "../services/course";
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { ROLES, PERMISSIONS, hasPermission, hasRole } from "../utils/roles";

/**
 * Setup course routes
 */
export function setupCourseRoutes() {
  const auth = setupAuth();

  return new Elysia({ prefix: "/course" })
    .use(auth)    // Get all courses (filtered based on user role)
    .get(
      "/list",
      async ({ requireAuth }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        // Get courses based on user's roles and permissions
        const courses = await courseService.getCoursesByUserAccess(userId, userRoles);
        return success(courses);
      }, {
      detail: {
        tags: ["Courses"],
        summary: "List courses",
        description: "Retrieve a list of courses based on user permissions. Admins see all courses, while regular users only see public courses and their own courses.",
        responses: {
          "200": {
            description: "List of courses retrieved successfully",
          },
          "401": {
            description: "Authentication required",
          }
        },
      },
    }
    )    // Get course by ID
    .get(
      "/get/:courseId",
      async ({ params, requireAuth, set }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        const courseId = parseInt(params.courseId, 10);
        const course = await courseService.getCourseById(courseId);

        // Check if user has access to this course:
        // 1. Course is public, OR
        // 2. User is the course owner, OR
        // 3. User has ADMIN role
        const isPublic = course.public === true;
        const isOwner = course.owner_id === userId;
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        if (!isPublic && !isOwner && !isAdmin) {
          set.status = 403; // Forbidden
          return error("You do not have permission to access this course", 403);
        }

        return success(course);
      }, {
      detail: {
        tags: ["Courses"],
        summary: "Get course by ID",
        description: "Retrieve a course by its ID. User can access a course if it's public, they own it, or they're an admin.",
        responses: {
          "200": {
            description: "Course found",
          },
          "401": {
            description: "Authentication required",
          },
          "403": {
            description: "Forbidden - User does not have permission to access this course",
          },
          "404": {
            description: "Course not found",
          },
        },
      },
    }
    )    // Create a new course
    .post(
      "/create",
      async ({ body, set, requireAuth }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        // Check if the user has permission to create courses
        if (!hasPermission(userRoles, PERMISSIONS.CREATE_COURSE) &&
          !hasRole(userRoles, [ROLES.ADMIN, ROLES.TEACHER])) {
          set.status = 403; // Forbidden
          return error("You do not have permission to create courses", 403);
        }

        // Check if the user is the owner of the module
        const moduleId = body.module_id;
        const { moduleService } = await import("../services/module");
        const module = await moduleService.getModuleById(moduleId);

        // Allow course creation if:
        // 1. User is the module owner, OR
        // 2. User has the ADMIN role
        const isOwner = module.owner_id === userId;
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        if (!isOwner && !isAdmin) {
          set.status = 403; // Forbidden
          return error("You are not authorized to create courses in this module", 403);
        }

        // Create the course with the authenticated user as owner
        const course = await courseService.createCourseAndUpdateModule({ ...body, owner_id: userId });
        set.status = 201;
        return success(course, 201);
      },
      {
        body: t.Object({
          name: t.String(),
          content: t.String(),
          module_id: t.Number(),
          level: t.Number(),
          public: t.Boolean(),
        }), detail: {
          tags: ["Courses"],
          summary: "Create a new course",
          description: "Create a new course. User must either own the module or be an admin. Additionally, the user must have the CREATE_COURSE permission or have a TEACHER or ADMIN role.",
          responses: {
            "201": {
              description: "Course created successfully",
            },
            "401": {
              description: "Authentication required",
            },
            "403": {
              description: "Not authorized to create courses in this module",
            },
            "404": {
              description: "Module not found",
            }
          },
        },
      }
    )
    .get(    // Get courses by owner ID    .get(
      "/owner/:ownerId",
      async ({ params, requireAuth }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        const ownerId = parseInt(params.ownerId, 10);

        // If user is looking at their own courses or is an admin, return all
        const isOwnCourses = userId === ownerId;
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        if (isOwnCourses || isAdmin) {
          // Return all courses (public and private) for this owner
          const courses = await courseService.getCoursesByOwnerId(ownerId);
          return success(courses);
        } else {
          // Return only public courses for this owner
          const allOwnerCourses = await courseService.getCoursesByOwnerId(ownerId);
          const publicCourses = allOwnerCourses.filter(course => course.public === true);
          return success(publicCourses);
        }
      }, {
      detail: {
        tags: ["Courses"],
        summary: "Get courses by owner ID",
        description: "Retrieve courses created by a specific owner. Returns all courses if requesting your own courses or if you're an admin. Otherwise, returns only public courses.",
        responses: {
          "200": {
            description: "Courses found",
          },
          "401": {
            description: "Authentication required",
          },
        },
      },
    }
    )    // Update a course
    .put(
      "/update/:courseId",
      async ({ params, body, requireAuth, set }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        const courseId = parseInt(params.courseId, 10);
        const course = await courseService.getCourseById(courseId);

        // Allow updates if:
        // 1. User is the course owner, OR
        // 2. User has the ADMIN role
        const isOwner = course.owner_id === userId;
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        if (!isOwner && !isAdmin) {
          set.status = 403; // Forbidden          return error("You are not authorized to update this course", 403);
        }

        const updatedCourse = await courseService.updateCourseAndModules(courseId, body);
        return success(updatedCourse);
      },
      {
        body: t.Object({
          name: t.Optional(t.String()),
          content: t.Optional(t.String()),
          module_id: t.Optional(t.Number()),
          level: t.Optional(t.Number()),
          public: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["Courses"],
          summary: "Update a course",
          description: "Update a course by its ID. User can update a course if they own it or have admin privileges.",
          responses: {
            "200": {
              description: "Course updated successfully",
            },
            "401": {
              description: "Authentication required",
            },
            "403": {
              description: "Not authorized to update this course",
            },
            "404": {
              description: "Course not found",
            },
          },
        },
      }
    )    // Delete a course
    .delete(
      "/delete/:courseId",
      async ({ params, requireAuth, set }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);
        const userRoles = claims.roles;

        const courseId = parseInt(params.courseId, 10);
        const course = await courseService.getCourseById(courseId);

        // Allow deletion if:
        // 1. User is the course owner, OR
        // 2. User has the ADMIN role
        const isOwner = course.owner_id === userId;
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        if (!isOwner && !isAdmin) {
          set.status = 403; // Forbidden          return error("You are not authorized to delete this course", 403);
        }

        await courseService.deleteCourseAndUpdateModule(courseId);
        return success({ message: "Course deleted" });
      }, {
      detail: {
        tags: ["Courses"],
        summary: "Delete a course",
        description: "Delete a course by its ID. User can delete a course if they own it or have admin privileges.",
        responses: {
          "200": {
            description: "Course deleted successfully",
          },
          "401": {
            description: "Authentication required",
          },
          "403": {
            description: "Not authorized to delete this course",
          },
          "404": {
            description: "Course not found",
          },
        },
      },
    }
    );
}