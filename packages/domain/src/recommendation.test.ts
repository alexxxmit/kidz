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
        genderPresentation: "NOT_SPECIFIED",
        hairProfile: { length: "MEDIUM", color: "BLACK", openToColorAdvice: true },
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

  it("returns hairstyle and accessory guidance for the selected style", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Alex",
        locale: "ru",
        ageYears: 15,
        autonomyMode: "USER_DECIDES",
        genderPresentation: "NEUTRAL",
        hairProfile: { length: "LONG", color: "BLACK", openToColorAdvice: true },
        styleMix: [{ styleId: "stockholm", weight: 1 }],
      },
      weather: { temperatureC: 18, rainProbability: 0.1, windKph: 5, occasion: "everyday" },
      wardrobe: [
        { name: "Молочная рубашка", category: "shirt", slot: "top", colors: ["#EEEAE2"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Светлые брюки", category: "trousers", slot: "bottom", colors: ["#CBC7BE"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Белые кроссовки", category: "sneakers", slot: "footwear", colors: ["#F1F0EB"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Тонкая цепочка", category: "necklace", slot: "jewelry", colors: ["#C9CDD3"], warmth: 0, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Tote", category: "tote", slot: "bag", colors: ["#EEEAE2"], warmth: 0, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
      ],
    });

    expect(options[0]?.hair.title).toContain("Стокгольмский");
    expect(options[0]?.hair.colorFit).toBe("optional_shift");
    expect(options[0]?.makeup.title).toContain("Стокгольмский");
    expect(options[0]?.makeup.reasonCodes).toContain("MAKEUP_DIRECTION");
    expect(options[0]?.stylingSuggestions.map((suggestion) => suggestion.slot)).toEqual([
      "jewelry",
      "bag",
      "headwear",
    ]);
  });
});
