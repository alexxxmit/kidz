import { describe, expect, it } from "vitest";

import { HAIR_LENGTH_OPTIONS } from "./appearance";

describe("hair length choices", () => {
  it("uses the physical lengths shown to the user", () => {
    expect(Object.fromEntries(HAIR_LENGTH_OPTIONS.map((option) => [option.id, option.description.ru]))).toEqual({
      BUZZ: "до подбородка",
      SHORT: "до плеч",
      MEDIUM: "до груди",
      LONG: "до талии",
      VERY_LONG: "примерно до колен",
    });
  });
});
