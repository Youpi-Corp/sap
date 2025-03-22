import { db } from "../db/client";
import { info } from "../db/schema";
import { NotFoundError } from "../middleware/error";

// Info type
export interface Info {
  cgu: string;
  legal_mentions: string | null;
}

export class InfoService {
  /**
   * Get info (there is only one row in the info table)
   * @returns Info
   */
  async getInfo(): Promise<Info> {
    const result = await db.select().from(info).limit(1);

    if (result.length === 0) {
      throw new NotFoundError("Info not found");
    }

    return result[0];
  }

  /**
   * Update info data
   * @param infoData New info data
   * @returns Updated info
   */
  async updateInfo(infoData: Partial<Info>): Promise<Info> {
    try {
      // Try to get existing info
      await this.getInfo();

      // Update existing record (there should be only one)
      const result = await db.update(info).set(infoData).returning();

      return result[0];
    } catch (err) {
      if (err instanceof NotFoundError) {
        // If not found, create a new record
        // Make sure cgu is provided for new records
        if (!infoData.cgu) {
          infoData.cgu = "Default Terms and Conditions";
        }

        const result = await db
          .insert(info)
          .values(infoData as Info)
          .returning();

        return result[0];
      }

      throw err;
    }
  }
}

// Export a singleton instance
export const infoService = new InfoService();
