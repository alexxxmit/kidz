import type { OutfitOption } from "@kidz/contracts";
import { describe, expect, it } from "vitest";

import { lookSignature, rankOutfitsWithLearning, type LookFeedback } from "./learning";

const look = (id: string, name: string, score: number): OutfitOption => ({
  id,
  items: [{ name, category: "tshirt", slot: "top", colors: ["#111111"], warmth: 1, styleIds: ["stockholm"], careState: "CLEAN", fitState: "FITS" }],
  score,
  scores: { style: score, presentation: 1, dressCode: 1, weather: 1, completeness: 1, rotation: 1, styling: 1 },
  reasonCodes: [],
  missingSlots: [],
  hair: { title: "Hair", detail: "Natural", recommendedColor: "BROWN", colorFit: "already_fits", reasonCodes: [] },
  makeup: { title: "Makeup", detail: "Natural", intensity: "none", agePolicy: "not_suggested", reasonCodes: [] },
  stylingSuggestions: [],
});

describe("outfit learning", () => {
  it("moves a rejected exact look behind an alternative", () => {
    const first = look("first", "Белая рубашка", 0.95);
    const second = look("second", "Полосатый лонгслив", 0.9);
    const feedback: LookFeedback[] = [{ signature: lookSignature(first), itemNames: ["Белая рубашка"], worn: false, occasion: "everyday", createdAt: "2026-07-16T10:00:00.000Z" }];
    expect(rankOutfitsWithLearning([first, second], feedback)[0]?.id).toBe("second");
  });

  it("uses worn and favorite items as a soft preference", () => {
    const first = look("first", "Белая рубашка", 0.9);
    const second = look("second", "Любимый кардиган", 0.88);
    const feedback: LookFeedback[] = [{ signature: "old", itemNames: ["Любимый кардиган"], worn: true, occasion: "school", createdAt: "2026-07-15T10:00:00.000Z" }];
    expect(rankOutfitsWithLearning([first, second], feedback, ["Любимый кардиган"])[0]?.id).toBe("second");
  });
});
