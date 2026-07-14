type PickerImage = {
  base64?: string | null;
  mimeType?: string | null;
};

type WardrobeImage = {
  localId: string;
  imageUri?: string | undefined;
  cutoutUri?: string | undefined;
};

const safeImageMimeType = (value?: string | null) =>
  value && /^image\/(?:avif|heic|heif|jpeg|jpg|png|webp)$/i.test(value) ? value.toLowerCase() : "image/jpeg";

export const pickerImageDataUrl = (asset: PickerImage): string | undefined =>
  asset.base64 ? `data:${safeImageMimeType(asset.mimeType)};base64,${asset.base64}` : undefined;

export const isEphemeralWebImage = (uri?: string): boolean => Boolean(uri?.startsWith("blob:"));

export const discardExpiredWebPhotos = <T extends WardrobeImage>(items: T[]): { items: T[]; discarded: number } => {
  const retained = items.filter((item) => {
    if (!item.localId.startsWith("photo-")) return true;
    const references = [item.cutoutUri, item.imageUri].filter((value): value is string => Boolean(value));
    return references.some((uri) => !isEphemeralWebImage(uri));
  });
  return { items: retained, discarded: items.length - retained.length };
};
