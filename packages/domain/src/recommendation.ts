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
    return Math.max(best, (shared / target.size) * 0.28);
  }, 0);
};

const parseLuminance = (value: string) => {
  const named: Record<string, number> = { black: 0.04, white: 0.98, gray: 0.5, grey: 0.5, navy: 0.12, beige: 0.76, cream: 0.9, brown: 0.25 };
  if (named[value.toLowerCase()] !== undefined) return named[value.toLowerCase()]!;
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0.5;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
};

const itemIsLight = (item: CandidateItem) => parseLuminance(item.colors[0] ?? "#808080") >= 0.72;
const itemIsDark = (item: CandidateItem) => parseLuminance(item.colors[0] ?? "#808080") <= 0.38;
const feminineCategories = new Set(["dress", "skirt", "hair_accessory", "headband", "earrings"]);

const itemPresentationScore = (item: CandidateItem, presentation: OutfitRequest["profile"]["genderPresentation"]) => {
  const feminineSignal = feminineCategories.has(item.category) || /mary jane|балетк|bow|бант/i.test(item.name);
  if (presentation === "FEMININE") return feminineSignal ? 1 : 0.82;
  if (presentation === "MASCULINE") return feminineSignal ? 0.08 : 1;
  return feminineSignal ? 0.28 : 1;
};

const presentationScore = (items: CandidateItem[], request: OutfitRequest) => clamp(items.reduce((sum, item) => sum + itemPresentationScore(item, request.profile.genderPresentation), 0) / Math.max(items.length, 1));

const itemDressCodeScore = (item: CandidateItem, request: OutfitRequest) => {
  if (request.weather.occasion !== "school" || request.profile.schoolDressCode === "FREE_STYLE" || request.profile.schoolDressCode === "NOT_APPLICABLE") return 1;
  if (request.profile.schoolDressCode === "WHITE_TOP") return item.slot === "top" ? (itemIsLight(item) ? 1 : 0.08) : 1;
  if (item.styleIds.includes("school-uniform")) return 1;
  if (item.slot === "top") return item.category === "shirt" && itemIsLight(item) ? 1 : itemIsLight(item) ? 0.68 : 0.12;
  if (item.slot === "bottom") return ["trousers", "skirt"].includes(item.category) && itemIsDark(item) ? 1 : itemIsDark(item) ? 0.55 : 0.15;
  if (item.slot === "footwear") return ["shoes", "boots"].includes(item.category) ? 1 : itemIsLight(item) || itemIsDark(item) ? 0.72 : 0.35;
  if (item.slot === "mid_layer" || item.slot === "outerwear") return ["sweater", "jacket", "coat"].includes(item.category) ? 0.9 : 0.55;
  return 0.8;
};

const dressCodeScore = (items: CandidateItem[], request: OutfitRequest) => clamp(items.reduce((sum, item) => sum + itemDressCodeScore(item, request), 0) / Math.max(items.length, 1));

const styleSignatureScore = (items: CandidateItem[], styleId: string) => {
  if (!items.length) return 0;
  const exact = items.filter((item) => item.styleIds.includes(styleId)).length / items.length;
  if (styleId === "stockholm") {
    const palette = items.filter((item) => item.colors.some((color) => {
      const luminance = parseLuminance(color);
      return luminance <= 0.36 || luminance >= 0.64;
    })).length / items.length;
    const silhouette = items.filter((item) => ["tshirt", "shirt", "sweater", "coat", "jacket", "trousers", "jeans", "skirt", "shoes", "boots", "bag", "headband", "scarf", "necklace", "earrings"].includes(item.category)).length / items.length;
    const currentCodes = items.filter((item) => /полос|stripe|кардиган|cardigan|v-neck|wide|широк|свобод|мини|mini|угги|suede|замш|балет|shoulder|плечо|ободок|headband|гетр|leg warmer|золот|gold/i.test(item.name)).length / items.length;
    const knitLayer = items.some((item) => item.slot === "mid_layer" && item.category === "sweater");
    const currentBottom = items.some((item) => item.slot === "bottom" && /wide|широк|свобод|мини|mini/i.test(item.name));
    const warmDetail = items.some((item) => /корич|brown|шоколад|chocolate|бордов|burgundy|золот|gold|замш|suede/i.test(item.name));
    const noisy = items.filter((item) => /график|принт|graphic|logo/i.test(item.name)).length / items.length;
    return clamp(exact * 0.34 + palette * 0.1 + silhouette * 0.14 + currentCodes * 0.2 + (knitLayer ? 0.12 : 0) + (currentBottom ? 0.07 : 0) + (warmDetail ? 0.07 : 0) - noisy * 0.35);
  }
  if (styleId === "emo") {
    const dark = items.filter(itemIsDark).length / items.length;
    const codes = items.filter((item) => ["tshirt", "hoodie", "jeans", "skirt", "sneakers", "boots", "belt", "necklace", "bracelet"].includes(item.category)).length / items.length;
    const layered = items.some((item) => item.slot === "mid_layer") || items.some((item) => /полос|striped|график|graphic/i.test(item.name));
    return clamp(exact * 0.52 + dark * 0.25 + codes * 0.18 + (layered ? 0.12 : 0));
  }
  return exact;
};

const targetWarmth = (temperatureC: number): number => {
  if (temperatureC <= 0) return 9;
  if (temperatureC <= 8) return 7;
  if (temperatureC <= 12) return 6;
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
    const exact = items.filter((item) => item.styleIds.includes(style.styleId)).length / Math.max(items.length, 1);
    const signature = styleSignatureScore(items, style.styleId);
    return sum + ((affinity / Math.max(items.length, 1)) * 0.25 + exact * 0.5 + signature * 0.25) * style.weight;
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
  request: OutfitRequest,
): CandidateItem[][] => {
  const available = request.wardrobe.filter(
    (item) => item.careState !== "LAUNDRY" && item.fitState !== "OUTGROWN",
  );
  const targetStyles = new Set(request.profile.styleMix.map((style) => style.styleId));
  const rankScore = (item: CandidateItem) => itemStyleScore(item, request.profile.styleMix) * 0.72 + itemPresentationScore(item, request.profile.genderPresentation) * 0.18 + itemDressCodeScore(item, request) * 0.1;
  const ranked = (items: CandidateItem[], limit: number) => {
    let candidates = [...items];
    if (request.weather.occasion === "school" && !["FREE_STYLE", "NOT_APPLICABLE"].includes(request.profile.schoolDressCode)) {
      const dressCodeMatches = candidates.filter((item) => itemDressCodeScore(item, request) >= 0.9);
      if (dressCodeMatches.length) candidates = dressCodeMatches;
    }
    if (request.profile.genderPresentation === "MASCULINE") {
      const presentationMatches = candidates.filter((item) => itemPresentationScore(item, request.profile.genderPresentation) >= 0.9);
      if (presentationMatches.length) candidates = presentationMatches;
    }
    const exactStyleMatches = candidates.filter((item) => item.styleIds.some((styleId) => targetStyles.has(styleId)));
    if (exactStyleMatches.length) candidates = exactStyleMatches;
    return candidates
      .sort((a, b) => rankScore(b) - rankScore(a))
      .slice(0, limit);
  };
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
  const feelsLike = request.weather.feelsLikeC ?? request.weather.temperatureC;
  const needsOuter = outers.length > 1 && (feelsLike <= 5 || (request.weather.rainProbability >= 0.55 && feelsLike <= 22));
  const needsLayer = (mids.length > 1 || outers.length > 1) && (feelsLike <= 12 || (request.weather.windKph >= 25 && feelsLike <= 18));
  const needsMiddleLayer = mids.length > 1 && feelsLike <= 0;
  const avoidWarmLayers = feelsLike >= 28;
  const optionalBySlot = (slot: GarmentSlot): Array<CandidateItem | undefined> => [
    undefined,
    ...ranked(available.filter((item) => item.slot === slot), 2),
  ];
  const headwear = optionalBySlot("headwear");
  const jewelry = [
    undefined,
    ...ranked(available.filter((item) => item.slot === "jewelry" || item.slot === "accessory"), 2),
  ];
  const bags = optionalBySlot("bag");
  const accessorySets: Array<Array<CandidateItem | undefined>> = [
    [undefined, undefined, undefined],
    [headwear[1], jewelry[1], bags[1]],
    [headwear[2], jewelry[2], bags[2]],
    [undefined, jewelry[1], bags[2]],
    [headwear[1], jewelry[2], undefined],
  ];
  const bodies: CandidateItem[][] = [
    ...tops.flatMap((top) => bottoms.map((bottom) => [top, bottom])),
    ...onePieces.map((item) => [item]),
  ];

  const result: CandidateItem[][] = [];
  for (const body of bodies) {
    for (const shoe of shoes.length ? shoes : [undefined]) {
      for (const mid of mids) {
        for (const outer of outers) {
          if (needsOuter && !outer) continue;
          if (needsLayer && !mid && !outer) continue;
          if (needsMiddleLayer && !mid) continue;
          if (avoidWarmLayers && ((mid?.warmth ?? 0) > 0 || (outer?.warmth ?? 0) > 0)) continue;
          for (const accessories of accessorySets) {
            result.push(
              [...body, shoe, mid, outer, ...accessories].filter(Boolean) as CandidateItem[],
            );
          }
        }
      }
    }
  }
  return result.filter((items) => {
    const hasLayer = items.some((item) => item.slot === "mid_layer" || item.slot === "outerwear");
    const hasBase = items.some((item) => item.slot === "top" || item.slot === "one_piece");
    return !hasLayer || hasBase;
  });
};

const optionSignature = (items: CandidateItem[]) =>
  items
    .map((item) => `${item.slot}:${item.name}`)
    .sort()
    .join("|");

export const generateOutfits = (request: OutfitRequest): OutfitOption[] => {
  const candidates = combinations(request).map((items, index) => {
    const style = weightedStyleScore(items, request.profile.styleMix);
    const presentation = presentationScore(items, request);
    const dressCode = dressCodeScore(items, request);
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
      style * 0.48 +
      presentation * 0.17 +
      dressCode * 0.12 +
      weather.score * 0.1 +
      completeness.score * 0.07 +
      styling.stylingScore * 0.04 +
      rotation * 0.02 +
      totalLookBonus,
    );
    const reasonCodes = [
      style >= 0.5 ? "STYLE_MATCH" : "STYLE_EXPLORATION",
      "HAIR_DIRECTION",
      "MAKEUP_DIRECTION",
      presentation >= 0.8 ? "PRESENTATION_MATCH" : "PRESENTATION_FLEX",
      request.weather.occasion === "school" ? `DRESS_CODE_${request.profile.schoolDressCode}` : "NO_DRESS_CODE",
      items.some((item) => item.slot === "jewelry" || item.slot === "bag" || item.slot === "accessory")
        ? "ACCESSORY_BALANCE"
        : "ACCESSORY_IDEA",
      items.some((item) => item.slot === "mid_layer" || item.slot === "outerwear")
        ? "LAYER_OVER_BASE"
        : "NO_EXTRA_LAYER",
      ...weather.reasons,
      completeness.missing.length ? "PARTIAL_WARDROBE" : "COMPLETE_LOOK",
    ];
    return {
      id: `look-${index + 1}`,
      items,
      score: Number(score.toFixed(4)),
      scores: {
        style: Number(style.toFixed(3)),
        presentation: Number(presentation.toFixed(3)),
        dressCode: Number(dressCode.toFixed(3)),
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
      const coreSlots = new Set<GarmentSlot>(["top", "bottom", "one_piece", "footwear"]);
      const core = candidate.items.filter((item) => coreSlots.has(item.slot));
      const sharedCore = core.filter((item) => a.has(item.name)).length;
      const lead = candidate.items.find((item) => item.slot === "top" || item.slot === "one_piece");
      const repeatsLead = Boolean(lead && a.has(lead.name));
      const bottom = candidate.items.find((item) => item.slot === "bottom");
      const repeatsBottom = Boolean(bottom && a.has(bottom.name));
      return repeatsLead || repeatsBottom || sharedCore / Math.max(core.length, 1) >= 0.66 || common / Math.max(candidate.items.length, 1) >= 0.72;
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
