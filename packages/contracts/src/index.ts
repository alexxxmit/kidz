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

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(40).default("Мой профиль"),
  locale: LocaleSchema,
  ageYears: z.number().int().min(0).max(18),
  autonomyMode: AutonomyModeSchema,
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
  weather: number;
  completeness: number;
  rotation: number;
};

export type OutfitOption = {
  id: string;
  items: Array<Omit<WardrobeItemInput, "profileId"> & { id?: string }>;
  score: number;
  scores: ScoreBreakdown;
  reasonCodes: string[];
  missingSlots: GarmentSlot[];
};

export type StyleDefinition = {
  id: string;
  names: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  aliases: string[];
  palette: string[];
  traits: string[];
};

export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
};
