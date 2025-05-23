import { Elysia, t } from "elysia"; // Added Elysia import
import { courseService } from "../services/course";
import { userService } from "../services/user";
import { success } from "../utils/response";

/**
 * Setup course routes
 */
export function setupCourseRoutes() {
  type SetContext = { status: number | string; headers?: Record<string, string>; };

  return new Elysia({ prefix: "/course" })
    // Get all courses
    .get(
      "/list",
      async () => {
        // Auth check removed
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
            }
          },
        },
      }
    )
    // Get course by ID
    .get(
      "/get/:courseId",
      async ({ params }) => {
        // Auth check removed
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
      async ({ body, set }) => {
        // Auth check removed
        // For creating a course, we'll use the first user as the owner
        const users = await userService.getAllUsers();
        if (!users.length || typeof users[0].id !== 'number') {
          set.status = 404;
          return { success: false, error: "No users available to create course", statusCode: 404 };
        }

        const creatingUser = users[0];
        const course = await courseService.createCourse({ ...body, owner_id: creatingUser.id });
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
            "404": {
              description: "No users available to create course",
            },
          },
        },
      }
    )
    // Update a course
    .put(
      "/update/:courseId",
      async ({ params, body }) => {
        // Auth check removed
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
      async ({ params }) => {
        // Auth check removed
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
            "404": {
              description: "Course not found",
            },
          },
        },
      }
    );
}