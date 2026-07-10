import { describe, expect, it } from "vitest";

import { AccountInputSchema, AccountPatchInputSchema, DEFAULT_AVATAR_PROFILE } from "./index.js";

describe("avatar profile contracts", () => {
  it("adds a stable avatar to accounts created by older clients", () => {
    const account = AccountInputSchema.parse({
      nickname: "Mira",
      handle: "mira.style",
      ageYears: 15,
      locale: "ru",
      styleMix: [{ styleId: "stockholm", weight: 1 }],
    });

    expect(account.avatarProfile).toEqual(DEFAULT_AVATAR_PROFILE);
  });

  it("validates avatar updates as one complete profile", () => {
    const update = AccountPatchInputSchema.parse({
      avatarProfile: { skinTone: "DEEP", hairColor: "BLACK", hairStyle: "BOB", pose: "MIRROR" },
    });

    expect(update.avatarProfile?.hairStyle).toBe("BOB");
    expect(AccountPatchInputSchema.safeParse({ avatarProfile: { skinTone: "BLUE" } }).success).toBe(false);
  });
});
