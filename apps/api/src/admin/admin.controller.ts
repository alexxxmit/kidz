import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, UnauthorizedException } from "@nestjs/common";
import { z } from "zod";

import { AdminService } from "./admin.service.js";

const DecisionSchema = z.object({ status: z.enum(["REVIEWING", "RESOLVED"]), action: z.enum(["NONE", "HIDE"]).default("NONE") });

@Controller("v1/admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  private authorize(token?: string) {
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) throw new UnauthorizedException();
  }

  @Get("moderation/reports")
  queue(@Headers("x-admin-token") token?: string) { this.authorize(token); return this.admin.queue(); }

  @Patch("moderation/reports/:id")
  decide(@Headers("x-admin-token") token: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    this.authorize(token);
    const parsed = DecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.admin.resolve(id, parsed.data.status, parsed.data.action);
  }
}
