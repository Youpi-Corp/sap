import { db } from "../db/client";
import { moduleComments, modules, users } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";

// Module comment types
export interface ModuleComment {
  id: number;
  content: string;
  user_id: number;
  module_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    pseudo: string | null;
    profile_picture: string | null;
  } | null;
}

export interface NewModuleComment {
  content: string;
  user_id: number;
  module_id: number;
}

export interface UpdateModuleComment {
  content: string;
}

export class ModuleCommentService {
  /**
   * Create a new comment on a module
   * @param commentData Comment data
   * @returns Created comment
   */
  async createComment(commentData: NewModuleComment): Promise<ModuleComment> {
    // Verify that the module exists
    const moduleExists = await db
      .select()
      .from(modules)
      .where(eq(modules.id, commentData.module_id));

    if (moduleExists.length === 0) {
      throw new NotFoundError("Module not found");
    }

    const now = new Date().toISOString();
    const result = await db
      .insert(moduleComments)
      .values({
        ...commentData,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return result[0];
  }

  /**
   * Get a comment by ID
   * @param id Comment ID
   * @returns Comment with user information
   */
  async getCommentById(id: number): Promise<ModuleComment> {
    const result = await db
      .select({
        id: moduleComments.id,
        content: moduleComments.content,
        user_id: moduleComments.user_id,
        module_id: moduleComments.module_id,
        created_at: moduleComments.created_at,
        updated_at: moduleComments.updated_at,
        user: {
          id: users.id,
          pseudo: users.pseudo,
          profile_picture: users.profile_picture,
        },
      })
      .from(moduleComments)
      .leftJoin(users, eq(moduleComments.user_id, users.id))
      .where(eq(moduleComments.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Comment not found");
    }

    return result[0];
  }

  /**
   * Get all comments for a module
   * @param moduleId Module ID
   * @returns Array of comments with user information
   */
  async getCommentsByModuleId(moduleId: number): Promise<ModuleComment[]> {
    const result = await db
      .select({
        id: moduleComments.id,
        content: moduleComments.content,
        user_id: moduleComments.user_id,
        module_id: moduleComments.module_id,
        created_at: moduleComments.created_at,
        updated_at: moduleComments.updated_at,
        user: {
          id: users.id,
          pseudo: users.pseudo,
          profile_picture: users.profile_picture,
        },
      })
      .from(moduleComments)
      .leftJoin(users, eq(moduleComments.user_id, users.id))
      .where(eq(moduleComments.module_id, moduleId))
      .orderBy(desc(moduleComments.created_at));

    return result;
  }

  /**
   * Update a comment
   * @param id Comment ID
   * @param commentData Updated comment data
   * @returns Updated comment
   */
  async updateComment(
    id: number,
    commentData: UpdateModuleComment
  ): Promise<ModuleComment> {
    const now = new Date().toISOString();
    const result = await db
      .update(moduleComments)
      .set({
        content: commentData.content,
        updated_at: now,
      })
      .where(eq(moduleComments.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Comment not found");
    }

    return result[0];
  }

  /**
   * Delete a comment
   * @param id Comment ID
   * @returns True if deleted successfully
   */
  async deleteComment(id: number): Promise<boolean> {
    const result = await db
      .delete(moduleComments)
      .where(eq(moduleComments.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Comment not found");
    }

    return true;
  }

  /**
   * Check if a user owns a comment
   * @param commentId Comment ID
   * @param userId User ID
   * @returns True if user owns the comment
   */
  async isCommentOwner(commentId: number, userId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(moduleComments)
      .where(
        and(
          eq(moduleComments.id, commentId),
          eq(moduleComments.user_id, userId)
        )
      );

    return result.length > 0;
  }

  /**
   * Get all comments by a user
   * @param userId User ID
   * @returns Array of comments
   */
  async getCommentsByUserId(userId: number): Promise<ModuleComment[]> {
    const result = await db
      .select({
        id: moduleComments.id,
        content: moduleComments.content,
        user_id: moduleComments.user_id,
        module_id: moduleComments.module_id,
        created_at: moduleComments.created_at,
        updated_at: moduleComments.updated_at,
        user: {
          id: users.id,
          pseudo: users.pseudo,
          profile_picture: users.profile_picture,
        },
      })
      .from(moduleComments)
      .leftJoin(users, eq(moduleComments.user_id, users.id))
      .where(eq(moduleComments.user_id, userId))
      .orderBy(desc(moduleComments.created_at));

    return result;
  }
}

// Export a singleton instance
export const moduleCommentService = new ModuleCommentService();
