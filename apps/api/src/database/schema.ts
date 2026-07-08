import { integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: varchar("display_name", { length: 40 }).notNull(),
  locale: varchar("locale", { length: 5 }).notNull(),
  ageYears: integer("age_years").notNull(),
  autonomyMode: varchar("autonomy_mode", { length: 24 }).notNull(),
  genderPresentation: varchar("gender_presentation", { length: 24 }).notNull().default("NOT_SPECIFIED"),
  hairProfile: jsonb("hair_profile").notNull().default({
    length: "MEDIUM",
    color: "DARK_BROWN",
    openToColorAdvice: true,
  }),
  styleMix: jsonb("style_mix").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wardrobeItems = pgTable("wardrobe_items", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
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
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  context: jsonb("context").notNull(),
  options: jsonb("options").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
