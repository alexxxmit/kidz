import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AccountPatchInput, LookPostInput, MessageInput } from "@kidz/contracts";
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { AuthContext } from "../auth/auth.service.js";
import { DatabaseService } from "../database/database.service.js";
import {
  blocks,
  conversationMembers,
  conversations,
  follows,
  lookComments,
  lookPosts,
  lookReactions,
  messages,
  reports,
  socialAccounts,
} from "../database/schema.js";
import { ModerationService } from "../safety/moderation.service.js";

@Injectable()
export class SocialService {
  constructor(private readonly database: DatabaseService, private readonly moderation: ModerationService) {}

  async me(context: AuthContext) {
    const rows = await this.database.db.select().from(socialAccounts).where(eq(socialAccounts.id, context.accountId)).limit(1);
    if (!rows[0]) throw new NotFoundException("Account not found");
    return this.withCounts(rows[0]);
  }

  async updateMe(context: AuthContext, input: AccountPatchInput) {
    const changes: Partial<typeof socialAccounts.$inferInsert> = {};
    if (input.nickname !== undefined) changes.nickname = input.nickname;
    if (input.locale !== undefined) changes.locale = input.locale;
    if (input.styleMix !== undefined) changes.styleMix = input.styleMix;
    if (input.privacyState !== undefined) changes.privacyState = context.ageYears < 13 && input.privacyState === "PUBLIC" ? "CIRCLE" : input.privacyState;
    if (Object.keys(changes).length) await this.database.db.update(socialAccounts).set(changes).where(eq(socialAccounts.id, context.accountId));
    return this.me(context);
  }

  async search(context: AuthContext, query: string) {
    if (context.ageYears < 10) return { accounts: [] };
    const normalized = query.replace(/^@/, "").trim().toLowerCase();
    if (normalized.length < 3) return { accounts: [] };
    const rows = await this.database.db
      .select()
      .from(socialAccounts)
      .where(and(ilike(socialAccounts.handle, `${normalized}%`), sql`${socialAccounts.id} <> ${context.accountId}`))
      .limit(context.ageYears < 13 ? 6 : 20);
    return { accounts: rows.map((row) => this.publicAccount(row)) };
  }

  async createPost(context: AuthContext, input: LookPostInput) {
    const moderation = await this.moderation.checkText(input.caption);
    if (!moderation.allowed) throw new BadRequestException("Публикация скрыта фильтром безопасности");
    const visibility = context.ageYears <= 9 ? "PRIVATE" : context.ageYears <= 12 && input.visibility === "PUBLIC" ? "CIRCLE" : input.visibility;
    const id = randomUUID();
    await this.database.db.insert(lookPosts).values({
      id,
      authorAccountId: context.accountId,
      outfit: input.outfit,
      caption: input.caption,
      styleTags: input.styleTags,
      visibility,
      moderationState: moderation.state,
      challengeId: input.challengeId,
      remixOfPostId: input.remixOfPostId,
    });
    return { id, visibility, moderationState: moderation.state };
  }

  async feed(context: AuthContext) {
    const accepted = await this.database.db
      .select({ target: follows.targetAccountId })
      .from(follows)
      .where(and(eq(follows.followerAccountId, context.accountId), eq(follows.status, "ACCEPTED")));
    const circle = accepted.map((row) => row.target);
    const audience = context.ageYears < 13
      ? circle.length
        ? or(eq(lookPosts.authorAccountId, context.accountId), and(inArray(lookPosts.authorAccountId, circle), eq(lookPosts.visibility, "CIRCLE")))
        : eq(lookPosts.authorAccountId, context.accountId)
      : circle.length
        ? or(eq(lookPosts.visibility, "PUBLIC"), eq(lookPosts.authorAccountId, context.accountId), and(inArray(lookPosts.authorAccountId, circle), eq(lookPosts.visibility, "CIRCLE")))
        : or(eq(lookPosts.visibility, "PUBLIC"), eq(lookPosts.authorAccountId, context.accountId));
    const rows = await this.database.db
      .select({
        id: lookPosts.id,
        outfit: lookPosts.outfit,
        caption: lookPosts.caption,
        styleTags: lookPosts.styleTags,
        visibility: lookPosts.visibility,
        challengeId: lookPosts.challengeId,
        remixOfPostId: lookPosts.remixOfPostId,
        createdAt: lookPosts.createdAt,
        authorId: socialAccounts.id,
        nickname: socialAccounts.nickname,
        handle: socialAccounts.handle,
        avatarUri: socialAccounts.avatarUri,
        styleMix: socialAccounts.styleMix,
        reactionCount: sql<number>`(select count(*)::int from look_reactions r where r.post_id = ${lookPosts.id})`,
        commentCount: sql<number>`(select count(*)::int from look_comments c where c.post_id = ${lookPosts.id} and c.moderation_state <> 'HIDDEN')`,
        remixCount: sql<number>`(select count(*)::int from look_posts rp where rp.remix_of_post_id = ${lookPosts.id} and rp.moderation_state = 'CLEAN')`,
        viewerReacted: sql<boolean>`exists(select 1 from look_reactions vr where vr.post_id = ${lookPosts.id} and vr.account_id = ${context.accountId})`,
      })
      .from(lookPosts)
      .innerJoin(socialAccounts, eq(socialAccounts.id, lookPosts.authorAccountId))
      .where(and(sql`${lookPosts.moderationState} in ('CLEAN', 'PENDING')`, audience))
      .orderBy(desc(lookPosts.createdAt))
      .limit(40);
    return {
      posts: rows.map((row) => ({
        id: row.id,
        outfit: row.outfit,
        caption: row.caption,
        styleTags: row.styleTags,
        visibility: row.visibility,
        ...(row.challengeId ? { challengeId: row.challengeId } : {}),
        ...(row.remixOfPostId ? { remixOfPostId: row.remixOfPostId } : {}),
        author: { id: row.authorId, nickname: row.nickname, handle: row.handle, avatarUri: row.avatarUri ?? undefined, styleMix: row.styleMix },
        reactionCount: row.reactionCount,
        commentCount: row.commentCount,
        remixCount: row.remixCount,
        viewerReacted: row.viewerReacted,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async react(context: AuthContext, postId: string, kind: string) {
    const current = await this.database.db.select().from(lookReactions).where(and(eq(lookReactions.postId, postId), eq(lookReactions.accountId, context.accountId))).limit(1);
    if (current[0]) {
      await this.database.db.delete(lookReactions).where(and(eq(lookReactions.postId, postId), eq(lookReactions.accountId, context.accountId)));
      return { active: false };
    }
    await this.database.db.insert(lookReactions).values({ postId, accountId: context.accountId, kind });
    return { active: true };
  }

  async follow(context: AuthContext, targetAccountId: string) {
    if (context.ageYears < 10) throw new ForbiddenException("Friends are unavailable in family mode");
    const target = await this.database.db.select().from(socialAccounts).where(eq(socialAccounts.id, targetAccountId)).limit(1);
    if (!target[0]) throw new NotFoundException("Account not found");
    const status = context.ageYears >= 13 && target[0].ageYears >= 13 && target[0].privacyState === "PUBLIC" ? "ACCEPTED" : "REQUESTED";
    await this.database.db.insert(follows).values({ followerAccountId: context.accountId, targetAccountId, status }).onConflictDoUpdate({ target: [follows.followerAccountId, follows.targetAccountId], set: { status } });
    return { status };
  }

  async followRequests(context: AuthContext) {
    const rows = await this.database.db
      .select({ id: socialAccounts.id, nickname: socialAccounts.nickname, handle: socialAccounts.handle, avatarUri: socialAccounts.avatarUri, styleMix: socialAccounts.styleMix })
      .from(follows)
      .innerJoin(socialAccounts, eq(socialAccounts.id, follows.followerAccountId))
      .where(and(eq(follows.targetAccountId, context.accountId), eq(follows.status, "REQUESTED")))
      .limit(50);
    return { requests: rows };
  }

  async decideFollow(context: AuthContext, followerAccountId: string, action: "ACCEPT" | "REJECT") {
    const condition = and(eq(follows.followerAccountId, followerAccountId), eq(follows.targetAccountId, context.accountId), eq(follows.status, "REQUESTED"));
    if (action === "ACCEPT") await this.database.db.update(follows).set({ status: "ACCEPTED" }).where(condition);
    else await this.database.db.delete(follows).where(condition);
    return { status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" };
  }

  async addComment(context: AuthContext, postId: string, body: string) {
    if (context.ageYears < 10) throw new ForbiddenException("Comments are unavailable in family mode");
    const review = await this.moderation.checkText(body, { blockContactSharing: context.ageYears < 16 });
    if (!review.allowed) throw new BadRequestException("Комментарий скрыт фильтром безопасности");
    const id = randomUUID();
    await this.database.db.insert(lookComments).values({ id, postId, authorAccountId: context.accountId, body, moderationState: review.state });
    return { id, moderationState: review.state };
  }

  async createConversation(context: AuthContext, targetAccountId: string) {
    if (context.ageYears < 13) throw new ForbiddenException("Chat opens from age 13");
    const relation = await this.database.db.select().from(follows).where(and(eq(follows.status, "ACCEPTED"), or(
      and(eq(follows.followerAccountId, context.accountId), eq(follows.targetAccountId, targetAccountId)),
      and(eq(follows.followerAccountId, targetAccountId), eq(follows.targetAccountId, context.accountId)),
    ))).limit(1);
    if (!relation[0]) throw new ForbiddenException("Chat is available only for accepted contacts");
    const existing = await this.database.db.select({ id: conversations.id }).from(conversations).where(and(
      ne(conversations.safetyState, "CLOSED"),
      sql`exists(select 1 from conversation_members first_member where first_member.conversation_id = ${conversations.id} and first_member.account_id = ${context.accountId})`,
      sql`exists(select 1 from conversation_members second_member where second_member.conversation_id = ${conversations.id} and second_member.account_id = ${targetAccountId})`,
    )).limit(1);
    if (existing[0]) return existing[0];
    const id = randomUUID();
    await this.database.db.transaction(async (tx) => {
      await tx.insert(conversations).values({ id });
      await tx.insert(conversationMembers).values([
        { conversationId: id, accountId: context.accountId },
        { conversationId: id, accountId: targetAccountId },
      ]);
    });
    return { id };
  }

  async listConversations(context: AuthContext) {
    if (context.ageYears < 13) return { conversations: [] };
    const mine = await this.database.db
      .select({ id: conversations.id, lastMessageAt: conversations.lastMessageAt, safetyState: conversations.safetyState })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
      .where(and(eq(conversationMembers.accountId, context.accountId), ne(conversations.safetyState, "CLOSED")))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(100);
    const enriched = await Promise.all(mine.map(async (conversation) => {
      const peer = await this.database.db
        .select({
          id: socialAccounts.id,
          nickname: socialAccounts.nickname,
          handle: socialAccounts.handle,
          avatarUri: socialAccounts.avatarUri,
          styleMix: socialAccounts.styleMix,
        })
        .from(conversationMembers)
        .innerJoin(socialAccounts, eq(socialAccounts.id, conversationMembers.accountId))
        .where(and(eq(conversationMembers.conversationId, conversation.id), ne(conversationMembers.accountId, context.accountId)))
        .limit(1);
      const last = await this.database.db
        .select({ body: messages.body, createdAt: messages.createdAt })
        .from(messages)
        .where(and(eq(messages.conversationId, conversation.id), sql`${messages.moderationState} <> 'HIDDEN'`))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      return {
        ...conversation,
        lastMessageAt: conversation.lastMessageAt?.toISOString() ?? last[0]?.createdAt.toISOString() ?? new Date(0).toISOString(),
        peer: peer[0] ?? null,
        lastMessage: last[0] ? { body: last[0].body, createdAt: last[0].createdAt.toISOString() } : null,
      };
    }));
    return { conversations: enriched };
  }

  async listMessages(context: AuthContext, conversationId: string) {
    await this.requireMember(context.accountId, conversationId);
    const rows = await this.database.db.select().from(messages).where(and(eq(messages.conversationId, conversationId), sql`${messages.moderationState} <> 'HIDDEN'`)).orderBy(desc(messages.createdAt)).limit(100);
    return { messages: rows.reverse() };
  }

  async sendMessage(context: AuthContext, conversationId: string, input: MessageInput) {
    if (context.ageYears < 13) throw new ForbiddenException("Chat opens from age 13");
    await this.requireMember(context.accountId, conversationId);
    const review = await this.moderation.checkText(input.body, { blockContactSharing: context.ageYears < 16 });
    if (!review.allowed) throw new BadRequestException("Сообщение не отправлено из-за фильтра безопасности");
    const id = randomUUID();
    await this.database.db.transaction(async (tx) => {
      await tx.insert(messages).values({ id, conversationId, senderAccountId: context.accountId, body: input.body, moderationState: review.state });
      await tx.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    });
    return { id, moderationState: review.state };
  }

  async report(context: AuthContext, input: { targetType: string; targetId: string; reason: string; details?: string | undefined }) {
    const id = randomUUID();
    await this.database.db.insert(reports).values({ id, reporterAccountId: context.accountId, ...input });
    return { id, status: "OPEN" };
  }

  async block(context: AuthContext, targetAccountId: string) {
    await this.database.db.transaction(async (tx) => {
      await tx.insert(blocks).values({ blockerAccountId: context.accountId, blockedAccountId: targetAccountId }).onConflictDoNothing();
      await tx.delete(follows).where(or(
        and(eq(follows.followerAccountId, context.accountId), eq(follows.targetAccountId, targetAccountId)),
        and(eq(follows.followerAccountId, targetAccountId), eq(follows.targetAccountId, context.accountId)),
      ));
      await tx.update(conversations).set({ safetyState: "CLOSED" }).where(and(
        sql`exists(select 1 from conversation_members blocker_member where blocker_member.conversation_id = ${conversations.id} and blocker_member.account_id = ${context.accountId})`,
        sql`exists(select 1 from conversation_members blocked_member where blocked_member.conversation_id = ${conversations.id} and blocked_member.account_id = ${targetAccountId})`,
      ));
    });
    return { blocked: true };
  }

  private async requireMember(accountId: string, conversationId: string) {
    const membership = await this.database.db
      .select({ accountId: conversationMembers.accountId })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
      .where(and(eq(conversationMembers.accountId, accountId), eq(conversationMembers.conversationId, conversationId), ne(conversations.safetyState, "CLOSED")))
      .limit(1);
    if (!membership[0]) throw new ForbiddenException("Conversation is unavailable");
  }

  private publicAccount(row: typeof socialAccounts.$inferSelect) {
    return { id: row.id, nickname: row.nickname, handle: row.handle, avatarUri: row.avatarUri, styleMix: row.styleMix, privacyState: row.privacyState };
  }

  private withCounts(row: typeof socialAccounts.$inferSelect) {
    return { ...this.publicAccount(row), locale: row.locale, ageYears: row.ageYears, ageMode: row.ageMode, followersCount: 0, followingCount: 0, looksCount: 0, createdAt: row.createdAt.toISOString() };
  }
}
