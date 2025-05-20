import { InfoModel, IInfo } from "../db/schema"; // Correct Mongoose model and interface
import { NotFoundError, ApiError } from "../middleware/error";
import mongoose from 'mongoose'; // For ObjectId validation

// Interface for creating new info, can be a subset of IInfo
export interface NewInfo {
  cgu?: string;
  legal_mentions?: string | null;
}

export class InfoService {
  /**
   * Get info by ID
   * @param id Info ID (string for MongoDB ObjectId)
   * @returns Info object
   */
  async getInfoById(id: string): Promise<IInfo> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid info ID format", 400);
    }
    const infoDoc = await InfoModel.findById(id);
    if (!infoDoc) {
      throw new NotFoundError("Info not found");
    }
    return infoDoc;
  }

  /**
   * Get the first info document (assuming there's usually one or a default)
   * @returns Info object or null if none found
   */
  async getFirstInfo(): Promise<IInfo | null> {
    // Sort by _id or createdAt if you want the latest or first created
    const infoDoc = await InfoModel.findOne().sort({ _id: -1 });
    return infoDoc;
  }

  /**
   * Create new info
   * @param infoData Data for the new info document
   * @returns Created info object
   */
  async createInfo(infoData: NewInfo): Promise<IInfo> {
    // Mongoose schema defaults will apply if not provided here
    const newInfo = new InfoModel({
      cgu: infoData.cgu, // Will use schema default if infoData.cgu is undefined
      legal_mentions: infoData.legal_mentions // Will use schema default if undefined
    });
    await newInfo.save();
    return newInfo;
  }

  /**
   * Update info by ID
   * @param id Info ID (string for MongoDB ObjectId)
   * @param infoData Info data to update
   * @returns Updated info object
   */
  async updateInfo(id: string, infoData: Partial<NewInfo>): Promise<IInfo> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid info ID format", 400);
    }
    // findByIdAndUpdate will only update fields present in infoData
    const updatedInfo = await InfoModel.findByIdAndUpdate(id, infoData, { new: true, runValidators: true });
    if (!updatedInfo) {
      throw new NotFoundError("Info not found to update");
    }
    return updatedInfo;
  }

  /**
   * Update the first info document found, or create if none exists.
   * @param infoData Data to update or create with
   * @returns The updated or created info document
   */
  async upsertFirstInfo(infoData: NewInfo): Promise<IInfo> {
    const existingInfo = await InfoModel.findOne().sort({ _id: -1 });
    if (existingInfo) {
      // Ensure _id is correctly accessed and converted to string
      return this.updateInfo(existingInfo._id.toString(), infoData);
    } else {
      return this.createInfo(infoData);
    }
  }

  /**
   * Delete info by ID
   * @param id Info ID (string for MongoDB ObjectId)
   * @returns True if info was deleted
   */
  async deleteInfo(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid info ID format", 400);
    }
    const result = await InfoModel.findByIdAndDelete(id);
    return !!result; // True if a document was found and deleted, false otherwise
  }
}

// Export a singleton instance
export const infoService = new InfoService();
