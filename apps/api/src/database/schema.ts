import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  installHash: varchar("install_hash", { length: 64 }).notNull(),
  ageYears: integer("age_years").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("sessions_token_hash_idx").on(table.tokenHash)],
);

export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 30 }).notNull(),
    handle: varchar("handle", { length: 24 }).notNull(),
    locale: varchar("locale", { length: 5 }).notNull(),
    ageYears: integer("age_years").notNull(),
    ageMode: varchar("age_mode", { length: 24 }).notNull(),
    privacyState: varchar("privacy_state", { length: 16 }).notNull(),
    avatarUri: varchar("avatar_uri", { length: 1024 }),
    avatarProfile: jsonb("avatar_profile").notNull().default({ skinTone: "WARM", hairColor: "DARK_BROWN", hairStyle: "LONG_STRAIGHT", pose: "EDITORIAL" }),
    styleMix: jsonb("style_mix").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("social_accounts_user_idx").on(table.userId),
    uniqueIndex("social_accounts_handle_idx").on(table.handle),
  ],
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: varchar("display_name", { length: 40 }).notNull(),
  locale: varchar("locale", { length: 5 }).notNull(),
  ageYears: integer("age_years").notNull(),
  autonomyMode: varchar("autonomy_mode", { length: 24 }).notNull(),
  genderPresentation: varchar("gender_presentation", { length: 24 }).notNull().default("NOT_SPECIFIED"),
  hairProfile: jsonb("hair_profile").notNull().default({ length: "MEDIUM", color: "DARK_BROWN", openToColorAdvice: true }),
  styleMix: jsonb("style_mix").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wardrobeItems = pgTable("wardrobe_items", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  slot: varchar("slot", { length: 24 }).notNull(),
  colors: jsonb("colors").notNull(),
  warmth: integer("warmth").notNull(),
  styleIds: jsonb("style_ids").notNull(),
  careState: varchar("care_state", { length: 24 }).notNull(),
  fitState: varchar("fit_state", { length: 24 }).notNull(),
  imageUri: varchar("image_uri", { length: 1024 }),
  cutoutUri: varchar("cutout_uri", { length: 1024 }),
  imageProcessingState: varchar("image_processing_state", { length: 24 }).notNull().default("NONE"),
  wearCount: integer("wear_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const outfitRecommendations = pgTable("outfit_recommendations", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  context: jsonb("context").notNull(),
  options: jsonb("options").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const follows = pgTable(
  "follows",
  {
    followerAccountId: uuid("follower_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    targetAccountId: uuid("target_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.followerAccountId, table.targetAccountId] })],
);

export const lookPosts = pgTable(
  "look_posts",
  {
    id: uuid("id").primaryKey(),
    authorAccountId: uuid("author_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    outfit: jsonb("outfit").notNull(),
    caption: varchar("caption", { length: 500 }).notNull().default(""),
    styleTags: jsonb("style_tags").notNull(),
    visibility: varchar("visibility", { length: 16 }).notNull(),
    moderationState: varchar("moderation_state", { length: 20 }).notNull().default("CLEAN"),
    challengeId: uuid("challenge_id"),
    remixOfPostId: uuid("remix_of_post_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("look_posts_author_created_idx").on(table.authorAccountId, table.createdAt)],
);

export const lookReactions = pgTable(
  "look_reactions",
  {
    postId: uuid("post_id").notNull().references(() => lookPosts.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.accountId] })],
);

export const lookComments = pgTable(
  "look_comments",
  {
    id: uuid("id").primaryKey(),
    postId: uuid("post_id").notNull().references(() => lookPosts.id, { onDelete: "cascade" }),
    authorAccountId: uuid("author_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 500 }).notNull(),
    moderationState: varchar("moderation_state", { length: 20 }).notNull().default("CLEAN"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("look_comments_post_created_idx").on(table.postId, table.createdAt)],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerAccountId: uuid("blocker_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    blockedAccountId: uuid("blocked_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.blockerAccountId, table.blockedAccountId] })],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey(),
  safetyState: varchar("safety_state", { length: 20 }).notNull().default("OPEN"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.accountId] })],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderAccountId: uuid("sender_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 1200 }).notNull(),
    moderationState: varchar("moderation_state", { length: 20 }).notNull().default("CLEAN"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_created_idx").on(table.conversationId, table.createdAt)],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey(),
  reporterAccountId: uuid("reporter_account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: uuid("target_id").notNull(),
  reason: varchar("reason", { length: 24 }).notNull(),
  details: varchar("details", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const entitlements = pgTable("entitlements", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 20 }).notNull().default("FREE"),
  source: varchar("source", { length: 24 }).notNull().default("NONE"),
  active: boolean("active").notNull().default(false),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
