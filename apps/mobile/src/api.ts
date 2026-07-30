import type {
  AccountPatchInput,
  AiStylistInput,
  AiStylistResponse,
  DirectMessage,
  GarmentPolishInput,
  GarmentPolishJob,
  GuestSession,
  GuestSessionInput,
  LookPost,
  LookPostInput,
  OutfitOption,
  ProfileInput,
  TryOnJob,
  TryOnSubmitInput,
  WardrobeItemInput,
  WardrobeVisionInput,
  WardrobeVisionResult,
  WeatherContext,
} from "@kidz/contracts";
import { Platform } from "react-native";

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

export type FollowRequest = Pick<SocialSearchAccount, "id" | "nickname" | "handle" | "avatarUri" | "styleMix">;

export const loadFollowRequests = (accessToken: string) =>
  request<{ requests: FollowRequest[] }>("/v1/social/follows/requests", undefined, accessToken);

export const acceptFollowRequest = (accessToken: string, followerAccountId: string) =>
  request<{ status: "ACCEPTED" }>(`/v1/social/follows/${followerAccountId}/decision`, { method: "POST", body: JSON.stringify({ action: "ACCEPT" }) }, accessToken);

export const createSocialConversation = (accessToken: string, targetAccountId: string) =>
  request<{ id: string }>("/v1/social/conversations", { method: "POST", body: JSON.stringify({ targetAccountId }) }, accessToken);

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

export type WardrobeVideoAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: Blob | null;
};

export type WardrobeVideoFrame = {
  imageDataUrl: string;
  timestampMs: number;
};

export const extractWardrobeVideoFrames = async (asset: WardrobeVideoAsset): Promise<WardrobeVideoFrame[]> => {
  const body = new FormData();
  const name = asset.fileName || "mira-closet-video.mp4";
  const type = asset.mimeType || "video/mp4";
  if (Platform.OS === "web") {
    const blob = asset.file ?? await (await fetch(asset.uri)).blob();
    body.append("file", blob, name);
  } else {
    body.append("file", { uri: asset.uri, name, type } as never);
  }
  const response = await fetch(`${VISION_URL}/v1/video-frames`, { method: "POST", body });
  if (!response.ok) throw new Error(`Vision video ${response.status}: ${await response.text()}`);
  const result = await response.json() as { frames: Array<{ image_base64: string; mime_type: "image/jpeg"; timestamp_ms: number }> };
  return result.frames.map((frame) => ({
    imageDataUrl: `data:${frame.mime_type};base64,${frame.image_base64}`,
    timestampMs: frame.timestamp_ms,
  }));
};

export const dedupeWardrobeImages = async (images: string[]) => {
  const response = await fetch(`${VISION_URL}/v1/dedupe-images`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ images }),
  });
  if (!response.ok) throw new Error(`Vision dedupe ${response.status}`);
  return response.json() as Promise<{
    unique_indices: number[];
    duplicate_groups: Array<{ kept_index: number; duplicate_indices: number[] }>;
  }>;
};

export const analyzeWardrobePhoto = (accessToken: string, input: WardrobeVisionInput) =>
  request<WardrobeVisionResult>("/v1/ai/wardrobe-vision", { method: "POST", body: JSON.stringify(input) }, accessToken);

export const createGarmentPolish = (accessToken: string, input: GarmentPolishInput) =>
  request<GarmentPolishJob>("/v1/ai/garment-polish", { method: "POST", body: JSON.stringify(input) }, accessToken);

export const loadGarmentPolish = (accessToken: string, jobId: string) =>
  request<GarmentPolishJob>(`/v1/ai/garment-polish/${jobId}`, undefined, accessToken);

export const createVirtualTryOn = (accessToken: string, input: TryOnSubmitInput) =>
  request<TryOnJob>("/v1/ai/try-on", { method: "POST", body: JSON.stringify(input) }, accessToken);

export const loadVirtualTryOn = (accessToken: string, jobId: string) =>
  request<TryOnJob>(`/v1/ai/try-on/${jobId}`, undefined, accessToken);

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
