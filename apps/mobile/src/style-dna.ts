import type { OutfitOption } from "@kidz/contracts";

type StyleAwareItem = {
  name: string;
  styleIds: string[];
  favorite?: boolean | undefined;
  wearCount?: number | undefined;
};

type Feedback = {
  itemNames: string[];
  worn: boolean;
  createdAt: string;
};

export type StyleDnaEntry = {
  styleId: string;
  percent: number;
};

export type StyleDnaSnapshot = {
  month: string;
  scores: Record<string, number>;
};

export const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

export const calculateStyleDna = (
  selectedStyleIds: string[],
  wardrobe: StyleAwareItem[],
  feedback: Feedback[],
  postedOutfits: OutfitOption[] = [],
): StyleDnaEntry[] => {
  const scores = new Map<string, number>();
  const add = (styleId: string, amount: number) => scores.set(styleId, Math.max(0.1, (scores.get(styleId) ?? 0) + amount));

  selectedStyleIds.forEach((styleId) => add(styleId, 5));
  wardrobe.forEach((item) => item.styleIds.forEach((styleId) => add(styleId, 0.7 + (item.favorite ? 1.8 : 0) + Math.min(item.wearCount ?? 0, 5) * 0.2)));

  const wardrobeByName = new Map(wardrobe.map((item) => [item.name, item]));
  feedback.forEach((entry) => entry.itemNames.forEach((name) => {
    const item = wardrobeByName.get(name);
    item?.styleIds.forEach((styleId) => add(styleId, entry.worn ? 2.5 : -0.4));
  }));
  postedOutfits.forEach((outfit) => outfit.items.forEach((item) => item.styleIds.forEach((styleId) => add(styleId, 0.8))));

  const top = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = top.reduce((sum, [, value]) => sum + value, 0) || 1;
  const result = top.map(([styleId, value]) => ({ styleId, percent: Math.round((value / total) * 100) }));
  const difference = 100 - result.reduce((sum, entry) => sum + entry.percent, 0);
  if (result[0]) result[0].percent += difference;
  return result;
};

export const toStyleDnaSnapshot = (entries: StyleDnaEntry[], date = new Date()): StyleDnaSnapshot => ({
  month: monthKey(date),
  scores: Object.fromEntries(entries.map((entry) => [entry.styleId, entry.percent])),
});

export const styleDnaMovement = (current: StyleDnaEntry[], previous?: StyleDnaSnapshot) =>
  current.map((entry) => ({
    ...entry,
    change: entry.percent - (previous?.scores[entry.styleId] ?? entry.percent),
  }));

export const weeklyStyleStory = (feedback: Feedback[], wardrobe: StyleAwareItem[], now = new Date()) => {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const worn = feedback.filter((entry) => entry.worn && new Date(entry.createdAt) >= weekAgo);
  const unique = new Set(worn.flatMap((entry) => entry.itemNames));
  const rediscovered = [...unique].filter((name) => {
    const item = wardrobe.find((candidate) => candidate.name === name);
    return Boolean(item && (item.wearCount ?? 0) <= 1);
  }).length;
  return { wornLooks: worn.length, uniquePieces: unique.size, rediscovered };
};
