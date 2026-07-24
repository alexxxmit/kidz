import type { GenderPresentation, HairColor, HairLength, HairStylePreference, Locale } from "@kidz/contracts";

export const GENDER_OPTIONS: Array<{
  id: GenderPresentation;
  symbol: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
}> = [
  { id: "FEMININE", symbol: "♀", label: { ru: "Девочка", en: "Girl" }, description: { ru: "женственная подача", en: "feminine direction" } },
  { id: "MASCULINE", symbol: "♂", label: { ru: "Мальчик", en: "Boy" }, description: { ru: "мужская подача", en: "masculine direction" } },
  { id: "NEUTRAL", symbol: "✦", label: { ru: "Нейтрально", en: "Neutral" }, description: { ru: "без гендерных рамок", en: "without gender rules" } },
  { id: "NOT_SPECIFIED", symbol: "—", label: { ru: "Не указывать", en: "Skip" }, description: { ru: "универсальные советы", en: "universal guidance" } },
];

export const HAIR_LENGTH_OPTIONS: Array<{ id: HairLength; label: Record<Locale, string> }> = [
  { id: "BUZZ", label: { ru: "Очень короткие", en: "Buzz" } },
  { id: "SHORT", label: { ru: "Короткие", en: "Short" } },
  { id: "MEDIUM", label: { ru: "Средние", en: "Medium" } },
  { id: "LONG", label: { ru: "Длинные", en: "Long" } },
  { id: "VERY_LONG", label: { ru: "Очень длинные", en: "Very long" } },
];

export const HAIR_COLOR_OPTIONS: Array<{ id: HairColor; color: string; label: Record<Locale, string> }> = [
  { id: "BLACK", color: "#17151B", label: { ru: "Чёрные", en: "Black" } },
  { id: "DARK_BROWN", color: "#3B2925", label: { ru: "Тёмные", en: "Dark brown" } },
  { id: "BROWN", color: "#704936", label: { ru: "Каштан", en: "Brown" } },
  { id: "LIGHT_BROWN", color: "#A87855", label: { ru: "Русые", en: "Light brown" } },
  { id: "BLONDE", color: "#E6CA82", label: { ru: "Блонд", en: "Blonde" } },
  { id: "RED", color: "#A74B2F", label: { ru: "Рыжие", en: "Red" } },
  { id: "GRAY", color: "#AAA8AD", label: { ru: "Седые", en: "Gray" } },
  { id: "DYED_BRIGHT", color: "#8B58D9", label: { ru: "Яркие", en: "Bright" } },
  { id: "MIXED", color: "#6D526E", label: { ru: "Смешанный", en: "Mixed" } },
];

export const HAIR_STYLE_OPTIONS: Array<{
  id: HairStylePreference;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  minLength: HairLength[];
}> = [
  { id: "AUTO", label: { ru: "Подберёт MIRA", en: "Let MIRA choose" }, description: { ru: "по стилю и образу", en: "for the style and look" }, minLength: ["BUZZ", "SHORT", "MEDIUM", "LONG", "VERY_LONG"] },
  { id: "TEXTURED", label: { ru: "Текстура", en: "Texture" }, description: { ru: "живой объём и пряди", en: "natural volume and pieces" }, minLength: ["BUZZ", "SHORT", "MEDIUM"] },
  { id: "BLOWOUT", label: { ru: "Объёмный blowout", en: "Bouncy blowout" }, description: { ru: "мягкий объём у лица", en: "soft face-framing volume" }, minLength: ["MEDIUM", "LONG", "VERY_LONG"] },
  { id: "STRAIGHT", label: { ru: "Прямые", en: "Straight" }, description: { ru: "ровная гладкая длина", en: "smooth polished length" }, minLength: ["SHORT", "MEDIUM", "LONG", "VERY_LONG"] },
  { id: "WAVES_CURLS", label: { ru: "Волны / локоны", en: "Waves / curls" }, description: { ru: "мягкая форма и движение", en: "soft shape and movement" }, minLength: ["SHORT", "MEDIUM", "LONG", "VERY_LONG"] },
  { id: "SLEEK", label: { ru: "Гладкая укладка", en: "Sleek" }, description: { ru: "чистый контур и пробор", en: "clean outline and part" }, minLength: ["BUZZ", "SHORT", "MEDIUM", "LONG", "VERY_LONG"] },
  { id: "UPDO_BRAID", label: { ru: "Пучок / коса", en: "Updo / braid" }, description: { ru: "собранные волосы", en: "hair worn up" }, minLength: ["MEDIUM", "LONG", "VERY_LONG"] },
];
