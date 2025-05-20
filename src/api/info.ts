import { Elysia, t } from "elysia";
import { infoService } from "../services/info";
import { setupAuth, Role } from "../middleware/auth";
import { success } from "../utils/response";

/**
 * Setup info routes
 */
export function setupInfoRoutes() {
  const authPlugin = setupAuth();

  return (
    new Elysia({ prefix: "/info" })
      .use(authPlugin)
      // Get info
      .get(
        "/get",
        async ({ set }) => {
          try {
            const info = await infoService.getFirstInfo();
            return success(info);
          } catch (error) {
            // If info not found, set correct status code
            set.status = 404;
            return success(null, 404);
          }
        },
        {
          detail: {
            tags: ["Info"],
            summary: "Get platform information",
            description:
              "Retrieve general information about the platform including terms and legal notices",
            responses: {
              "200": {
                description: "Information retrieved successfully",
              },
              "404": {
                description: "Information not found",
              },
            },
          },
        }
      )
      // Alive check
      .get(
        "/alive",
        () => {
          return success({ message: "I'm alive!" });
        },
        {
          detail: {
            tags: ["Info"],
            summary: "Service health check",
            description: "Simple endpoint to check if the service is running",
            responses: {
              "200": {
                description: "Service is running",
              },
            },
          },
        }
      )
      // Update info (admin only)
      .put(
        "/update",
        async ({ body, guardRoles, set }) => {
          // Check if user has admin role
          const authResult = guardRoles([Role.Admin]);
          if (authResult) {
            // If guard returned a response, it means auth failed
            set.status = authResult.statusCode;
            return authResult;
          }

          const updatedInfo = await infoService.updateInfo(body);
          return success(updatedInfo);
        },
        {
          body: t.Object({
            cgu: t.Optional(t.String()),
            legal_mentions: t.Optional(t.Union([t.String(), t.Null()])),
          }),
          detail: {
            tags: ["Info"],
            summary: "Update platform information (Admin only)",
            description:
              "Update general platform information (Admin role required)",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
              "200": {
                description: "Information updated successfully",
              },
              "401": {
                description: "Not authenticated",
              },
              "403": {
                description: "Not authorized (Admin role required)",
              },
            },
          },
        }
      )
  );
}
