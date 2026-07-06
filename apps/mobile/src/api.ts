import type { OutfitOption, ProfileInput, WardrobeItemInput, WeatherContext } from "@kidz/contracts";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
};

export const persistAndGenerate = async (
  profile: ProfileInput,
  wardrobe: Array<Omit<WardrobeItemInput, "profileId">>,
  weather: WeatherContext,
): Promise<{ options: OutfitOption[]; mode: "online" }> => {
  const savedProfile = await request<{ id: string }>("/v1/profiles", {
    method: "POST",
    body: JSON.stringify(profile),
  });
  await Promise.all(
    wardrobe.map((item) =>
      request("/v1/wardrobe/items", {
        method: "POST",
        body: JSON.stringify({ ...item, profileId: savedProfile.id }),
      }),
    ),
  );
  const recommendation = await request<{ options: OutfitOption[] }>("/v1/outfits/generate", {
    method: "POST",
    body: JSON.stringify({ profileId: savedProfile.id, weather }),
  });
  return { options: recommendation.options, mode: "online" };
};
