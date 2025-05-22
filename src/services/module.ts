import { db } from "../db/client";
import { modules } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";

// Module types
export interface Module {
  id: number;
  name: string | null;
  content: string | null;
  user_id: number | null;
}

export interface NewModule {
  name: string | null;
  content: string | null;
  user_id: number | null;
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
}

// Export a singleton instance
export const moduleService = new ModuleService();