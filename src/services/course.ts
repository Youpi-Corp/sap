import { db } from "../db/client";
import { courses, modules, courseLikes, courseCompletions } from "../db/schema";
import { eq, or, count, and } from "drizzle-orm";
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
  // likes?: number;
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

  /**
   * Update the courses count for a module
   * @param moduleId Module ID
   * @returns Updated count
   */
  private async updateModuleCoursesCount(moduleId: number | null): Promise<number | null> {
    if (moduleId === null) return null;

    // Count the courses for this module
    const countResult = await db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.module_id, moduleId));

    const coursesCount = countResult[0]?.value || 0;

    // Update the module
    await db
      .update(modules)
      .set({ courses_count: coursesCount })
      .where(eq(modules.id, moduleId));

    return coursesCount;
  }

  /**
   * Create a new course and update module count
   * @param courseData Course data
   * @returns Created course
   */
  async createCourseAndUpdateModule(courseData: NewCourse): Promise<Course> {
    console.log("Creating course with data:", courseData);
    const result = await db.insert(courses).values(courseData).returning();

    // Update the module's course count if module_id is provided
    if (courseData.module_id) {
      await this.updateModuleCoursesCount(courseData.module_id);
    }

    return result[0];
  }

  /**
   * Update a course and update module counts
   * @param id Course ID
   * @param courseData Course data to update
   * @returns Updated course
   */
  async updateCourseAndModules(id: number, courseData: Partial<NewCourse>): Promise<Course> {
    // Get the current course to check if module_id changes
    const currentCourse = await this.getCourseById(id);
    const oldModuleId = currentCourse.module_id;

    // Update the course
    const result = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Course not found");
    }

    // Get the new module_id after update
    const newModuleId = result[0].module_id;

    // Update counts for old and new modules if they've changed
    if (oldModuleId !== newModuleId) {
      if (oldModuleId !== null) {
        await this.updateModuleCoursesCount(oldModuleId);
      }
      if (newModuleId !== null) {
        await this.updateModuleCoursesCount(newModuleId);
      }
    }

    return result[0];
  }

  /**
   * Delete a course and update module count
   * @param id Course ID
   * @returns True if course was deleted
   */
  async deleteCourseAndUpdateModule(id: number): Promise<boolean> {
    // Get the current course to find its module_id
    const currentCourse = await this.getCourseById(id);
    const moduleId = currentCourse.module_id;

    // Delete course likes associated with this course
    await db.delete(courseLikes).where(eq(courseLikes.course_id, id));

    // Delete the course
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();

    // Update module count if course had a module
    if (result.length > 0 && moduleId !== null) {
      await this.updateModuleCoursesCount(moduleId);
    }

    return result.length > 0;
  }

  /**
   * User likes a course
   * @param userId User ID
   * @param courseId Course ID
   * @return True if like was added
   */
  async likeCourse(userId: number, courseId: number): Promise<boolean> {
    // Check if course exists
    await this.getCourseById(courseId);

    try {
      const result = await db
        .insert(courseLikes)
        .values({ user_id: userId, course_id: courseId })
        .returning();
      return result.length > 0;
    } catch (error: unknown) {
      // If the error is due to a unique constraint violation, it means the user already liked the course
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return false;
      }
      throw error;
    }
  }

  /**
   * User unlikes a course
   * @param userId User ID
   * @param courseId Course ID
   * @return True if unlike was successful
   */
  async unlikeCourse(userId: number, courseId: number): Promise<boolean> {
    // Check if course exists
    await this.getCourseById(courseId);

    const result = await db
      .delete(courseLikes)
      .where(
        and(
          eq(courseLikes.user_id, userId),
          eq(courseLikes.course_id, courseId)
        )
      )
      .returning();
    return result.length > 0;
  }

  /**
   * Get the number of likes for a course
   * @param courseId Course ID
   * @returns Number of likes
   */
  async getCourseLikesCount(courseId: number): Promise<number> {
    const result = await db
      .select({ value: count() })
      .from(courseLikes)
      .where(eq(courseLikes.course_id, courseId));

    return result[0]?.value || 0;
  }

  /**
   * Check if a user has liked a course
   * @param userId User ID
   * @param courseId Course ID
   * @return True if the user has liked the course
   */
  async hasUserLikedCourse(userId: number, courseId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(courseLikes)
      .where(
        and(
          eq(courseLikes.user_id, userId),
          eq(courseLikes.course_id, courseId)
        )
      );
    return result.length > 0;
  }

  /**
   * Mark lessons as completed for a user
   * @param userId User ID
   * @param courseId Course ID
   * @return True if the course was marked as completed
   */
  async markCourseAsCompleted(userId: number, courseId: number): Promise<boolean> {
    // Check if course exists
    await this.getCourseById(courseId);

    try {
      const result = await db
        .insert(courseCompletions)
        .values({ user_id: userId, course_id: courseId, completed_at: new Date().toISOString() })
        .returning();
      return result.length > 0;
    } catch (error: unknown) {
      // If the error is due to a unique constraint violation, it means the user already completed the course
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return false;
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const courseService = new CourseService();