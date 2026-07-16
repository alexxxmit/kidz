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
  editorial?: boolean;
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

export const STYLE_DISCOVERY_OPTIONS = [
  { id: "clean", styles: ["stockholm", "clean-girl"], title: { ru: "Спокойно и чисто", en: "Clean and calm" }, body: { ru: "Светлые слои, деним, простые формы", en: "Light layers, denim, simple shapes" }, colors: ["#EEEAE2", "#AFC3D1", "#343536"] },
  { id: "bold", styles: ["emo", "grunge"], title: { ru: "Смело и темно", en: "Bold and dark" }, body: { ru: "Графика, чёрный, металл и характер", en: "Graphics, black, metal and attitude" }, colors: ["#17191E", "#7A2434", "#A8ADB6"] },
  { id: "soft", styles: ["coquette", "romantic"], title: { ru: "Нежно и романтично", en: "Soft and romantic" }, body: { ru: "Мягкие цвета, детали и лёгкие силуэты", en: "Soft colors, details and light silhouettes" }, colors: ["#F9DDE7", "#FFF8FA", "#E9AFC3"] },
  { id: "street", styles: ["streetwear", "acubi"], title: { ru: "Удобно и по-городскому", en: "Easy and urban" }, body: { ru: "Свободные формы, кроссовки и слои", en: "Relaxed shapes, sneakers and layers" }, colors: ["#D7D7D2", "#666A72", "#1C1E23"] },
] as const;

export const editorialPosts = (locale: Locale): FeedPost[] => {
  const entries = [
    { id: "stockholm", styleId: "stockholm", style: "Stockholm", caption: { ru: "Формула недели: полоска, расслабленный деним и одна тёплая кожаная деталь.", en: "Formula of the week: stripes, relaxed denim, and one warm leather detail." }, color: "#D9D1C5" },
    { id: "emo", styleId: "emo", style: "Soft emo", caption: { ru: "Тёмный образ без перегруза: графика, прямой низ и серебристый акцент.", en: "A dark look without the overload: graphics, a straight bottom, and a silver accent." }, color: "#C9C4D1" },
    { id: "coquette", styleId: "coquette", style: "Coquette", caption: { ru: "Нежный образ становится современнее, если оставить только одну романтичную деталь.", en: "A soft look feels more current when it keeps just one romantic detail." }, color: "#F2C9D6" },
  ];
  return entries.map((entry, index) => ({
    id: `editorial-${entry.id}`,
    nickname: locale === "ru" ? "Редакция MIRA" : "MIRA Edit",
    handle: "@mira.edit",
    avatarColor: entry.color,
    time: locale === "ru" ? "сегодня" : "today",
    caption: entry.caption,
    style: entry.style,
    outfit: demoOutfits(entry.styleId, locale)[index % 3]!,
    reactions: 128 + index * 47,
    comments: 0,
    remixes: 24 + index * 11,
    editorial: true,
  }));
};

export const PLUS_FEATURES = {
  ru: ["Безлимитные AI-подборки и новые варианты", "Планировщик поездок и готовый чемодан", "Капсулы на сезон, школу и события", "Глубокая аналитика шкафа и точный список покупок"],
  en: ["Unlimited AI outfits and alternatives", "Trip planner and a ready-to-pack suitcase", "Season, school, and event capsules", "Deep closet analytics and a precise shopping list"],
};

export const wardrobePreview = STARTER_WARDROBE.map((item, index) => ({
  ...item,
  localId: `wardrobe-${index}`,
})) satisfies Array<Omit<WardrobeItemInput, "profileId"> & { localId: string }>;
