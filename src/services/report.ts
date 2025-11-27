import { db } from "../db/client";
import { reports, users, modules, courses, moduleComments } from "../db/schema";
import { eq, and, count, desc, inArray, sql } from "drizzle-orm";
import { ApiError, NotFoundError } from "../middleware/error";

export type ReportTargetType = "user" | "module" | "lesson" | "comment";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "nudity"
  | "self_harm"
  | "misinformation"
  | "plagiarism"
  | "other";

export type Report = typeof reports.$inferSelect;

export interface ReportWithReporter extends Report {
  reporter?: {
    id: number;
    pseudo: string | null;
    email: string | null;
  } | null;
}

export interface ReportGroupSummary {
  target_type: ReportTargetType;
  target_id: number;
  total_reports: number;
  pending_reports: number;
  latest_report_at: string | null;
  target_label: string;
  target_secondary?: string | null;
  target_link?: string | null;
}

type ReportAction = "dismiss" | "resolve";

export interface NewReport {
  reporter_id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  details?: string | null;
}

interface ReportReasonDescriptor {
  code: ReportReason;
  label: string;
  description: string;
}

export class ReportService {
  private static readonly reasons: ReportReasonDescriptor[] = [
    {
      code: "spam",
      label: "Spam or Scam",
      description: "Advertising, phishing, or other unwanted content",
    },
    {
      code: "harassment",
      label: "Harassment",
      description: "Bullying, threats, or targeted harassment",
    },
    {
      code: "hate",
      label: "Hate Speech",
      description: "Derogatory or hateful content toward a protected group",
    },
    {
      code: "nudity",
      label: "Nudity or Sexual Content",
      description: "Inappropriate or explicit imagery",
    },
    {
      code: "self_harm",
      label: "Self-Harm",
      description: "Content encouraging self-harm or suicide",
    },
    {
      code: "misinformation",
      label: "Misinformation",
      description: "False or misleading information",
    },
    {
      code: "plagiarism",
      label: "Plagiarism",
      description: "Content copied without credit",
    },
    {
      code: "other",
      label: "Other",
      description: "Something else that violates the guidelines",
    },
  ];

  async createReport(data: NewReport): Promise<Report> {
    this.ensureReasonIsValid(data.reason);
    await this.ensureTargetExists(data.target_type, data.target_id);
    await this.ensureNoDuplicatePendingReport(
      data.reporter_id,
      data.target_type,
      data.target_id,
    );

    const now = new Date().toISOString();
    const [record] = await db
      .insert(reports)
      .values({
        reporter_id: data.reporter_id,
        target_type: data.target_type,
        target_id: data.target_id,
        reason: data.reason,
        details: data.details ?? null,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return record;
  }

  async getReportCountsByTargetType(
    targetType: ReportTargetType,
  ): Promise<Record<number, number>> {
    const rows = await db
      .select({
        target_id: reports.target_id,
        total: count(),
      })
      .from(reports)
      .where(eq(reports.target_type, targetType))
      .groupBy(reports.target_id);

    return rows.reduce<Record<number, number>>((acc, row) => {
      acc[row.target_id] = row.total ?? 0;
      return acc;
    }, {});
  }

  async deleteReportsForTarget(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<void> {
    await db
      .delete(reports)
      .where(
        and(
          eq(reports.target_type, targetType),
          eq(reports.target_id, targetId),
        ),
      );
  }

  getReportReasons(): ReportReasonDescriptor[] {
    return ReportService.reasons;
  }

  async getReportsForTarget(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<ReportWithReporter[]> {
    await this.ensureTargetExists(targetType, targetId);

    const rows = await db
      .select({
        id: reports.id,
        reporter_id: reports.reporter_id,
        target_type: reports.target_type,
        target_id: reports.target_id,
        reason: reports.reason,
        details: reports.details,
        status: reports.status,
        created_at: reports.created_at,
        updated_at: reports.updated_at,
        resolved_by: reports.resolved_by,
        resolved_at: reports.resolved_at,
        reporter: {
          id: users.id,
          pseudo: users.pseudo,
          email: users.email,
        },
      })
      .from(reports)
      .leftJoin(users, eq(users.id, reports.reporter_id))
      .where(
        and(
          eq(reports.target_type, targetType),
          eq(reports.target_id, targetId),
        ),
      )
      .orderBy(desc(reports.created_at));

    return rows as ReportWithReporter[];
  }

  async getGroupedReports(): Promise<ReportGroupSummary[]> {
    const totalColumn = count().as("total_reports");
    const pendingColumn = sql<number>`sum(case when ${reports.status} = 'pending' then 1 else 0 end)`
      .as("pending_reports");
    const latestColumn = sql<string>`max(${reports.created_at})`.as(
      "latest_report_at",
    );

    const groups = await db
      .select({
        target_type: reports.target_type,
        target_id: reports.target_id,
        total_reports: totalColumn,
        pending_reports: pendingColumn,
        latest_report_at: latestColumn,
      })
      .from(reports)
      .groupBy(reports.target_type, reports.target_id);

    if (groups.length === 0) {
      return [];
    }

    const descriptors = await this.buildTargetDescriptors(groups);

    const enriched = groups.map((group) => {
      const key = this.buildTargetKey(group.target_type, group.target_id);
      const descriptor = descriptors.get(key);

      return {
        target_type: group.target_type,
        target_id: group.target_id,
        total_reports: Number(group.total_reports) || 0,
        pending_reports: Number(group.pending_reports) || 0,
        latest_report_at: group.latest_report_at ?? null,
        target_label:
          descriptor?.target_label ||
          `${group.target_type} #${group.target_id}`,
        target_secondary: descriptor?.target_secondary,
        target_link: descriptor?.target_link,
      } satisfies ReportGroupSummary;
    });

    enriched.sort((a, b) => {
      if (b.pending_reports !== a.pending_reports) {
        return b.pending_reports - a.pending_reports;
      }

      const aTime = a.latest_report_at
        ? new Date(a.latest_report_at).getTime()
        : 0;
      const bTime = b.latest_report_at
        ? new Date(b.latest_report_at).getTime()
        : 0;
      return bTime - aTime;
    });

    return enriched;
  }

  async updateReportsStatusForTarget(
    targetType: ReportTargetType,
    targetId: number,
    action: ReportAction,
    adminUserId: number,
  ): Promise<number> {
    await this.ensureTargetExists(targetType, targetId);

    const newStatus = action === "dismiss" ? "dismissed" : "resolved";
    const now = new Date().toISOString();

    const updated = await db
      .update(reports)
      .set({
        status: newStatus,
        resolved_by: adminUserId,
        resolved_at: now,
        updated_at: now,
      })
      .where(
        and(
          eq(reports.target_type, targetType),
          eq(reports.target_id, targetId),
          eq(reports.status, "pending"),
        ),
      )
      .returning({ id: reports.id });

    return updated.length;
  }

  private buildTargetKey(type: ReportTargetType, id: number) {
    return `${type}:${id}`;
  }

  private async buildTargetDescriptors(
    groups: Array<{ target_type: ReportTargetType; target_id: number }>,
  ) {
    const descriptorMap = new Map<
      string,
      { target_label: string; target_secondary?: string | null; target_link?: string | null }
    >();

    const userIds = new Set<number>();
    const moduleIds = new Set<number>();
    const lessonIds = new Set<number>();
    const commentIds = new Set<number>();

    for (const group of groups) {
      switch (group.target_type) {
        case "user":
          userIds.add(group.target_id);
          break;
        case "module":
          moduleIds.add(group.target_id);
          break;
        case "lesson":
          lessonIds.add(group.target_id);
          break;
        case "comment":
          commentIds.add(group.target_id);
          break;
      }
    }

    if (userIds.size > 0) {
      const rows = await db
        .select({ id: users.id, pseudo: users.pseudo, email: users.email })
        .from(users)
        .where(inArray(users.id, Array.from(userIds)));

      rows.forEach((row) => {
        descriptorMap.set(this.buildTargetKey("user", row.id), {
          target_label:
            row.pseudo || row.email || `User #${row.id}`,
          target_secondary: row.email || (row.pseudo ? `User #${row.id}` : null),
          target_link: `/profile/${row.id}`,
        });
      });
    }

    if (moduleIds.size > 0) {
      const rows = await db
        .select({ id: modules.id, title: modules.title, owner_id: modules.owner_id })
        .from(modules)
        .where(inArray(modules.id, Array.from(moduleIds)));

      rows.forEach((row) => {
        descriptorMap.set(this.buildTargetKey("module", row.id), {
          target_label: row.title || `Module #${row.id}`,
          target_secondary: row.owner_id ? `Owner #${row.owner_id}` : null,
          target_link: `/module/${row.id}`,
        });
      });
    }

    if (lessonIds.size > 0) {
      const rows = await db
        .select({ id: courses.id, name: courses.name, module_id: courses.module_id })
        .from(courses)
        .where(inArray(courses.id, Array.from(lessonIds)));

      rows.forEach((row) => {
        descriptorMap.set(this.buildTargetKey("lesson", row.id), {
          target_label: row.name || `Lesson #${row.id}`,
          target_secondary: row.module_id
            ? `Module #${row.module_id}`
            : null,
          target_link: `/lesson/${row.id}`,
        });
      });
    }

    if (commentIds.size > 0) {
      const rows = await db
        .select({
          id: moduleComments.id,
          content: moduleComments.content,
          module_id: moduleComments.module_id,
        })
        .from(moduleComments)
        .where(inArray(moduleComments.id, Array.from(commentIds)));

      rows.forEach((row) => {
        const snippet = row.content
          ? row.content.length > 80
            ? `${row.content.slice(0, 80)}…`
            : row.content
          : null;

        descriptorMap.set(this.buildTargetKey("comment", row.id), {
          target_label: snippet || `Comment #${row.id}`,
          target_secondary: row.module_id
            ? `Module #${row.module_id}`
            : null,
          target_link: row.module_id ? `/module/${row.module_id}` : null,
        });
      });
    }

    return descriptorMap;
  }

  private ensureReasonIsValid(reason: string): void {
    const isValid = ReportService.reasons.some((entry) => entry.code === reason);

    if (!isValid) {
      throw new ApiError("Invalid report reason", 400);
    }
  }

  private async ensureTargetExists(
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<void> {
    switch (targetType) {
      case "user": {
        const result = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, targetId))
          .limit(1);
        if (result.length === 0) {
          throw new NotFoundError("User not found");
        }
        return;
      }
      case "module": {
        const result = await db
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.id, targetId))
          .limit(1);
        if (result.length === 0) {
          throw new NotFoundError("Module not found");
        }
        return;
      }
      case "lesson": {
        const result = await db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.id, targetId))
          .limit(1);
        if (result.length === 0) {
          throw new NotFoundError("Lesson not found");
        }
        return;
      }
      case "comment": {
        const result = await db
          .select({ id: moduleComments.id })
          .from(moduleComments)
          .where(eq(moduleComments.id, targetId))
          .limit(1);
        if (result.length === 0) {
          throw new NotFoundError("Comment not found");
        }
        return;
      }
      default:
        throw new ApiError("Unsupported report target", 400);
    }
  }

  private async ensureNoDuplicatePendingReport(
    reporterId: number,
    targetType: ReportTargetType,
    targetId: number,
  ): Promise<void> {
    const existing = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporter_id, reporterId),
          eq(reports.target_type, targetType),
          eq(reports.target_id, targetId),
          eq(reports.status, "pending"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ApiError("You already submitted a report for this item", 409);
    }
  }
}

export const reportService = new ReportService();
