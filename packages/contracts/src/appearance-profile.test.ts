import { describe, expect, it } from "vitest";

import { AccountInputSchema, AccountPatchInputSchema, DEFAULT_HAIR_PROFILE } from "./index.js";

describe("appearance profile contracts", () => {
  it("adds safe appearance defaults for accounts created by older clients", () => {
    const account = AccountInputSchema.parse({
      nickname: "Mira",
      handle: "mira.style",
      ageYears: 15,
      locale: "ru",
      styleMix: [{ styleId: "stockholm", weight: 1 }],
    });

    expect(account.genderPresentation).toBe("NOT_SPECIFIED");
    expect(account.hairProfile).toEqual(DEFAULT_HAIR_PROFILE);
    expect(account.schoolDressCode).toBe("FREE_STYLE");
  });

  it("validates gender, hair, and school-setting updates", () => {
    const update = AccountPatchInputSchema.parse({
      genderPresentation: "FEMININE",
      hairProfile: { length: "LONG", color: "BLACK", openToColorAdvice: true, stylePreference: "BLOWOUT" },
      schoolDressCode: "UNIFORM",
      schoolUniformDescription: "Тёмно-синий жакет, белая рубашка и серая юбка",
    });

    expect(update.hairProfile?.length).toBe("LONG");
    expect(update.hairProfile?.stylePreference).toBe("BLOWOUT");
    expect(update.schoolUniformDescription).toContain("жакет");
    expect(AccountPatchInputSchema.safeParse({ schoolDressCode: "BUSINESS_STYLE" }).success).toBe(true);
    expect(AccountPatchInputSchema.safeParse({ genderPresentation: "UNKNOWN" }).success).toBe(false);
    expect(AccountPatchInputSchema.safeParse({ schoolUniformDescription: "x".repeat(281) }).success).toBe(false);
  });
});
