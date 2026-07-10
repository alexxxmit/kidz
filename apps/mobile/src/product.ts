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
  styleMix: [{ styleId, weight: 1 }],
});

export const demoOutfits = (styleId = "stockholm", locale: Locale = "ru") =>
  generateOutfits({
    profile: profileFor(styleId, locale),
    wardrobe: STARTER_WARDROBE,
    weather: { temperatureC: 17, feelsLikeC: 16, rainProbability: 0.15, windKph: 11, occasion: "school" },
  });

const look = (styleId: string, index: number) => demoOutfits(styleId)[index] ?? demoOutfits(styleId)[0]!;

export const DEMO_POSTS: FeedPost[] = [
  {
    id: "post-lina",
    nickname: "lina",
    handle: "@lina.layers",
    avatarColor: "#FF91A9",
    time: "12m",
    caption: { ru: "взяла базу и добавила один emo-акцент 🖤", en: "kept the base clean and added one emo accent 🖤" },
    style: "soft emo",
    outfit: look("emo", 0),
    reactions: 348,
    comments: 27,
    remixes: 43,
  },
  {
    id: "post-aya",
    nickname: "aya",
    handle: "@aya.archive",
    avatarColor: "#A9E4E7",
    time: "38m",
    caption: { ru: "школьный acubi без покупки новых вещей", en: "school acubi without buying anything new" },
    style: "acubi",
    outfit: look("acubi", 1),
    reactions: 219,
    comments: 18,
    remixes: 61,
  },
  {
    id: "post-noor",
    nickname: "noor",
    handle: "@noor.moves",
    avatarColor: "#FFD27C",
    time: "1h",
    caption: { ru: "sporty, но с серебряным акцентом", en: "sporty, with one silver accent" },
    style: "sporty street",
    outfit: look("sporty", 0),
    reactions: 504,
    comments: 39,
    remixes: 78,
  },
];

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
  ru: ["Безлимитный AI-стилист", "Виртуальные примерки", "Умный wishlist и разбор покупок", "Расширенная аналитика гардероба"],
  en: ["Unlimited AI stylist", "Virtual try-ons", "Smart wishlist and purchase check", "Advanced closet insights"],
};

export const wardrobePreview = STARTER_WARDROBE.map((item, index) => ({
  ...item,
  localId: `wardrobe-${index}`,
})) satisfies Array<Omit<WardrobeItemInput, "profileId"> & { localId: string }>;
