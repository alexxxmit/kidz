import { describe, expect, it } from "vitest";

import { demoOutfits, editorialPosts, PLUS_FEATURES } from "./product";

describe("Stockholm demo capsule", () => {
  it("builds three current Stockholm looks instead of generic minimal outfits", () => {
    const looks = demoOutfits("stockholm");
    const names = looks.flatMap((look) => look.items.map((item) => item.name));

    expect(looks).toHaveLength(3);
    expect(names.some((name) => /полос/i.test(name))).toBe(true);
    expect(names.some((name) => /широкие джинсы/i.test(name))).toBe(true);
    expect(names.some((name) => /кардиган|v-neck/i.test(name))).toBe(true);
    expect(names.some((name) => /замшевая сумка|city-сумка|сумка на плечо/i.test(name))).toBe(true);
    expect(looks.every((look) => look.items.every((item) => item.styleIds.includes("stockholm")))).toBe(true);
  });
});

describe("product content", () => {
  it("keeps inspiration populated with clearly editorial looks", () => {
    const posts = editorialPosts("ru");
    expect(posts).toHaveLength(3);
    expect(posts.every((post) => post.editorial && post.id.startsWith("editorial-"))).toBe(true);
  });

  it("charges for power features instead of styling details", () => {
    expect(PLUS_FEATURES.ru.join(" ")).toContain("Безлимитные AI-подборки");
    expect(PLUS_FEATURES.ru.join(" ")).toContain("Планировщик поездок");
    expect(PLUS_FEATURES.ru.join(" ")).not.toMatch(/макияж|укладк|украшен/i);
  });
});
