import type {
  AccountPatchInput,
  AiStylistInput,
  AiStylistResponse,
  DirectMessage,
  GuestSession,
  GuestSessionInput,
  LookPost,
  LookPostInput,
  OutfitOption,
  ProfileInput,
  WardrobeItemInput,
  WeatherContext,
} from "@kidz/contracts";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const VISION_URL = process.env.EXPO_PUBLIC_VISION_URL ?? "http://localhost:8000";

const request = async <T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
};

export const createGuestSession = (input: GuestSessionInput) =>
  request<GuestSession>("/v1/auth/guest", { method: "POST", body: JSON.stringify(input) });

export const deleteAccount = (accessToken: string) =>
  request<{ deleted: true }>("/v1/auth/me", { method: "DELETE" }, accessToken);

export const updateSocialAccount = (accessToken: string, input: AccountPatchInput) =>
  request("/v1/social/me", { method: "PATCH", body: JSON.stringify(input) }, accessToken);

export const askAiStylist = (accessToken: string, input: AiStylistInput) =>
  request<AiStylistResponse>("/v1/ai/stylist", { method: "POST", body: JSON.stringify(input) }, accessToken);

export const publishLook = (accessToken: string, input: LookPostInput) =>
  request<{ id: string; visibility: string; moderationState: string }>("/v1/social/look-posts", { method: "POST", body: JSON.stringify(input) }, accessToken);

export const loadSocialFeed = (accessToken: string) =>
  request<{ posts: LookPost[] }>("/v1/social/feed", undefined, accessToken);

export const reactToLook = (accessToken: string, postId: string) =>
  request<{ active: boolean }>(`/v1/social/look-posts/${postId}/react`, { method: "POST", body: JSON.stringify({ kind: "INSPIRED" }) }, accessToken);

export type SocialSearchAccount = {
  id: string;
  nickname: string;
  handle: string;
  avatarUri?: string | null;
  styleMix: Array<{ styleId: string; weight: number }>;
  privacyState: string;
};

export const searchSocialAccounts = (accessToken: string, query: string) =>
  request<{ accounts: SocialSearchAccount[] }>(`/v1/social/search?q=${encodeURIComponent(query)}`, undefined, accessToken);

export const followSocialAccount = (accessToken: string, targetAccountId: string) =>
  request<{ status: "ACCEPTED" | "REQUESTED" }>("/v1/social/follows", { method: "POST", body: JSON.stringify({ targetAccountId }) }, accessToken);

export type ConversationSummary = {
  id: string;
  safetyState: string;
  lastMessageAt: string;
  peer: { id: string; nickname: string; handle: string; avatarUri?: string | null } | null;
  lastMessage: { body: string; createdAt: string } | null;
};

export const loadConversations = (accessToken: string) =>
  request<{ conversations: ConversationSummary[] }>("/v1/social/conversations", undefined, accessToken);

export const loadMessages = (accessToken: string, conversationId: string) =>
  request<{ messages: DirectMessage[] }>(`/v1/social/conversations/${conversationId}/messages`, undefined, accessToken);

export const sendDirectMessage = (accessToken: string, conversationId: string, body: string) =>
  request<{ id: string; moderationState: string }>(`/v1/social/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }, accessToken);

export const cutoutWardrobePhoto = async (imageBase64: string) => {
  const response = await fetch(`${VISION_URL}/v1/cutout-image`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!response.ok) throw new Error(`Vision ${response.status}`);
  const result = await response.json() as { image_base64: string; mime_type: "image/png" };
  return `data:${result.mime_type};base64,${result.image_base64}`;
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
