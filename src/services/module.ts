import { db } from "../db/client";
import { modules, moduleSubscriptions, courseModules, courses } from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";
import type { Course } from "./course"; // Import Course type as a type only

// Module types
export interface Module {
  id: number;
  title: string | null; // Renamed from 'name'
  description: string | null; // Added description
  owner_id: number | null;
  courses_count: number | null; // Added courses count
  public: boolean; // Public flag - always boolean, never null
  dtc: string | null; // Date time created
  dtm: string | null; // Date time modified
  courses?: Course[]; // Optional courses array
}

export interface NewModule {
  title: string | null; // Renamed from 'name'
  description?: string | null; // Added description
  public?: boolean; // Public flag - optional but always boolean when provided
  owner_id: number | null;
}

export class ModuleService {  /**
   * Create a new module
   * @param moduleData Module data
   * @returns Created module
   */
  async createModule(moduleData: NewModule): Promise<Module> {
    // Add current timestamp
    const now = new Date().toISOString();
    const result = await db.insert(modules).values({
      ...moduleData,
      // Set public to false if not provided
      public: moduleData.public ?? false,
      dtc: now,
      dtm: now
    }).returning();

    // Ensure public is a boolean
    const module = {
      ...result[0],
      public: result[0].public === null ? false : !!result[0].public
    };

    return module;
  }

  /**
   * Get a module by ID
   * @param id Module ID
   * @returns Module
   */  async getModuleById(id: number): Promise<Module> {
    const result = await db.select().from(modules).where(eq(modules.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Module not found");
    }

    // Ensure public is a boolean and get associated courses
    const moduleWithBoolean = this.ensurePublicIsBoolean(result[0]);
    const moduleWithCourses = await this.addCoursesToModule(moduleWithBoolean);
    return moduleWithCourses;
  }
  /**
   * Get all modules
   * @returns Array of modules
   */  async getAllModules(): Promise<Module[]> {
    const allModules = await db.select().from(modules);

    // Ensure public is boolean for all modules
    const modulesWithBoolean = allModules.map(module => this.ensurePublicIsBoolean(module));

    // Add courses to each module
    const modulesWithCourses = await Promise.all(
      modulesWithBoolean.map(module => this.addCoursesToModule(module))
    );
    return modulesWithCourses;
  }

  /**
   * Get all public modules
   * @returns Array of public modules
   */  async getPublicModules(): Promise<Module[]> {
    const publicModules = await db
      .select()
      .from(modules)
      .where(eq(modules.public, true));

    // Ensure public is boolean for all modules
    const modulesWithBoolean = publicModules.map(module => this.ensurePublicIsBoolean(module));

    // Add courses to each module
    const modulesWithCourses = await Promise.all(
      modulesWithBoolean.map(module => this.addCoursesToModule(module))
    );
    return modulesWithCourses;
  }

  /**
   * Update a module
   * @param id Module ID
   * @param moduleData Module data to update
   * @returns Updated module
   */  async updateModule(id: number, moduleData: Partial<NewModule>): Promise<Module> {
    // Update the timestamp
    const now = new Date().toISOString();
    const result = await db
      .update(modules)
      .set({
        ...moduleData,
        dtm: now
      })
      .where(eq(modules.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Module not found");
    }

    // Ensure public is a boolean and get associated courses
    const moduleWithBoolean = this.ensurePublicIsBoolean(result[0]);
    const moduleWithCourses = await this.addCoursesToModule(moduleWithBoolean);
    return moduleWithCourses;
  }

  /**
   * Delete a module
   * @param id Module ID
   * @returns True if module was deleted
   */
  async deleteModule(id: number): Promise<boolean> {
    // Delete related course-module relationships first
    await db.delete(courseModules).where(eq(courseModules.module_id, id));

    const result = await db
      .delete(modules)
      .where(eq(modules.id, id))
      .returning({ id: modules.id });

    return result.length > 0;
  }

  /**
   * Get modules by owner ID
   * @param ownerId Owner ID
   * @returns Array of modules
   */  async getModulesByOwnerId(ownerId: number): Promise<Module[]> {
    const ownersModules = await db
      .select()
      .from(modules)
      .where(eq(modules.owner_id, ownerId));

    // Ensure public is boolean for all modules
    const modulesWithBoolean = ownersModules.map(module => this.ensurePublicIsBoolean(module));

    // Add courses to each module
    const modulesWithCourses = await Promise.all(
      modulesWithBoolean.map(module => this.addCoursesToModule(module))
    );
    return modulesWithCourses;
  }

  /**
   * Add a course to a module
   * @param moduleId Module ID
   * @param courseId Course ID
   * @returns True if course was added successfully
   */
  async addCourseToModule(moduleId: number, courseId: number): Promise<boolean> {
    try {
      // Add the relationship
      const result = await db
        .insert(courseModules)
        .values({ module_id: moduleId, course_id: courseId })
        .returning();

      // Update the courses_count
      if (result.length > 0) {
        await this.updateCoursesCount(moduleId);
        return true;
      }
      return false;
    } catch (error: unknown) {
      // If there's a unique constraint violation, the relationship already exists
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Remove a course from a module
   * @param moduleId Module ID
   * @param courseId Course ID
   * @returns True if course was removed successfully
   */
  async removeCourseFromModule(moduleId: number, courseId: number): Promise<boolean> {
    const result = await db
      .delete(courseModules)
      .where(
        and(
          eq(courseModules.module_id, moduleId),
          eq(courseModules.course_id, courseId)
        )
      )
      .returning();

    // Update the courses_count
    if (result.length > 0) {
      await this.updateCoursesCount(moduleId);
      return true;
    }
    return false;
  }

  /**
   * Get all courses associated with a module
   * @param moduleId Module ID
   * @returns Array of courses
   */
  async getModuleCourses(moduleId: number): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        name: courses.name,
        content: courses.content,
        module_id: courses.module_id,
        level: courses.level,
        likes: courses.likes,
        views: courses.views,
        public: courses.public,
        chat_id: courses.chat_id,
        owner_id: courses.owner_id,
      })
      .from(courses)
      .innerJoin(
        courseModules,
        eq(courseModules.course_id, courses.id)
      )
      .where(eq(courseModules.module_id, moduleId));
  }

  /**
   * Update the courses count for a module
   * @param moduleId Module ID
   * @returns Updated count
   */
  private async updateCoursesCount(moduleId: number): Promise<number> {
    // Count the courses for this module
    const countResult = await db
      .select({ value: count() })
      .from(courseModules)
      .where(eq(courseModules.module_id, moduleId));

    const coursesCount = countResult[0]?.value || 0;

    // Update the module
    await db
      .update(modules)
      .set({ courses_count: coursesCount })
      .where(eq(modules.id, moduleId));

    return coursesCount;
  }

  /**
   * Add courses to a module object
   * @param module Module object
   * @returns Module with courses
   */
  private async addCoursesToModule(module: Module): Promise<Module> {
    const moduleCourses = await this.getModuleCourses(module.id);
    return {
      ...module,
      courses: moduleCourses
    };
  }

  /**
   * Subscribe a user to a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns True if subscription was successful
   */
  async subscribeToModule(userId: number, moduleId: number): Promise<boolean> {
    // Check if module exists
    await this.getModuleById(moduleId);

    try {
      const result = await db
        .insert(moduleSubscriptions)
        .values({ user_id: userId, module_id: moduleId })
        .returning();
      return result.length > 0;
    } catch (error: unknown) {
      // If there's a unique constraint violation, the user is already subscribed
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') { // Unique violation
        return false;
      }
      throw error;
    }
  }

  /**
   * Unsubscribe a user from a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns True if unsubscription was successful
   */
  async unsubscribeFromModule(userId: number, moduleId: number): Promise<boolean> {
    const result = await db
      .delete(moduleSubscriptions)
      .where(
        and(
          eq(moduleSubscriptions.user_id, userId),
          eq(moduleSubscriptions.module_id, moduleId)
        )
      )
      .returning();
    return result.length > 0;
  }

  /**
   * Get all modules a user is subscribed to
   * @param userId User ID
   * @returns Array of modules
   */  async getSubscribedModules(userId: number): Promise<Module[]> {
    const subscribedModules = await db
      .select()
      .from(modules)
      .innerJoin(
        moduleSubscriptions,
        eq(moduleSubscriptions.module_id, modules.id)
      )
      .where(eq(moduleSubscriptions.user_id, userId));

    // Map the join result to the Module interface
    const mappedModules = subscribedModules.map(join => this.ensurePublicIsBoolean({
      id: join.module.id,
      title: join.module.title,
      description: join.module.description,
      owner_id: join.module.owner_id,
      courses_count: join.module.courses_count,
      public: join.module.public,
      dtc: join.module.dtc,
      dtm: join.module.dtm
    }));

    // Add courses to each module
    const modulesWithCourses = await Promise.all(
      mappedModules.map(module => this.addCoursesToModule(module))
    );
    return modulesWithCourses;
  }

  /**
   * Check if a user is subscribed to a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns True if user is subscribed
   */
  async isUserSubscribed(userId: number, moduleId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(moduleSubscriptions)
      .where(
        and(
          eq(moduleSubscriptions.user_id, userId),
          eq(moduleSubscriptions.module_id, moduleId)
        )
      );
    return result.length > 0;
  }

  /**
   * Ensure module public field is always a boolean
   * @param module Module data from database
   * @returns Module with guaranteed boolean public field
   */
  private ensurePublicIsBoolean(module: any): Module {
    return {
      ...module,
      public: module.public === null ? false : Boolean(module.public)
    };
  }
}

// Export a singleton instance
export const moduleService = new ModuleService();