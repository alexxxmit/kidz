import type {
  GarmentSlot,
  OutfitOption,
  OutfitRequest,
  WardrobeItemInput,
} from "@kidz/contracts";

import { buildStylingGuidance } from "./styling.js";
import { STYLE_CATALOG } from "./styles.js";

type CandidateItem = Omit<WardrobeItemInput, "profileId"> & { id?: string };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const styleTraits = new Map(STYLE_CATALOG.map((style) => [style.id, new Set(style.traits)]));

const styleAffinity = (item: CandidateItem, targetStyleId: string) => {
  if (item.styleIds.includes(targetStyleId)) return 1;
  const target = styleTraits.get(targetStyleId);
  if (!target?.size) return 0;
  return item.styleIds.reduce((best, itemStyleId) => {
    const itemTraits = styleTraits.get(itemStyleId);
    if (!itemTraits?.size) return best;
    const shared = [...target].filter((trait) => itemTraits.has(trait)).length;
    return Math.max(best, (shared / target.size) * 0.68);
  }, 0);
};

const targetWarmth = (temperatureC: number): number => {
  if (temperatureC <= 0) return 9;
  if (temperatureC <= 8) return 7;
  if (temperatureC <= 15) return 5;
  if (temperatureC <= 22) return 3;
  return 1;
};

const weightedStyleScore = (
  items: CandidateItem[],
  styleMix: OutfitRequest["profile"]["styleMix"],
): number => {
  const totalWeight = styleMix.reduce((sum, style) => sum + style.weight, 0) || 1;
  const score = styleMix.reduce((sum, style) => {
    const affinity = items.reduce((itemSum, item) => itemSum + styleAffinity(item, style.styleId), 0);
    return sum + (affinity / Math.max(items.length, 1)) * style.weight;
  }, 0);
  return clamp(score / totalWeight);
};

const completenessScore = (items: CandidateItem[]): { score: number; missing: GarmentSlot[] } => {
  const slots = new Set(items.map((item) => item.slot));
  const missing: GarmentSlot[] = [];
  const hasBody = slots.has("one_piece") || (slots.has("top") && slots.has("bottom"));
  if (!hasBody) {
    if (!slots.has("top")) missing.push("top");
    if (!slots.has("bottom")) missing.push("bottom");
  }
  if (!slots.has("footwear")) missing.push("footwear");
  return { score: clamp(1 - missing.length / 3), missing };
};

const itemStyleScore = (
  item: CandidateItem,
  styleMix: OutfitRequest["profile"]["styleMix"],
): number => {
  const totalWeight = styleMix.reduce((sum, style) => sum + style.weight, 0) || 1;
  const score = styleMix.reduce(
    (sum, style) => sum + styleAffinity(item, style.styleId) * style.weight,
    0,
  );
  return clamp(score / totalWeight);
};

const weatherScore = (
  items: CandidateItem[],
  request: OutfitRequest,
): { score: number; reasons: string[] } => {
  const temperature = request.weather.feelsLikeC ?? request.weather.temperatureC;
  const warmth = items.reduce((sum, item) => sum + item.warmth, 0);
  const distance = Math.abs(warmth - targetWarmth(temperature));
  const autonomySoftening =
    request.profile.ageYears >= 10 && request.profile.autonomyMode !== "PARENT_DECIDES" ? 0.65 : 1;
  const score = clamp(1 - (distance / 9) * autonomySoftening);
  const reasons: string[] = [];
  if (temperature <= 10 && items.some((item) => item.slot === "outerwear")) {
    reasons.push("COOL_WEATHER_LAYER");
  }
  if (request.weather.rainProbability >= 0.45) reasons.push("RAIN_CONTEXT");
  if (request.weather.windKph >= 25) reasons.push("WIND_LATER");
  return { score, reasons };
};

const combinations = (
  wardrobe: CandidateItem[],
  styleMix: OutfitRequest["profile"]["styleMix"],
): CandidateItem[][] => {
  const available = wardrobe.filter(
    (item) => item.careState !== "LAUNDRY" && item.fitState !== "OUTGROWN",
  );
  const ranked = (items: CandidateItem[], limit: number) =>
    [...items]
      .sort((a, b) => itemStyleScore(b, styleMix) - itemStyleScore(a, styleMix))
      .slice(0, limit);
  const tops = ranked(available.filter((item) => item.slot === "top"), 7);
  const bottoms = ranked(available.filter((item) => item.slot === "bottom"), 7);
  const onePieces = ranked(available.filter((item) => item.slot === "one_piece"), 4);
  const shoes = ranked(available.filter((item) => item.slot === "footwear"), 5);
  const mids: Array<CandidateItem | undefined> = [
    undefined,
    ...ranked(available.filter((item) => item.slot === "mid_layer"), 4),
  ];
  const outers: Array<CandidateItem | undefined> = [
    undefined,
    ...ranked(available.filter((item) => item.slot === "outerwear"), 4),
  ];
  const optionalBySlot = (slot: GarmentSlot): Array<CandidateItem | undefined> => [
    undefined,
    ...available
      .filter((item) => item.slot === slot)
      .sort((a, b) => itemStyleScore(b, styleMix) - itemStyleScore(a, styleMix))
      .slice(0, 2),
  ];
  const headwear = optionalBySlot("headwear");
  const jewelry = [
    undefined,
    ...available
      .filter((item) => item.slot === "jewelry" || item.slot === "accessory")
      .sort((a, b) => itemStyleScore(b, styleMix) - itemStyleScore(a, styleMix))
      .slice(0, 2),
  ];
  const bags = optionalBySlot("bag");
  const bodies: CandidateItem[][] = [
    ...tops.flatMap((top) => bottoms.map((bottom) => [top, bottom])),
    ...onePieces.map((item) => [item]),
  ];

  const result: CandidateItem[][] = [];
  for (const body of bodies) {
    for (const shoe of shoes.length ? shoes : [undefined]) {
      for (const mid of mids) {
        for (const outer of outers) {
          for (const hat of headwear) {
            for (const jewel of jewelry) {
              for (const bag of bags) {
                result.push(
                  [...body, shoe, mid, outer, hat, jewel, bag].filter(Boolean) as CandidateItem[],
                );
              }
            }
          }
        }
      }
    }
  }
  return result.length ? result : available.map((item) => [item]);
};

const optionSignature = (items: CandidateItem[]) =>
  items
    .map((item) => `${item.slot}:${item.name}`)
    .sort()
    .join("|");

export const generateOutfits = (request: OutfitRequest): OutfitOption[] => {
  const candidates = combinations(request.wardrobe, request.profile.styleMix).map((items, index) => {
    const style = weightedStyleScore(items, request.profile.styleMix);
    const weather = weatherScore(items, request);
    const completeness = completenessScore(items);
    const styling = buildStylingGuidance(request.profile, items);
    const rotation = clamp(
      1 - items.reduce((sum, item) => sum + ("wearCount" in item ? Number(item.wearCount) : 0), 0) / 20,
    );
    const totalLookBonus = Math.min(
      items.filter((item) => ["mid_layer", "outerwear", "headwear", "jewelry", "bag", "accessory"].includes(item.slot)).length * 0.018,
      0.072,
    );
    const score = clamp(
      style * 0.31 +
      weather.score * 0.27 +
      completeness.score * 0.23 +
      styling.stylingScore * 0.11 +
      rotation * 0.08 +
      totalLookBonus,
    );
    const reasonCodes = [
      style >= 0.5 ? "STYLE_MATCH" : "STYLE_EXPLORATION",
      "HAIR_DIRECTION",
      "MAKEUP_DIRECTION",
      items.some((item) => item.slot === "jewelry" || item.slot === "bag" || item.slot === "accessory")
        ? "ACCESSORY_BALANCE"
        : "ACCESSORY_IDEA",
      ...weather.reasons,
      completeness.missing.length ? "PARTIAL_WARDROBE" : "COMPLETE_LOOK",
    ];
    return {
      id: `look-${index + 1}`,
      items,
      score: Number(score.toFixed(4)),
      scores: {
        style: Number(style.toFixed(3)),
        weather: Number(weather.score.toFixed(3)),
        completeness: Number(completeness.score.toFixed(3)),
        rotation: Number(rotation.toFixed(3)),
        styling: styling.stylingScore,
      },
      reasonCodes,
      missingSlots: completeness.missing,
      hair: styling.hair,
      makeup: styling.makeup,
      stylingSuggestions: styling.stylingSuggestions,
      signature: optionSignature(items),
    } satisfies OutfitOption & { signature: string };
  });

  const sorted = candidates.sort((a, b) => b.score - a.score);
  const selected: typeof sorted = [];
  for (const candidate of sorted) {
    const overlapsTooMuch = selected.some((current) => {
      const a = new Set(current.items.map((item) => item.name));
      const common = candidate.items.filter((item) => a.has(item.name)).length;
      return common / Math.max(candidate.items.length, 1) > 0.75;
    });
    if (!overlapsTooMuch || selected.length === 0) selected.push(candidate);
    if (selected.length === 3) break;
  }
  if (selected.length < 3) {
    for (const candidate of sorted) {
      if (!selected.includes(candidate)) selected.push(candidate);
      if (selected.length === 3) break;
    }
  }

  return selected.map(({ signature: _signature, ...option }) => option);
};
