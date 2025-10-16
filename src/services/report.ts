import { db } from "../db/client";
import { moduleReports, modules } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../middleware/error";

export interface ModuleReport {
  id: number;
  module_id: number;
  reporter_id: number | null;
  reason: string;
  details?: string | null;
  created_at: string | null;
}

export interface NewModuleReport {
  module_id: number;
  reporter_id?: number | null;
  reason: string;
  details?: string | null;
}

export class ReportService {
  async createReport(data: NewModuleReport): Promise<ModuleReport> {
    // Ensure module exists
    const moduleExists = await db.select().from(modules).where(eq(modules.id, data.module_id));
    if (moduleExists.length === 0) {
      throw new NotFoundError("Module not found");
    }

    const result = await db.insert(moduleReports).values({
      module_id: data.module_id,
      reporter_id: data.reporter_id ?? null,
      reason: data.reason,
      details: data.details ?? null,
    }).returning();

    return result[0] as ModuleReport;
  }

  async getReportsForModule(moduleId: number): Promise<ModuleReport[]> {
    // Ensure module exists
    const moduleExists = await db.select().from(modules).where(eq(modules.id, moduleId));
    if (moduleExists.length === 0) {
      throw new NotFoundError("Module not found");
    }

    const results = await db.select().from(moduleReports).where(eq(moduleReports.module_id, moduleId));
    return results as ModuleReport[];
  }

  async deleteReport(reportId: number): Promise<boolean> {
    const result = await db.delete(moduleReports).where(eq(moduleReports.id, reportId)).returning();
    return result.length > 0;
  }
}

export const reportService = new ReportService();
