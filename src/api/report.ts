import { Elysia, t } from "elysia";
import { reportService } from "../services/report";
import { success, error } from "../utils/response";
import { setupAuth } from "../middleware/auth";

export function setupReportRoutes() {
  const auth = setupAuth();

  return new Elysia({ prefix: "/report" })
    .use(auth)
    // Create a report
    .post(
      "/",
      async ({ body, requireAuth, set }) => {
        const claims = await requireAuth();
        const userId = parseInt(claims.sub);

        const { module_id, reason, details } = body as any;

        try {
          const report = await reportService.createReport({
            module_id: parseInt(module_id, 10),
            reporter_id: userId,
            reason,
            details,
          });
          set.status = 201;
          return success(report, 201);
        } catch (err: any) {
          if (err?.message === "Module not found") {
            set.status = 404;
            return error("Module not found", 404);
          }
          throw err;
        }
      },
      {
        body: t.Object({ module_id: t.Number(), reason: t.String(), details: t.Optional(t.String()) }),
        detail: {
          tags: ["Reports"],
          summary: "Create a report for a module",
        },
      }
    )
    // Get reports for a module (admin or module owner only ideally)
    .get(
      "/module/:moduleId",
      async ({ params, requireAuth, set }) => {
        // Require auth
        const claims = await requireAuth();
        const moduleId = parseInt(params.moduleId, 10);

        try {
          const reports = await reportService.getReportsForModule(moduleId);
          return success(reports);
        } catch (err: any) {
          if (err?.message === "Module not found") {
            set.status = 404;
            return error("Module not found", 404);
          }
          throw err;
        }
      },
      {
        detail: {
          tags: ["Reports"],
          summary: "Get reports for a module",
        },
      }
    );
}
