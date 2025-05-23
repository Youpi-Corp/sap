import { db } from "../db/client";
import { modules, moduleSubscriptions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";

// Module types
export interface Module {
  id: number;
  name: string | null;
  content: string | null;
  owner_id: number | null; // Changed user_id to owner_id
}

export interface NewModule {
  name: string | null;
  content: string | null;
  owner_id: number | null; // Changed user_id to owner_id
}

export class ModuleService {
  /**
   * Create a new module
   * @param moduleData Module data
   * @returns Created module
   */
  async createModule(moduleData: NewModule): Promise<Module> {
    const result = await db.insert(modules).values(moduleData).returning();
    return result[0];
  }

  /**
   * Get a module by ID
   * @param id Module ID
   * @returns Module
   */
  async getModuleById(id: number): Promise<Module> {
    const result = await db.select().from(modules).where(eq(modules.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Module not found");
    }

    return result[0];
  }

  /**
   * Get all modules
   * @returns Array of modules
   */
  async getAllModules(): Promise<Module[]> {
    return await db.select().from(modules);
  }

  /**
   * Update a module
   * @param id Module ID
   * @param moduleData Module data to update
   * @returns Updated module
   */
  async updateModule(id: number, moduleData: Partial<NewModule>): Promise<Module> {
    const result = await db
      .update(modules)
      .set(moduleData)
      .where(eq(modules.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Module not found");
    }

    return result[0];
  }

  /**
   * Delete a module
   * @param id Module ID
   * @returns True if module was deleted
   */
  async deleteModule(id: number): Promise<boolean> {
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
   */
  async getModulesByOwnerId(ownerId: number): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.owner_id, ownerId));
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
    } catch (error) {
      // If there's a unique constraint violation, the user is already subscribed
      if (error.code === '23505') { // Unique violation
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
   */  async unsubscribeFromModule(userId: number, moduleId: number): Promise<boolean> {
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
   */
  async getSubscribedModules(userId: number): Promise<Module[]> {
    return await db
      .select({
        id: modules.id,
        name: modules.name,
        content: modules.content,
        owner_id: modules.owner_id,
      })
      .from(modules)
      .innerJoin(
        moduleSubscriptions,
        eq(moduleSubscriptions.module_id, modules.id)
      )
      .where(eq(moduleSubscriptions.user_id, userId));
  }

  /**
   * Check if a user is subscribed to a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns True if user is subscribed
   */  async isUserSubscribed(userId: number, moduleId: number): Promise<boolean> {
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
}

// Export a singleton instance
export const moduleService = new ModuleService();