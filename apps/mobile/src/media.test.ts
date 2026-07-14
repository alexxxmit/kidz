import { describe, expect, it } from "vitest";

import { discardExpiredWebPhotos, pickerImageDataUrl } from "./media";

describe("web wardrobe media", () => {
  it("turns a picked image into a durable data URL", () => {
    expect(pickerImageDataUrl({ base64: "abc123", mimeType: "image/png" })).toBe("data:image/png;base64,abc123");
    expect(pickerImageDataUrl({ base64: "abc123", mimeType: "text/html" })).toBe("data:image/jpeg;base64,abc123");
  });

  it("discards a photographed item whose only saved reference is an expired blob URL", () => {
    const result = discardExpiredWebPhotos([
      { localId: "photo-expired", imageUri: "blob:https://mira.example/old" },
      { localId: "photo-cutout", imageUri: "blob:https://mira.example/old", cutoutUri: "data:image/webp;base64,cutout" },
      { localId: "wardrobe-demo" },
    ]);
    expect(result.discarded).toBe(1);
    expect(result.items.map((item) => item.localId)).toEqual(["photo-cutout", "wardrobe-demo"]);
  });
});
