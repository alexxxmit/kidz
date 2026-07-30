import type { GarmentPolishInput } from "@kidz/contracts";
import { describe, expect, it } from "vitest";

import { buildGarmentPolishPrompt } from "./garment-polish.service.js";

const input: GarmentPolishInput = {
  imageDataUrl: "data:image/png;base64,garment",
  name: "Серый топ с принтом",
  category: "tshirt",
  colors: ["#A8A8A8", "#111111"],
};

describe("buildGarmentPolishPrompt", () => {
  it("requests cleanup while preserving the exact physical garment", () => {
    const prompt = buildGarmentPolishPrompt(input);
    expect(prompt).toContain("freshly cleaned, perfectly ironed");
    expect(prompt).toContain("Preserve the exact real item");
    expect(prompt).toContain("print, pattern, logo");
    expect(prompt).toContain("Do not redesign, restyle, recolor");
    expect(prompt).toContain("No person, body, hands");
  });
});
