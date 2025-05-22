import { t } from "elysia";
import { courseService } from "../services/course";
import { setupAuth, Role } from "../middleware/auth";
import { success } from "../utils/response";

/**
 * Setup course routes
 */
export function setupCourseRoutes() {
  return setupAuth().group("/course", (app) =>
    app
      // Get all courses
      .get(
        "/list",
        async ({ guardRoles, set }) => {
          const authResult = guardRoles([Role.Learner, Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const courses = await courseService.getAllCourses();
          return success(courses);
        },
        {
          detail: {
            tags: ["Courses"],
            summary: "List all courses",
            description: "Retrieve a list of all courses",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "List of courses retrieved successfully",
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
      // Get course by ID
      .get(
        "/get/:courseId",
        async ({ params, guardRoles, set }) => {
          const authResult = guardRoles([Role.Learner, Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const courseId = parseInt(params.courseId, 10);
          const course = await courseService.getCourseById(courseId);
          return success(course);
        },
        {
          detail: {
            tags: ["Courses"],
            summary: "Get course by ID",
            description: "Retrieve a course by its ID",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Course found",
              },
              "401": {
                description: "Not authenticated",
              },
              "404": {
                description: "Course not found",
              },
            },
          },
        }
      )
      // Create a new course (Admin or Teacher only)
      .post(
        "/create",
        async ({ body, guardRoles, set }) => {
          const authResult = guardRoles([Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const course = await courseService.createCourse(body);
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
          }),
          detail: {
            tags: ["Courses"],
            summary: "Create a new course",
            description: "Create a new course (Admin or Teacher only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "201": {
                description: "Course created successfully",
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
      // Update a course (Admin or Teacher only)
      .put(
        "/update/:courseId",
        async ({ params, body, guardRoles, set }) => {
          const authResult = guardRoles([Role.Teacher, Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const courseId = parseInt(params.courseId, 10);
          const updatedCourse = await courseService.updateCourse(courseId, body);
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
            description: "Update a course by its ID (Admin or Teacher only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Course updated successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
              },
              "404": {
                description: "Course not found",
              },
            },
          },
        }
      )
      // Delete a course (Admin only)
      .delete(
        "/delete/:courseId",
        async ({ params, guardRoles, set }) => {
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            set.status = authResult.statusCode;
            return authResult;
          }

          const courseId = parseInt(params.courseId, 10);
          await courseService.deleteCourse(courseId);
          return success({ message: "Course deleted" });
        },
        {
          detail: {
            tags: ["Courses"],
            summary: "Delete a course",
            description: "Delete a course by its ID (Admin only)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Course deleted successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized",
              },
              "404": {
                description: "Course not found",
              },
            },
          },
        }
      )
  );
}