import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_HAIR_PROFILE, type DirectMessage, type GenderPresentation, type HairProfile, type Locale, type LookPost, type OutfitOption } from "@kidz/contracts";
import { generateOutfits, getStyles } from "@kidz/domain";
import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import {
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Compass,
  Crown,
  Heart,
  Home,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Shirt,
  Shuffle,
  Sparkles,
  Star,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  askAiStylist,
  acceptFollowRequest,
  createGuestSession,
  createSocialConversation,
  cutoutWardrobePhoto,
  deleteAccount,
  followSocialAccount,
  loadConversations,
  loadFollowRequests,
  loadMessages,
  loadSocialFeed,
  publishLook,
  reactToLook,
  searchSocialAccounts,
  sendDirectMessage,
  updateSocialAccount,
  type ConversationSummary,
  type FollowRequest,
  type SocialSearchAccount,
} from "../src/api";
import { GENDER_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_LENGTH_OPTIONS } from "../src/appearance";
import { STARTER_WARDROBE } from "../src/demo";
import { CHALLENGES, demoOutfits, PLUS_FEATURES, TREND_STYLES, type FeedPost, wardrobePreview } from "../src/product";
import { colors, typography } from "../src/theme";

type Tab = "today" | "circle" | "create" | "closet" | "me";
type Overlay = "none" | "onboarding" | "chat" | "paywall";
type ProfileState = {
  locale: Locale;
  age: number;
  nickname: string;
  handle: string;
  styles: string[];
  genderPresentation: GenderPresentation;
  hairProfile: HairProfile;
};

const PROFILE_KEY = "mira.profile.v2";
const TOKEN_KEY = "mira.session.v1";
const WARDROBE_KEY = "mira.wardrobe.v1";
const defaultProfile: ProfileState = { locale: "ru", age: 15, nickname: "mira", handle: "mira.style", styles: ["stockholm", "emo"], genderPresentation: "FEMININE", hairProfile: DEFAULT_HAIR_PROFILE };

const tx = (locale: Locale, ru: string, en: string) => (locale === "ru" ? ru : en);
const ageMode = (age: number) => age <= 5 ? "family" : age <= 9 ? "together" : age <= 12 ? "private" : "social";
const displayHandle = (handle: string) => `@${handle.replace(/^@/, "")}`;
const avatarColors = [colors.coral, colors.cyan, colors.warm, colors.ultraviolet];
const livePost = (post: LookPost, myHandle: string): FeedPost => ({
  id: post.id,
  nickname: post.author.nickname,
  handle: displayHandle(post.author.handle),
  avatarColor: avatarColors[post.author.handle.length % avatarColors.length]!,
  time: new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  caption: { ru: post.caption, en: post.caption },
  style: post.styleTags.join(" + ") || "remix",
  outfit: post.outfit,
  reactions: post.reactionCount,
  comments: post.commentCount,
  remixes: post.remixCount,
  reacted: post.viewerReacted,
  mine: post.author.handle === myHandle.replace(/^@/, ""),
});
const storage = {
  getToken: () => Platform.OS === "web" ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (value: string) => Platform.OS === "web" ? AsyncStorage.setItem(TOKEN_KEY, value) : SecureStore.setItemAsync(TOKEN_KEY, value),
  deleteToken: () => Platform.OS === "web" ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
};
const wardrobeDirectory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}mira-wardrobe/` : undefined;
const persistWardrobeImage = async (source: string, localId: string, kind: "source" | "cutout") => {
  if (Platform.OS === "web" || !wardrobeDirectory) return source;
  await FileSystem.makeDirectoryAsync(wardrobeDirectory, { intermediates: true }).catch(() => undefined);
  const destination = `${wardrobeDirectory}${localId}-${kind}.png`;
  if (source.startsWith("data:")) {
    await FileSystem.writeAsStringAsync(destination, source.split(",", 2)[1] ?? "", { encoding: FileSystem.EncodingType.Base64 });
  } else {
    await FileSystem.copyAsync({ from: source, to: destination });
  }
  return destination;
};

export default function MiraApp() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [tab, setTab] = useState<Tab>("today");
  const [token, setToken] = useState<string>();
  const [wardrobe, setWardrobe] = useState(wardrobePreview);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FollowRequest[]>([]);
  const [generated, setGenerated] = useState<OutfitOption[]>(() => demoOutfits("stockholm"));
  const [activeLook, setActiveLook] = useState(0);
  const [occasion, setOccasion] = useState("school");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string>();
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<string>();
  const scrollRef = useRef<ScrollView>(null);
  const locale = profile.locale;
  const mode = ageMode(profile.age);
  const socialEnabled = profile.age >= 13;
  const catalogStyles = useMemo(() => getStyles(locale), [locale]);
  const selectedNames = catalogStyles.filter((item) => profile.styles.includes(item.id)).map((item) => item.name);
  const currentLook = generated[activeLook] ?? generated[0];
  const searchAccounts = useCallback(async (query: string) => token ? (await searchSocialAccounts(token, query)).accounts : [], [token]);
  const followAccount = useCallback(async (accountId: string) => token ? (await followSocialAccount(token, accountId)).status : "REQUESTED" as const, [token]);
  const acceptConnection = useCallback(async (accountId: string) => {
    if (!token) return;
    await acceptFollowRequest(token, accountId);
    if (profile.age >= 13) await createSocialConversation(token, accountId);
    setIncomingRequests((current) => current.filter((request) => request.id !== accountId));
    notify(tx(locale, "Контакт подтверждён", "Connection approved"));
  }, [locale, profile.age, token]);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(PROFILE_KEY), storage.getToken(), AsyncStorage.getItem(WARDROBE_KEY)]).then(([saved, savedToken, savedWardrobe]) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<ProfileState>;
          setProfile({ ...defaultProfile, ...parsed, genderPresentation: parsed.genderPresentation ?? defaultProfile.genderPresentation, hairProfile: { ...DEFAULT_HAIR_PROFILE, ...parsed.hairProfile } });
          if (!parsed.genderPresentation || !parsed.hairProfile) setOverlay("onboarding");
        } catch { setOverlay("onboarding"); }
      } else {
        setOverlay("onboarding");
      }
      if (savedToken) setToken(savedToken);
      if (savedWardrobe) {
        try { setWardrobe(JSON.parse(savedWardrobe) as typeof wardrobePreview); } catch { /* Start with the safe demo closet. */ }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe));
  }, [hydrated, wardrobe]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

  useEffect(() => {
    if (!token || tab !== "circle" || profile.age < 10) return;
    let active = true;
    void Promise.all([loadSocialFeed(token), loadFollowRequests(token)]).then(([feed, requests]) => {
      if (active) {
        setPosts(feed.posts.map((post) => livePost(post, profile.handle)));
        setIncomingRequests(requests.requests);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [profile.age, profile.handle, tab, token]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), 2300);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => {
    setToast(message);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const finishOnboarding = async (next: ProfileState) => {
    setProfile(next);
    setOverlay("none");
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    if (token) {
      await updateSocialAccount(token, {
        nickname: next.nickname,
        locale: next.locale,
        styleMix: next.styles.map((styleId) => ({ styleId, weight: 1 / next.styles.length })),
        genderPresentation: next.genderPresentation,
        hairProfile: next.hairProfile,
      }).catch(() => undefined);
      generateFor(next, occasion);
      return;
    }
    const installId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-mira-install`;
    try {
      const session = await createGuestSession({
        installId,
        nickname: next.nickname,
        handle: next.handle.replace(/^@/, "").toLowerCase(),
        ageYears: next.age,
        locale: next.locale,
        styleMix: next.styles.map((styleId) => ({ styleId, weight: 1 / next.styles.length })),
        genderPresentation: next.genderPresentation,
        hairProfile: next.hairProfile,
      });
      setToken(session.accessToken);
      await storage.setToken(session.accessToken);
      if (session.account.handle !== next.handle) {
        const allocated = { ...next, handle: session.account.handle };
        setProfile(allocated);
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(allocated));
      }
    } catch {
      // Local-first mode stays fully usable when staging or a chosen handle is unavailable.
    }
    generateFor(next, occasion);
  };

  const generateFor = (target = profile, nextOccasion = occasion) => {
    const options = generateOutfits({
      profile: {
        displayName: target.nickname,
        locale: target.locale,
        ageYears: target.age,
        autonomyMode: target.age <= 5 ? "PARENT_DECIDES" : target.age <= 9 ? "TOGETHER" : "USER_DECIDES",
        genderPresentation: target.genderPresentation,
        hairProfile: target.hairProfile,
        styleMix: target.styles.map((styleId) => ({ styleId, weight: 1 / target.styles.length })),
      },
      wardrobe: wardrobe.map(({ localId: _id, ...item }) => item),
      weather: { temperatureC: 17, feelsLikeC: 16, rainProbability: 0.2, windKph: 12, occasion: nextOccasion as "school" | "walk" | "sport" | "party" | "everyday" },
    });
    setGenerated(options);
    setActiveLook(0);
  };

  useEffect(() => {
    if (!hydrated) return;
    generateFor(profile, occasion);
  }, [hydrated, occasion, profile.age, profile.genderPresentation, profile.hairProfile.color, profile.hairProfile.length, profile.hairProfile.openToColorAdvice, profile.locale, profile.styles, wardrobe]);

  const askMira = async (question = aiQuestion) => {
    const normalized = question.trim();
    if (!normalized) return;
    setAiLoading(true);
    setAiQuestion(normalized);
    try {
      if (!token) throw new Error("local");
      const result = await askAiStylist(token, {
        ageYears: profile.age,
        locale,
        question: normalized,
        styleMix: profile.styles.map((styleId) => ({ styleId, weight: 1 / profile.styles.length })),
        wardrobeSummary: wardrobe.map((item) => item.name),
        outfit: currentLook,
      });
      setAiAnswer(result.answer);
    } catch {
      setAiAnswer(tx(locale,
        `Оставь одну главную вещь в стиле ${selectedNames[0] ?? "твоего mood"}, добавь спокойную базу и один аксессуар. Я использовала только то, что уже есть в шкафу.`,
        `Keep one hero piece in your ${selectedNames[0] ?? "chosen"} direction, add a calm base and one accessory. I only used what is already in your closet.`,
      ));
    } finally {
      setAiLoading(false);
    }
  };

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.72, allowsEditing: false, base64: true });
    if (result.canceled || !result.assets[0]) return;
    const source = STARTER_WARDROBE[0]!;
    const asset = result.assets[0];
    const localId = `photo-${Date.now()}`;
    const storedSource = await persistWardrobeImage(asset.uri, localId, "source").catch(() => asset.uri);
    setWardrobe((items) => [{ ...source, name: tx(locale, "Новая вещь", "New piece"), imageUri: storedSource, imageProcessingState: "PENDING_CUTOUT", localId }, ...items]);
    notify(tx(locale, "Фото добавлено · AI вырезает фон", "Photo added · AI is removing the background"));
    if (asset.base64) {
      void cutoutWardrobePhoto(asset.base64).then((cutoutUri) => persistWardrobeImage(cutoutUri, localId, "cutout")).then((cutoutUri) => {
        setWardrobe((items) => items.map((item) => item.localId === localId ? { ...item, cutoutUri, imageProcessingState: "CUTOUT_READY" } : item));
        notify(tx(locale, "Фон вырезан · вещь готова", "Background removed · piece is ready"));
      }).catch(() => {
        setWardrobe((items) => items.map((item) => item.localId === localId ? { ...item, imageProcessingState: "CUTOUT_FAILED" } : item));
      });
    }
  };

  const toggleReaction = (postId: string) => {
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, reacted: !post.reacted, reactions: post.reactions + (post.reacted ? -1 : 1) } : post));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (token && !postId.startsWith("post-") && !postId.startsWith("mine-")) {
      void reactToLook(token, postId).catch(() => {
        setPosts((current) => current.map((post) => post.id === postId ? { ...post, reacted: !post.reacted, reactions: post.reactions + (post.reacted ? -1 : 1) } : post));
      });
    }
  };

  const publishCurrent = async () => {
    if (!currentLook) return;
    const post: FeedPost = {
      id: `mine-${Date.now()}`,
      nickname: profile.nickname,
      handle: displayHandle(profile.handle),
      avatarColor: colors.ultraviolet,
      time: tx(locale, "сейчас", "now"),
      caption: { ru: "мой сегодняшний remix ✦", en: "today's remix ✦" },
      style: selectedNames.join(" + "),
      outfit: currentLook,
      reactions: 0,
      comments: 0,
      remixes: 0,
      mine: true,
    };
    setPosts((current) => [post, ...current]);
    let synced = !token;
    if (token) {
      try {
        const published = await publishLook(token, {
          outfit: currentLook,
          caption: post.caption[locale],
          styleTags: profile.styles,
          visibility: profile.age < 10 ? "PRIVATE" : "CIRCLE",
        });
        setPosts((current) => current.map((item) => item.id === post.id ? { ...item, id: published.id } : item));
        synced = true;
      } catch {
        notify(tx(locale, "Лук сохранён на устройстве · синхронизируем позже", "Look saved on device · we’ll sync it later"));
      }
    }
    if (synced) notify(tx(locale, "Лук опубликован в твоём круге", "Look shared with your circle"));
    setTab("circle");
  };

  const removeAccount = async () => {
    if (token) await deleteAccount(token).catch(() => undefined);
    await Promise.all([AsyncStorage.removeItem(PROFILE_KEY), AsyncStorage.removeItem(WARDROBE_KEY), storage.deleteToken()]);
    if (Platform.OS !== "web" && wardrobeDirectory) await FileSystem.deleteAsync(wardrobeDirectory, { idempotent: true }).catch(() => undefined);
    setToken(undefined);
    setProfile(defaultProfile);
    setWardrobe(wardrobePreview);
    setPosts([]);
    setOverlay("onboarding");
  };

  if (!hydrated) return <View style={styles.loading}><Text style={styles.wordmark}>MIRA</Text></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.desktopStage, width > 720 && styles.desktopStageWide]}>
        <View style={[styles.phone, width > 720 && styles.phoneWide]}>
          <AppHeader
            locale={locale}
            profile={profile}
            socialEnabled={socialEnabled}
            onChat={() => setOverlay("chat")}
            onPlus={() => setOverlay("paywall")}
          />
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {tab === "today" && (
              <TodayScreen
                locale={locale}
                profile={profile}
                mode={mode}
                styleNames={selectedNames}
                look={currentLook}
                aiQuestion={aiQuestion}
                aiAnswer={aiAnswer}
                aiLoading={aiLoading}
                setAiQuestion={setAiQuestion}
                askMira={askMira}
                onCreate={() => setTab("create")}
                onPublish={publishCurrent}
              />
            )}
            {tab === "circle" && (
              <CircleScreen
                locale={locale}
                age={profile.age}
                posts={posts}
                incomingRequests={incomingRequests}
                onReact={toggleReaction}
                onRemix={(look) => { setGenerated([look, ...generated]); setActiveLook(0); setTab("create"); }}
                onSearch={searchAccounts}
                onFollow={followAccount}
                onAccept={acceptConnection}
              />
            )}
            {tab === "create" && (
              <CreateScreen
                locale={locale}
                styleNames={selectedNames}
                occasion={occasion}
                setOccasion={(value) => { setOccasion(value); generateFor(profile, value); }}
                outfits={generated}
                activeLook={activeLook}
                setActiveLook={setActiveLook}
                regenerate={() => generateFor()}
                publish={publishCurrent}
              />
            )}
            {tab === "closet" && <ClosetScreen locale={locale} wardrobe={wardrobe} addPhoto={addPhoto} />}
            {tab === "me" && (
              <ProfileScreen
                locale={locale}
                profile={profile}
                mode={mode}
                styleNames={selectedNames}
                posts={posts.filter((post) => post.mine)}
                onEdit={() => setOverlay("onboarding")}
                onPlus={() => setOverlay("paywall")}
                onDelete={removeAccount}
              />
            )}
          </ScrollView>
          <BottomNav locale={locale} active={tab} onChange={setTab} />
          {toast && <View style={styles.toast}><Check size={16} color={colors.paper} /><Text style={styles.toastText}>{toast}</Text></View>}
          {overlay !== "none" && (
            <View style={styles.overlay}>
              {overlay === "onboarding" && <Onboarding initial={profile} firstRun={!token} onDone={finishOnboarding} onClose={() => setOverlay("none")} />}
              {overlay === "chat" && <ChatScreen locale={locale} age={profile.age} token={token} onClose={() => setOverlay("none")} />}
              {overlay === "paywall" && <Paywall locale={locale} onClose={() => setOverlay("none")} />}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function AppHeader({ locale, profile, socialEnabled, onChat, onPlus }: { locale: Locale; profile: ProfileState; socialEnabled: boolean; onChat: () => void; onPlus: () => void }) {
  return (
    <View style={styles.header}>
      <View><Text style={styles.wordmark}>MIRA</Text><Text style={styles.headerSub}>{displayHandle(profile.handle)}</Text></View>
      <View style={styles.headerActions}>
        <Pressable style={styles.plusBadge} onPress={onPlus}><Sparkles size={13} color={colors.ultraviolet} /><Text style={styles.plusBadgeText}>PLUS</Text></Pressable>
        <Pressable accessibilityLabel={tx(locale, "Сообщения", "Messages")} style={styles.iconButton} onPress={onChat}>{socialEnabled ? <MessageCircle size={20} color={colors.graphite} /> : <LockKeyhole size={18} color={colors.secondary} />}</Pressable>
        <Pressable accessibilityLabel={tx(locale, "Уведомления", "Notifications")} style={styles.iconButton}><Bell size={19} color={colors.graphite} /></Pressable>
      </View>
    </View>
  );
}

function TodayScreen({ locale, profile, mode, styleNames, look, aiQuestion, aiAnswer, aiLoading, setAiQuestion, askMira, onCreate, onPublish }: {
  locale: Locale; profile: ProfileState; mode: string; styleNames: string[]; look: OutfitOption | undefined; aiQuestion: string; aiAnswer: string | undefined; aiLoading: boolean; setAiQuestion: (v: string) => void; askMira: (q?: string) => void; onCreate: () => void; onPublish: () => void;
}) {
  return (
    <View>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>{tx(locale, "ТВОЙ ДЕНЬ · 17°", "YOUR DAY · 17°")}</Text><Text style={styles.heroTitle}>{tx(locale, `Привет, ${profile.nickname}`, `Hey, ${profile.nickname}`)}</Text></View>
        <View style={styles.weatherOrb}><Text style={styles.weatherEmoji}>☼</Text><Text style={styles.weatherTemp}>17°</Text></View>
      </View>
      <Text style={styles.lead}>{mode === "family" ? tx(locale, "Спокойный и практичный образ на сегодня уже готов.", "A practical, comfortable look is ready.") : tx(locale, "Какую версию себя выбираешь сегодня?", "Which version of you feels right today?")}</Text>
      <View style={styles.styleDna}>
        <View style={styles.styleStripe}>{["#C9C2B8", "#222126", colors.coral, colors.ultraviolet].map((color) => <View key={color} style={{ flex: 1, backgroundColor: color }} />)}</View>
        <View style={styles.styleDnaCopy}><Text style={styles.miniLabel}>STYLE DNA</Text><Text numberOfLines={1} style={styles.styleDnaName}>{styleNames.join(" + ")}</Text></View>
        <ChevronRight size={18} color={colors.graphite} />
      </View>
      {look && (
        <View style={styles.heroLookCard}>
          <LinearGradient colors={["#ECE8FF", "#F7E9F0", "#E7F5F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroLookTop}><View><Text style={styles.miniLabel}>{tx(locale, "MIRA ПОДОБРАЛА", "MIRA PICKED")}</Text><Text style={styles.lookMood}>{styleNames[0] ?? "your style"}</Text></View><View style={styles.matchPill}><Sparkles size={13} color={colors.ultraviolet} /><Text style={styles.matchText}>{Math.round(look.score * 100)}%</Text></View></View>
          <OutfitCanvas look={look} large />
          <TotalLookSummary locale={locale} look={look} />
          <View style={styles.heroActions}>
            <Pressable onPress={onCreate} style={styles.secondaryAction}><Shuffle size={17} color={colors.graphite} /><Text style={styles.secondaryActionText}>{tx(locale, "Изменить", "Remix")}</Text></Pressable>
            <Pressable onPress={onPublish} style={styles.primaryAction}><Text style={styles.primaryActionText}>{tx(locale, "Это мой лук", "Wear this")}</Text><ChevronRight size={17} color={colors.paper} /></Pressable>
          </View>
        </View>
      )}
      <SectionTitle title={tx(locale, "Спроси MIRA", "Ask MIRA")} action="AI" />
      <View style={styles.aiCard}>
        <View style={styles.aiIdentity}><View style={styles.aiMark}><WandSparkles size={18} color={colors.paper} /></View><View><Text style={styles.aiName}>MIRA AI</Text><Text style={styles.aiStatus}>{profile.age < 13 ? tx(locale, "приватный режим", "private mode") : tx(locale, "твой стилист онлайн", "your stylist is online")}</Text></View></View>
        {aiAnswer && <Text style={styles.aiAnswer}>{aiAnswer}</Text>}
        <View style={styles.aiComposer}><TextInput value={aiQuestion} onChangeText={setAiQuestion} onSubmitEditing={() => askMira()} placeholder={tx(locale, "Например: сделай образ смелее", "Try: make this look bolder")} placeholderTextColor="#A09AAA" style={styles.aiInput} /><Pressable onPress={() => askMira()} style={styles.aiSend}>{aiLoading ? <ActivityIndicator color={colors.paper} size="small" /> : <Send size={16} color={colors.paper} />}</Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPrompts}>
          {[tx(locale, "В школу", "For school"), tx(locale, "Смелее", "Bolder"), tx(locale, "Добавь аксессуар", "Add an accessory")].map((prompt) => <Pressable key={prompt} onPress={() => { setAiQuestion(prompt); askMira(prompt); }} style={styles.promptChip}><Text style={styles.promptChipText}>{prompt}</Text></Pressable>)}
        </ScrollView>
      </View>
      <SectionTitle title={tx(locale, "Челлендж недели", "Weekly challenge")} action={tx(locale, "Все", "See all")} />
      <View style={styles.challengeCard}><View style={styles.challengeIcon}><Star size={21} color={colors.graphite} /></View><View style={{ flex: 1 }}><Text style={styles.challengeTitle}>{CHALLENGES[0]!.title[locale]}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: "66%" }]} /></View><Text style={styles.challengeMeta}>2/3 · +120 ✦</Text></View><ChevronRight size={18} color={colors.secondary} /></View>
    </View>
  );
}

function CircleScreen({ locale, age, posts, incomingRequests, onReact, onRemix, onSearch, onFollow, onAccept }: {
  locale: Locale;
  age: number;
  posts: FeedPost[];
  incomingRequests: FollowRequest[];
  onReact: (id: string) => void;
  onRemix: (look: OutfitOption) => void;
  onSearch: (query: string) => Promise<SocialSearchAccount[]>;
  onFollow: (accountId: string) => Promise<"ACCEPTED" | "REQUESTED">;
  onAccept: (accountId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SocialSearchAccount[]>([]);
  const [followed, setFollowed] = useState<Record<string, string>>({});
  useEffect(() => {
    if (search.trim().length < 3) { setResults([]); return; }
    let active = true;
    const timer = setTimeout(() => { void onSearch(search).then((accounts) => { if (active) setResults(accounts); }).catch(() => undefined); }, 280);
    return () => { active = false; clearTimeout(timer); };
  }, [onSearch, search]);
  if (age <= 9) return <LockedSocial locale={locale} age={age} />;
  return (
    <View>
      <View style={styles.screenTitleRow}><View><Text style={styles.eyebrow}>{age < 13 ? tx(locale, "ТОЛЬКО ТВОЙ КРУГ", "YOUR CIRCLE ONLY") : tx(locale, "ТВОЙ STYLE-CIRCLE", "YOUR STYLE CIRCLE")}</Text><Text style={styles.screenTitle}>{tx(locale, "Вдохновение", "Inspiration")}</Text></View><Pressable style={styles.roundSearch}><Search size={20} color={colors.graphite} /></Pressable></View>
      <View style={styles.feedTabs}><Text style={styles.feedTabActive}>{tx(locale, "Для тебя", "For you")}</Text><Text style={styles.feedTab}>{tx(locale, "Друзья", "Friends")}</Text><Text style={styles.feedTab}>{tx(locale, "Челленджи", "Challenges")}</Text></View>
      <View style={styles.searchBar}><Search size={17} color={colors.secondary} /><TextInput value={search} onChangeText={setSearch} placeholder={tx(locale, "Найти @handle или стиль", "Find @handle or a style")} placeholderTextColor="#A19BAA" style={styles.searchInput} /></View>
      {incomingRequests.length > 0 && <View style={styles.requestPanel}><Text style={styles.requestTitle}>{tx(locale, "ХОТЯТ В ТВОЙ КРУГ", "CIRCLE REQUESTS")}</Text>{incomingRequests.map((account) => <View key={account.id} style={styles.searchResult}><View style={[styles.avatar, { backgroundColor: avatarColors[account.handle.length % avatarColors.length] }]}><Text style={styles.avatarLetter}>{account.nickname.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.postName}>{account.nickname}</Text><Text style={styles.postHandle}>@{account.handle}</Text></View><Pressable onPress={() => void onAccept(account.id)} style={styles.acceptButton}><Check size={13} color={colors.paper} /><Text style={styles.acceptButtonText}>{tx(locale, "Принять", "Accept")}</Text></Pressable></View>)}</View>}
      {results.length > 0 && <View style={styles.searchResults}>{results.map((account) => <View key={account.id} style={styles.searchResult}><View style={[styles.avatar, { backgroundColor: avatarColors[account.handle.length % avatarColors.length] }]}><Text style={styles.avatarLetter}>{account.nickname.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.postName}>{account.nickname}</Text><Text style={styles.postHandle}>@{account.handle} · {account.styleMix.map((item) => item.styleId).join(" + ")}</Text></View><Pressable disabled={Boolean(followed[account.id])} onPress={() => { void onFollow(account.id).then((status) => setFollowed((value) => ({ ...value, [account.id]: status }))); }} style={styles.followButton}><Text style={styles.followButtonText}>{followed[account.id] ? tx(locale, "Отправлено", "Requested") : tx(locale, "В круг", "Follow")}</Text></Pressable></View>)}</View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendRail}>
        {TREND_STYLES.map((trend) => <View key={trend.id} style={styles.trendCard}><View style={styles.trendPalette}>{trend.colors.map((color) => <View key={color} style={{ flex: 1, backgroundColor: color }} />)}</View><Text style={styles.trendName}>{trend.title}</Text><Text style={styles.trendChange}>{trend.change}</Text></View>)}
      </ScrollView>
      <View style={styles.feedList}>{posts.length ? posts.map((post) => <PostCard key={post.id} locale={locale} post={post} onReact={() => onReact(post.id)} onRemix={() => onRemix(post.outfit)} />) : <View style={styles.emptyFeed}><Sparkles size={25} color={colors.ultraviolet} /><Text style={styles.lockedTitle}>{tx(locale, "Твой круг только начинается", "Your circle starts here")}</Text><Text style={styles.lockedBody}>{tx(locale, "Найди подругу по @handle или опубликуй первый лук — без фейковых постов в ленте.", "Find a friend by @handle or share the first look — no fake posts in your feed.")}</Text></View>}</View>
    </View>
  );
}

function PostCard({ locale, post, onReact, onRemix }: { locale: Locale; post: FeedPost; onReact: () => void; onRemix: () => void }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}><View style={[styles.avatar, { backgroundColor: post.avatarColor }]}><Text style={styles.avatarLetter}>{post.nickname.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.postName}>{post.nickname} <Text style={styles.postHandle}>{post.handle}</Text></Text><Text style={styles.postTime}>{post.time} · {post.style}</Text></View><MoreHorizontal size={20} color={colors.secondary} /></View>
      <View style={styles.postCanvas}><LinearGradient colors={["#F0ECFF", "#F9EDF0"]} style={StyleSheet.absoluteFill} /><OutfitCanvas look={post.outfit} /></View>
      <Text style={styles.postCaption}>{post.caption[locale]}</Text>
      <View style={styles.postActions}><Pressable onPress={onReact} style={styles.socialAction}><Heart size={20} color={post.reacted ? colors.coral : colors.graphite} fill={post.reacted ? colors.coral : "transparent"} /><Text style={styles.socialCount}>{post.reactions}</Text></Pressable><View style={styles.socialAction}><MessageCircle size={19} color={colors.graphite} /><Text style={styles.socialCount}>{post.comments}</Text></View><Pressable onPress={onRemix} style={styles.remixButton}><Shuffle size={15} color={colors.ultraviolet} /><Text style={styles.remixText}>{tx(locale, "Ремикс", "Remix")} · {post.remixes}</Text></Pressable></View>
    </View>
  );
}

function CreateScreen({ locale, styleNames, occasion, setOccasion, outfits, activeLook, setActiveLook, regenerate, publish }: { locale: Locale; styleNames: string[]; occasion: string; setOccasion: (v: string) => void; outfits: OutfitOption[]; activeLook: number; setActiveLook: (v: number) => void; regenerate: () => void; publish: () => void }) {
  const look = outfits[activeLook];
  return (
    <View>
      <Text style={styles.eyebrow}>{tx(locale, "AI LOOK LAB", "AI LOOK LAB")}</Text><Text style={styles.screenTitle}>{tx(locale, "Собери настроение", "Build a mood")}</Text><Text style={styles.lead}>{tx(locale, "MIRA использует только вещи из твоего шкафа. Ты решаешь, что оставить.", "MIRA uses only your real closet. You decide what stays.")}</Text>
      <Text style={styles.fieldCaption}>{tx(locale, "КУДА СОБИРАЕМСЯ?", "WHAT'S THE PLAN?")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasionRail}>
        {[["school", "🎒", tx(locale, "Школа", "School")], ["walk", "☕", tx(locale, "Прогулка", "Out")], ["party", "✦", tx(locale, "Вечеринка", "Party")], ["sport", "⚡", tx(locale, "Спорт", "Sport")]].map(([id, emoji, label]) => <Pressable key={id} onPress={() => setOccasion(id!)} style={[styles.occasionCard, occasion === id && styles.occasionCardActive]}><Text style={styles.occasionEmoji}>{emoji}</Text><Text style={[styles.occasionLabel, occasion === id && styles.occasionLabelActive]}>{label}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.createStyleRow}><View><Text style={styles.fieldCaption}>{tx(locale, "НАПРАВЛЕНИЕ", "DIRECTION")}</Text><Text style={styles.createStyleName}>{styleNames.join(" + ")}</Text></View><View style={styles.matchPill}><Sparkles size={13} color={colors.ultraviolet} /><Text style={styles.matchText}>AI</Text></View></View>
      {look && <View style={styles.builderCanvas}><LinearGradient colors={["#EBE8FF", "#F8EAF0", "#EAF7F6"]} style={StyleSheet.absoluteFill} /><OutfitCanvas look={look} large /><TotalLookGuide locale={locale} look={look} /></View>}
      <View style={styles.lookDots}>{outfits.map((_, index) => <Pressable key={index} onPress={() => setActiveLook(index)} style={[styles.lookDot, index === activeLook && styles.lookDotActive]} />)}</View>
      <View style={styles.builderActions}><Pressable onPress={regenerate} style={styles.secondaryAction}><Shuffle size={17} color={colors.graphite} /><Text style={styles.secondaryActionText}>{tx(locale, "Ещё варианты", "New options")}</Text></Pressable><Pressable onPress={publish} style={styles.primaryAction}><ImagePlus size={17} color={colors.paper} /><Text style={styles.primaryActionText}>{tx(locale, "Опубликовать", "Share look")}</Text></Pressable></View>
      <View style={styles.tipCard}><WandSparkles size={19} color={colors.ultraviolet} /><Text style={styles.tipText}>{tx(locale, "Нажми на вещь в готовом образе, чтобы заменить только её — остальной mood сохранится.", "Tap a piece to swap only that item while keeping the mood.")}</Text></View>
    </View>
  );
}

function ClosetScreen({ locale, wardrobe, addPhoto }: { locale: Locale; wardrobe: typeof wardrobePreview; addPhoto: () => void }) {
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? wardrobe : wardrobe.filter((item) => item.slot === filter);
  return (
    <View>
      <View style={styles.screenTitleRow}><View><Text style={styles.eyebrow}>{tx(locale, "ТВОИ РЕАЛЬНЫЕ ВЕЩИ", "YOUR REAL PIECES")}</Text><Text style={styles.screenTitle}>{tx(locale, "Шкаф", "Closet")}</Text></View><Pressable onPress={addPhoto} style={styles.addRound}><Plus size={22} color={colors.paper} /></Pressable></View>
      <View style={styles.closetStats}><View><Text style={styles.statValue}>{wardrobe.length}</Text><Text style={styles.statLabel}>{tx(locale, "вещей", "pieces")}</Text></View><View style={styles.statDivider} /><View><Text style={styles.statValue}>86%</Text><Text style={styles.statLabel}>{tx(locale, "носятся", "in rotation")}</Text></View><View style={styles.statDivider} /><View><Text style={styles.statValue}>42</Text><Text style={styles.statLabel}>{tx(locale, "образа", "looks")}</Text></View></View>
      <Pressable onPress={addPhoto} style={styles.scanCard}><LinearGradient colors={[colors.ultraviolet, "#8B6BFF"]} style={StyleSheet.absoluteFill} /><View style={styles.scanIcon}><Camera size={24} color={colors.ultraviolet} /></View><View style={{ flex: 1 }}><Text style={styles.scanTitle}>{tx(locale, "Сфотографируй вещь", "Photograph a piece")}</Text><Text style={styles.scanBody}>{tx(locale, "AI вырежет фон и заполнит карточку", "AI removes the background and fills the details")}</Text></View><ChevronRight size={20} color={colors.paper} /></Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>{[["all", tx(locale, "Все", "All")], ["top", tx(locale, "Верх", "Tops")], ["bottom", tx(locale, "Низ", "Bottoms")], ["footwear", tx(locale, "Обувь", "Shoes")], ["bag", tx(locale, "Сумки", "Bags")], ["jewelry", tx(locale, "Украшения", "Jewelry")]].map(([id, label]) => <Pressable key={id} onPress={() => setFilter(id!)} style={[styles.filterChip, filter === id && styles.filterChipActive]}><Text style={[styles.filterText, filter === id && styles.filterTextActive]}>{label}</Text></Pressable>)}</ScrollView>
      <View style={styles.closetGrid}>{visible.map((item) => <View key={item.localId} style={styles.closetItem}><View style={[styles.closetArt, { backgroundColor: item.colors[0] ?? colors.violetMist }]}>{item.imageUri ? <Image source={{ uri: item.cutoutUri ?? item.imageUri }} style={styles.closetImage} /> : <Shirt size={31} color={"#FFFFFFCC"} />}{item.imageProcessingState === "PENDING_CUTOUT" && <View style={styles.processingBadge}><Sparkles size={10} color={colors.ultraviolet} /><Text style={styles.processingText}>AI</Text></View>}</View><Text numberOfLines={2} style={styles.closetName}>{item.name}</Text><Text style={styles.closetMeta}>{item.careState === "CLEAN" ? tx(locale, "готово", "ready") : item.careState.toLowerCase()}</Text></View>)}</View>
    </View>
  );
}

function ProfileScreen({ locale, profile, mode, styleNames, posts, onEdit, onPlus, onDelete }: { locale: Locale; profile: ProfileState; mode: string; styleNames: string[]; posts: FeedPost[]; onEdit: () => void; onPlus: () => void; onDelete: () => void }) {
  const inspired = posts.reduce((total, post) => total + post.reactions, 0);
  const genderLabel = GENDER_OPTIONS.find((option) => option.id === profile.genderPresentation)?.label[locale];
  const hairLength = HAIR_LENGTH_OPTIONS.find((option) => option.id === profile.hairProfile.length)?.label[locale];
  const hairColor = HAIR_COLOR_OPTIONS.find((option) => option.id === profile.hairProfile.color)?.label[locale];
  return (
    <View>
      <View style={styles.profileHero}><LinearGradient colors={["#DCD4FF", "#FFDCE5", "#C9F0EF"]} style={StyleSheet.absoluteFill} /><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{profile.nickname.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.profileName}>{profile.nickname}</Text><Text style={styles.profileHandle}>{displayHandle(profile.handle)}</Text><Pressable onPress={onEdit} style={styles.editProfile}><Text style={styles.editProfileText}>{tx(locale, "Изменить профиль", "Edit profile")}</Text></Pressable></View>
      <View style={styles.profileStats}><View><Text style={styles.profileStatValue}>{posts.length}</Text><Text style={styles.profileStatLabel}>{tx(locale, "луков", "looks")}</Text></View><View><Text style={styles.profileStatValue}>0</Text><Text style={styles.profileStatLabel}>{tx(locale, "в круге", "circle")}</Text></View><View><Text style={styles.profileStatValue}>{inspired}</Text><Text style={styles.profileStatLabel}>{tx(locale, "вдохновились", "inspired")}</Text></View></View>
      <View style={styles.profileStyleCard}><View style={styles.styleStripe}>{["#CBC5BB", "#25252A", colors.coral, colors.ultraviolet].map((color) => <View key={color} style={{ flex: 1, backgroundColor: color }} />)}</View><Text style={styles.miniLabel}>MY STYLE DNA</Text><Text style={styles.profileStyleName}>{styleNames.join(" + ")}</Text><Text style={styles.profileStyleBody}>{tx(locale, "Стиль меняется вместе с тобой. Это направление, а не ярлык.", "Your style grows with you. It is a direction, not a label.")}</Text></View>
      <Pressable onPress={onEdit} style={styles.appearanceProfileCard}><View style={styles.appearanceProfileIcon}><Sparkles size={19} color={colors.ultraviolet} /></View><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>{tx(locale, "Параметры рекомендаций", "Guidance preferences")}</Text><Text style={styles.privacyBody}>{genderLabel} · {hairLength} · {hairColor}</Text></View><ChevronRight size={18} color={colors.secondary} /></Pressable>
      <View style={styles.privacyCard}><View style={styles.privacyIcon}><LockKeyhole size={19} color={colors.ultraviolet} /></View><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>{mode === "social" ? tx(locale, "Профиль виден только твоему кругу", "Only your circle sees your profile") : tx(locale, "Закрытый возрастной режим", "Age-safe private mode")}</Text><Text style={styles.privacyBody}>{tx(locale, "Возраст не показывается. Геолокация и школа никогда не публикуются.", "Your age, school and location are never shown.")}</Text></View><ChevronRight size={18} color={colors.secondary} /></View>
      <Pressable onPress={onPlus} style={styles.plusCard}><LinearGradient colors={["#19151F", "#34255A"]} style={StyleSheet.absoluteFill} /><Crown size={24} color={colors.warm} /><View style={{ flex: 1 }}><Text style={styles.plusTitle}>MIRA PLUS</Text><Text style={styles.plusBody}>{tx(locale, "Безлимитный AI, капсулы и умные покупки", "Unlimited AI, capsules and smart shopping")}</Text></View><ChevronRight size={19} color={colors.paper} /></Pressable>
      <SectionTitle title={tx(locale, "Твои луки", "Your looks")} action={`${posts.length}`} />
      {!posts.length ? <View style={styles.emptyLooks}><ImagePlus size={24} color={colors.secondary} /><Text style={styles.emptyLooksText}>{tx(locale, "Опубликуй первый лук — он появится здесь.", "Share your first look and it will live here.")}</Text></View> : <View style={styles.miniLooks}>{posts.map((post) => <View key={post.id} style={styles.miniLook}><OutfitCanvas look={post.outfit} /></View>)}</View>}
      <Pressable onPress={onDelete} style={styles.deleteAccount}><Text style={styles.deleteAccountText}>{tx(locale, "Удалить аккаунт и данные", "Delete account and data")}</Text></Pressable>
    </View>
  );
}

function OutfitCanvas({ look, large = false }: { look: OutfitOption; large?: boolean }) {
  return (
    <View style={[styles.outfitCanvas, large && styles.outfitCanvasLarge]}>
      {look.items.slice(0, large ? 7 : 6).map((item, index) => {
        const uri = item.cutoutUri ?? item.imageUri;
        return <View key={`${item.name}-${index}`} style={[styles.outfitPiece, large && styles.outfitPieceLarge, { transform: [{ rotate: `${index % 2 ? 3 : -3}deg` }], marginTop: index % 3 === 1 ? 13 : 0 }]}>{uri ? <Image source={{ uri }} style={styles.outfitImage} resizeMode="contain" /> : <View style={[styles.outfitColor, { backgroundColor: item.colors[0] ?? colors.powder }]}><Shirt size={large ? 24 : 18} color="#FFFFFFD8" /></View>}<Text numberOfLines={1} style={styles.outfitItemName}>{item.name}</Text></View>;
      })}
    </View>
  );
}

function TotalLookSummary({ locale, look }: { locale: Locale; look: OutfitOption }) {
  const details = look.items.filter((item) => ["headwear", "jewelry", "bag", "accessory"].includes(item.slot));
  return <View style={styles.totalLookSummary}>
    <View style={styles.totalLookSummaryTop}><Text style={styles.totalLookLabel}>{tx(locale, "ПОЛНЫЙ ОБРАЗ", "TOTAL LOOK")}</Text><View style={styles.freeBadge}><Text style={styles.freeBadgeText}>{tx(locale, "БЕСПЛАТНО", "FREE")}</Text></View></View>
    <View style={styles.totalLookChips}><View style={styles.totalLookChip}><Text style={styles.totalLookChipLabel}>{tx(locale, "Укладка", "Hair")}</Text><Text numberOfLines={1} style={styles.totalLookChipValue}>{look.hair.title}</Text></View><View style={styles.totalLookChip}><Text style={styles.totalLookChipLabel}>{tx(locale, "Макияж", "Makeup")}</Text><Text numberOfLines={1} style={styles.totalLookChipValue}>{look.makeup.title}</Text></View><View style={styles.totalLookChip}><Text style={styles.totalLookChipLabel}>{tx(locale, "Детали", "Details")}</Text><Text numberOfLines={1} style={styles.totalLookChipValue}>{details.length ? details.map((item) => item.name).join(" · ") : tx(locale, "без перегруза", "kept minimal")}</Text></View></View>
  </View>;
}

function TotalLookGuide({ locale, look }: { locale: Locale; look: OutfitOption }) {
  const details = look.items.filter((item) => ["headwear", "jewelry", "bag", "accessory"].includes(item.slot));
  return <View style={styles.totalLookGuide}>
    <View style={styles.totalLookGuideHeader}><View><Text style={styles.totalLookLabel}>{tx(locale, "ФИНАЛЬНЫЕ ШТРИХИ", "FINISHING TOUCHES")}</Text><Text style={styles.totalLookGuideTitle}>{tx(locale, "Всё уже входит в образ", "Everything is part of the look")}</Text></View><View style={styles.freeBadge}><Text style={styles.freeBadgeText}>{tx(locale, "БЕСПЛАТНО", "FREE")}</Text></View></View>
    <View style={styles.guideCard}><Text style={styles.guideCardEyebrow}>{tx(locale, "УКЛАДКА · ПО ДЛИНЕ ВОЛОС", "HAIR · MATCHED TO LENGTH")}</Text><Text style={styles.guideCardTitle}>{look.hair.title}</Text><Text style={styles.guideCardBody}>{look.hair.detail}</Text>{look.hair.colorAdvice && <Text style={styles.colorAdvice}>{look.hair.colorAdvice}</Text>}</View>
    <View style={styles.guideCard}><Text style={styles.guideCardEyebrow}>{tx(locale, "МАКИЯЖ · ПО ВОЗРАСТУ И ПОДАЧЕ", "MAKEUP · AGE & PRESENTATION AWARE")}</Text><Text style={styles.guideCardTitle}>{look.makeup.title}</Text><Text style={styles.guideCardBody}>{look.makeup.detail}</Text></View>
    <View style={styles.guideCard}><Text style={styles.guideCardEyebrow}>{tx(locale, "СУМКА · УКРАШЕНИЯ · ГОЛОВНОЙ УБОР", "BAG · JEWELRY · HEADWEAR")}</Text><Text style={styles.guideCardTitle}>{details.length ? tx(locale, "Подобраны из твоего шкафа", "Picked from your closet") : tx(locale, "Оставляем образ чистым", "Keeping the look clean")}</Text><Text style={styles.guideCardBody}>{details.length ? details.map((item) => item.name).join(" · ") : tx(locale, "MIRA не добавляет аксессуар ради аксессуара — только если он поддерживает выбранный стиль.", "MIRA only adds an accessory when it genuinely supports the chosen style.")}</Text></View>
  </View>;
}

function BottomNav({ locale, active, onChange }: { locale: Locale; active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: Array<[Tab, typeof Home, string]> = [["today", Home, tx(locale, "Сегодня", "Today")], ["circle", Compass, tx(locale, "Круг", "Circle")], ["create", Sparkles, tx(locale, "Создать", "Create")], ["closet", Shirt, tx(locale, "Шкаф", "Closet")], ["me", UserRound, tx(locale, "Я", "Me")]];
  return <BlurView intensity={85} tint="light" style={styles.bottomNav}>{tabs.map(([id, Icon, label]) => { const selected = active === id; return <Pressable key={id} onPress={() => { onChange(id); void Haptics.selectionAsync(); }} style={[styles.navItem, id === "create" && styles.createNav]}>{id === "create" ? <View style={styles.createNavIcon}><Icon size={20} color={colors.paper} /></View> : <Icon size={21} color={selected ? colors.ultraviolet : colors.secondary} fill={id === "today" && selected ? colors.ultraviolet : "transparent"} />}<Text style={[styles.navLabel, selected && styles.navLabelActive]}>{label}</Text></Pressable>; })}</BlurView>;
}

function Onboarding({ initial, firstRun, onDone, onClose }: { initial: ProfileState; firstRun: boolean; onDone: (profile: ProfileState) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const [styleSearch, setStyleSearch] = useState("");
  const catalog = getStyles(draft.locale);
  const visibleCatalog = catalog.filter((style) => [style.name, style.description, ...style.aliases].some((value) => value.toLowerCase().includes(styleSearch.trim().toLowerCase())));
  const toggleStyle = (id: string) => setDraft((current) => ({ ...current, styles: current.styles.includes(id) ? current.styles.filter((style) => style !== id) : current.styles.length >= 3 ? [...current.styles.slice(1), id] : [...current.styles, id] }));
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.onboarding}>
      <View style={styles.onboardingTop}><Text style={styles.wordmark}>MIRA</Text>{!firstRun && <Pressable onPress={onClose} style={styles.closeButton}><X size={20} color={colors.graphite} /></Pressable>}</View>
      <ScrollView contentContainerStyle={styles.onboardingContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.onboardingStep}>0{step + 1} / 04</Text>
        {step === 0 && <><Text style={styles.onboardingTitle}>Choose your language</Text><Text style={styles.onboardingLead}>{tx(draft.locale, "Все стили, подсказки и интерфейс будут на выбранном языке.", "Styles, guidance and the interface follow your language.")}</Text><View style={styles.languageCards}>{(["ru", "en"] as Locale[]).map((value) => <Pressable key={value} onPress={() => setDraft((current) => ({ ...current, locale: value }))} style={[styles.languageCard, draft.locale === value && styles.languageCardActive]}><Text style={styles.languageCode}>{value.toUpperCase()}</Text><Text style={styles.languageName}>{value === "ru" ? "Русский" : "English"}</Text>{draft.locale === value && <Check size={19} color={colors.ultraviolet} />}</Pressable>)}</View></>}
        {step === 1 && <><Text style={styles.onboardingTitle}>{tx(draft.locale, "Профиль без лишних вопросов", "A profile without the friction")}</Text><Text style={styles.onboardingLead}>{tx(draft.locale, "Возраст меняет подсказки, приватность и доступ к social-функциям. Точная дата рождения не нужна.", "Age changes guidance, privacy and social access. We do not need your full birth date.")}</Text><View style={styles.agePicker}><Pressable disabled={!firstRun} onPress={() => setDraft((p) => ({ ...p, age: Math.max(0, p.age - 1) }))} style={[styles.ageButton, !firstRun && { opacity: 0.35 }]}><Minus size={20} color={colors.graphite} /></Pressable><View><Text style={styles.ageNumber}>{draft.age}</Text><Text style={styles.ageYears}>{tx(draft.locale, "лет", "years")}</Text></View><Pressable disabled={!firstRun} onPress={() => setDraft((p) => ({ ...p, age: Math.min(18, p.age + 1) }))} style={[styles.ageButton, !firstRun && { opacity: 0.35 }]}><Plus size={20} color={colors.graphite} /></Pressable></View><View style={styles.ageModeCard}><LockKeyhole size={18} color={colors.ultraviolet} /><Text style={styles.ageModeText}>{draft.age < 10 ? tx(draft.locale, "Семейный режим без открытой соцсети", "Family mode without an open social feed") : draft.age < 13 ? tx(draft.locale, "Закрытый круг по invite-коду", "Private circle by invite only") : tx(draft.locale, "Social-режим, закрытый по умолчанию", "Social mode, private by default")}</Text></View><Text style={styles.inputLabel}>{tx(draft.locale, "КАК ТЕБЯ НАЗЫВАТЬ", "WHAT SHOULD WE CALL YOU")}</Text><TextInput value={draft.nickname} onChangeText={(nickname) => setDraft((p) => ({ ...p, nickname }))} style={styles.bigInput} maxLength={30} /><Text style={styles.inputLabel}>ID</Text><View style={styles.handleInput}><Text style={styles.handlePrefix}>@</Text><TextInput editable={firstRun} autoCapitalize="none" value={draft.handle} onChangeText={(handle) => setDraft((p) => ({ ...p, handle: handle.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase() }))} style={[styles.handleTextInput, !firstRun && { opacity: 0.55 }]} maxLength={24} /></View></>}
        {step === 2 && <><Text style={styles.onboardingTitle}>{draft.age < 6 ? tx(draft.locale, "Настроим настроение", "Set the mood") : tx(draft.locale, "Стиль — это твой язык", "Style is your language")}</Text><Text style={styles.onboardingLead}>{draft.age < 6 ? tx(draft.locale, "Для маленьких детей стиль выбирает взрослый и может менять его в любой момент.", "A parent sets the direction for little ones and can change it anytime.") : tx(draft.locale, "Выбери до трёх направлений. MIRA научится смешивать их из твоих реальных вещей.", "Choose up to three directions. MIRA learns to mix them using your real clothes.")}</Text><View style={[styles.searchBar, { marginBottom: 12 }]}><Search size={17} color={colors.secondary} /><TextInput value={styleSearch} onChangeText={setStyleSearch} placeholder={tx(draft.locale, "Найти: emo, Stockholm, fairycore…", "Find: emo, Stockholm, fairycore…")} placeholderTextColor="#A19BAA" style={styles.searchInput} /></View><View style={styles.styleChoiceGrid}>{visibleCatalog.map((style) => { const selected = draft.styles.includes(style.id); return <Pressable key={style.id} onPress={() => toggleStyle(style.id)} style={[styles.styleChoice, selected && styles.styleChoiceActive]}><View style={styles.styleChoicePalette}>{style.palette.slice(0, 4).map((color) => <View key={color} style={{ flex: 1, backgroundColor: color }} />)}</View><Text style={styles.styleChoiceName}>{style.name}</Text>{selected && <View style={styles.styleSelected}><Check size={12} color={colors.paper} /></View>}</Pressable>; })}</View></>}
        {step === 3 && <><Text style={styles.onboardingTitle}>{tx(draft.locale, "Советы именно для тебя", "Guidance that fits you")}</Text><Text style={styles.onboardingLead}>{tx(draft.locale, "Пол и параметры волос нужны только для укладки и возрастных рекомендаций по макияжу. Они не показываются другим людям.", "Gender and hair details are only used for hairstyle and age-aware makeup guidance. They are never shown to other people.")}</Text><AppearanceCustomizer locale={draft.locale} gender={draft.genderPresentation} hair={draft.hairProfile} onGenderChange={(genderPresentation) => setDraft((current) => ({ ...current, genderPresentation }))} onHairChange={(hairProfile) => setDraft((current) => ({ ...current, hairProfile }))} /></>}
      </ScrollView>
      <View style={styles.onboardingFooter}>{step > 0 && <Pressable onPress={() => setStep((value) => value - 1)} style={styles.backRound}><ChevronLeft size={21} color={colors.graphite} /></Pressable>}<Pressable disabled={step === 2 && !draft.styles.length} onPress={() => step < 3 ? setStep((value) => value + 1) : void onDone(draft)} style={styles.onboardingCta}><Text style={styles.onboardingCtaText}>{step === 3 ? tx(draft.locale, "Войти в MIRA", "Enter MIRA") : tx(draft.locale, "Продолжить", "Continue")}</Text><ChevronRight size={19} color={colors.paper} /></Pressable></View>
    </KeyboardAvoidingView>
  );
}

function AppearanceCustomizer({ locale, gender, hair, onGenderChange, onHairChange }: { locale: Locale; gender: GenderPresentation; hair: HairProfile; onGenderChange: (value: GenderPresentation) => void; onHairChange: (value: HairProfile) => void }) {
  return <View>
    <Text style={styles.appearanceLabel}>{tx(locale, "ПОЛ / ПОДАЧА", "GENDER / PRESENTATION")}</Text>
    <View style={styles.genderGrid}>{GENDER_OPTIONS.map((option) => <Pressable key={option.id} onPress={() => onGenderChange(option.id)} style={[styles.genderCard, gender === option.id && styles.genderCardActive]}><Text style={[styles.genderSymbol, gender === option.id && styles.genderSymbolActive]}>{option.symbol}</Text><View style={{ flex: 1 }}><Text style={[styles.genderTitle, gender === option.id && styles.genderTitleActive]}>{option.label[locale]}</Text><Text style={[styles.genderBody, gender === option.id && styles.genderBodyActive]}>{option.description[locale]}</Text></View>{gender === option.id && <Check size={15} color={colors.paper} />}</Pressable>)}</View>
    <Text style={styles.appearanceLabel}>{tx(locale, "ДЛИНА ВОЛОС", "HAIR LENGTH")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appearanceRail}>{HAIR_LENGTH_OPTIONS.map((option) => <Pressable key={option.id} onPress={() => onHairChange({ ...hair, length: option.id })} style={[styles.appearanceChoice, hair.length === option.id && styles.appearanceChoiceActive]}><Text style={[styles.appearanceChoiceText, hair.length === option.id && styles.appearanceChoiceTextActive]}>{option.label[locale]}</Text></Pressable>)}</ScrollView>
    <Text style={styles.appearanceLabel}>{tx(locale, "ЦВЕТ ВОЛОС", "HAIR COLOR")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appearanceRail}>{HAIR_COLOR_OPTIONS.map((option) => <Pressable key={option.id} onPress={() => onHairChange({ ...hair, color: option.id })} style={[styles.hairColorChoice, hair.color === option.id && styles.hairColorChoiceActive]}><View style={[styles.hairColorSwatch, { backgroundColor: option.color }]} /><Text style={styles.hairColorText}>{option.label[locale]}</Text>{hair.color === option.id && <Check size={12} color={colors.ultraviolet} />}</Pressable>)}</ScrollView>
    <View style={styles.appearancePrivacy}><LockKeyhole size={18} color={colors.ultraviolet} /><Text style={styles.appearancePrivacyText}>{tx(locale, "MIRA может подсказать другой цвет волос для выбранного стиля, но это всегда необязательная идея — не требование.", "MIRA may suggest another hair color for a style, but it is always an optional idea, never a requirement.")}</Text></View>
  </View>;
}

function ChatScreen({ locale, age, token, onClose }: { locale: Locale; age: number; token: string | undefined; onClose: () => void }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selected, setSelected] = useState<ConversationSummary>();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (age < 13 || !token) return;
    setLoading(true);
    void loadConversations(token).then((result) => setConversations(result.conversations)).catch(() => undefined).finally(() => setLoading(false));
  }, [age, token]);

  const openConversation = async (conversation: ConversationSummary) => {
    if (!token) return;
    setSelected(conversation);
    setLoading(true);
    try { setMessages((await loadMessages(token, conversation.id)).messages); } finally { setLoading(false); }
  };

  const submitMessage = async () => {
    const body = message.trim();
    if (!body || !token || !selected) return;
    setMessage("");
    try {
      await sendDirectMessage(token, selected.id, body);
      setMessages((await loadMessages(token, selected.id)).messages);
    } catch {
      setMessage(body);
    }
  };

  if (age < 13) return <View style={styles.fullScreen}><OverlayHeader title={tx(locale, "Сообщения", "Messages")} onClose={onClose} /><View style={styles.lockedChat}><View style={styles.lockedIcon}><LockKeyhole size={28} color={colors.ultraviolet} /></View><Text style={styles.lockedTitle}>{tx(locale, "Чат откроется с 13 лет", "Chat opens at 13")}</Text><Text style={styles.lockedBody}>{tx(locale, "До этого можно делиться луками внутри семейного пространства и закрытого круга без личных сообщений.", "Until then, looks can be shared in the family space and private circle without direct messages.")}</Text></View></View>;

  return <View style={styles.fullScreen}>
    <OverlayHeader title={selected?.peer?.nickname ?? tx(locale, "Сообщения", "Messages")} onClose={() => selected ? setSelected(undefined) : onClose()} back={Boolean(selected)} />
    {selected ? <>
      <ScrollView contentContainerStyle={styles.messageThread}>
        {loading && <ActivityIndicator color={colors.ultraviolet} />}
        {messages.map((item) => { const outgoing = item.senderAccountId !== selected.peer?.id; return <View key={item.id} style={outgoing ? styles.messageOutgoing : styles.messageIncoming}><Text style={outgoing ? styles.messageTextOutgoing : styles.messageText}>{item.body}</Text></View>; })}
        <View style={styles.safetyNotice}><LockKeyhole size={13} color={colors.secondary} /><Text style={styles.safetyNoticeText}>{tx(locale, "Ссылки и личные контакты скрываются для безопасности", "Links and personal contact details are filtered for safety")}</Text></View>
      </ScrollView>
      <View style={styles.messageComposer}><TextInput value={message} onChangeText={setMessage} onSubmitEditing={submitMessage} placeholder={tx(locale, "Сообщение…", "Message…")} style={styles.messageInput} /><Pressable onPress={submitMessage} style={styles.messageSend}><Send size={17} color={colors.paper} /></Pressable></View>
    </> : loading ? <ActivityIndicator style={{ marginTop: 60 }} color={colors.ultraviolet} /> : conversations.length ? <View style={styles.conversationList}>{conversations.map((item) => <Pressable key={item.id} onPress={() => void openConversation(item)} style={styles.conversationRow}><View style={[styles.avatar, { backgroundColor: avatarColors[(item.peer?.handle.length ?? 0) % avatarColors.length] }]}><Text style={styles.avatarLetter}>{item.peer?.nickname.slice(0, 1).toUpperCase() ?? "?"}</Text></View><View style={{ flex: 1 }}><Text style={styles.postName}>{item.peer?.nickname ?? "MIRA"} <Text style={styles.postHandle}>@{item.peer?.handle}</Text></Text><Text numberOfLines={1} style={styles.conversationText}>{item.lastMessage?.body ?? tx(locale, "Начните разговор с образа", "Start with a look")}</Text></View></Pressable>)}</View> : <View style={styles.lockedChat}><View style={styles.lockedIcon}><MessageCircle size={28} color={colors.ultraviolet} /></View><Text style={styles.lockedTitle}>{tx(locale, "Пока нет диалогов", "No conversations yet")}</Text><Text style={styles.lockedBody}>{token ? tx(locale, "Личные сообщения появляются только после взаимного подтверждения контакта.", "Direct messages appear only after both people approve the connection.") : tx(locale, "Подключись к MIRA, чтобы открыть безопасные сообщения.", "Connect to MIRA to open safe messaging.")}</Text></View>}
  </View>;
}

function Paywall({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const [yearly, setYearly] = useState(true);
  return <View style={styles.paywall}><LinearGradient colors={["#17131D", "#30234D", "#6848E6"]} style={StyleSheet.absoluteFill} /><OverlayHeader title="" onClose={onClose} light /><ScrollView contentContainerStyle={styles.paywallContent}><View style={styles.paywallMark}><Sparkles size={28} color={colors.warm} /></View><Text style={styles.paywallEyebrow}>MIRA PLUS</Text><Text style={styles.paywallTitle}>{tx(locale, "Твой стиль. Без лимитов.", "Your style. No limits.")}</Text><Text style={styles.paywallLead}>{tx(locale, "Плати за решения, которые экономят время и помогают носить больше — не за искусственные звёздочки.", "Pay for useful decisions that save time and unlock your closet — not artificial coins.")}</Text><View style={styles.coreFreeNotice}><Check size={15} color={colors.warm} /><Text style={styles.coreFreeNoticeText}>{tx(locale, "Сумки, украшения, головные уборы, макияж и укладка остаются в бесплатной версии.", "Bags, jewelry, headwear, makeup and hairstyle guidance stay free.")}</Text></View><View style={styles.featureList}>{PLUS_FEATURES[locale].map((feature) => <View key={feature} style={styles.featureRow}><View style={styles.featureCheck}><Check size={13} color={colors.night} /></View><Text style={styles.featureText}>{feature}</Text></View>)}</View><View style={styles.billingSwitch}><Pressable onPress={() => setYearly(true)} style={[styles.billingOption, yearly && styles.billingOptionActive]}><Text style={[styles.billingText, yearly && styles.billingTextActive]}>{tx(locale, "Год", "Yearly")}</Text><Text style={styles.saveText}>−42%</Text></Pressable><Pressable onPress={() => setYearly(false)} style={[styles.billingOption, !yearly && styles.billingOptionActive]}><Text style={[styles.billingText, !yearly && styles.billingTextActive]}>{tx(locale, "Месяц", "Monthly")}</Text></Pressable></View><View style={styles.priceRow}><Text style={styles.price}>{yearly ? "$29.99" : "$4.99"}</Text><Text style={styles.pricePeriod}>/{yearly ? tx(locale, "год", "year") : tx(locale, "месяц", "month")}</Text></View><Pressable style={styles.paywallCta}><Text style={styles.paywallCtaText}>{tx(locale, "Попробовать 7 дней бесплатно", "Start 7-day free trial")}</Text><ChevronRight size={19} color={colors.night} /></Pressable><Text style={styles.paywallFine}>{tx(locale, "Отмена в любой момент. Покупка подтверждается через App Store.", "Cancel anytime. Purchase is confirmed through the App Store.")}</Text></ScrollView></View>;
}

function LockedSocial({ locale, age }: { locale: Locale; age: number }) {
  return <View><Text style={styles.eyebrow}>{tx(locale, "СЕМЕЙНОЕ ПРОСТРАНСТВО", "FAMILY SPACE")}</Text><Text style={styles.screenTitle}>{tx(locale, "Наши образы", "Our looks")}</Text><View style={styles.lockedSocialCard}><View style={styles.lockedIcon}><CircleUserRound size={29} color={colors.ultraviolet} /></View><Text style={styles.lockedTitle}>{tx(locale, "Здесь нет открытой соцсети", "There is no open social feed here")}</Text><Text style={styles.lockedBody}>{age <= 5 ? tx(locale, "Луки видят только взрослые семейного аккаунта.", "Only adults in the family account can see these looks.") : tx(locale, "Можно собирать образы вместе и делиться ими только с одобренными близкими.", "Build looks together and share only with approved family members.")}</Text></View></View>;
}

function OverlayHeader({ title, onClose, back = false, light = false }: { title: string; onClose: () => void; back?: boolean; light?: boolean }) { return <View style={styles.overlayHeader}><Pressable onPress={onClose} style={[styles.closeButton, light && styles.closeButtonLight]}>{back ? <ChevronLeft size={20} color={light ? colors.paper : colors.graphite} /> : <X size={20} color={light ? colors.paper : colors.graphite} />}</Pressable><Text style={[styles.overlayTitle, light && { color: colors.paper }]}>{title}</Text><View style={{ width: 42 }} /></View>; }
function SectionTitle({ title, action }: { title: string; action: string }) { return <View style={styles.sectionTitle}><Text style={styles.sectionTitleText}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.porcelain },
  desktopStage: { flex: 1, backgroundColor: colors.porcelain },
  desktopStageWide: { paddingVertical: 18, alignItems: "center", backgroundColor: "#E9E5F1" },
  phone: { flex: 1, width: "100%", backgroundColor: colors.porcelain, overflow: "hidden" },
  phoneWide: { maxWidth: 540, borderRadius: 28 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.porcelain },
  header: { height: 66, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EAE6EF", backgroundColor: "#F4F2FAF0" },
  wordmark: { fontFamily: typography.display, fontSize: 23, color: colors.graphite, letterSpacing: -1.3 },
  headerSub: { fontFamily: typography.bodyMedium, fontSize: 9.5, color: colors.secondary, marginTop: -1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  plusBadge: { height: 33, paddingHorizontal: 10, borderRadius: 17, backgroundColor: colors.violetMist, flexDirection: "row", alignItems: "center", gap: 5 },
  plusBadgeText: { fontFamily: typography.bodySemibold, fontSize: 10, color: colors.ultraviolet, letterSpacing: 0.7 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 23, paddingBottom: 124 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { fontFamily: typography.bodySemibold, fontSize: 10, color: colors.ultraviolet, letterSpacing: 1.2, marginBottom: 7 },
  heroTitle: { fontFamily: typography.display, fontSize: 29, lineHeight: 35, color: colors.graphite, letterSpacing: -1.5 },
  screenTitle: { fontFamily: typography.display, fontSize: 28, lineHeight: 34, color: colors.graphite, letterSpacing: -1.4 },
  weatherOrb: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.warm, alignItems: "center", justifyContent: "center" },
  weatherEmoji: { fontSize: 17, lineHeight: 18 },
  weatherTemp: { fontFamily: typography.bodySemibold, fontSize: 12, color: colors.graphite },
  lead: { fontFamily: typography.body, fontSize: 14, lineHeight: 21, color: colors.secondary, marginTop: 9, marginBottom: 17 },
  styleDna: { height: 62, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: "hidden", flexDirection: "row", alignItems: "center", paddingRight: 14, marginBottom: 14 },
  styleStripe: { width: 8, alignSelf: "stretch" },
  styleDnaCopy: { flex: 1, paddingHorizontal: 13 },
  miniLabel: { fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.secondary, letterSpacing: 1.1 },
  styleDnaName: { fontFamily: typography.bodySemibold, fontSize: 14, color: colors.graphite, marginTop: 4 },
  heroLookCard: { minHeight: 450, borderRadius: 28, overflow: "hidden", padding: 18, borderWidth: 1, borderColor: "#FFFFFFA0" },
  heroLookTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 1 },
  lookMood: { fontFamily: typography.displaySoft, fontSize: 16, color: colors.graphite, marginTop: 4, textTransform: "capitalize" },
  matchPill: { paddingHorizontal: 10, height: 31, borderRadius: 16, backgroundColor: "#FFFFFFD6", flexDirection: "row", alignItems: "center", gap: 5 },
  matchText: { fontFamily: typography.bodySemibold, fontSize: 11, color: colors.ultraviolet },
  outfitCanvas: { minHeight: 210, paddingVertical: 14, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center", gap: 9 },
  outfitCanvasLarge: { minHeight: 324, paddingTop: 25, paddingBottom: 10 },
  outfitPiece: { width: "29%", minHeight: 88, alignItems: "center", justifyContent: "center" },
  outfitPieceLarge: { width: "28%", minHeight: 112 },
  outfitColor: { width: "100%", aspectRatio: 1.08, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#FFFFFFB8" },
  outfitImage: { width: "100%", height: 90 },
  outfitItemName: { fontFamily: typography.bodyMedium, fontSize: 8.2, color: colors.graphite, marginTop: 4, maxWidth: "100%" },
  totalLookSummary: { borderRadius: 17, backgroundColor: "#FFFFFFC9", padding: 11, marginBottom: 11 },
  totalLookSummaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  totalLookLabel: { fontFamily: typography.bodySemibold, fontSize: 8, color: colors.ultraviolet, letterSpacing: 1.05 },
  freeBadge: { borderRadius: 10, backgroundColor: colors.mint, paddingHorizontal: 7, paddingVertical: 4 },
  freeBadgeText: { fontFamily: typography.bodySemibold, fontSize: 7, color: colors.success, letterSpacing: 0.5 },
  totalLookChips: { flexDirection: "row", gap: 6 },
  totalLookChip: { flex: 1, minWidth: 0, borderRadius: 12, backgroundColor: "#FFFFFFA8", padding: 8 },
  totalLookChipLabel: { fontFamily: typography.bodySemibold, fontSize: 7.2, color: colors.secondary },
  totalLookChipValue: { fontFamily: typography.bodySemibold, fontSize: 8.2, color: colors.graphite, marginTop: 3 },
  heroActions: { flexDirection: "row", gap: 9, marginTop: 4 },
  secondaryAction: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: colors.paper, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: colors.line },
  secondaryActionText: { fontFamily: typography.bodySemibold, fontSize: 12, color: colors.graphite },
  primaryAction: { flex: 1.25, minHeight: 48, borderRadius: 16, backgroundColor: colors.graphite, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  primaryActionText: { fontFamily: typography.bodySemibold, fontSize: 12, color: colors.paper },
  sectionTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 27, marginBottom: 12 },
  sectionTitleText: { fontFamily: typography.displaySoft, fontSize: 16, color: colors.graphite, letterSpacing: -0.5 },
  sectionAction: { fontFamily: typography.bodySemibold, fontSize: 10, color: colors.ultraviolet },
  aiCard: { borderRadius: 23, backgroundColor: colors.paper, padding: 15, borderWidth: 1, borderColor: colors.line },
  aiIdentity: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  aiMark: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.ultraviolet },
  aiName: { fontFamily: typography.bodySemibold, fontSize: 12.5, color: colors.graphite },
  aiStatus: { fontFamily: typography.body, fontSize: 10, color: colors.success, marginTop: 2 },
  aiAnswer: { fontFamily: typography.body, fontSize: 12.5, lineHeight: 19, color: colors.graphite, backgroundColor: colors.violetMist, borderRadius: 14, padding: 12, marginBottom: 10 },
  aiComposer: { height: 48, backgroundColor: "#F6F4F8", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingLeft: 13, paddingRight: 5 },
  aiInput: { flex: 1, fontFamily: typography.body, fontSize: 11.5, color: colors.graphite, outlineStyle: "none" } as never,
  aiSend: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center" },
  quickPrompts: { gap: 7, paddingTop: 10 },
  promptChip: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  promptChipText: { fontFamily: typography.bodyMedium, fontSize: 9.5, color: colors.secondary },
  challengeCard: { borderRadius: 20, backgroundColor: colors.paper, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.line },
  challengeIcon: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm },
  challengeTitle: { fontFamily: typography.bodySemibold, fontSize: 12, color: colors.graphite },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#E9E6EC", marginTop: 8, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.coral },
  challengeMeta: { fontFamily: typography.bodyMedium, fontSize: 9, color: colors.secondary, marginTop: 5 },
  screenTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roundSearch: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  feedTabs: { flexDirection: "row", gap: 20, borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 20, marginBottom: 13 },
  feedTab: { fontFamily: typography.bodySemibold, fontSize: 11, color: colors.secondary, paddingBottom: 11 },
  feedTabActive: { fontFamily: typography.bodySemibold, fontSize: 11, color: colors.graphite, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: colors.ultraviolet },
  searchBar: { height: 45, backgroundColor: colors.paper, borderRadius: 15, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9 },
  searchInput: { flex: 1, fontFamily: typography.body, fontSize: 11.5, color: colors.graphite, outlineStyle: "none" } as never,
  searchResults: { marginTop: 8, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  requestPanel: { marginTop: 10, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  requestTitle: { fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.ultraviolet, letterSpacing: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  searchResult: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  followButton: { minWidth: 68, borderRadius: 13, backgroundColor: colors.violetMist, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" },
  followButtonText: { fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.ultraviolet },
  acceptButton: { borderRadius: 13, backgroundColor: colors.ultraviolet, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  acceptButtonText: { fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.paper },
  trendRail: { gap: 9, paddingVertical: 14 },
  trendCard: { width: 110, height: 78, backgroundColor: colors.paper, borderRadius: 16, overflow: "hidden", paddingBottom: 8, borderWidth: 1, borderColor: colors.line },
  trendPalette: { flexDirection: "row", height: 28 },
  trendName: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: colors.graphite, paddingHorizontal: 9, marginTop: 6 },
  trendChange: { position: "absolute", right: 8, bottom: 7, fontFamily: typography.bodySemibold, fontSize: 8, color: colors.success },
  feedList: { gap: 15 },
  emptyFeed: { alignItems: "center", gap: 8, borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 28, paddingVertical: 34 },
  postCard: { backgroundColor: colors.paper, borderRadius: 24, padding: 13, borderWidth: 1, borderColor: colors.line },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 11 },
  avatar: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontFamily: typography.displaySoft, fontSize: 14, color: colors.graphite },
  postName: { fontFamily: typography.bodySemibold, fontSize: 11.5, color: colors.graphite },
  postHandle: { fontFamily: typography.body, color: colors.secondary },
  postTime: { fontFamily: typography.body, fontSize: 9.5, color: colors.secondary, marginTop: 2 },
  postCanvas: { minHeight: 235, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  postCaption: { fontFamily: typography.bodyMedium, fontSize: 11.5, lineHeight: 17, color: colors.graphite, marginTop: 11 },
  postActions: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 15 },
  socialAction: { flexDirection: "row", alignItems: "center", gap: 5 },
  socialCount: { fontFamily: typography.bodySemibold, fontSize: 10, color: colors.secondary },
  remixButton: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.violetMist, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  remixText: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.ultraviolet },
  fieldCaption: { fontFamily: typography.bodySemibold, fontSize: 9, color: colors.secondary, letterSpacing: 1.1, marginTop: 9, marginBottom: 9 },
  occasionRail: { gap: 8, paddingBottom: 20 },
  occasionCard: { width: 91, height: 71, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  occasionCardActive: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  occasionEmoji: { fontSize: 18, marginBottom: 5 },
  occasionLabel: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.secondary },
  occasionLabelActive: { color: colors.paper },
  createStyleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  createStyleName: { fontFamily: typography.displaySoft, fontSize: 14, color: colors.graphite, textTransform: "capitalize" },
  builderCanvas: { minHeight: 430, borderRadius: 27, overflow: "hidden", padding: 15 },
  totalLookGuide: { borderRadius: 20, backgroundColor: "#FFFFFFD9", padding: 12, gap: 8 },
  totalLookGuideHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 2 },
  totalLookGuideTitle: { fontFamily: typography.displaySoft, fontSize: 11, color: colors.graphite, marginTop: 4 },
  guideCard: { borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 10 },
  guideCardEyebrow: { fontFamily: typography.bodySemibold, fontSize: 7.2, color: colors.ultraviolet, letterSpacing: 0.7 },
  guideCardTitle: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: colors.graphite, marginTop: 5 },
  guideCardBody: { fontFamily: typography.body, fontSize: 9, lineHeight: 13.5, color: colors.secondary, marginTop: 3 },
  colorAdvice: { fontFamily: typography.bodyMedium, fontSize: 8.5, lineHeight: 13, color: colors.ultraviolet, backgroundColor: colors.violetMist, borderRadius: 10, padding: 7, marginTop: 7 },
  lookDots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 13 },
  lookDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBC6D1" },
  lookDotActive: { width: 22, backgroundColor: colors.ultraviolet },
  builderActions: { flexDirection: "row", gap: 9 },
  tipCard: { flexDirection: "row", gap: 10, borderRadius: 18, backgroundColor: colors.violetMist, padding: 13, marginTop: 13 },
  tipText: { flex: 1, fontFamily: typography.body, fontSize: 10.5, lineHeight: 16, color: colors.secondary },
  addRound: { width: 45, height: 45, borderRadius: 17, backgroundColor: colors.ultraviolet, alignItems: "center", justifyContent: "center" },
  closetStats: { backgroundColor: colors.paper, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 16, marginTop: 18, borderWidth: 1, borderColor: colors.line },
  statValue: { fontFamily: typography.displaySoft, fontSize: 18, color: colors.graphite, textAlign: "center" },
  statLabel: { fontFamily: typography.body, fontSize: 8.5, color: colors.secondary, textAlign: "center", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.line },
  scanCard: { minHeight: 81, borderRadius: 21, overflow: "hidden", padding: 14, flexDirection: "row", alignItems: "center", gap: 11, marginTop: 13 },
  scanIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
  scanTitle: { fontFamily: typography.bodySemibold, fontSize: 12.5, color: colors.paper },
  scanBody: { fontFamily: typography.body, fontSize: 9.5, color: "#E8E1FF", marginTop: 3 },
  filterRail: { gap: 7, paddingVertical: 15 },
  filterChip: { borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.paper },
  filterChipActive: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  filterText: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.secondary },
  filterTextActive: { color: colors.paper },
  closetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  closetItem: { width: "31%", marginBottom: 6 },
  closetArt: { width: "100%", aspectRatio: 0.95, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  closetImage: { width: "100%", height: "100%", resizeMode: "contain" },
  processingBadge: { position: "absolute", right: 6, top: 6, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.paper, flexDirection: "row", alignItems: "center", gap: 2 },
  processingText: { fontFamily: typography.bodySemibold, fontSize: 7.5, color: colors.ultraviolet },
  closetName: { fontFamily: typography.bodySemibold, fontSize: 9.5, lineHeight: 13, color: colors.graphite, marginTop: 6 },
  closetMeta: { fontFamily: typography.body, fontSize: 8, color: colors.success, marginTop: 2 },
  profileHero: { minHeight: 238, borderRadius: 27, overflow: "hidden", alignItems: "center", padding: 23 },
  profileAvatar: { width: 72, height: 72, borderRadius: 27, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.paper },
  profileAvatarText: { fontFamily: typography.display, fontSize: 25, color: colors.paper },
  profileName: { fontFamily: typography.displaySoft, fontSize: 20, color: colors.graphite, marginTop: 10 },
  profileHandle: { fontFamily: typography.bodyMedium, fontSize: 10.5, color: colors.secondary, marginTop: 2 },
  editProfile: { borderRadius: 14, backgroundColor: "#FFFFFFC9", paddingHorizontal: 14, paddingVertical: 8, marginTop: 12 },
  editProfileText: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.graphite },
  profileStats: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 18 },
  profileStatValue: { fontFamily: typography.displaySoft, fontSize: 17, color: colors.graphite, textAlign: "center" },
  profileStatLabel: { fontFamily: typography.body, fontSize: 8.5, color: colors.secondary, marginTop: 3 },
  profileStyleCard: { backgroundColor: colors.paper, borderRadius: 22, borderWidth: 1, borderColor: colors.line, overflow: "hidden", padding: 16, paddingLeft: 24 },
  profileStyleName: { fontFamily: typography.displaySoft, fontSize: 15, color: colors.graphite, marginTop: 7, textTransform: "capitalize" },
  profileStyleBody: { fontFamily: typography.body, fontSize: 10.5, lineHeight: 16, color: colors.secondary, marginTop: 7 },
  appearanceProfileCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.paper, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 13, marginTop: 11 },
  appearanceProfileIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.violetMist, alignItems: "center", justifyContent: "center" },
  privacyCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.paper, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 13, marginTop: 11 },
  privacyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.violetMist, alignItems: "center", justifyContent: "center" },
  privacyTitle: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: colors.graphite },
  privacyBody: { fontFamily: typography.body, fontSize: 9, lineHeight: 13, color: colors.secondary, marginTop: 3 },
  plusCard: { minHeight: 79, borderRadius: 21, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 12, padding: 15, marginTop: 11 },
  plusTitle: { fontFamily: typography.displaySoft, fontSize: 12, color: colors.paper },
  plusBody: { fontFamily: typography.body, fontSize: 9.5, color: "#D6CDE6", marginTop: 3 },
  emptyLooks: { minHeight: 110, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: "#C8C1CF", alignItems: "center", justifyContent: "center", padding: 20 },
  emptyLooksText: { fontFamily: typography.body, fontSize: 10.5, color: colors.secondary, textAlign: "center", marginTop: 7 },
  deleteAccount: { alignSelf: "center", padding: 12, marginTop: 18 },
  deleteAccountText: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.danger },
  miniLooks: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  miniLook: { width: "48%", minHeight: 200, borderRadius: 18, backgroundColor: colors.violetMist, overflow: "hidden" },
  bottomNav: { position: "absolute", left: 10, right: 10, bottom: 8, height: 72, borderRadius: 25, borderWidth: 1, borderColor: "#FFFFFF", overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 5 },
  navItem: { flex: 1, height: 62, alignItems: "center", justifyContent: "center", gap: 3 },
  navLabel: { fontFamily: typography.bodySemibold, fontSize: 7.8, color: colors.secondary },
  navLabelActive: { color: colors.ultraviolet },
  createNav: { marginTop: -12 },
  createNavIcon: { width: 43, height: 43, borderRadius: 17, backgroundColor: colors.ultraviolet, alignItems: "center", justifyContent: "center" },
  toast: { position: "absolute", left: 28, right: 28, bottom: 89, minHeight: 46, borderRadius: 16, backgroundColor: colors.graphite, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 13 },
  toastText: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: colors.paper, textAlign: "center" },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 30, backgroundColor: colors.porcelain },
  fullScreen: { flex: 1, backgroundColor: colors.porcelain },
  overlayHeader: { height: 62, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  overlayTitle: { fontFamily: typography.displaySoft, fontSize: 16, color: colors.graphite },
  closeButton: { width: 42, height: 42, borderRadius: 17, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  closeButtonLight: { backgroundColor: "#FFFFFF14", borderColor: "#FFFFFF24" },
  onboarding: { flex: 1, backgroundColor: colors.porcelain },
  onboardingTop: { height: 65, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  onboardingContent: { padding: 19, paddingBottom: 30 },
  onboardingStep: { fontFamily: typography.bodySemibold, fontSize: 9.5, color: colors.ultraviolet, letterSpacing: 1.2, marginBottom: 15 },
  onboardingTitle: { fontFamily: typography.display, fontSize: 28, lineHeight: 35, color: colors.graphite, letterSpacing: -1.5 },
  onboardingLead: { fontFamily: typography.body, fontSize: 13, lineHeight: 20, color: colors.secondary, marginTop: 10, marginBottom: 21 },
  languageCards: { gap: 10 },
  languageCard: { height: 78, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, gap: 14 },
  languageCardActive: { borderColor: colors.ultraviolet, borderWidth: 2 },
  languageCode: { width: 37, fontFamily: typography.displaySoft, fontSize: 11, color: colors.ultraviolet },
  languageName: { flex: 1, fontFamily: typography.displaySoft, fontSize: 17, color: colors.graphite },
  agePicker: { height: 136, borderRadius: 25, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 35 },
  ageButton: { width: 43, height: 43, borderRadius: 16, backgroundColor: colors.porcelain, alignItems: "center", justifyContent: "center" },
  ageNumber: { fontFamily: typography.display, fontSize: 51, lineHeight: 56, color: colors.graphite, textAlign: "center" },
  ageYears: { fontFamily: typography.bodyMedium, fontSize: 9, color: colors.secondary, textAlign: "center" },
  ageModeCard: { flexDirection: "row", gap: 8, backgroundColor: colors.violetMist, borderRadius: 16, padding: 11, marginTop: 10, marginBottom: 18 },
  ageModeText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 10, lineHeight: 15, color: colors.graphite },
  inputLabel: { fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.secondary, letterSpacing: 1, marginBottom: 6, marginTop: 9 },
  bigInput: { height: 51, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontFamily: typography.bodySemibold, fontSize: 14, color: colors.graphite, outlineStyle: "none" } as never,
  handleInput: { height: 51, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  handlePrefix: { fontFamily: typography.bodySemibold, fontSize: 14, color: colors.ultraviolet },
  handleTextInput: { flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, color: colors.graphite, outlineStyle: "none" } as never,
  styleChoiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  styleChoice: { width: "48%", minHeight: 81, borderRadius: 18, overflow: "hidden", backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, paddingBottom: 9 },
  styleChoiceActive: { borderColor: colors.ultraviolet, borderWidth: 2 },
  styleChoicePalette: { height: 29, flexDirection: "row" },
  styleChoiceName: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: colors.graphite, paddingHorizontal: 10, paddingTop: 9 },
  styleSelected: { position: "absolute", right: 7, bottom: 7, width: 21, height: 21, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.ultraviolet },
  appearanceLabel: { fontFamily: typography.bodySemibold, fontSize: 8.5, letterSpacing: 1.1, color: colors.secondary, marginTop: 17, marginBottom: 9 },
  genderGrid: { gap: 8 },
  genderCard: { minHeight: 66, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13 },
  genderCardActive: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  genderSymbol: { width: 34, fontFamily: typography.displaySoft, fontSize: 19, color: colors.ultraviolet, textAlign: "center" },
  genderSymbolActive: { color: colors.warm },
  genderTitle: { fontFamily: typography.bodySemibold, fontSize: 11.5, color: colors.graphite },
  genderTitleActive: { color: colors.paper },
  genderBody: { fontFamily: typography.body, fontSize: 9, color: colors.secondary, marginTop: 2 },
  genderBodyActive: { color: "#CFC8DA" },
  appearanceRail: { gap: 7, paddingRight: 6 },
  appearanceChoice: { minHeight: 42, borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" },
  appearanceChoiceActive: { backgroundColor: colors.graphite, borderColor: colors.graphite },
  appearanceChoiceText: { fontFamily: typography.bodySemibold, fontSize: 9, color: colors.secondary },
  appearanceChoiceTextActive: { color: colors.paper },
  hairColorChoice: { minWidth: 101, height: 46, borderRadius: 15, paddingHorizontal: 9, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 7 },
  hairColorChoiceActive: { borderColor: colors.ultraviolet, borderWidth: 2 },
  hairColorSwatch: { width: 24, height: 24, borderRadius: 9, borderWidth: 1, borderColor: "#00000012" },
  hairColorText: { flex: 1, fontFamily: typography.bodySemibold, fontSize: 8.5, color: colors.graphite },
  appearancePrivacy: { flexDirection: "row", gap: 9, borderRadius: 16, backgroundColor: colors.violetMist, padding: 12, marginTop: 17 },
  appearancePrivacyText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 9.5, lineHeight: 14.5, color: colors.graphite },
  onboardingFooter: { minHeight: 76, paddingHorizontal: 18, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: 1, borderTopColor: colors.line },
  backRound: { width: 49, height: 49, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  onboardingCta: { flex: 1, height: 51, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.graphite },
  onboardingCtaText: { fontFamily: typography.bodySemibold, fontSize: 12, color: colors.paper },
  lockedChat: { flex: 1, alignItems: "center", justifyContent: "center", padding: 35 },
  lockedIcon: { width: 65, height: 65, borderRadius: 24, backgroundColor: colors.violetMist, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  lockedTitle: { fontFamily: typography.displaySoft, fontSize: 16, color: colors.graphite, textAlign: "center" },
  lockedBody: { fontFamily: typography.body, fontSize: 11.5, lineHeight: 18, color: colors.secondary, textAlign: "center", marginTop: 8 },
  lockedSocialCard: { minHeight: 270, marginTop: 20, backgroundColor: colors.paper, borderRadius: 26, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", padding: 30 },
  conversationList: { padding: 17, gap: 8 },
  conversationRow: { minHeight: 68, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  conversationText: { fontFamily: typography.body, fontSize: 10.5, color: colors.secondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  messageThread: { flexGrow: 1, padding: 18, gap: 10, justifyContent: "flex-end" },
  messageIncoming: { maxWidth: "79%", alignSelf: "flex-start", borderRadius: 18, borderBottomLeftRadius: 5, backgroundColor: colors.paper, padding: 12 },
  messageOutgoing: { maxWidth: "79%", alignSelf: "flex-end", borderRadius: 18, borderBottomRightRadius: 5, backgroundColor: colors.ultraviolet, padding: 12 },
  messageText: { fontFamily: typography.body, fontSize: 11.5, lineHeight: 17, color: colors.graphite },
  messageTextOutgoing: { fontFamily: typography.body, fontSize: 11.5, lineHeight: 17, color: colors.paper },
  safetyNotice: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: "#ECE9F0" },
  safetyNoticeText: { fontFamily: typography.bodyMedium, fontSize: 8.5, color: colors.secondary },
  messageComposer: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper },
  messageInput: { flex: 1, height: 43, borderRadius: 15, backgroundColor: colors.porcelain, paddingHorizontal: 12, fontFamily: typography.body, fontSize: 11.5, outlineStyle: "none" } as never,
  messageSend: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.ultraviolet, alignItems: "center", justifyContent: "center" },
  paywall: { flex: 1, backgroundColor: colors.night },
  paywallContent: { paddingHorizontal: 23, paddingBottom: 40, alignItems: "center" },
  paywallMark: { width: 65, height: 65, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF15", marginTop: 22 },
  paywallEyebrow: { fontFamily: typography.bodySemibold, fontSize: 10, letterSpacing: 1.7, color: colors.warm, marginTop: 16 },
  paywallTitle: { fontFamily: typography.display, fontSize: 27, lineHeight: 34, color: colors.paper, textAlign: "center", letterSpacing: -1.4, marginTop: 8 },
  paywallLead: { fontFamily: typography.body, fontSize: 11.5, lineHeight: 18, color: "#D0C8DD", textAlign: "center", marginTop: 10 },
  coreFreeNotice: { width: "100%", borderRadius: 16, backgroundColor: "#FFFFFF10", borderWidth: 1, borderColor: "#FFFFFF1A", flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 11, marginTop: 18 },
  coreFreeNoticeText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 9.5, lineHeight: 14.5, color: colors.paper },
  featureList: { width: "100%", gap: 12, marginTop: 18 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 24, height: 24, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.warm },
  featureText: { fontFamily: typography.bodyMedium, fontSize: 11, color: colors.paper },
  billingSwitch: { width: "100%", minHeight: 53, borderRadius: 18, backgroundColor: "#FFFFFF12", flexDirection: "row", padding: 5, marginTop: 25 },
  billingOption: { flex: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  billingOptionActive: { backgroundColor: colors.paper },
  billingText: { fontFamily: typography.bodySemibold, fontSize: 10.5, color: "#CFC6DB" },
  billingTextActive: { color: colors.graphite },
  saveText: { fontFamily: typography.bodySemibold, fontSize: 8, color: colors.success },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 18 },
  price: { fontFamily: typography.display, fontSize: 31, color: colors.paper },
  pricePeriod: { fontFamily: typography.bodyMedium, fontSize: 10, color: "#CFC6DB", marginBottom: 6 },
  paywallCta: { width: "100%", height: 55, borderRadius: 18, backgroundColor: colors.warm, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 16 },
  paywallCtaText: { fontFamily: typography.bodySemibold, fontSize: 11.5, color: colors.night },
  paywallFine: { fontFamily: typography.body, fontSize: 8.5, color: "#AAA0B9", textAlign: "center", marginTop: 10 },
});
