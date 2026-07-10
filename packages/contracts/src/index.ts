import { z } from "zod";

export const LocaleSchema = z.enum(["ru", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const AutonomyModeSchema = z.enum([
  "PARENT_DECIDES",
  "TOGETHER",
  "USER_DECIDES",
]);
export type AutonomyMode = z.infer<typeof AutonomyModeSchema>;

export const StyleMixEntrySchema = z.object({
  styleId: z.string().min(1),
  weight: z.number().min(0.05).max(1),
});
export type StyleMixEntry = z.infer<typeof StyleMixEntrySchema>;

export const GenderPresentationSchema = z.enum([
  "FEMININE",
  "MASCULINE",
  "NEUTRAL",
  "NOT_SPECIFIED",
]);
export type GenderPresentation = z.infer<typeof GenderPresentationSchema>;

export const SchoolDressCodeSchema = z.enum(["NOT_APPLICABLE", "UNIFORM", "WHITE_TOP", "FREE_STYLE"]);
export type SchoolDressCode = z.infer<typeof SchoolDressCodeSchema>;

export const HairLengthSchema = z.enum([
  "BUZZ",
  "SHORT",
  "MEDIUM",
  "LONG",
  "VERY_LONG",
]);
export type HairLength = z.infer<typeof HairLengthSchema>;

export const HairColorSchema = z.enum([
  "BLACK",
  "DARK_BROWN",
  "BROWN",
  "LIGHT_BROWN",
  "BLONDE",
  "RED",
  "GRAY",
  "DYED_BRIGHT",
  "MIXED",
  "OTHER",
]);
export type HairColor = z.infer<typeof HairColorSchema>;

export const HairProfileSchema = z.object({
  length: HairLengthSchema.default("MEDIUM"),
  color: HairColorSchema.default("DARK_BROWN"),
  openToColorAdvice: z.boolean().default(true),
});
export type HairProfile = z.infer<typeof HairProfileSchema>;
export const DEFAULT_HAIR_PROFILE = { length: "MEDIUM", color: "DARK_BROWN", openToColorAdvice: true } as const;

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(40).default("Мой профиль"),
  locale: LocaleSchema,
  ageYears: z.number().int().min(0).max(18),
  autonomyMode: AutonomyModeSchema,
  genderPresentation: GenderPresentationSchema.default("NOT_SPECIFIED"),
  hairProfile: HairProfileSchema.default(DEFAULT_HAIR_PROFILE),
  schoolDressCode: SchoolDressCodeSchema.default("FREE_STYLE"),
  styleMix: z.array(StyleMixEntrySchema).min(1).max(3),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;
export type Profile = ProfileInput & { id: string; createdAt: string };

export const GarmentSlotSchema = z.enum([
  "top",
  "bottom",
  "one_piece",
  "mid_layer",
  "outerwear",
  "footwear",
  "headwear",
  "jewelry",
  "bag",
  "accessory",
]);
export type GarmentSlot = z.infer<typeof GarmentSlotSchema>;

export const GarmentCategorySchema = z.enum([
  "tshirt",
  "shirt",
  "hoodie",
  "sweater",
  "jacket",
  "coat",
  "jeans",
  "trousers",
  "skirt",
  "dress",
  "shorts",
  "sneakers",
  "boots",
  "shoes",
  "hat",
  "cap",
  "beanie",
  "headband",
  "hair_accessory",
  "scarf",
  "belt",
  "necklace",
  "bracelet",
  "ring",
  "earrings",
  "watch",
  "bag",
  "backpack",
  "crossbody_bag",
  "tote",
  "accessory",
]);
export type GarmentCategory = z.infer<typeof GarmentCategorySchema>;

export const WardrobeItemInputSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  category: GarmentCategorySchema,
  slot: GarmentSlotSchema,
  colors: z.array(z.string().min(1)).min(1).max(4),
  warmth: z.number().int().min(0).max(4),
  styleIds: z.array(z.string()).max(8).default([]),
  careState: z.enum(["CLEAN", "WORN_REUSABLE", "LAUNDRY"]).default("CLEAN"),
  fitState: z.enum(["FITS", "UNKNOWN", "TOO_BIG", "OUTGROWN"]).default("FITS"),
  imageUri: z.string().optional(),
  cutoutUri: z.string().optional(),
  imageProcessingState: z
    .enum(["NONE", "PENDING_CUTOUT", "CUTOUT_READY", "CUTOUT_FAILED"])
    .optional(),
});
export type WardrobeItemInput = z.infer<typeof WardrobeItemInputSchema>;
export type WardrobeItem = WardrobeItemInput & {
  id: string;
  createdAt: string;
  wearCount: number;
};

export const WeatherContextSchema = z.object({
  temperatureC: z.number().min(-60).max(60),
  feelsLikeC: z.number().min(-70).max(70).optional(),
  rainProbability: z.number().min(0).max(1).default(0),
  windKph: z.number().min(0).max(300).default(0),
  occasion: z.enum(["school", "walk", "sport", "party", "everyday"]).default("everyday"),
});
export type WeatherContext = z.infer<typeof WeatherContextSchema>;

export const OutfitRequestSchema = z.object({
  profile: ProfileInputSchema,
  wardrobe: z.array(WardrobeItemInputSchema.omit({ profileId: true })).min(1),
  weather: WeatherContextSchema,
  intent: z.string().trim().max(280).optional(),
});
export type OutfitRequest = z.infer<typeof OutfitRequestSchema>;

export type ScoreBreakdown = {
  style: number;
  presentation: number;
  dressCode: number;
  weather: number;
  completeness: number;
  rotation: number;
  styling: number;
};

export type HairSuggestion = {
  title: string;
  detail: string;
  colorAdvice?: string;
  recommendedColor: HairColor;
  colorFit: "already_fits" | "optional_shift" | "not_applicable";
  reasonCodes: string[];
};

export type StylingSuggestion = {
  slot: GarmentSlot | "hair";
  title: string;
  detail: string;
  reasonCode: string;
};

export type MakeupSuggestion = {
  title: string;
  detail: string;
  intensity: "none" | "light" | "medium" | "bold";
  agePolicy: "not_suggested" | "optional" | "style_reference";
  reasonCodes: string[];
};

export type OutfitOption = {
  id: string;
  items: Array<Omit<WardrobeItemInput, "profileId"> & { id?: string }>;
  score: number;
  scores: ScoreBreakdown;
  reasonCodes: string[];
  missingSlots: GarmentSlot[];
  hair: HairSuggestion;
  makeup: MakeupSuggestion;
  stylingSuggestions: StylingSuggestion[];
};

export type StyleDefinition = {
  id: string;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  aliases: string[];
  palette: string[];
  traits: string[];
};

export const AgeModeSchema = z.enum(["FAMILY", "CO_CREATE", "PRIVATE_TEEN", "SOCIAL_TEEN"]);
export type AgeMode = z.infer<typeof AgeModeSchema>;

export const ageModeFor = (ageYears: number): AgeMode => {
  if (ageYears <= 5) return "FAMILY";
  if (ageYears <= 9) return "CO_CREATE";
  if (ageYears <= 12) return "PRIVATE_TEEN";
  return "SOCIAL_TEEN";
};

export const PrivacyStateSchema = z.enum(["PRIVATE", "CIRCLE", "PUBLIC"]);
export type PrivacyState = z.infer<typeof PrivacyStateSchema>;

export const AccountInputSchema = z.object({
  nickname: z.string().trim().min(2).max(30),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{3,24}$/),
  ageYears: z.number().int().min(0).max(18),
  locale: LocaleSchema,
  styleMix: z.array(StyleMixEntrySchema).min(1).max(3),
  avatarUri: z.string().url().max(1024).optional(),
  genderPresentation: GenderPresentationSchema.default("NOT_SPECIFIED"),
  hairProfile: HairProfileSchema.default(DEFAULT_HAIR_PROFILE),
  schoolDressCode: SchoolDressCodeSchema.default("FREE_STYLE"),
  privacyState: PrivacyStateSchema.optional(),
});
export type AccountInput = z.infer<typeof AccountInputSchema>;

export const AccountPatchInputSchema = z.object({
  nickname: z.string().trim().min(2).max(30).optional(),
  locale: LocaleSchema.optional(),
  styleMix: z.array(StyleMixEntrySchema).min(1).max(3).optional(),
  genderPresentation: GenderPresentationSchema.optional(),
  hairProfile: HairProfileSchema.optional(),
  schoolDressCode: SchoolDressCodeSchema.optional(),
  privacyState: PrivacyStateSchema.optional(),
});
export type AccountPatchInput = z.infer<typeof AccountPatchInputSchema>;

export type SocialAccount = AccountInput & {
  id: string;
  ageMode: AgeMode;
  privacyState: PrivacyState;
  followersCount: number;
  followingCount: number;
  looksCount: number;
  createdAt: string;
};

export const GuestSessionInputSchema = AccountInputSchema.extend({
  installId: z.string().trim().min(16).max(160),
});
export type GuestSessionInput = z.infer<typeof GuestSessionInputSchema>;

export type GuestSession = {
  accessToken: string;
  expiresAt: string;
  account: SocialAccount;
};

export const LookVisibilitySchema = z.enum(["PRIVATE", "CIRCLE", "PUBLIC"]);
export type LookVisibility = z.infer<typeof LookVisibilitySchema>;

export const LookPostInputSchema = z.object({
  outfit: z.custom<OutfitOption>(),
  caption: z.string().trim().max(500).default(""),
  styleTags: z.array(z.string().min(1).max(40)).max(8).default([]),
  visibility: LookVisibilitySchema.default("CIRCLE"),
  challengeId: z.string().uuid().optional(),
  remixOfPostId: z.string().uuid().optional(),
});
export type LookPostInput = z.infer<typeof LookPostInputSchema>;

export type LookPost = LookPostInput & {
  id: string;
  author: Pick<SocialAccount, "id" | "nickname" | "handle" | "avatarUri" | "styleMix">;
  reactionCount: number;
  commentCount: number;
  remixCount: number;
  viewerReacted: boolean;
  createdAt: string;
};

export const FollowInputSchema = z.object({ targetAccountId: z.string().uuid() });
export const ReactionInputSchema = z.object({ kind: z.enum(["LOVE", "INSPIRED", "WOW"]).default("LOVE") });

export const MessageInputSchema = z.object({
  body: z.string().trim().min(1).max(1200),
});
export type MessageInput = z.infer<typeof MessageInputSchema>;

export type DirectMessage = MessageInput & {
  id: string;
  conversationId: string;
  senderAccountId: string;
  moderationState: "CLEAN" | "PENDING" | "HIDDEN";
  createdAt: string;
};

export const ReportInputSchema = z.object({
  targetType: z.enum(["ACCOUNT", "LOOK_POST", "MESSAGE"]),
  targetId: z.string().uuid(),
  reason: z.enum(["BULLYING", "SEXUAL_CONTENT", "SELF_HARM", "HATE", "SPAM", "OTHER"]),
  details: z.string().trim().max(500).optional(),
});

export const AiStylistInputSchema = z.object({
  ageYears: z.number().int().min(0).max(18),
  locale: LocaleSchema,
  question: z.string().trim().min(1).max(600),
  styleMix: z.array(StyleMixEntrySchema).min(1).max(3),
  wardrobeSummary: z.array(z.string().trim().min(1).max(120)).max(120).default([]),
  outfit: z.custom<OutfitOption>().optional(),
});
export type AiStylistInput = z.infer<typeof AiStylistInputSchema>;

export type AiStylistResponse = {
  answer: string;
  quickActions: string[];
  safetyMode: "UNDER_13_LOCAL" | "TEEN_GUARDED" | "STANDARD";
  provider: "openai" | "local";
};

export const WardrobeVisionInputSchema = z.object({
  ageYears: z.number().int().min(0).max(18),
  locale: LocaleSchema,
  imageDataUrl: z.string().startsWith("data:image/").max(12_000_000),
  selectedStyleIds: z.array(z.string().min(1)).min(1).max(3),
});
export type WardrobeVisionInput = z.infer<typeof WardrobeVisionInputSchema>;

export const WardrobeVisionResultSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: GarmentCategorySchema,
  slot: GarmentSlotSchema,
  colors: z.array(z.string().regex(/^#[0-9A-F]{6}$/i)).min(1).max(4),
  warmth: z.number().int().min(0).max(4),
  styleIds: z.array(z.string().min(1)).max(8),
  confidence: z.number().min(0).max(1),
  provider: z.enum(["openai", "local"]),
});
export type WardrobeVisionResult = z.infer<typeof WardrobeVisionResultSchema>;

export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
};
