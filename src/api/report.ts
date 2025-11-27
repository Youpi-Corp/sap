import { Elysia, t } from "elysia";
import { setupAuth } from "../middleware/auth";
import { reportService, ReportTargetType } from "../services/report";
import { success, error } from "../utils/response";
import { ApiError, NotFoundError } from "../middleware/error";
import { ROLES } from "../utils/roles";

const targetTypeSchema = t.Union([
  t.Literal("user"),
  t.Literal("module"),
  t.Literal("lesson"),
  t.Literal("comment"),
]);

const reasonSchema = t.Union([
  t.Literal("spam"),
  t.Literal("harassment"),
  t.Literal("hate"),
  t.Literal("nudity"),
  t.Literal("self_harm"),
  t.Literal("misinformation"),
  t.Literal("plagiarism"),
  t.Literal("other"),
]);

export function setupReportRoutes() {
  const auth = setupAuth();

  return new Elysia({ prefix: "/report" })
    .use(auth)
    .get(
      "/reasons",
      () => success(reportService.getReportReasons()),
      {
        detail: {
          tags: ["Reports"],
          summary: "List report reasons",
          description: "Retrieve the catalog of report reasons shown to end users",
          responses: {
            "200": {
              description: "Reasons retrieved successfully",
            },
          },
        },
      },
    )
    .get(
      "/admin/summary",
      async ({ guardRoles, requireAuth, set }) => {
        const guardResult = guardRoles([ROLES.ADMIN]);
        if (guardResult) {
          set.status = guardResult.statusCode;
          return guardResult;
        }

        await requireAuth();
        const summary = await reportService.getGroupedReports();
        return success(summary);
      },
      {
        detail: {
          tags: ["Reports"],
          summary: "List grouped reports",
          description: "Retrieve grouped report counts for every reported item (Admin only)",
          responses: {
            "200": { description: "Summary retrieved" },
            "401": { description: "Authentication required" },
            "403": { description: "Forbidden - Admin role required" },
          },
        },
      },
    )
    .get(
      "/details/:targetType/:targetId",
      async ({ params, guardRoles, requireAuth, set }) => {
        const guardResult = guardRoles([ROLES.ADMIN]);
        if (guardResult) {
          set.status = guardResult.statusCode;
          return guardResult;
        }

        await requireAuth();

        const targetType = params.targetType as ReportTargetType;
        const targetId = Number(params.targetId);

        if (Number.isNaN(targetId)) {
          set.status = 400;
          return error("Invalid target identifier", 400);
        }

        try {
          const reportList = await reportService.getReportsForTarget(
            targetType,
            targetId,
          );
          return success(reportList);
        } catch (err) {
          if (err instanceof ApiError || err instanceof NotFoundError) {
            set.status = err.statusCode;
            return error(err.message, err.statusCode);
          }

          throw err;
        }
      },
      {
        detail: {
          tags: ["Reports"],
          summary: "Get report details",
          description:
            "Retrieve every report submitted for a specific resource (Admin only)",
          responses: {
            "200": {
              description: "Reports retrieved successfully",
            },
            "400": {
              description: "Invalid target identifier",
            },
            "401": {
              description: "Authentication required",
            },
            "403": {
              description: "Forbidden - Admin role required",
            },
            "404": {
              description: "Target not found",
            },
          },
        },
      },
    )
    .post(
      "/target/:targetType/:targetId/status",
      async ({ params, body, guardRoles, requireAuth, set }) => {
        const guardResult = guardRoles([ROLES.ADMIN]);
        if (guardResult) {
          set.status = guardResult.statusCode;
          return guardResult;
        }

        const claims = await requireAuth();
        const adminId = parseInt(claims.sub, 10);

        const targetType = params.targetType as ReportTargetType;
        const targetId = Number(params.targetId);

        if (Number.isNaN(targetId)) {
          set.status = 400;
          return error("Invalid target identifier", 400);
        }

        try {
          const updated = await reportService.updateReportsStatusForTarget(
            targetType,
            targetId,
            body.action,
            adminId,
          );
          return success({ updated });
        } catch (err) {
          if (err instanceof ApiError || err instanceof NotFoundError) {
            set.status = err.statusCode;
            return error(err.message, err.statusCode);
          }

          throw err;
        }
      },
      {
        body: t.Object({
          action: t.Union([t.Literal("dismiss"), t.Literal("resolve")]),
        }),
        detail: {
          tags: ["Reports"],
          summary: "Update report status",
          description: "Dismiss or resolve all pending reports for a specific item (Admin only)",
          responses: {
            "200": { description: "Reports updated" },
            "400": { description: "Invalid request" },
            "401": { description: "Authentication required" },
            "403": { description: "Forbidden - Admin role required" },
            "404": { description: "Target not found" },
          },
        },
      },
    )
    .post(
      "/",
      async ({ body, requireAuth, set }) => {
        try {
          const claims = await requireAuth();
          const reporterId = parseInt(claims.sub, 10);
          const report = await reportService.createReport({
            reporter_id: reporterId,
            target_type: body.targetType,
            target_id: body.targetId,
            reason: body.reason,
            details: body.details ?? null,
          });
          set.status = 201;
          return success(report, 201);
        } catch (err) {
          if (err instanceof ApiError) {
            set.status = err.statusCode;
            return error(err.message, err.statusCode);
          }

          if (err instanceof NotFoundError) {
            set.status = err.statusCode;
            return error(err.message, err.statusCode);
          }

          throw err;
        }
      },
      {
        body: t.Object({
          targetType: targetTypeSchema,
          targetId: t.Number(),
          reason: reasonSchema,
          details: t.Optional(t.String({ maxLength: 1000 })),
        }),
        detail: {
          tags: ["Reports"],
          summary: "Submit a report",
          description: "Create a new report for a user, module, lesson, or comment",
          responses: {
            "201": {
              description: "Report created successfully",
            },
            "400": {
              description: "Invalid request payload",
            },
            "401": {
              description: "Authentication required",
            },
            "404": {
              description: "Target not found",
            },
            "409": {
              description: "Duplicate pending report",
            },
          },
        },
      },
    );
}
