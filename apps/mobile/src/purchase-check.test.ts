import { describe, expect, it } from "vitest";

import { evaluatePurchase } from "./purchase-check";

describe("purchase check", () => {
  it("warns when the closet already has several similar pieces", () => {
    const candidate = { name: "Серый кардиган", category: "sweater" as const, slot: "mid_layer" as const, colors: ["#A0A0A0"], warmth: 2, styleIds: ["stockholm"], confidence: 1, provider: "local" as const };
    const similar = ["#999999", "#AAAAAA", "#A9A9A9"].map((color, index) => ({ name: `Кардиган ${index}`, category: "sweater" as const, slot: "mid_layer" as const, colors: [color], styleIds: ["stockholm"] }));
    expect(evaluatePurchase(candidate, similar, ["stockholm"]).verdict).toBe("SKIP");
  });
});
