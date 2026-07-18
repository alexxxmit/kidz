import { describe, expect, it } from "vitest";

import { generateOutfits } from "./recommendation.js";
import { buildStylingGuidance } from "./styling.js";

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
        schoolDressCode: "FREE_STYLE",
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
        schoolDressCode: "FREE_STYLE",
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

  it("changes hairstyle guidance with gender presentation while respecting hair length", () => {
    const profile = {
      displayName: "Alex",
      locale: "ru" as const,
      ageYears: 15,
      autonomyMode: "USER_DECIDES" as const,
      hairProfile: { length: "SHORT" as const, color: "BLACK" as const, openToColorAdvice: true },
      schoolDressCode: "FREE_STYLE" as const,
      styleMix: [{ styleId: "emo", weight: 1 }],
    };
    const items = [
      { name: "Чёрная футболка", category: "tshirt" as const, slot: "top" as const, colors: ["#111"], warmth: 1, styleIds: ["emo"], careState: "CLEAN" as const, fitState: "FITS" as const },
    ];
    const feminine = buildStylingGuidance({ ...profile, genderPresentation: "FEMININE" }, items);
    const masculine = buildStylingGuidance({ ...profile, genderPresentation: "MASCULINE" }, items);

    expect(feminine.hair.detail).toContain("женственной");
    expect(masculine.hair.detail).toContain("мужской");
    expect(feminine.hair.detail).not.toBe(masculine.hair.detail);
  });

  it("respects masculine presentation and a white-top school dress code", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Misha",
        locale: "ru",
        ageYears: 14,
        autonomyMode: "USER_DECIDES",
        genderPresentation: "MASCULINE",
        hairProfile: { length: "SHORT", color: "BROWN", openToColorAdvice: true },
        schoolDressCode: "WHITE_TOP",
        styleMix: [{ styleId: "stockholm", weight: 1 }],
      },
      weather: { temperatureC: 18, rainProbability: 0, windKph: 5, occasion: "school" },
      wardrobe: [
        { name: "Белая оксфордская рубашка", category: "shirt", slot: "top", colors: ["#F4F1EA"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Чёрная футболка", category: "tshirt", slot: "top", colors: ["#111217"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Чёрное платье", category: "dress", slot: "one_piece", colors: ["#111217"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Серые прямые брюки", category: "trousers", slot: "bottom", colors: ["#626873"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Белые кроссовки", category: "sneakers", slot: "footwear", colors: ["#F1F0EB"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
      ],
    });

    expect(options[0]?.items.some((item) => item.name === "Белая оксфордская рубашка")).toBe(true);
    expect(options[0]?.items.some((item) => item.category === "dress")).toBe(false);
    expect(options[0]?.scores.presentation).toBeGreaterThan(0.8);
    expect(options[0]?.scores.dressCode).toBeGreaterThan(0.8);
  });

  it("keeps Stockholm and emo looks inside their own visual codes", () => {
    const wardrobe = [
      { name: "Молочная рубашка", category: "shirt" as const, slot: "top" as const, colors: ["#EEEAE2"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Тёмная футболка с графикой", category: "tshirt" as const, slot: "top" as const, colors: ["#111217"], warmth: 1, styleIds: ["emo"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Широкие тёмно-синие джинсы", category: "jeans" as const, slot: "bottom" as const, colors: ["#24354C"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Чёрные потёртые джинсы", category: "jeans" as const, slot: "bottom" as const, colors: ["#15161A"], warmth: 2, styleIds: ["emo"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Белые чистые кроссовки", category: "sneakers" as const, slot: "footwear" as const, colors: ["#F3F1EA"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Чёрные высокие кеды", category: "sneakers" as const, slot: "footwear" as const, colors: ["#121318"], warmth: 1, styleIds: ["emo"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Песочный тренч", category: "coat" as const, slot: "outerwear" as const, colors: ["#C8B99E"], warmth: 3, styleIds: ["stockholm"], careState: "CLEAN" as const, fitState: "FITS" as const },
      { name: "Графитовое худи", category: "hoodie" as const, slot: "mid_layer" as const, colors: ["#33343A"], warmth: 3, styleIds: ["emo"], careState: "CLEAN" as const, fitState: "FITS" as const },
    ];
    const base = {
      displayName: "Mira", locale: "ru" as const, ageYears: 15, autonomyMode: "USER_DECIDES" as const,
      genderPresentation: "FEMININE" as const, hairProfile: { length: "LONG" as const, color: "BLACK" as const, openToColorAdvice: true }, schoolDressCode: "FREE_STYLE" as const,
    };
    const weather = { temperatureC: 14, rainProbability: 0, windKph: 5, occasion: "everyday" as const };
    const stockholm = generateOutfits({ profile: { ...base, styleMix: [{ styleId: "stockholm", weight: 1 }] }, weather, wardrobe });
    const emo = generateOutfits({ profile: { ...base, styleMix: [{ styleId: "emo", weight: 1 }] }, weather, wardrobe });

    expect(stockholm[0]?.items.every((item) => item.styleIds.includes("stockholm"))).toBe(true);
    expect(emo[0]?.items.every((item) => item.styleIds.includes("emo"))).toBe(true);
    expect(stockholm[0]?.items.map((item) => item.name)).not.toEqual(emo[0]?.items.map((item) => item.name));
  });

  it("never treats a cardigan or coat as the only top", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Mira", locale: "ru", ageYears: 15, autonomyMode: "USER_DECIDES", genderPresentation: "FEMININE",
        hairProfile: { length: "LONG", color: "BROWN", openToColorAdvice: true }, schoolDressCode: "FREE_STYLE", styleMix: [{ styleId: "stockholm", weight: 1 }],
      },
      weather: { temperatureC: 5, feelsLikeC: 2, rainProbability: 0, windKph: 8, occasion: "everyday" },
      wardrobe: [
        { name: "Кардиган", category: "sweater", slot: "mid_layer", colors: ["#ddd"], warmth: 3, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Пальто", category: "coat", slot: "outerwear", colors: ["#777"], warmth: 4, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Брюки", category: "trousers", slot: "bottom", colors: ["#555"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
      ],
    });

    expect(options).toEqual([]);
  });

  it("adds cold-weather outerwear over a real base when it is available", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Mira", locale: "ru", ageYears: 15, autonomyMode: "USER_DECIDES", genderPresentation: "FEMININE",
        hairProfile: { length: "LONG", color: "BROWN", openToColorAdvice: true }, schoolDressCode: "FREE_STYLE", styleMix: [{ styleId: "stockholm", weight: 1 }],
      },
      weather: { temperatureC: 7, feelsLikeC: 4, rainProbability: 0.6, windKph: 30, occasion: "everyday" },
      wardrobe: [
        { name: "Лонгслив", category: "tshirt", slot: "top", colors: ["#eee"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Джинсы", category: "jeans", slot: "bottom", colors: ["#445"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Ботинки", category: "boots", slot: "footwear", colors: ["#332"], warmth: 2, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Пальто", category: "coat", slot: "outerwear", colors: ["#777"], warmth: 4, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
      ],
    });

    expect(options[0]?.items.some((item) => item.slot === "top")).toBe(true);
    expect(options[0]?.items.some((item) => item.slot === "outerwear")).toBe(true);
    expect(options[0]?.reasonCodes).toContain("LAYER_OVER_BASE");
  });

  it("does not add an unnecessary warm layer in hot weather", () => {
    const options = generateOutfits({
      profile: {
        displayName: "Mira", locale: "ru", ageYears: 15, autonomyMode: "USER_DECIDES", genderPresentation: "FEMININE",
        hairProfile: { length: "LONG", color: "BROWN", openToColorAdvice: true }, schoolDressCode: "FREE_STYLE", styleMix: [{ styleId: "stockholm", weight: 1 }],
      },
      weather: { temperatureC: 34, feelsLikeC: 38, rainProbability: 0, windKph: 8, occasion: "everyday" },
      wardrobe: [
        { name: "Лёгкий топ", category: "tshirt", slot: "top", colors: ["#eee"], warmth: 0, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Юбка", category: "skirt", slot: "bottom", colors: ["#eee"], warmth: 0, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Балетки", category: "shoes", slot: "footwear", colors: ["#332"], warmth: 0, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Тёплый кардиган", category: "sweater", slot: "mid_layer", colors: ["#ddd"], warmth: 4, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
        { name: "Пальто", category: "coat", slot: "outerwear", colors: ["#777"], warmth: 5, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" },
      ],
    });

    expect(options[0]?.items.some((item) => item.slot === "mid_layer" || item.slot === "outerwear")).toBe(false);
    expect(options[0]?.reasonCodes).toContain("NO_EXTRA_LAYER");
  });
});
