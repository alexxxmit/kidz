import { describe, expect, it } from "vitest";

import { generateOutfits } from "./recommendation.js";

describe("generateOutfits", () => {
  it("never recommends laundry or outgrown items", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Alex",
        locale: "ru",
        ageYears: 14,
        autonomyMode: "USER_DECIDES",
        styleMix: [{ styleId: "emo", weight: 1 }],
      },
      weather: { temperatureC: 8, rainProbability: 0.2, windKph: 10, occasion: "school" },
      wardrobe: [
        { name: "Чёрная футболка", category: "tshirt", slot: "top", colors: ["black"], warmth: 1, styleIds: ["emo"], careState: "CLEAN", fitState: "FITS" },
        { name: "Серые джинсы", category: "jeans", slot: "bottom", colors: ["gray"], warmth: 2, styleIds: ["emo"], careState: "CLEAN", fitState: "FITS" },
        { name: "Кеды", category: "sneakers", slot: "footwear", colors: ["black"], warmth: 1, styleIds: ["emo"], careState: "CLEAN", fitState: "FITS" },
        { name: "Грязное худи", category: "hoodie", slot: "mid_layer", colors: ["black"], warmth: 3, styleIds: ["emo"], careState: "LAUNDRY", fitState: "FITS" },
        { name: "Малая куртка", category: "jacket", slot: "outerwear", colors: ["black"], warmth: 4, styleIds: ["emo"], careState: "CLEAN", fitState: "OUTGROWN" },
      ],
    });

    expect(options.length).toBeGreaterThan(0);
    expect(options.flatMap((option) => option.items.map((item) => item.name))).not.toContain("Грязное худи");
    expect(options.flatMap((option) => option.items.map((item) => item.name))).not.toContain("Малая куртка");
  });
});
