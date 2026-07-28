import type { WardrobeVisionResult } from "@kidz/contracts";

type ClosetItem = Pick<WardrobeVisionResult, "name" | "category" | "slot" | "colors" | "styleIds">;

const colorDistance = (left: string, right: string) => {
  const parse = (value: string) => value.replace("#", "").match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? [128, 128, 128];
  const a = parse(left);
  const b = parse(right);
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - (b[index] ?? 128)) ** 2, 0));
};

export const evaluatePurchase = (candidate: WardrobeVisionResult, wardrobe: ClosetItem[], selectedStyles: string[]) => {
  const similar = wardrobe.filter((item) =>
    item.slot === candidate.slot &&
    (item.category === candidate.category || colorDistance(item.colors[0] ?? "#808080", candidate.colors[0] ?? "#808080") < 72),
  );
  const styleMatches = candidate.styleIds.filter((styleId) => selectedStyles.includes(styleId)).length;
  const complementary = wardrobe.filter((item) => item.slot !== candidate.slot && item.styleIds.some((styleId) => candidate.styleIds.includes(styleId))).length;
  const newLooks = Math.min(36, Math.max(1, complementary * (similar.length ? 1 : 2)));
  const verdict = similar.length >= 3 ? "SKIP" : styleMatches === 0 && selectedStyles.length ? "THINK" : "BUY";
  return { verdict, similar, newLooks, styleMatches };
};
