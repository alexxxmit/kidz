import { DEFAULT_AVATAR_PROFILE as CONTRACT_DEFAULT_AVATAR_PROFILE, type AvatarProfile, type HairColor, type Locale, type OutfitOption } from "@kidz/contracts";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

import { colors, typography } from "./theme";

export const DEFAULT_AVATAR_PROFILE: AvatarProfile = CONTRACT_DEFAULT_AVATAR_PROFILE;

export const AVATAR_SKIN_OPTIONS: Array<{ id: AvatarProfile["skinTone"]; color: string }> = [
  { id: "PORCELAIN", color: "#F7D8C4" },
  { id: "LIGHT", color: "#EBC1A1" },
  { id: "WARM", color: "#D99B74" },
  { id: "TAN", color: "#B9754F" },
  { id: "DEEP", color: "#7C4936" },
  { id: "RICH", color: "#4B2B25" },
];

export const AVATAR_HAIR_COLORS: Array<{ id: HairColor; color: string; label: Record<Locale, string> }> = [
  { id: "BLACK", color: "#17151B", label: { ru: "Чёрный", en: "Black" } },
  { id: "DARK_BROWN", color: "#3B2925", label: { ru: "Тёмный", en: "Dark" } },
  { id: "BROWN", color: "#704936", label: { ru: "Каштан", en: "Brown" } },
  { id: "LIGHT_BROWN", color: "#A87855", label: { ru: "Русый", en: "Light brown" } },
  { id: "BLONDE", color: "#E6CA82", label: { ru: "Блонд", en: "Blonde" } },
  { id: "RED", color: "#A74B2F", label: { ru: "Рыжий", en: "Red" } },
  { id: "DYED_BRIGHT", color: "#8B58D9", label: { ru: "Яркий", en: "Bright" } },
];

export const AVATAR_HAIR_STYLES: Array<{ id: AvatarProfile["hairStyle"]; label: Record<Locale, string> }> = [
  { id: "BUZZ", label: { ru: "Buzz", en: "Buzz" } },
  { id: "CROP", label: { ru: "Короткая", en: "Crop" } },
  { id: "BOB", label: { ru: "Боб", en: "Bob" } },
  { id: "WAVES", label: { ru: "Волны", en: "Waves" } },
  { id: "CURLS", label: { ru: "Кудри", en: "Curls" } },
  { id: "PONYTAIL", label: { ru: "Хвост", en: "Ponytail" } },
  { id: "BRAIDS", label: { ru: "Косы", en: "Braids" } },
  { id: "LONG_STRAIGHT", label: { ru: "Длинные", en: "Long" } },
];

export const AVATAR_POSES: Array<{ id: AvatarProfile["pose"]; label: Record<Locale, string> }> = [
  { id: "EDITORIAL", label: { ru: "Обложка", en: "Editorial" } },
  { id: "MIRROR", label: { ru: "Селфи", en: "Mirror" } },
  { id: "WALK", label: { ru: "В движении", en: "Walking" } },
];

const skinColors: Record<AvatarProfile["skinTone"], string> = Object.fromEntries(AVATAR_SKIN_OPTIONS.map((option) => [option.id, option.color])) as Record<AvatarProfile["skinTone"], string>;
const hairColors: Record<HairColor, string> = {
  BLACK: "#17151B",
  DARK_BROWN: "#3B2925",
  BROWN: "#704936",
  LIGHT_BROWN: "#A87855",
  BLONDE: "#E6CA82",
  RED: "#A74B2F",
  GRAY: "#AAA8AD",
  DYED_BRIGHT: "#8B58D9",
  MIXED: "#6D526E",
  OTHER: "#414047",
};

type OutfitItem = OutfitOption["items"][number];
const itemFor = (look: OutfitOption | undefined, ...slots: OutfitItem["slot"][]) => look?.items.find((item) => slots.includes(item.slot));
const colorFor = (item: OutfitItem | undefined, fallback: string, index = 0) => item?.colors[index] ?? item?.colors[0] ?? fallback;

function HairBack({ avatar, color }: { avatar: AvatarProfile; color: string }) {
  if (avatar.hairStyle === "LONG_STRAIGHT") return <Path d="M79 82 Q75 35 120 32 Q165 35 161 86 L168 210 Q145 224 120 205 Q95 224 72 210 Z" fill={color} />;
  if (avatar.hairStyle === "WAVES") return <Path d="M78 85 Q71 45 94 34 Q122 18 151 39 Q170 54 160 91 C180 117 155 131 168 154 C179 177 155 199 164 215 L132 211 C143 188 126 174 139 151 C150 129 133 109 145 88 Z M92 82 C79 111 98 126 84 150 C70 174 91 190 78 214 L108 210 C98 184 116 166 102 145 C88 123 105 102 92 82 Z" fill={color} />;
  if (avatar.hairStyle === "BOB") return <Path d="M78 83 Q75 35 120 32 Q165 36 162 87 L157 142 Q137 151 120 137 Q102 151 82 141 Z" fill={color} />;
  if (avatar.hairStyle === "PONYTAIL") return <><Path d="M82 83 Q78 35 120 32 Q161 35 158 84 L151 116 L89 116 Z" fill={color} /><Path d="M153 59 Q191 71 178 124 Q171 153 187 176 Q156 175 153 141 Q150 105 145 77 Z" fill={color} /></>;
  if (avatar.hairStyle === "BRAIDS") return <><Path d="M80 82 Q78 34 120 32 Q162 36 159 84 L151 111 L89 111 Z" fill={color} /><Path d="M88 85 C73 124 82 157 72 198 C69 213 83 219 88 202 C98 164 87 128 99 91 Z" fill={color} /><Path d="M151 85 C166 124 157 157 168 198 C172 214 157 220 152 202 C141 164 153 127 141 91 Z" fill={color} /></>;
  if (avatar.hairStyle === "CURLS") return <G fill={color}>{[[88,54,25],[115,43,27],[143,55,26],[82,82,25],[158,85,24],[90,109,22],[151,112,23]].map(([cx, cy, r], index) => <Circle key={index} cx={cx} cy={cy} r={r} />)}</G>;
  return null;
}

function HairFront({ avatar, color }: { avatar: AvatarProfile; color: string }) {
  if (avatar.hairStyle === "BUZZ") return <Path d="M87 72 Q88 38 120 38 Q152 38 153 72 Q136 57 120 58 Q103 57 87 72 Z" fill={color} />;
  if (avatar.hairStyle === "CROP") return <Path d="M84 72 Q82 43 111 36 L151 46 L157 71 L143 63 L135 73 L119 60 L105 73 L96 62 Z" fill={color} />;
  if (avatar.hairStyle === "CURLS") return <G fill={color}>{[[92,51,17],[112,43,18],[134,46,18],[151,59,17],[84,67,14]].map(([cx, cy, r], index) => <Circle key={index} cx={cx} cy={cy} r={r} />)}</G>;
  return <Path d="M83 75 Q80 37 119 34 Q159 36 158 76 Q148 61 143 55 Q133 69 119 58 Q104 71 94 57 Q89 66 83 75 Z" fill={color} />;
}

function Arms({ pose, skin }: { pose: AvatarProfile["pose"]; skin: string }) {
  if (pose === "MIRROR") return <G fill="none" stroke={skin} strokeWidth={18} strokeLinecap="round"><Path d="M82 164 Q68 211 73 268" /><Path d="M157 162 Q174 132 181 94" /></G>;
  if (pose === "WALK") return <G fill="none" stroke={skin} strokeWidth={18} strokeLinecap="round"><Path d="M82 164 Q62 214 54 264" /><Path d="M158 163 Q179 210 187 256" /></G>;
  return <G fill="none" stroke={skin} strokeWidth={18} strokeLinecap="round"><Path d="M82 164 Q70 217 70 270" /><Path d="M158 164 Q169 214 178 263" /></G>;
}

function Legs({ pose, skin, bottom }: { pose: AvatarProfile["pose"]; skin: string; bottom: OutfitItem | undefined }) {
  const isSkirt = bottom?.category === "skirt";
  const isShort = bottom?.category === "shorts";
  const fill = colorFor(bottom, "#41434B");
  const legTop = isSkirt ? 285 : isShort ? 268 : 250;
  if (isSkirt || isShort || !bottom) {
    return <G stroke={skin} strokeWidth={22} strokeLinecap="round"><Line x1="104" y1={legTop} x2={pose === "WALK" ? 91 : 101} y2="367" /><Line x1="136" y1={legTop} x2={pose === "WALK" ? 153 : 139} y2="367" /></G>;
  }
  return <G fill={fill} stroke="#18151F" strokeOpacity={0.12} strokeWidth={1.5}><Path d={pose === "WALK" ? "M87 238 L119 238 L112 286 L100 374 L75 374 L86 282 Z" : "M87 238 L119 238 L116 374 L91 374 L86 281 Z"} /><Path d={pose === "WALK" ? "M121 238 L153 238 L154 282 L166 374 L141 374 L128 286 Z" : "M121 238 L153 238 L151 374 L126 374 L124 281 Z"} /></G>;
}

function BottomLayer({ bottom }: { bottom: OutfitItem | undefined }) {
  if (!bottom || !["skirt", "shorts"].includes(bottom.category)) return null;
  const fill = colorFor(bottom, "#34343C");
  if (bottom.category === "skirt") return <Path d="M87 229 L153 229 L166 292 Q120 305 74 292 Z" fill={fill} stroke="#18151F" strokeOpacity={0.12} strokeWidth={1.5} />;
  return <G fill={fill}><Path d="M87 230 L120 230 L116 275 L82 275 Z" /><Path d="M120 230 L153 230 L158 275 L124 275 Z" /></G>;
}

function TopLayer({ item, onePiece }: { item: OutfitItem | undefined; onePiece: OutfitItem | undefined }) {
  const top = onePiece ?? item;
  const fill = colorFor(top, "#6C4BFF");
  const accent = colorFor(top, "#FFFFFF", 1);
  if (onePiece) return <><Path d="M88 130 Q120 117 152 130 L158 229 L176 302 Q120 322 64 302 L82 229 Z" fill={fill} stroke="#18151F" strokeOpacity={0.12} strokeWidth={1.5} /><Path d="M105 128 Q120 145 135 128" fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={3} /></>;
  const oversized = item?.category === "hoodie" || item?.category === "sweater";
  return <><Path d={oversized ? "M83 132 Q120 114 157 132 L166 224 Q120 238 74 224 Z" : "M88 130 Q120 118 152 130 L157 228 L83 228 Z"} fill={fill} stroke="#18151F" strokeOpacity={0.12} strokeWidth={1.5} />{item?.category === "shirt" && <><Line x1="120" y1="137" x2="120" y2="222" stroke={accent} strokeOpacity={0.65} strokeWidth={2} /><Path d="M102 128 L120 150 L138 128" fill="none" stroke={accent} strokeOpacity={0.65} strokeWidth={2.5} /></>}{accent !== fill && item?.category === "tshirt" && <Path d="M84 177 L156 177" stroke={accent} strokeOpacity={0.65} strokeWidth={7} />}</>;
}

function OuterwearLayer({ item }: { item: OutfitItem | undefined }) {
  if (!item) return null;
  const fill = colorFor(item, "#5E6570");
  const long = item.category === "coat";
  return <G><Path d={`M83 130 Q98 120 112 124 L116 ${long ? 285 : 230} L73 ${long ? 278 : 224} L76 159 Z`} fill={fill} stroke="#18151F" strokeOpacity={0.15} strokeWidth={1.5} /><Path d={`M157 130 Q142 120 128 124 L124 ${long ? 285 : 230} L167 ${long ? 278 : 224} L164 159 Z`} fill={fill} stroke="#18151F" strokeOpacity={0.15} strokeWidth={1.5} /><Line x1="120" y1="128" x2="120" y2={long ? 282 : 228} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2} /></G>;
}

function Shoes({ item, pose }: { item: OutfitItem | undefined; pose: AvatarProfile["pose"] }) {
  const fill = colorFor(item, "#F1F0EB");
  const accent = colorFor(item, "#D4D0C8", 1);
  const leftX = pose === "WALK" ? 70 : 83;
  const rightX = pose === "WALK" ? 140 : 126;
  const boots = item?.category === "boots";
  return <G><Path d={`M${leftX + 8} ${boots ? 350 : 366} L${leftX + 28} ${boots ? 350 : 366} L${leftX + 39} 385 Q${leftX + 19} 393 ${leftX} 384 Z`} fill={fill} stroke="#18151F" strokeOpacity={0.2} strokeWidth={1.5} /><Path d={`M${rightX + 8} ${boots ? 350 : 366} L${rightX + 28} ${boots ? 350 : 366} L${rightX + 40} 385 Q${rightX + 20} 393 ${rightX} 384 Z`} fill={fill} stroke="#18151F" strokeOpacity={0.2} strokeWidth={1.5} /><Line x1={leftX + 5} y1="383" x2={leftX + 36} y2="383" stroke={accent} strokeWidth={3} /><Line x1={rightX + 5} y1="383" x2={rightX + 37} y2="383" stroke={accent} strokeWidth={3} /></G>;
}

function Accessories({ look, skin }: { look: OutfitOption | undefined; skin: string }) {
  const bag = itemFor(look, "bag");
  const jewelry = itemFor(look, "jewelry");
  const accessory = itemFor(look, "accessory");
  return <G>{bag && <><Path d="M147 143 Q185 180 172 270" fill="none" stroke={colorFor(bag, "#24242B")} strokeWidth={5} strokeLinecap="round" /><Rect x="150" y="236" width="49" height="55" rx="13" fill={colorFor(bag, "#24242B")} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2} /><Rect x="164" y="248" width="21" height="5" rx="2.5" fill="#FFFFFF" opacity={0.35} /></>}{jewelry?.category === "necklace" && <><Path d="M107 129 Q120 151 133 129" fill="none" stroke={colorFor(jewelry, "#D1D4DA")} strokeWidth={2.5} /><Circle cx="120" cy="149" r="3.5" fill={colorFor(jewelry, "#D1D4DA")} /></>}{jewelry?.category === "earrings" && <G fill={colorFor(jewelry, "#F2EEE5")} stroke={skin} strokeWidth={0.5}><Circle cx="87" cy="87" r="4" /><Circle cx="153" cy="87" r="4" /></G>}{jewelry?.category === "bracelet" && <Path d="M61 259 Q70 266 79 259" fill="none" stroke={colorFor(jewelry, "#202127")} strokeWidth={4} />}{accessory?.category === "belt" && <Rect x="84" y="221" width="73" height="9" rx="4" fill={colorFor(accessory, "#17181D")} />}</G>;
}

function Headwear({ item }: { item: OutfitItem | undefined }) {
  if (!item) return null;
  const fill = colorFor(item, "#474B54");
  if (item.category === "beanie") return <><Path d="M83 61 Q87 24 120 23 Q153 24 157 61 Z" fill={fill} /><Rect x="83" y="55" width="74" height="16" rx="7" fill={fill} stroke="#FFFFFF" strokeOpacity={0.25} /></>;
  if (item.category === "cap") return <><Path d="M85 61 Q90 32 121 33 Q150 34 156 61 Z" fill={fill} /><Path d="M123 59 Q168 55 176 68 Q145 72 121 66 Z" fill={fill} /></>;
  if (item.category === "headband") return <Path d="M86 59 Q120 29 154 59" fill="none" stroke={fill} strokeWidth={8} />;
  return <><Path d="M78 58 Q88 25 120 25 Q152 25 162 58 Z" fill={fill} /><Ellipse cx="120" cy="61" rx="54" ry="8" fill={fill} /></>;
}

export function FashionAvatar({ avatar = DEFAULT_AVATAR_PROFILE, look, height = 330, label }: { avatar?: AvatarProfile; look?: OutfitOption; height?: number; label?: string }) {
  const skin = skinColors[avatar.skinTone];
  const hair = hairColors[avatar.hairColor];
  const top = itemFor(look, "top", "mid_layer");
  const outerwear = itemFor(look, "outerwear");
  const bottom = itemFor(look, "bottom");
  const onePiece = itemFor(look, "one_piece");
  const footwear = itemFor(look, "footwear");
  const headwear = itemFor(look, "headwear");
  return <View style={avatarStyles.frame} accessibilityLabel={label}>
    <Svg width="100%" height={height} viewBox="0 0 240 420">
      <Ellipse cx="120" cy="205" rx="102" ry="161" fill="#FFFFFF" opacity={0.32} />
      <Path d="M34 117 Q75 56 167 50 Q214 99 202 209 Q186 327 120 402 Q43 332 28 213 Q21 158 34 117 Z" fill="#FFFFFF" opacity={0.16} />
      <Ellipse cx="120" cy="394" rx="83" ry="10" fill="#4B3C68" opacity={0.11} />
      <HairBack avatar={avatar} color={hair} />
      <Arms pose={avatar.pose} skin={skin} />
      <Legs pose={avatar.pose} skin={skin} bottom={onePiece ? undefined : bottom} />
      <Shoes item={footwear} pose={avatar.pose} />
      <BottomLayer bottom={onePiece ? undefined : bottom} />
      <TopLayer item={top} onePiece={onePiece} />
      <OuterwearLayer item={outerwear} />
      <Accessories look={look} skin={skin} />
      <Ellipse cx="120" cy="85" rx="35" ry="44" fill={skin} />
      <Ellipse cx="87" cy="87" rx="5" ry="9" fill={skin} />
      <Ellipse cx="153" cy="87" rx="5" ry="9" fill={skin} />
      <HairFront avatar={avatar} color={hair} />
      <Path d="M104 84 Q109 80 114 84" fill="none" stroke="#33262A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M126 84 Q131 80 136 84" fill="none" stroke="#33262A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M113 105 Q120 110 127 105" fill="none" stroke="#9B5A62" strokeWidth={2} strokeLinecap="round" />
      <Headwear item={headwear} />
      {avatar.pose === "MIRROR" && <G><Rect x="172" y="72" width="22" height="36" rx="6" fill="#27242D" /><Circle cx="183" cy="78" r="2.5" fill="#B7DFF7" /></G>}
    </Svg>
    {label && <Text numberOfLines={1} style={avatarStyles.label}>{label}</Text>}
  </View>;
}

const avatarStyles = StyleSheet.create({
  frame: { width: "100%", alignItems: "center", justifyContent: "center" },
  label: { position: "absolute", left: 12, bottom: 10, right: 12, textAlign: "center", fontFamily: typography.bodySemibold, fontSize: 9, color: colors.secondary },
});
