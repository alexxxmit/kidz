import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { FollowInputSchema, LookPostInputSchema, MessageInputSchema, ReactionInputSchema, ReportInputSchema } from "@kidz/contracts";
import { z } from "zod";

import { AuthService } from "../auth/auth.service.js";
import { SocialService } from "./social.service.js";

const TargetSchema = z.object({ targetAccountId: z.string().uuid() });
const CommentSchema = z.object({ body: z.string().trim().min(1).max(500) });
const FollowDecisionSchema = z.object({ action: z.enum(["ACCEPT", "REJECT"]) });

@Controller("v1/social")
export class SocialController {
  constructor(private readonly social: SocialService, private readonly auth: AuthService) {}

  @Get("me")
  async me(@Headers("authorization") token?: string) { return this.social.me(await this.auth.require(token)); }

  @Get("search")
  async search(@Headers("authorization") token: string | undefined, @Query("q") q = "") { return this.social.search(await this.auth.require(token), q); }

  @Post("look-posts")
  async post(@Headers("authorization") token: string | undefined, @Body() body: unknown) {
    const parsed = LookPostInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.createPost(await this.auth.require(token), parsed.data);
  }

  @Get("feed")
  async feed(@Headers("authorization") token?: string) { return this.social.feed(await this.auth.require(token)); }

  @Post("look-posts/:id/react")
  async react(@Headers("authorization") token: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    const parsed = ReactionInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.react(await this.auth.require(token), id, parsed.data.kind);
  }

  @Post("look-posts/:id/comments")
  async comment(@Headers("authorization") token: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    const parsed = CommentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.addComment(await this.auth.require(token), id, parsed.data.body);
  }

  @Post("follows")
  async follow(@Headers("authorization") token: string | undefined, @Body() body: unknown) {
    const parsed = FollowInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.follow(await this.auth.require(token), parsed.data.targetAccountId);
  }

  @Get("follows/requests")
  async followRequests(@Headers("authorization") token?: string) { return this.social.followRequests(await this.auth.require(token)); }

  @Post("follows/:id/decision")
  async decideFollow(@Headers("authorization") token: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    const parsed = FollowDecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.decideFollow(await this.auth.require(token), id, parsed.data.action);
  }

  @Post("conversations")
  async conversation(@Headers("authorization") token: string | undefined, @Body() body: unknown) {
    const parsed = TargetSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.createConversation(await this.auth.require(token), parsed.data.targetAccountId);
  }

  @Get("conversations")
  async conversations(@Headers("authorization") token?: string) { return this.social.listConversations(await this.auth.require(token)); }

  @Get("conversations/:id/messages")
  async messages(@Headers("authorization") token: string | undefined, @Param("id") id: string) { return this.social.listMessages(await this.auth.require(token), id); }

  @Post("conversations/:id/messages")
  async message(@Headers("authorization") token: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    const parsed = MessageInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.sendMessage(await this.auth.require(token), id, parsed.data);
  }

  @Post("reports")
  async report(@Headers("authorization") token: string | undefined, @Body() body: unknown) {
    const parsed = ReportInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.report(await this.auth.require(token), parsed.data);
  }

  @Post("blocks")
  async block(@Headers("authorization") token: string | undefined, @Body() body: unknown) {
    const parsed = TargetSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.social.block(await this.auth.require(token), parsed.data.targetAccountId);
  }
}
