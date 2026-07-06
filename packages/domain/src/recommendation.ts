import type {
  GarmentSlot,
  OutfitOption,
  OutfitRequest,
  WardrobeItemInput,
} from "@kidz/contracts";

type CandidateItem = Omit<WardrobeItemInput, "profileId"> & { id?: string };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

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
    const matches = items.filter((item) => item.styleIds.includes(style.styleId)).length;
    return sum + (matches / Math.max(items.length, 1)) * style.weight;
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

const combinations = (wardrobe: CandidateItem[]): CandidateItem[][] => {
  const available = wardrobe.filter(
    (item) => item.careState !== "LAUNDRY" && item.fitState !== "OUTGROWN",
  );
  const tops = available.filter((item) => item.slot === "top");
  const bottoms = available.filter((item) => item.slot === "bottom");
  const onePieces = available.filter((item) => item.slot === "one_piece");
  const shoes = available.filter((item) => item.slot === "footwear");
  const mids: Array<CandidateItem | undefined> = [
    undefined,
    ...available.filter((item) => item.slot === "mid_layer"),
  ];
  const outers: Array<CandidateItem | undefined> = [
    undefined,
    ...available.filter((item) => item.slot === "outerwear"),
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
          result.push([...body, shoe, mid, outer].filter(Boolean) as CandidateItem[]);
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
  const candidates = combinations(request.wardrobe).map((items, index) => {
    const style = weightedStyleScore(items, request.profile.styleMix);
    const weather = weatherScore(items, request);
    const completeness = completenessScore(items);
    const rotation = clamp(
      1 - items.reduce((sum, item) => sum + ("wearCount" in item ? Number(item.wearCount) : 0), 0) / 20,
    );
    const score =
      style * 0.36 + weather.score * 0.29 + completeness.score * 0.25 + rotation * 0.1;
    const reasonCodes = [
      style >= 0.5 ? "STYLE_MATCH" : "STYLE_EXPLORATION",
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
      },
      reasonCodes,
      missingSlots: completeness.missing,
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
