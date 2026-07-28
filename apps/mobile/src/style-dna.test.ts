import { describe, expect, it } from "vitest";

import { calculateStyleDna, styleDnaMovement, weeklyStyleStory } from "./style-dna";

describe("living Style DNA", () => {
  it("learns from worn and favorite pieces and always totals 100", () => {
    const wardrobe = [
      { name: "Кардиган", styleIds: ["stockholm"], favorite: true },
      { name: "Тёмная футболка", styleIds: ["emo"] },
    ];
    const dna = calculateStyleDna(["stockholm", "emo"], wardrobe, [
      { itemNames: ["Кардиган"], worn: true, createdAt: new Date().toISOString() },
    ]);
    expect(dna.reduce((sum, entry) => sum + entry.percent, 0)).toBe(100);
    expect(dna[0]?.styleId).toBe("stockholm");
  });

  it("compares the current month to the previous snapshot", () => {
    expect(styleDnaMovement([{ styleId: "stockholm", percent: 70 }], { month: "2026-06", scores: { stockholm: 55 } })[0]?.change).toBe(15);
  });

  it("builds a real weekly story from worn feedback", () => {
    const story = weeklyStyleStory(
      [{ itemNames: ["Кардиган", "Джинсы"], worn: true, createdAt: new Date().toISOString() }],
      [{ name: "Кардиган", styleIds: ["stockholm"], wearCount: 1 }, { name: "Джинсы", styleIds: ["stockholm"], wearCount: 4 }],
    );
    expect(story).toEqual({ wornLooks: 1, uniquePieces: 2, rediscovered: 1 });
  });
});
