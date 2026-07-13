import type { Locale, OutfitOption, WardrobeItemInput } from "@kidz/contracts";
import { generateOutfits } from "@kidz/domain";

import { STARTER_WARDROBE } from "./demo";

export type FeedPost = {
  id: string;
  nickname: string;
  handle: string;
  avatarColor: string;
  time: string;
  caption: Record<Locale, string>;
  style: string;
  outfit: OutfitOption;
  reactions: number;
  comments: number;
  remixes: number;
  reacted?: boolean;
  mine?: boolean;
};

const profileFor = (styleId: string, locale: Locale = "ru") => ({
  displayName: "MIRA",
  locale,
  ageYears: 15,
  autonomyMode: "USER_DECIDES" as const,
  genderPresentation: "FEMININE" as const,
  hairProfile: { length: "LONG" as const, color: "DARK_BROWN" as const, openToColorAdvice: true },
  schoolDressCode: "FREE_STYLE" as const,
  styleMix: [{ styleId, weight: 1 }],
});

export const demoOutfits = (styleId = "stockholm", locale: Locale = "ru") =>
  generateOutfits({
    profile: profileFor(styleId, locale),
    wardrobe: STARTER_WARDROBE,
    weather: { temperatureC: 17, feelsLikeC: 16, rainProbability: 0.15, windKph: 11, occasion: "school" },
  });

export const TREND_STYLES = [
  { id: "stockholm", title: "Stockholm", change: "+24%", colors: ["#E9E4DC", "#99A0A7", "#2B2D31"] },
  { id: "soft-emo", title: "Soft emo", change: "+18%", colors: ["#17171A", "#8C273B", "#D7D2CE"] },
  { id: "acubi", title: "Acubi", change: "+31%", colors: ["#D7D7D2", "#666A72", "#1C1E23"] },
  { id: "coquette", title: "Coquette", change: "+12%", colors: ["#F9DDE7", "#E9AFC3", "#FFF8FA"] },
];

export const CHALLENGES = [
  { id: "one-piece-three", title: { ru: "1 вещь · 3 настроения", en: "1 piece · 3 moods" }, reward: 120, progress: 2, total: 3 },
  { id: "closet-first", title: { ru: "Неделя без новых покупок", en: "No-buy remix week" }, reward: 250, progress: 4, total: 7 },
];

export const PLUS_FEATURES = {
  ru: ["40 AI-примерок на своих фото в месяц", "Безлимитные диалоги с AI-стилистом", "Капсулы и планирование сезона", "Умный wishlist и разбор покупок"],
  en: ["40 AI try-ons on your photos each month", "Unlimited AI stylist chats", "Capsules and seasonal planning", "Smart wishlist and purchase check"],
};

export const wardrobePreview = STARTER_WARDROBE.map((item, index) => ({
  ...item,
  localId: `wardrobe-${index}`,
})) satisfies Array<Omit<WardrobeItemInput, "profileId"> & { localId: string }>;
