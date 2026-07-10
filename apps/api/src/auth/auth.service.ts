import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ageModeFor, type GuestSession, type GuestSessionInput, type SocialAccount } from "@kidz/contracts";
import { and, eq, gt } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { DatabaseService } from "../database/database.service.js";
import { entitlements, sessions, socialAccounts, users } from "../database/schema.js";

export type AuthContext = {
  userId: string;
  accountId: string;
  ageYears: number;
  ageMode: ReturnType<typeof ageModeFor>;
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const defaultPrivacy = (age: number): "PRIVATE" | "CIRCLE" => age <= 9 ? "PRIVATE" : "CIRCLE";

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async createGuest(input: GuestSessionInput): Promise<GuestSession> {
    let normalizedHandle = input.handle.toLowerCase();
    const existingHandle = await this.database.db
      .select({ id: socialAccounts.id })
      .from(socialAccounts)
      .where(eq(socialAccounts.handle, normalizedHandle))
      .limit(1);
    if (existingHandle[0]) normalizedHandle = `${normalizedHandle.slice(0, 19)}.${randomBytes(2).toString("hex")}`;

    const userId = randomUUID();
    const accountId = randomUUID();
    const mode = ageModeFor(input.ageYears);
    const privacyState = input.ageYears < 13 ? input.privacyState === "PRIVATE" ? "PRIVATE" : "CIRCLE" : (input.privacyState ?? defaultPrivacy(input.ageYears));
    await this.database.db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, installHash: hash(input.installId), ageYears: input.ageYears });
      await tx.insert(socialAccounts).values({
        id: accountId,
        userId,
        nickname: input.nickname,
        handle: normalizedHandle,
        locale: input.locale,
        ageYears: input.ageYears,
        ageMode: mode,
        privacyState,
        avatarUri: input.avatarUri,
        avatarProfile: input.avatarProfile,
        styleMix: input.styleMix,
      });
      await tx.insert(entitlements).values({ userId, plan: "FREE", source: "NONE", active: false });
    });
    return this.issueSession(userId, this.accountShape({
      id: accountId,
      nickname: input.nickname,
      handle: normalizedHandle,
      ageYears: input.ageYears,
      locale: input.locale,
      styleMix: input.styleMix,
      avatarProfile: input.avatarProfile,
      ...(input.avatarUri ? { avatarUri: input.avatarUri } : {}),
      privacyState,
      ageMode: mode,
      createdAt: new Date(),
    }));
  }

  async require(authorization?: string): Promise<AuthContext> {
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new UnauthorizedException("Bearer token required");
    const row = await this.database.db
      .select({
        userId: sessions.userId,
        accountId: socialAccounts.id,
        ageYears: socialAccounts.ageYears,
        ageMode: socialAccounts.ageMode,
      })
      .from(sessions)
      .innerJoin(socialAccounts, eq(socialAccounts.userId, sessions.userId))
      .where(and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (!row[0]) throw new UnauthorizedException("Session expired");
    return row[0] as AuthContext;
  }

  async deleteAccount(context: AuthContext) {
    await this.database.db.delete(users).where(eq(users.id, context.userId));
    return { deleted: true };
  }

  private async issueSession(userId: string, account: SocialAccount): Promise<GuestSession> {
    const accessToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
    await this.database.db.insert(sessions).values({
      id: randomUUID(),
      userId,
      tokenHash: hash(accessToken),
      expiresAt,
    });
    return { accessToken, expiresAt: expiresAt.toISOString(), account };
  }

  private accountShape(row: {
    id: string;
    nickname: string;
    handle: string;
    ageYears: number;
    locale: string;
    styleMix: unknown;
    avatarProfile: unknown;
    avatarUri?: string | null;
    privacyState: string;
    ageMode: string;
    createdAt: Date;
  }): SocialAccount {
    return {
      id: row.id,
      nickname: row.nickname,
      handle: row.handle,
      ageYears: row.ageYears,
      locale: row.locale as SocialAccount["locale"],
      styleMix: row.styleMix as SocialAccount["styleMix"],
      avatarProfile: row.avatarProfile as SocialAccount["avatarProfile"],
      ...(row.avatarUri ? { avatarUri: row.avatarUri } : {}),
      privacyState: row.privacyState as SocialAccount["privacyState"],
      ageMode: row.ageMode as SocialAccount["ageMode"],
      followersCount: 0,
      followingCount: 0,
      looksCount: 0,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
