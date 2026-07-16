import type { OutfitOption } from "@kidz/contracts";

export type LookFeedback = {
  signature: string;
  itemNames: string[];
  worn: boolean;
  occasion: string;
  createdAt: string;
};

export const lookSignature = (look: OutfitOption): string =>
  look.items.map((item) => `${item.slot}:${item.name}`).sort().join("|");

export const rankOutfitsWithLearning = (
  outfits: OutfitOption[],
  feedback: LookFeedback[],
  favoriteNames: string[] = [],
): OutfitOption[] => {
  const favorites = new Set(favoriteNames);
  const liked = new Map<string, number>();
  for (const entry of feedback.filter((item) => item.worn)) {
    for (const name of entry.itemNames) liked.set(name, (liked.get(name) ?? 0) + 1);
  }
  const latestBySignature = new Map<string, LookFeedback>();
  for (const entry of [...feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (!latestBySignature.has(entry.signature)) latestBySignature.set(entry.signature, entry);
  }

  return outfits
    .map((look, index) => {
      const signature = lookSignature(look);
      const exact = latestBySignature.get(signature);
      const learned = look.items.reduce((sum, item) => sum + Math.min(liked.get(item.name) ?? 0, 3) * 0.018, 0);
      const favorite = look.items.reduce((sum, item) => sum + (favorites.has(item.name) ? 0.026 : 0), 0);
      const exactAdjustment = exact ? (exact.worn ? 0.08 : -0.55) : 0;
      return { look, index, score: look.score + learned + favorite + exactAdjustment };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ look }) => look);
};
