import { Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";

import { DatabaseService } from "../database/database.service.js";
import { lookComments, lookPosts, messages, reports } from "../database/schema.js";

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async queue() {
    const rows = await this.database.db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100);
    const [metrics] = await this.database.db.select({
      open: sql<number>`count(*) filter (where ${reports.status} = 'OPEN')::int`,
      reviewing: sql<number>`count(*) filter (where ${reports.status} = 'REVIEWING')::int`,
      resolved: sql<number>`count(*) filter (where ${reports.status} = 'RESOLVED')::int`,
    }).from(reports);
    return { reports: rows, metrics: metrics ?? { open: 0, reviewing: 0, resolved: 0 } };
  }

  async resolve(id: string, status: "REVIEWING" | "RESOLVED", action: "NONE" | "HIDE") {
    const row = await this.database.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!row[0]) throw new NotFoundException("Report not found");
    const report = row[0];
    await this.database.db.transaction(async (tx) => {
      await tx.update(reports).set({ status }).where(eq(reports.id, id));
      if (action !== "HIDE") return;
      if (report.targetType === "LOOK_POST") await tx.update(lookPosts).set({ moderationState: "HIDDEN" }).where(eq(lookPosts.id, report.targetId));
      if (report.targetType === "MESSAGE") await tx.update(messages).set({ moderationState: "HIDDEN" }).where(eq(messages.id, report.targetId));
      if (report.targetType === "COMMENT") await tx.update(lookComments).set({ moderationState: "HIDDEN" }).where(eq(lookComments.id, report.targetId));
    });
    return { id, status, action };
  }
}
