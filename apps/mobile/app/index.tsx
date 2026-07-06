import type { AutonomyMode, Locale, OutfitOption, StyleDefinition, WardrobeItemInput } from "@kidz/contracts";
import { generateOutfits, getStyles } from "@kidz/domain";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, ChevronLeft, Minus, Plus, Search, Shirt, Sparkles, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

import { persistAndGenerate } from "../src/api";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { StepHeader } from "../src/components/StepHeader";
import { StyleRibbon } from "../src/components/StyleRibbon";
import { t } from "../src/copy";
import { quickItems, STARTER_WARDROBE } from "../src/demo";
import { colors, typography } from "../src/theme";

type Step = "language" | "profile" | "styles" | "wardrobe" | "outfits";
type LocalItem = Omit<WardrobeItemInput, "profileId"> & { localId: string };

const steps: Step[] = ["language", "profile", "styles", "wardrobe", "outfits"];
const weather = { temperatureC: 8, feelsLikeC: 6, rainProbability: 0.3, windKph: 28, occasion: "school" as const };

const autonomyForAge = (age: number): AutonomyMode => {
  if (age <= 5) return "PARENT_DECIDES";
  if (age <= 9) return "TOGETHER";
  return "USER_DECIDES";
};

const reasonLabel = (locale: Locale, code: string) => {
  if (code === "STYLE_MATCH") return t(locale, "styleMatch");
  if (code === "COOL_WEATHER_LAYER") return t(locale, "coolLayer");
  if (code === "COMPLETE_LOOK") return t(locale, "completeLook");
  if (code === "PARTIAL_WARDROBE") return t(locale, "partial");
  return code.replaceAll("_", " ").toLowerCase();
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState<Step>("language");
  const [locale, setLocale] = useState<Locale>("ru");
  const [age, setAge] = useState(13);
  const [autonomy, setAutonomy] = useState<AutonomyMode>("USER_DECIDES");
  const [selectedStyleIds, setSelectedStyleIds] = useState(["stockholm", "emo"]);
  const [search, setSearch] = useState("");
  const [wardrobe, setWardrobe] = useState<LocalItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncMode, setSyncMode] = useState<"online" | "local">("local");

  const catalog = useMemo(() => getStyles(locale), [locale]);
  const selectedStyles = useMemo(
    () => catalog.filter((style) => selectedStyleIds.includes(style.id)),
    [catalog, selectedStyleIds],
  );
  const visibleStyles = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((style) =>
      [style.name, style.description, ...style.aliases].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [catalog, search]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const goNext = () => {
    const index = steps.indexOf(step);
    if (index < steps.length - 1) setStep(steps[index + 1] ?? step);
  };
  const goBack = () => {
    const index = steps.indexOf(step);
    if (index > 0) setStep(steps[index - 1] ?? step);
  };

  const changeAge = (next: number) => {
    const value = Math.max(0, Math.min(18, next));
    setAge(value);
    setAutonomy(autonomyForAge(value));
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((current) => {
      if (current.includes(styleId)) return current.filter((id) => id !== styleId);
      if (current.length >= 3) return [...current.slice(1), styleId];
      return [...current, styleId];
    });
  };

  const addDemoWardrobe = () => {
    setWardrobe(
      STARTER_WARDROBE.map((item, index) => ({
        ...item,
        styleIds: item.styleIds.length ? item.styleIds : selectedStyleIds,
        localId: `demo-${index}`,
      })),
    );
  };

  const addQuickItem = (slot: keyof typeof quickItems) => {
    const source = quickItems[slot];
    setWardrobe((current) => [
      ...current,
      { ...source, styleIds: selectedStyleIds, localId: `${slot}-${Date.now()}` },
    ]);
  };

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.72,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const source = quickItems.top;
    setWardrobe((current) => [
      ...current,
      {
        ...source,
        name: locale === "ru" ? "Вещь с фото" : "Photo item",
        styleIds: selectedStyleIds,
        imageUri: asset.uri,
        localId: `photo-${Date.now()}`,
      },
    ]);
  };

  const buildOutfits = async () => {
    setLoading(true);
    const profile = {
      displayName: age >= 10 ? "My style" : "Family profile",
      locale,
      ageYears: age,
      autonomyMode: autonomy,
      styleMix: selectedStyleIds.map((styleId) => ({ styleId, weight: 1 / selectedStyleIds.length })),
    };
    const items = wardrobe.map(({ localId: _localId, ...item }) => item);
    try {
      const result = await persistAndGenerate(profile, items, weather);
      setOutfits(result.options);
      setSyncMode("online");
    } catch {
      setOutfits(generateOutfits({ profile, wardrobe: items, weather }));
      setSyncMode("local");
    } finally {
      setLoading(false);
      setStep("outfits");
    }
  };

  const content = (
    <View style={[styles.content, wide && styles.contentWide]}>
      <View style={styles.mobileBrand}>
        <Text style={styles.wordmark}>KIDZ/</Text>
        <Text style={styles.progress}>{steps.indexOf(step) + 1}—{steps.length}</Text>
      </View>

      {step !== "language" && (
        <Pressable onPress={goBack} accessibilityRole="button" style={styles.backButton}>
          <ChevronLeft size={18} color={colors.graphite} />
          <Text style={styles.backText}>{t(locale, "back")}</Text>
        </Pressable>
      )}

      {step === "language" && (
        <View>
          <StepHeader step={1} eyebrow={t(locale, "languageEyebrow")} title={t(locale, "languageTitle")} body={t(locale, "languageBody")} />
          <View style={styles.languageGrid}>
            {(["ru", "en"] as Locale[]).map((item) => (
              <Pressable key={item} onPress={() => setLocale(item)} style={[styles.languageCard, locale === item && styles.languageCardSelected]}>
                <Text style={styles.languageCode}>{item.toUpperCase()}</Text>
                <Text style={styles.languageName}>{item === "ru" ? "Русский" : "English"}</Text>
                {locale === item && <Check size={20} color={colors.ultraviolet} />}
              </Pressable>
            ))}
          </View>
          <PrimaryButton label={t(locale, "next")} onPress={goNext} />
        </View>
      )}

      {step === "profile" && (
        <View>
          <StepHeader step={2} eyebrow={t(locale, "profileEyebrow")} title={t(locale, "profileTitle")} body={t(locale, "profileBody")} />
          <View style={styles.agePanel}>
            <Text style={styles.fieldLabel}>{t(locale, "age")}</Text>
            <View style={styles.ageControls}>
              <Pressable style={styles.squareControl} onPress={() => changeAge(age - 1)}><Minus size={20} color={colors.graphite} /></Pressable>
              <Text style={styles.ageValue}>{age}</Text>
              <Pressable style={styles.squareControl} onPress={() => changeAge(age + 1)}><Plus size={20} color={colors.graphite} /></Pressable>
            </View>
            <View style={styles.ageTrack}>
              <View style={[styles.ageTrackFill, { width: `${(age / 18) * 100}%` }]} />
            </View>
            <View style={styles.ageLabels}><Text style={styles.utility}>0</Text><Text style={styles.utility}>6</Text><Text style={styles.utility}>10</Text><Text style={styles.utility}>18</Text></View>
          </View>
          <View style={{ gap: 10, marginBottom: 24 }}>
            {([
              ["PARENT_DECIDES", "parentDecides", "parentDecidesBody"],
              ["TOGETHER", "together", "togetherBody"],
              ["USER_DECIDES", "userDecides", "userDecidesBody"],
            ] as const).map(([value, titleKey, bodyKey]) => (
              <Pressable key={value} onPress={() => setAutonomy(value)} style={[styles.choiceRow, autonomy === value && styles.choiceRowSelected]}>
                <View style={[styles.radio, autonomy === value && styles.radioSelected]}>{autonomy === value && <View style={styles.radioDot} />}</View>
                <View style={{ flex: 1 }}><Text style={styles.choiceTitle}>{t(locale, titleKey)}</Text><Text style={styles.choiceBody}>{t(locale, bodyKey)}</Text></View>
              </Pressable>
            ))}
          </View>
          <PrimaryButton label={t(locale, "next")} onPress={goNext} />
        </View>
      )}

      {step === "styles" && (
        <View>
          <StepHeader step={3} eyebrow={t(locale, "styleEyebrow")} title={t(locale, "styleTitle")} body={t(locale, "styleBody")} />
          <View style={styles.mixPanel}>
            <StyleRibbon styles={selectedStyles} />
            <View style={styles.mixContent}>
              <Text style={styles.fieldLabel}>{t(locale, "selected")} · {selectedStyleIds.length}/3</Text>
              <Text style={styles.mixText}>{selectedStyles.map((style) => style.name).join(" + ") || "—"}</Text>
            </View>
          </View>
          <View style={styles.searchBox}><Search size={18} color={colors.secondary} /><TextInput value={search} onChangeText={setSearch} placeholder={t(locale, "searchStyle")} placeholderTextColor="#9A9EA8" style={styles.searchInput} /></View>
          <View style={styles.styleGrid}>
            {visibleStyles.map((style) => {
              const selected = selectedStyleIds.includes(style.id);
              return (
                <Pressable key={style.id} onPress={() => toggleStyle(style.id)} style={[styles.styleCard, selected && styles.styleCardSelected]}>
                  <View style={styles.paletteRow}>{style.palette.map((color) => <View key={color} style={{ flex: 1, height: 6, backgroundColor: color }} />)}</View>
                  <Text style={styles.styleName}>{style.name}</Text>
                  <Text numberOfLines={2} style={styles.styleDescription}>{style.description}</Text>
                  <View style={[styles.styleCheck, selected && styles.styleCheckSelected]}>{selected && <Check size={14} color={colors.paper} />}</View>
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton label={t(locale, "next")} onPress={goNext} disabled={!selectedStyleIds.length} />
        </View>
      )}

      {step === "wardrobe" && (
        <View>
          <StepHeader step={4} eyebrow={t(locale, "wardrobeEyebrow")} title={t(locale, "wardrobeTitle")} body={t(locale, "wardrobeBody")} />
          <View style={styles.actionPair}>
            <Pressable onPress={addPhoto} style={styles.photoAction}><Camera size={22} color={colors.paper} /><Text style={styles.photoActionText}>{t(locale, "addPhoto")}</Text></Pressable>
            <Pressable onPress={addDemoWardrobe} style={styles.demoAction}><Sparkles size={21} color={colors.ultraviolet} /><Text style={styles.demoActionText}>{t(locale, "addDemo")}</Text></Pressable>
          </View>
          <Text style={[styles.fieldLabel, { marginTop: 22, marginBottom: 9 }]}>{t(locale, "quickAdd")}</Text>
          <View style={styles.quickRow}>
            {(["top", "bottom", "footwear", "outerwear"] as const).map((slot) => (
              <Pressable key={slot} onPress={() => addQuickItem(slot)} style={styles.quickChip}><Plus size={14} color={colors.graphite} /><Text style={styles.quickText}>{slot}</Text></Pressable>
            ))}
          </View>
          <View style={styles.wardrobeList}>
            {!wardrobe.length && <View style={styles.emptyState}><Shirt size={28} color="#9AA0AA" /><Text style={styles.emptyText}>{t(locale, "wardrobeEmpty")}</Text></View>}
            {wardrobe.map((item) => (
              <View key={item.localId} style={styles.garmentRow}>
                {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.garmentImage} /> : <View style={[styles.garmentSwatch, { backgroundColor: item.colors[0] ?? colors.powder }]}><Shirt size={19} color={colors.paper} /></View>}
                <View style={{ flex: 1 }}><Text style={styles.garmentName}>{item.name}</Text><Text style={styles.garmentMeta}>{item.slot} · warmth {item.warmth}/4</Text></View>
                <Pressable onPress={() => setWardrobe((current) => current.filter((currentItem) => currentItem.localId !== item.localId))} hitSlop={10}><Trash2 size={18} color="#9A5B57" /></Pressable>
              </View>
            ))}
          </View>
          <PrimaryButton label={loading ? t(locale, "loading") : t(locale, "buildLooks")} onPress={buildOutfits} disabled={loading || wardrobe.length < 3} />
        </View>
      )}

      {step === "outfits" && (
        <View>
          <StepHeader step={5} eyebrow={t(locale, "outfitsEyebrow")} title={t(locale, "outfitsTitle")} body={t(locale, "outfitsBody")} />
          <View style={[styles.syncBanner, syncMode === "online" && styles.syncBannerOnline]}>
            <View style={[styles.syncDot, syncMode === "online" && styles.syncDotOnline]} />
            <View style={{ flex: 1 }}><Text style={styles.syncTitle}>{t(locale, syncMode === "online" ? "onlineMode" : "localMode")}</Text>{syncMode === "local" && <Text style={styles.syncBody}>{t(locale, "localModeBody")}</Text>}</View>
          </View>
          {loading ? <ActivityIndicator size="large" color={colors.ultraviolet} /> : (
            <View style={{ gap: 16 }}>
              {outfits.map((option, index) => (
                <View key={option.id} style={styles.outfitCard}>
                  <View style={styles.outfitTopline}><Text style={styles.outfitNumber}>{t(locale, "look")} 0{index + 1}</Text><Text style={styles.outfitScore}>{Math.round(option.score * 100)}%</Text></View>
                  <View style={styles.flatLay}>
                    {option.items.map((item, itemIndex) => (
                      <View key={`${item.name}-${itemIndex}`} style={[styles.flatLayItem, { transform: [{ rotate: `${(itemIndex % 2 ? 1 : -1) * (2 + itemIndex)}deg` }] }]}>
                        <View style={[styles.itemColor, { backgroundColor: item.colors[0] ?? colors.powder }]} />
                        <Text numberOfLines={2} style={styles.flatLayName}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.reasonList}>{option.reasonCodes.slice(0, 3).map((reason) => <View key={reason} style={styles.reasonRow}><View style={styles.reasonBullet} /><Text style={styles.reasonText}>{reasonLabel(locale, reason)}</Text></View>)}</View>
                  <Pressable style={styles.chooseButton}><Text style={styles.chooseText}>{t(locale, "choose")}</Text><ArrowIcon /></Pressable>
                </View>
              ))}
            </View>
          )}
          <Pressable onPress={() => setStep("wardrobe")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{t(locale, "newSet")}</Text></Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.shell, wide && styles.shellWide]}>
        {wide && (
          <View style={styles.brandPanel}>
            <View><Text style={styles.wordmarkLarge}>KIDZ/</Text><Text style={styles.brandLine}>{t(locale, "brandLine")}</Text></View>
            <View style={styles.posterRail}>{selectedStyles.length ? <StyleRibbon styles={selectedStyles} /> : <StyleRibbon styles={catalog.slice(0, 3)} />}<Text style={styles.posterText}>0—18{Platform.OS === "web" ? "\n" : " "}STYLE{Platform.OS === "web" ? "\n" : " "}SYSTEM</Text></View>
            <Text style={styles.brandFoot}>WARDROBE / WEATHER / YOU</Text>
          </View>
        )}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{content}</ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ArrowIcon() {
  return <View style={styles.miniArrow}><Text style={{ color: colors.paper, fontSize: 18 }}>→</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.porcelain },
  shell: { flex: 1 },
  shellWide: { flexDirection: "row" },
  brandPanel: { width: "35%", minWidth: 330, maxWidth: 500, backgroundColor: colors.graphite, padding: 42, justifyContent: "space-between", overflow: "hidden" },
  wordmarkLarge: { color: colors.paper, fontFamily: typography.display, fontSize: 30, letterSpacing: -1.4 },
  brandLine: { color: "#AEB3BE", fontFamily: typography.body, fontSize: 14, marginTop: 6 },
  brandFoot: { color: "#747A86", fontFamily: typography.bodySemibold, fontSize: 10, letterSpacing: 1.5 },
  posterRail: { borderWidth: 1, borderColor: "#3A3E47", minHeight: 310, justifyContent: "space-between" },
  posterText: { color: colors.paper, fontFamily: typography.display, fontSize: 40, lineHeight: 44, letterSpacing: -2.2, padding: 28 },
  scrollContent: { flexGrow: 1, paddingBottom: 56 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12 },
  contentWide: { paddingHorizontal: 50, paddingTop: 34 },
  mobileBrand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 44 },
  wordmark: { color: colors.graphite, fontFamily: typography.display, fontSize: 21, letterSpacing: -0.8 },
  progress: { color: colors.secondary, fontFamily: typography.bodySemibold, fontSize: 12 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 22, alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: colors.graphite, fontFamily: typography.bodyMedium, fontSize: 13 },
  languageGrid: { gap: 12, marginBottom: 28 },
  languageCard: { minHeight: 86, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, padding: 18, flexDirection: "row", alignItems: "center", gap: 18 },
  languageCardSelected: { borderColor: colors.ultraviolet, borderWidth: 2, padding: 17 },
  languageCode: { width: 42, color: colors.ultraviolet, fontFamily: typography.displaySoft, fontSize: 13 },
  languageName: { flex: 1, color: colors.graphite, fontFamily: typography.displaySoft, fontSize: 21 },
  agePanel: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 20, marginBottom: 14 },
  fieldLabel: { color: colors.secondary, fontFamily: typography.bodySemibold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  ageControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28, marginVertical: 12 },
  squareControl: { width: 44, height: 44, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  ageValue: { minWidth: 76, textAlign: "center", color: colors.graphite, fontFamily: typography.display, fontSize: 62, lineHeight: 68 },
  ageTrack: { height: 5, backgroundColor: "#E8EAF0", marginTop: 8 },
  ageTrackFill: { height: 5, backgroundColor: colors.ultraviolet },
  ageLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  utility: { color: "#9BA0AA", fontFamily: typography.bodyMedium, fontSize: 10 },
  choiceRow: { flexDirection: "row", gap: 14, padding: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: "transparent" },
  choiceRowSelected: { borderColor: colors.ultraviolet, backgroundColor: "#F0EFFF" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#9CA1AB", alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioSelected: { borderColor: colors.ultraviolet },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ultraviolet },
  choiceTitle: { color: colors.graphite, fontFamily: typography.bodySemibold, fontSize: 15 },
  choiceBody: { color: colors.secondary, fontFamily: typography.body, fontSize: 12.5, lineHeight: 19, marginTop: 3 },
  mixPanel: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, marginBottom: 12 },
  mixContent: { padding: 18 },
  mixText: { color: colors.graphite, fontFamily: typography.displaySoft, fontSize: 20, marginTop: 5 },
  searchBox: { minHeight: 50, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 15, marginBottom: 12 },
  searchInput: { flex: 1, color: colors.graphite, fontFamily: typography.body, fontSize: 14, outlineStyle: "none" } as never,
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  styleCard: { width: "48%", minHeight: 142, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 13, position: "relative" },
  styleCardSelected: { borderColor: colors.ultraviolet, borderWidth: 2, padding: 12 },
  paletteRow: { flexDirection: "row", gap: 2, marginBottom: 13 },
  styleName: { color: colors.graphite, fontFamily: typography.displaySoft, fontSize: 17 },
  styleDescription: { color: colors.secondary, fontFamily: typography.body, fontSize: 11.5, lineHeight: 16, marginTop: 5, paddingRight: 14 },
  styleCheck: { position: "absolute", right: 10, bottom: 10, width: 22, height: 22, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  styleCheckSelected: { backgroundColor: colors.ultraviolet, borderColor: colors.ultraviolet },
  actionPair: { flexDirection: "row", gap: 10 },
  photoAction: { flex: 1, minHeight: 88, backgroundColor: colors.graphite, padding: 16, justifyContent: "space-between" },
  photoActionText: { color: colors.paper, fontFamily: typography.bodySemibold, fontSize: 14 },
  demoAction: { flex: 1, minHeight: 88, backgroundColor: "#EEEAFE", padding: 16, justifyContent: "space-between" },
  demoActionText: { color: colors.graphite, fontFamily: typography.bodySemibold, fontSize: 14 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingVertical: 9, paddingHorizontal: 11 },
  quickText: { color: colors.graphite, fontFamily: typography.bodyMedium, fontSize: 11.5 },
  wardrobeList: { marginVertical: 20, gap: 8 },
  emptyState: { borderWidth: 1, borderStyle: "dashed", borderColor: "#C7CBD3", minHeight: 130, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: colors.secondary, fontFamily: typography.body, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, maxWidth: 280 },
  garmentRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 9 },
  garmentSwatch: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  garmentImage: { width: 48, height: 48, resizeMode: "cover" },
  garmentName: { color: colors.graphite, fontFamily: typography.bodySemibold, fontSize: 13.5 },
  garmentMeta: { color: colors.secondary, fontFamily: typography.body, fontSize: 10.5, marginTop: 3 },
  syncBanner: { flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "#E2C38D", backgroundColor: "#FFF7E8", padding: 14, marginBottom: 18 },
  syncBannerOnline: { borderColor: "#AFCFBB", backgroundColor: "#EDF8F1" },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D49024", marginTop: 5 },
  syncDotOnline: { backgroundColor: colors.success },
  syncTitle: { color: colors.graphite, fontFamily: typography.bodySemibold, fontSize: 12.5 },
  syncBody: { color: colors.secondary, fontFamily: typography.body, fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  outfitCard: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 16 },
  outfitTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  outfitNumber: { color: colors.graphite, fontFamily: typography.displaySoft, fontSize: 19 },
  outfitScore: { color: colors.ultraviolet, fontFamily: typography.bodySemibold, fontSize: 12 },
  flatLay: { minHeight: 190, flexDirection: "row", flexWrap: "wrap", alignContent: "center", justifyContent: "center", gap: 8, paddingVertical: 20 },
  flatLayItem: { width: "30%", minWidth: 88, maxWidth: 150, minHeight: 76, backgroundColor: "#F7F8FA", borderWidth: 1, borderColor: "#E5E7EC", padding: 7, justifyContent: "space-between" },
  itemColor: { height: 34, marginBottom: 6 },
  flatLayName: { color: colors.graphite, fontFamily: typography.bodyMedium, fontSize: 9.5, lineHeight: 13 },
  reasonList: { borderTopWidth: 1, borderTopColor: "#E8EAF0", paddingTop: 12, gap: 7 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reasonBullet: { width: 5, height: 5, backgroundColor: colors.ultraviolet },
  reasonText: { color: colors.secondary, fontFamily: typography.body, fontSize: 11.5 },
  chooseButton: { minHeight: 46, backgroundColor: colors.graphite, marginTop: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 15, paddingRight: 5 },
  chooseText: { color: colors.paper, fontFamily: typography.bodySemibold, fontSize: 12.5 },
  miniArrow: { width: 36, height: 36, backgroundColor: colors.ultraviolet, alignItems: "center", justifyContent: "center" },
  secondaryButton: { minHeight: 52, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", justifyContent: "center", marginTop: 18 },
  secondaryButtonText: { color: colors.graphite, fontFamily: typography.bodySemibold, fontSize: 14 },
});
