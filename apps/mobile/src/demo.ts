import type { WardrobeItemInput } from "@kidz/contracts";

type DemoItem = Omit<WardrobeItemInput, "profileId">;

export const STARTER_WARDROBE: DemoItem[] = [
  { name: "Графитовая футболка", category: "tshirt", slot: "top", colors: ["#25272D"], warmth: 1, styleIds: ["emo", "streetwear", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Молочная рубашка", category: "shirt", slot: "top", colors: ["#EEEAE2"], warmth: 1, styleIds: ["stockholm", "preppy", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Свободное худи", category: "hoodie", slot: "mid_layer", colors: ["#727882"], warmth: 3, styleIds: ["emo", "skater", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрные джинсы", category: "jeans", slot: "bottom", colors: ["#1B1D22"], warmth: 2, styleIds: ["emo", "grunge", "stockholm"], careState: "CLEAN", fitState: "FITS" },
  { name: "Светлые брюки", category: "trousers", slot: "bottom", colors: ["#CBC7BE"], warmth: 2, styleIds: ["stockholm", "minimal", "preppy"], careState: "CLEAN", fitState: "FITS" },
  { name: "Куртка-ветровка", category: "jacket", slot: "outerwear", colors: ["#3D4851"], warmth: 3, styleIds: ["techwear", "streetwear", "stockholm"], careState: "CLEAN", fitState: "FITS" },
  { name: "Высокие кеды", category: "sneakers", slot: "footwear", colors: ["#16171A", "#E5E2DB"], warmth: 1, styleIds: ["emo", "skater", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Белые кроссовки", category: "sneakers", slot: "footwear", colors: ["#F1F0EB"], warmth: 1, styleIds: ["stockholm", "minimal", "sporty"], careState: "CLEAN", fitState: "FITS" },
];

export const quickItems: Record<"top" | "bottom" | "footwear" | "outerwear", DemoItem> = {
  top: { name: "Новый верх", category: "tshirt", slot: "top", colors: ["#B9D7FF"], warmth: 1, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  bottom: { name: "Новый низ", category: "trousers", slot: "bottom", colors: ["#626873"], warmth: 2, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  footwear: { name: "Новая обувь", category: "sneakers", slot: "footwear", colors: ["#F1C884"], warmth: 1, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  outerwear: { name: "Новая куртка", category: "jacket", slot: "outerwear", colors: ["#BFDCC9"], warmth: 3, styleIds: [], careState: "CLEAN", fitState: "FITS" },
};
