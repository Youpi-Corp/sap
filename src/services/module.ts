import { ModuleModel, IModule } from "../db/schema"; // Updated import
import { NotFoundError, ApiError } from "../middleware/error";
import mongoose from 'mongoose'; // Import mongoose for ObjectId

// Module types - IModule is imported and can be used directly or extended
// export interface Module { // Replaced by IModule
//   _id?: string; // MongoDB uses _id
//   name: string | null;
//   content: string | null;
//   user_id?: mongoose.Schema.Types.ObjectId | string | null; // Updated type
// }

export interface NewModule { // This can be a subset of IModule for creation
  name?: string | null;
  content?: string | null;
  user_id?: mongoose.Schema.Types.ObjectId | string | null; // Updated type
}

export class ModuleService {
  /**
   * Create a new module
   * @param moduleData Module data
   * @returns Created module
   */
  async createModule(moduleData: NewModule): Promise<IModule> {
    const newModule = new ModuleModel(moduleData);
    await newModule.save();
    return newModule;
  }

  /**
   * Get a module by ID
   * @param id Module ID (string for MongoDB ObjectId)
   * @returns Module
   */
  async getModuleById(id: string): Promise<IModule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid module ID format", 400);
    }
    const module = await ModuleModel.findById(id);

    if (!module) {
      throw new NotFoundError("Module not found");
    }

    return module;
  }

  /**
   * Get all modules
   * @returns Array of modules
   */
  async getAllModules(): Promise<IModule[]> {
    return await ModuleModel.find();
  }

  /**
   * Update a module
   * @param id Module ID (string for MongoDB ObjectId)
   * @param moduleData Module data to update
   * @returns Updated module
   */
  async updateModule(id: string, moduleData: Partial<NewModule>): Promise<IModule> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid module ID format", 400);
    }
    const updatedModule = await ModuleModel.findByIdAndUpdate(id, moduleData, { new: true });

    if (!updatedModule) {
      throw new NotFoundError("Module not found");
    }

    return updatedModule;
  }

  /**
   * Delete a module
   * @param id Module ID (string for MongoDB ObjectId)
   * @returns True if module was deleted
   */
  async deleteModule(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid module ID format", 400);
    }
    const result = await ModuleModel.findByIdAndDelete(id);
    return !!result;
  }
}

// Export a singleton instance
export const moduleService = new ModuleService();