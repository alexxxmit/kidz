import type { GenderPresentation, HairColor, HairLength, HairProfile, HairStylePreference, OutfitOption, WardrobeItemInput } from "@kidz/contracts";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

type Garment = Omit<WardrobeItemInput, "profileId">;
type GridCell = { column: number; row: number };
export type GarmentPhotoReference = { source: number; cell: GridCell; columns: number; rows: number };

const ink = "#24212A";
const wardrobeGrid = require("../assets/editorial/wardrobe-products-grid-v1.png");
const stockholmGrid = require("../assets/editorial/stockholm-products-grid-v3.png");
const accessoryGrid = require("../assets/editorial/accessory-reference-grid-v1.png");
const stockholmAccessoryGrid = require("../assets/editorial/stockholm-accessories-grid-v1.png");
const hairReferenceGrid = require("../assets/editorial/style-hair-reference-grid-v1.png");
const hairStylePickerGrid = require("../assets/editorial/hair-style-picker-grid-v1.png");
const makeupReferenceGrid = require("../assets/editorial/style-makeup-reference-grid-v1.png");
const schoolDressCodeGrid = require("../assets/editorial/school-dress-code-grid-v1.png");
const hairLengthGrid = require("../assets/editorial/hair-length-grid-v1.png");
const veryLongHairGrid = require("../assets/editorial/hair-length-very-long-grid-v1.png");

function PhotoGridCrop({ source, cell, columns, rows, height, rounded = 22, inset = 0, edgeMask = true }: { source: number; cell: GridCell; columns: number; rows: number; height: number; rounded?: number; inset?: number; edgeMask?: boolean }) {
  const cellScale = 100 + inset * 2;
  return <View style={[styles.photoCrop, { height, borderRadius: rounded }]}><Image source={source} resizeMode="stretch" style={{ position: "absolute", width: `${columns * cellScale}%`, height: `${rows * cellScale}%`, left: `${-(cell.column * cellScale + inset)}%`, top: `${-(cell.row * cellScale + inset)}%` }} />{edgeMask && <View pointerEvents="none" style={styles.cropEdgeMask} />}</View>;
}

const productCell = (item: Garment): GridCell => {
  const name = item.name.toLowerCase();
  if (/график|graphic|print|принт/.test(name)) return { column: 2, row: 0 };
  if (/полос|stripe/.test(name)) return { column: 3, row: 1 };
  if (/голуб|oxford|оксфорд/.test(name)) return { column: 3, row: 0 };
  if (/лонгслив|ribbed/.test(name)) return { column: 1, row: 0 };
  if (item.category === "hoodie") return { column: 0, row: 1 };
  if (item.category === "sweater") return /крем|cream|молоч/.test(name) ? { column: 2, row: 1 } : { column: 1, row: 1 };
  if (item.slot === "top") return { column: 0, row: 0 };
  if (item.category === "skirt" || item.category === "dress") return { column: 3, row: 2 };
  if (item.category === "jeans") return /син|indigo|blue|wide|широк/.test(name) ? { column: 1, row: 2 } : { column: 0, row: 2 };
  if (item.slot === "bottom") return { column: 2, row: 2 };
  if (/бомбер|bomber/.test(name)) return { column: 0, row: 3 };
  if (/тренч|trench/.test(name)) return { column: 1, row: 3 };
  if (/блейзер|blazer/.test(name)) return { column: 2, row: 3 };
  if (item.slot === "outerwear") return { column: 3, row: 3 };
  if (/бел|white/.test(name) && item.slot === "footwear") return { column: 0, row: 4 };
  if (item.category === "sneakers" || item.category === "boots") return { column: 1, row: 4 };
  if (item.slot === "footwear") return { column: 2, row: 4 };
  return { column: 3, row: 4 };
};

const stockholmProductCell = (item: Garment): GridCell => {
  const name = item.name.toLowerCase();
  if (/молочн.*лонгслив|ivory.*scoop/.test(name)) return { column: 0, row: 0 };
  if (/ч[её]рн.*притал|black.*fitted/.test(name)) return { column: 1, row: 0 };
  if (/navy.*cardigan-top|т[её]мно-син.*кардиган-топ/.test(name)) return { column: 2, row: 0 };
  if (/сер.*v-neck|grey.*v-neck/.test(name)) return { column: 3, row: 0 };
  if (/розов.*худи|pink.*hoodie/.test(name)) return { column: 0, row: 1 };
  if (/кремов.*кардиган|cream.*cardigan/.test(name)) return { column: 1, row: 1 };
  if (/поло|polo/.test(name)) return { column: 2, row: 1 };
  if (/свитшот|sweatshirt/.test(name)) return { column: 3, row: 1 };
  if (item.category === "jeans") return /сер|grey|gray|bootcut|кл[её]ш/.test(name) ? { column: 1, row: 2 } : { column: 0, row: 2 };
  if (item.category === "trousers") return /спорт|sweat|jog/.test(name) ? { column: 3, row: 2 } : { column: 2, row: 2 };
  if (/розов.*пухов|pink.*puffer/.test(name)) return { column: 0, row: 3 };
  if (/молочн.*пухов|ivory.*puffer/.test(name)) return { column: 1, row: 3 };
  if (/шоколад.*блейзер|chocolate.*blazer/.test(name)) return { column: 2, row: 3 };
  if (/мех|fur/.test(name)) return { column: 3, row: 3 };
  if (item.category === "boots") return /высок|tall|knee/.test(name) ? { column: 3, row: 4 } : { column: 0, row: 4 };
  if (item.category === "sneakers") return /сер|grey|gray|suede|замш/.test(name) ? { column: 1, row: 4 } : { column: 2, row: 4 };
  if (/полос|stripe/.test(name) && item.slot === "top") return { column: 2, row: 0 };
  if (/топ|tank|ribbed/.test(name)) return { column: 0, row: 0 };
  if (/кардиган|cardigan/.test(name)) return { column: 1, row: 1 };
  if (item.category === "jacket" || item.category === "coat") return { column: 2, row: 3 };
  if (item.category === "shoes") return { column: 1, row: 4 };
  return productCell(item);
};

const accessoryCell = (item: Garment): GridCell => {
  const name = item.name.toLowerCase();
  if (item.category === "necklace") return /кулон|pendant|long|длин/.test(name) ? { column: 1, row: 0 } : { column: 0, row: 0 };
  if (item.category === "bracelet") return { column: 2, row: 0 };
  if (item.category === "ring") return { column: 3, row: 0 };
  if (item.category === "earrings") return /жемч|pearl/.test(name) ? { column: 0, row: 1 } : { column: 1, row: 1 };
  if (item.category === "watch") return { column: 2, row: 1 };
  if (item.category === "belt") return { column: 3, row: 1 };
  if (item.category === "headband") return { column: 0, row: 2 };
  if (item.category === "hair_accessory") return { column: 1, row: 2 };
  if (item.category === "beanie") return { column: 2, row: 2 };
  if (item.category === "cap") return { column: 3, row: 2 };
  if (item.category === "tote") return { column: 0, row: 3 };
  if (item.category === "crossbody_bag") return { column: 1, row: 3 };
  if (item.category === "backpack") return { column: 2, row: 3 };
  if (item.slot === "bag") return /спорт|gym|duffle/.test(name) ? { column: 0, row: 4 } : { column: 3, row: 3 };
  if (item.category === "scarf") return { column: 1, row: 4 };
  return /очк|glass|sunglass/.test(name) ? { column: 2, row: 4 } : { column: 3, row: 4 };
};

const stockholmAccessoryCell = (item: Garment): GridCell => {
  const name = item.name.toLowerCase();
  if (item.category === "necklace") return { column: 0, row: 0 };
  if (item.category === "earrings") return { column: 1, row: 0 };
  if (item.category === "ring") return { column: 2, row: 0 };
  if (item.category === "belt") return /бордов|burgundy/.test(name) ? { column: 2, row: 4 } : { column: 3, row: 0 };
  if (item.slot === "bag") {
    if (/ч[её]рн|black/.test(name)) return { column: 1, row: 1 };
    if (/бордов|burgundy/.test(name)) return { column: 2, row: 1 };
    if (/tote|тоут|больш|roomy|tan/.test(name)) return { column: 3, row: 1 };
    if (/молоч|ivory|cream/.test(name)) return { column: 3, row: 4 };
    return { column: 0, row: 1 };
  }
  if (item.category === "scarf") return /роз|pink/.test(name) ? { column: 1, row: 2 } : { column: 0, row: 2 };
  if (item.category === "headband") return /молоч|cream|ivory/.test(name) ? { column: 3, row: 3 } : { column: 2, row: 2 };
  if (item.category === "hair_accessory") return { column: 2, row: 3 };
  if (item.category === "watch") return { column: 0, row: 4 };
  if (item.category === "bracelet") return { column: 1, row: 4 };
  if (/гетр|leg warmer/.test(name)) return /сер|grey|gray/.test(name) ? { column: 1, row: 3 } : { column: 0, row: 3 };
  return accessoryCell(item);
};

const isAccessory = (item: Garment) => ["jewelry", "bag", "headwear", "accessory"].includes(item.slot);
const isStockholm = (item: Garment) => item.styleIds.includes("stockholm");

export function garmentPhotoReference(item: Garment): GarmentPhotoReference {
  const stockholm = isStockholm(item);
  const accessory = isAccessory(item);
  return {
    source: stockholm ? (accessory ? stockholmAccessoryGrid : stockholmGrid) : (accessory ? accessoryGrid : wardrobeGrid),
    cell: stockholm ? (accessory ? stockholmAccessoryCell(item) : stockholmProductCell(item)) : (accessory ? accessoryCell(item) : productCell(item)),
    columns: 4,
    rows: 5,
  };
}

export function GarmentIllustration({ item, height = 92 }: { item: Garment; height?: number }) {
  const reference = garmentPhotoReference(item);
  return <PhotoGridCrop {...reference} height={height} rounded={18} inset={5} />;
}

export function OccasionIllustration({ occasion, active = false }: { occasion: "school" | "walk" | "party" | "sport" | "activity"; active?: boolean }) {
  const fg = active ? "#FFFFFF" : ink;
  const accent = active ? "#FFD27C" : "#6C4BFF";
  return <Svg width="42" height="34" viewBox="0 0 64 52">
    {occasion === "school" && <G><Path d="M19 19 Q20 8 32 8 Q44 8 45 19" fill="none" stroke={accent} strokeWidth="4" /><Rect x="12" y="17" width="40" height="31" rx="10" fill="none" stroke={fg} strokeWidth="3" /><Rect x="20" y="29" width="24" height="13" rx="5" fill={accent} fillOpacity="0.4" stroke={accent} strokeWidth="2" /><Line x1="32" y1="18" x2="32" y2="27" stroke={fg} strokeWidth="3" /></G>}
    {occasion === "walk" && <G><Path d="M11 34 Q21 25 30 31 L40 39 Q48 41 55 43 Q54 49 46 49 L15 47 Q8 44 11 34 Z" fill="none" stroke={fg} strokeWidth="3" /><Path d="M17 32 L21 19 L29 13 L34 23" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><Line x1="18" y1="40" x2="48" y2="43" stroke={accent} strokeWidth="2" /></G>}
    {occasion === "party" && <G><Circle cx="32" cy="27" r="16" fill="none" stroke={fg} strokeWidth="3" /><Path d="M17 27 H47 M32 11 V43 M21 16 Q32 27 43 16 M21 38 Q32 27 43 38" fill="none" stroke={accent} strokeWidth="2" /><Path d="M8 13 L11 8 L14 13 L19 16 L14 19 L11 24 L8 19 L3 16 Z" fill={accent} /></G>}
    {occasion === "sport" && <G><Path d="M13 34 Q24 26 34 31 L43 37 L57 40 Q56 48 47 48 L16 46 Q9 44 13 34 Z" fill="none" stroke={fg} strokeWidth="3" /><Path d="M22 30 L29 20 L40 24" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><Line x1="7" y1="20" x2="17" y2="20" stroke={fg} strokeWidth="3" /><Line x1="4" y1="27" x2="15" y2="27" stroke={fg} strokeWidth="3" /></G>}
    {occasion === "activity" && <G><Rect x="10" y="9" width="44" height="38" rx="13" fill="none" stroke={fg} strokeWidth="3" /><Path d="M23 36 Q28 25 35 16" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><Circle cx="23" cy="37" r="5" fill={accent} /><Path d="M40 17 V33 Q40 39 35 39 Q31 39 31 35 Q31 31 36 31 Q39 31 40 33 M40 20 L49 18 V30 Q49 36 44 36" fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></G>}
  </Svg>;
}

export function SchoolDressCodeIllustration({ mode, gender = "NEUTRAL", active = false }: { mode: "UNIFORM" | "BUSINESS_STYLE" | "FREE_STYLE"; gender?: GenderPresentation; active?: boolean }) {
  const column = mode === "UNIFORM" ? 0 : mode === "BUSINESS_STYLE" ? 1 : 2;
  const row = gender === "FEMININE" ? 0 : 1;
  return <View style={[styles.schoolPhoto, active && styles.schoolPhotoActive]}>
    <PhotoGridCrop source={schoolDressCodeGrid} cell={{ column, row }} columns={3} rows={2} height={118} rounded={15} edgeMask={false} />
  </View>;
}

export function HairLengthIllustration({ length, gender = "FEMININE", active = false }: { length: HairLength; gender?: GenderPresentation; active?: boolean }) {
  const row = gender === "FEMININE" ? 0 : 1;
  const column: Record<Exclude<HairLength, "VERY_LONG">, number> = { BUZZ: 0, SHORT: 1, MEDIUM: 2, LONG: 3 };
  const source = length === "VERY_LONG" ? veryLongHairGrid : hairLengthGrid;
  const cell = { column: length === "VERY_LONG" ? 0 : column[length], row };
  return <View style={[styles.hairLengthPhoto, active && styles.hairLengthPhotoActive]}>
    <PhotoGridCrop source={source} cell={cell} columns={length === "VERY_LONG" ? 1 : 5} rows={2} height={125} rounded={14} inset={0} edgeMask={false} />
  </View>;
}

const styleFamilyRow = (styleId: string) => {
  if (["stockholm", "minimal", "clean-girl", "quiet-luxury", "old-money", "korean-minimal", "classic", "parisian", "normcore", "coastal"].includes(styleId)) return 0;
  if (["emo", "goth", "punk", "grunge", "scene", "egirl", "whimsigoth", "visual-kei", "dark-feminine", "indie-sleaze"].includes(styleId)) return 1;
  if (["coquette", "soft-girl", "balletcore", "cottagecore", "fairycore", "lolita", "romantic", "kawaii"].includes(styleId)) return 2;
  if (["streetwear", "skater", "sporty", "hiphop", "blokecore", "gorpcore", "workwear", "western"].includes(styleId)) return 3;
  if (["preppy", "academia", "vintage", "boho", "art-hoe"].includes(styleId)) return 4;
  return 5;
};
const hash = (value: string) => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
const beautyCell = (kind: "hair" | "makeup", hair: HairProfile, gender: GenderPresentation, styleId: string, variant: number): GridCell => {
  const masculine = gender === "MASCULINE" || gender === "NEUTRAL" || gender === "NOT_SPECIFIED";
  const row = styleFamilyRow(styleId);
  if (kind === "makeup") return { column: (masculine ? 3 : 0) + variant, row };
  const short = hair.length === "BUZZ";
  const selected = hair.stylePreference ?? "AUTO";
  if (short) {
    if (selected === "TEXTURED" || selected === "WAVES_CURLS" || selected === "BLOWOUT") return { column: 1, row };
    if (selected === "SLEEK" || selected === "STRAIGHT" || selected === "UPDO_BRAID") return { column: 2, row };
    return { column: variant, row };
  }
  if (selected === "BLOWOUT" || selected === "WAVES_CURLS" || selected === "TEXTURED") return { column: 3, row };
  if (selected === "STRAIGHT" || selected === "SLEEK") return { column: 4, row };
  if (selected === "UPDO_BRAID") return { column: 5, row };
  return { column: 3 + variant, row };
};

export function HairStyleThumbnail({ gender, preference, height = 92 }: { hair: HairProfile; gender: GenderPresentation; styleId: string; preference: HairStylePreference; height?: number }) {
  const columns: Record<HairStylePreference, number> = { AUTO: 0, TEXTURED: 1, BLOWOUT: 2, STRAIGHT: 3, WAVES_CURLS: 4, SLEEK: 5, UPDO_BRAID: 6 };
  const row = gender === "FEMININE" ? 0 : 1;
  return <PhotoGridCrop source={hairStylePickerGrid} cell={{ column: columns[preference], row }} columns={7} rows={2} height={height} rounded={13} inset={1} />;
}

export function BeautyReference({ kind, look, hair, gender, styleId, variantIndex, height = 148 }: { kind: "hair" | "makeup" | "accessories"; look: OutfitOption; hair: HairProfile; gender: GenderPresentation; styleId: string; recommendedColor?: HairColor; variantIndex?: number | undefined; height?: number }) {
  const identity = `${look.id}|${look.items.map((item) => item.name).join("|")}|${kind}`;
  const variant = variantIndex === undefined ? hash(identity) % 3 : Math.abs(variantIndex) % 3;
  if (kind !== "accessories") return <PhotoGridCrop source={kind === "hair" ? hairReferenceGrid : makeupReferenceGrid} cell={beautyCell(kind, hair, gender, styleId, variant)} columns={6} rows={6} height={height} rounded={18} inset={1} />;
  const details = look.items.filter(isAccessory).slice(0, 3);
  const visible = details.length ? details : look.items.slice(0, 1);
  const stockholm = styleId === "stockholm";
  return <View style={[styles.accessoryPhotoRow, { height }]}>{visible.map((item, index) => <View key={`${item.name}-${index}`} style={styles.accessoryPhotoCell}><PhotoGridCrop source={stockholm ? stockholmAccessoryGrid : accessoryGrid} cell={details.length ? (stockholm ? stockholmAccessoryCell(item) : accessoryCell(item)) : { column: variant, row: 0 }} columns={4} rows={5} height={height} rounded={14} inset={5} /></View>)}</View>;
}

const styles = StyleSheet.create({
  photoCrop: { width: "100%", overflow: "hidden", backgroundColor: "#F5F1F7" },
  cropEdgeMask: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderWidth: 14, borderColor: "#F5F1F7", zIndex: 2 },
  accessoryPhotoRow: { width: "100%", flexDirection: "row", gap: 3, overflow: "hidden" },
  accessoryPhotoCell: { flex: 1, minWidth: 0, overflow: "hidden" },
  schoolPhoto: { width: "100%", height: 118, borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#E3DEE8" },
  schoolPhotoActive: { borderColor: "#FFFFFF", borderWidth: 2 },
  hairLengthPhoto: { width: "100%", height: 125, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#E3DEE8" },
  hairLengthPhotoActive: { borderColor: "#FFFFFF", borderWidth: 2 },
});
