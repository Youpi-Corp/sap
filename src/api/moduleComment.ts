import { Elysia, t } from "elysia";
import { moduleCommentService } from "../services/moduleComment";
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";
import { NotFoundError } from "../middleware/error";
import { ROLES } from "../utils/roles";

/**
 * Setup module comment routes
 */
export function setupModuleCommentRoutes() {
  const auth = setupAuth();

  return (
    new Elysia({ prefix: "/module-comment" })
      .use(auth)
      // Get all comments for a module
      .get(
        "/:moduleId",
        async ({ params }) => {
          const moduleId = parseInt(params.moduleId, 10);
          const comments = await moduleCommentService.getCommentsByModuleId(moduleId);
          return success(comments);
        },
        {
          detail: {
            tags: ["Module Comments"],
            summary: "Get module comments",
            description: "Retrieve all comments for a specific module",
            responses: {
              "200": {
                description: "Comments retrieved successfully",
              },
            },
          },
        }
      )
      // Get a single comment by ID
      .get(
        "/comment/:commentId",
        async ({ params, set }) => {
          try {
            const commentId = parseInt(params.commentId, 10);
            const comment = await moduleCommentService.getCommentById(commentId);
            return success(comment);
          } catch (err) {
            if (err instanceof NotFoundError) {
              set.status = 404;
              return error("Comment not found", 404);
            }
            throw err;
          }
        },
        {
          detail: {
            tags: ["Module Comments"],
            summary: "Get comment by ID",
            description: "Retrieve a specific comment by its ID",
            responses: {
              "200": {
                description: "Comment retrieved successfully",
              },
              "404": {
                description: "Comment not found",
              },
            },
          },
        }
      )
      // Create a new comment
      .post(
        "/create",
        async ({ body, requireAuth, set }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);

          try {
            // Create the comment with the authenticated user
            const comment = await moduleCommentService.createComment({
              content: body.content,
              user_id: userId,
              module_id: body.module_id,
            });
            
            set.status = 201;
            return success(comment, 201);
          } catch (err) {
            if (err instanceof NotFoundError) {
              set.status = 404;
              return error("Module not found", 404);
            }
            throw err;
          }
        },
        {
          body: t.Object({
            content: t.String({ minLength: 1, maxLength: 5000 }),
            module_id: t.Number(),
          }),
          detail: {
            tags: ["Module Comments"],
            summary: "Create a comment",
            description: "Create a new comment on a module",
            responses: {
              "201": {
                description: "Comment created successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "404": {
                description: "Module not found",
              },
            },
          },
        }
      )
      // Update a comment
      .put(
        "/update/:commentId",
        async ({ params, body, requireAuth, set }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const userRoles = claims.roles || [];

          const commentId = parseInt(params.commentId, 10);

          try {
            // Check if user is the comment owner or admin
            const isOwner = await moduleCommentService.isCommentOwner(commentId, userId);
            const isAdmin = userRoles.includes(ROLES.ADMIN);

            if (!isOwner && !isAdmin) {
              set.status = 403;
              return error("You are not authorized to update this comment", 403);
            }

            const updatedComment = await moduleCommentService.updateComment(
              commentId,
              { content: body.content }
            );
            return success(updatedComment);
          } catch (err) {
            if (err instanceof NotFoundError) {
              set.status = 404;
              return error("Comment not found", 404);
            }
            throw err;
          }
        },
        {
          body: t.Object({
            content: t.String({ minLength: 1, maxLength: 5000 }),
          }),
          detail: {
            tags: ["Module Comments"],
            summary: "Update a comment",
            description: "Update a comment (only owner or admin can update)",
            responses: {
              "200": {
                description: "Comment updated successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Not authorized to update this comment",
              },
              "404": {
                description: "Comment not found",
              },
            },
          },
        }
      )
      // Delete a comment
      .delete(
        "/delete/:commentId",
        async ({ params, requireAuth, set }) => {
          // Get user from JWT token
          const claims = await requireAuth();
          const userId = parseInt(claims.sub);
          const userRoles = claims.roles || [];

          const commentId = parseInt(params.commentId, 10);

          try {
            // Check if user is the comment owner or admin
            const isOwner = await moduleCommentService.isCommentOwner(commentId, userId);
            const isAdmin = userRoles.includes(ROLES.ADMIN);

            if (!isOwner && !isAdmin) {
              set.status = 403;
              return error("You are not authorized to delete this comment", 403);
            }

            await moduleCommentService.deleteComment(commentId);
            return success({ deleted: true });
          } catch (err) {
            if (err instanceof NotFoundError) {
              set.status = 404;
              return error("Comment not found", 404);
            }
            throw err;
          }
        },
        {
          detail: {
            tags: ["Module Comments"],
            summary: "Delete a comment",
            description: "Delete a comment (only owner or admin can delete)",
            responses: {
              "200": {
                description: "Comment deleted successfully",
              },
              "401": {
                description: "Authentication required",
              },
              "403": {
                description: "Not authorized to delete this comment",
              },
              "404": {
                description: "Comment not found",
              },
            },
          },
        }
      )
      // Get all comments by a user
      .get(
        "/user/:userId",
        async ({ params, requireAuth }) => {
          // Require authentication
          await requireAuth();

          const userId = parseInt(params.userId, 10);
          const comments = await moduleCommentService.getCommentsByUserId(userId);
          return success(comments);
        },
        {
          detail: {
            tags: ["Module Comments"],
            summary: "Get user comments",
            description: "Retrieve all comments made by a specific user",
            responses: {
              "200": {
                description: "Comments retrieved successfully",
              },
              "401": {
                description: "Authentication required",
              },
            },
          },
        }
      )
  );
}
