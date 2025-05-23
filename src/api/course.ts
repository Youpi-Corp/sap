import { Elysia, t } from "elysia";
import { courseService } from "../services/course";
import { success } from "../utils/response";
import { setupAuth } from "../middleware/auth";

/**
 * Setup course routes
 */
export function setupCourseRoutes() {
  const auth = setupAuth();

  return new Elysia({ prefix: "/course" })
    .use(auth)
    // Get all courses
    .get(
      "/list",
      async ({ requireAuth }) => {
        // Require authentication
        await requireAuth();

        const courses = await courseService.getAllCourses();
        return success(courses);
      },
      {
        detail: {
          tags: ["Courses"],
          summary: "List all courses",
          description: "Retrieve a list of all courses",
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
      async ({ params, requireAuth }) => {
        // Require authentication
        await requireAuth();

        const courseId = parseInt(params.courseId, 10);
        const course = await courseService.getCourseById(courseId);
        return success(course);
      },
      {
        detail: {
          tags: ["Courses"],
          summary: "Get course by ID",
          description: "Retrieve a course by its ID",
          responses: {
            "200": {
              description: "Course found",
            },
            "401": {
              description: "Authentication required",
            },
            "404": {
              description: "Course not found",
            },
          },
        },
      }
    )
    // Create a new course
    .post(
      "/create",
      async ({ body, set, requireAuth }) => {
        // Get user from JWT token
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);

        // Create the course with the authenticated user as owner
        const course = await courseService.createCourse({ ...body, owner_id: userId });
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
          description: "Create a new course",
          responses: {
            "201": {
              description: "Course created successfully",
            },
            "401": {
              description: "Authentication required",
            }
          },
        },
      }
    )    // Update a course
    .put(
      "/update/:courseId",
      async ({ params, body, requireAuth }) => {
        // Require authentication
        await requireAuth();

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
          description: "Update a course by its ID",
          responses: {
            "200": {
              description: "Course updated successfully",
            },
            "401": {
              description: "Authentication required",
            },
            "404": {
              description: "Course not found",
            },
          },
        },
      }
    )
    // Delete a course
    .delete(
      "/delete/:courseId",
      async ({ params, requireAuth }) => {
        // Require authentication
        await requireAuth();

        const courseId = parseInt(params.courseId, 10);
        await courseService.deleteCourse(courseId);
        return success({ message: "Course deleted" });
      },
      {
        detail: {
          tags: ["Courses"],
          summary: "Delete a course",
          description: "Delete a course by its ID",
          responses: {
            "200": {
              description: "Course deleted successfully",
            },
            "401": {
              description: "Authentication required",
            },
            "404": {
              description: "Course not found",
            },
          },
        },
      }
    );
}