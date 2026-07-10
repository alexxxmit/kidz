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
  });

  it("validates gender and hair updates", () => {
    const update = AccountPatchInputSchema.parse({
      genderPresentation: "FEMININE",
      hairProfile: { length: "LONG", color: "BLACK", openToColorAdvice: true },
    });

    expect(update.hairProfile?.length).toBe("LONG");
    expect(AccountPatchInputSchema.safeParse({ genderPresentation: "UNKNOWN" }).success).toBe(false);
  });
});
