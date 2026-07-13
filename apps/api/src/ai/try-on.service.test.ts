import type { TryOnSubmitInput } from "@kidz/contracts";
import { describe, expect, it } from "vitest";

import { buildTryOnPrompt, validFalQueueUrl } from "./try-on.service.js";

const input: TryOnSubmitInput = {
  ageYears: 15,
  locale: "ru",
  personImageDataUrl: "data:image/jpeg;base64,person",
  styleIds: ["stockholm"],
  genderPresentation: "FEMININE",
  garments: [{ name: "Серый кардиган", slot: "top", imageDataUrl: "data:image/png;base64,garment" }],
  hair: { title: "Мягкий пучок", detail: "Свободные пряди у лица", recommendedColor: "BLONDE", colorFit: "optional_shift" },
  makeup: { title: "Свежий макияж", detail: "Румяна и бальзам", intensity: "light", agePolicy: "optional" },
  allowHairColorChange: false,
  photoConsent: true,
};

describe("buildTryOnPrompt", () => {
  it("maps each image and preserves identity and hair color", () => {
    const prompt = buildTryOnPrompt(input);
    expect(prompt).toContain("Image 1 is the person photo");
    expect(prompt).toContain("Image 2: Серый кардиган (top)");
    expect(prompt).toContain("Preserve the person's exact current hair color");
    expect(prompt).toContain("Preserve identity exactly");
    expect(prompt).toContain("non-sexualized");
  });

  it("does not add makeup to a young child", () => {
    const prompt = buildTryOnPrompt({ ...input, ageYears: 8 });
    expect(prompt).toContain("Do not add cosmetic makeup");
  });
});

describe("validFalQueueUrl", () => {
  it("accepts only HTTPS queue URLs returned by fal", () => {
    expect(validFalQueueUrl("https://queue.fal.run/fal-ai/nano-banana/requests/request-id/status"))
      .toBe("https://queue.fal.run/fal-ai/nano-banana/requests/request-id/status");
    expect(validFalQueueUrl("https://example.com/fal-ai/nano-banana/requests/request-id/status")).toBeUndefined();
    expect(validFalQueueUrl("http://queue.fal.run/fal-ai/nano-banana/requests/request-id/status")).toBeUndefined();
  });
});
