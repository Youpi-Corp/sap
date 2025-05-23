import { db } from "../db/client";
import { courses } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";

// Course types
export interface Course {
  id: number;
  name: string | null;
  content: string | null;
  module_id: number | null;
  level: number | null;
  likes: number | null;
  views: number | null;
  public: boolean | null;
  chat_id: number | null;
  owner_id: number | null;
}

export interface NewCourse {
  name: string;
  content: string;
  module_id: number;
  level: number;
  public: boolean;
  owner_id: number; // Changed user_id to owner_id
}

export class CourseService {
  /**
   * Get all courses
   * @returns Array of courses
   */
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  /**
   * Get a course by ID
   * @param id Course ID
   * @returns Course
   */
  async getCourseById(id: number): Promise<Course> {
    const result = await db.select().from(courses).where(eq(courses.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Course not found");
    }

    return result[0];
  }

  /**
   * Create a new course
   * @param courseData Course data
   * @returns Created course
   */
  async createCourse(courseData: NewCourse): Promise<Course> {
    console.log("Creating course with data:", courseData);
    const result = await db.insert(courses).values(courseData).returning();
    return result[0];
  }

  /**
   * Update a course
   * @param id Course ID
   * @param courseData Course data to update
   * @returns Updated course
   */
  async updateCourse(id: number, courseData: Partial<NewCourse>): Promise<Course> {
    const result = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Course not found");
    }

    return result[0];
  }

  /**
   * Delete a course
   * @param id Course ID
   * @returns True if course was deleted
   */
  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();

    return result.length > 0;
  }
  /**
   * Get courses by owner ID
   * @param ownerId Owner ID
   * @returns Array of courses
   */
  async getCoursesByOwnerId(ownerId: number): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.owner_id, ownerId));
  }

  /**
   * Get courses based on user roles and ID
   * - If user is an admin, returns all courses
   * - Otherwise, returns public courses and courses owned by the user
   * @param userId User ID
   * @param userRoles Array of user role names
   * @returns Array of courses
   */
  async getCoursesByUserAccess(userId: number, userRoles: string[]): Promise<Course[]> {
    const isAdmin = userRoles.includes('admin');

    if (isAdmin) {
      // Admins can see all courses
      return this.getAllCourses();
    } else {
      // Regular users can see public courses and their own courses
      return await db
        .select()
        .from(courses)
        .where(or(
          eq(courses.public, true),
          eq(courses.owner_id, userId)
        ));
    }
  }
}

// Export a singleton instance
export const courseService = new CourseService();