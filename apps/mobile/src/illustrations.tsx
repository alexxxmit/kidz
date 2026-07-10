import type { GenderPresentation, HairColor, HairProfile, OutfitOption, WardrobeItemInput } from "@kidz/contracts";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

type Garment = Omit<WardrobeItemInput, "profileId">;
type GridCell = { column: number; row: number };

const ink = "#24212A";
const wardrobeGrid = require("../assets/editorial/wardrobe-products-grid-v1.png");
const beautyGrid = require("../assets/editorial/beauty-reference-grid-v1.png");

function PhotoGridCrop({ source, cell, columns, rows, height, rounded = 22, inset = 0 }: { source: number; cell: GridCell; columns: number; rows: number; height: number; rounded?: number; inset?: number }) {
  const cellScale = 100 + inset * 2;
  return <View style={[styles.photoCrop, { height, borderRadius: rounded }]}><Image source={source} resizeMode="stretch" style={{ position: "absolute", width: `${columns * cellScale}%`, height: `${rows * cellScale}%`, left: `${-(cell.column * cellScale + inset)}%`, top: `${-(cell.row * cellScale + inset)}%` }} /></View>;
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

export function GarmentIllustration({ item, height = 92 }: { item: Garment; height?: number }) {
  return <PhotoGridCrop source={wardrobeGrid} cell={productCell(item)} columns={4} rows={5} height={height} rounded={18} inset={5} />;
}

export function OccasionIllustration({ occasion, active = false }: { occasion: "school" | "walk" | "party" | "sport"; active?: boolean }) {
  const fg = active ? "#FFFFFF" : ink;
  const accent = active ? "#FFD27C" : "#6C4BFF";
  return <Svg width="42" height="34" viewBox="0 0 64 52">
    {occasion === "school" && <G><Path d="M19 19 Q20 8 32 8 Q44 8 45 19" fill="none" stroke={accent} strokeWidth="4" /><Rect x="12" y="17" width="40" height="31" rx="10" fill="none" stroke={fg} strokeWidth="3" /><Rect x="20" y="29" width="24" height="13" rx="5" fill={accent} fillOpacity="0.4" stroke={accent} strokeWidth="2" /><Line x1="32" y1="18" x2="32" y2="27" stroke={fg} strokeWidth="3" /></G>}
    {occasion === "walk" && <G><Path d="M11 34 Q21 25 30 31 L40 39 Q48 41 55 43 Q54 49 46 49 L15 47 Q8 44 11 34 Z" fill="none" stroke={fg} strokeWidth="3" /><Path d="M17 32 L21 19 L29 13 L34 23" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><Line x1="18" y1="40" x2="48" y2="43" stroke={accent} strokeWidth="2" /></G>}
    {occasion === "party" && <G><Circle cx="32" cy="27" r="16" fill="none" stroke={fg} strokeWidth="3" /><Path d="M17 27 H47 M32 11 V43 M21 16 Q32 27 43 16 M21 38 Q32 27 43 38" fill="none" stroke={accent} strokeWidth="2" /><Path d="M8 13 L11 8 L14 13 L19 16 L14 19 L11 24 L8 19 L3 16 Z" fill={accent} /></G>}
    {occasion === "sport" && <G><Path d="M13 34 Q24 26 34 31 L43 37 L57 40 Q56 48 47 48 L16 46 Q9 44 13 34 Z" fill="none" stroke={fg} strokeWidth="3" /><Path d="M22 30 L29 20 L40 24" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" /><Line x1="7" y1="20" x2="17" y2="20" stroke={fg} strokeWidth="3" /><Line x1="4" y1="27" x2="15" y2="27" stroke={fg} strokeWidth="3" /></G>}
  </Svg>;
}

export function SchoolDressCodeIllustration({ mode, active = false }: { mode: "UNIFORM" | "WHITE_TOP" | "FREE_STYLE"; active?: boolean }) {
  const outline = active ? "#FFFFFF" : ink;
  const top = mode === "FREE_STYLE" ? "#6C4BFF" : "#F7F5EF";
  const bottom = mode === "UNIFORM" ? "#27344E" : mode === "WHITE_TOP" ? "#4E596B" : "#D55E79";
  return <Svg width="66" height="72" viewBox="0 0 80 90"><Path d="M25 18 L13 28 L19 41 L27 36 L27 55 L53 55 L53 36 L61 41 L67 28 L55 18 L48 14 Q40 22 32 14 Z" fill={top} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />{mode === "UNIFORM" && <><Path d="M32 16 L40 29 L48 16" fill="none" stroke="#6C4BFF" strokeWidth="2.5" /><Path d="M40 28 L36 41 L40 48 L44 41 Z" fill="#7D2938" /></>}{mode === "FREE_STYLE" && <Path d="M29 34 Q40 26 51 34 L47 42 Q40 37 33 42 Z" fill="#FFD27C" />}<Path d="M26 55 L40 55 L37 82 L22 82 Z M40 55 L54 55 L58 82 L43 82 Z" fill={bottom} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />{mode === "WHITE_TOP" && <Path d="M23 77 H58" stroke="#B7DFF7" strokeWidth="3" />}</Svg>;
}

const emoStyles = new Set(["emo", "goth", "punk", "egirl", "scene", "grunge", "visual-kei", "whimsigoth", "dark-feminine"]);
const beautyCell = (kind: "hair" | "makeup" | "accessories", hair: HairProfile, gender: GenderPresentation, styleId: string): GridCell => {
  const emo = emoStyles.has(styleId);
  const masculine = gender === "MASCULINE" || gender === "NEUTRAL" || gender === "NOT_SPECIFIED";
  const row = emo ? (masculine ? 3 : 2) : (masculine ? 1 : 0);
  if (kind === "makeup") return { column: 2, row };
  if (kind === "accessories") return { column: 3, row };
  const short = hair.length === "BUZZ" || hair.length === "SHORT";
  return { column: short ? 0 : 1, row };
};

export function BeautyReference({ kind, hair, gender, styleId, height = 148 }: { kind: "hair" | "makeup" | "accessories"; look: OutfitOption; hair: HairProfile; gender: GenderPresentation; styleId: string; recommendedColor?: HairColor; height?: number }) {
  return <PhotoGridCrop source={beautyGrid} cell={beautyCell(kind, hair, gender, styleId)} columns={4} rows={4} height={height} rounded={18} />;
}

const styles = StyleSheet.create({
  photoCrop: { width: "100%", overflow: "hidden", backgroundColor: "#F5F1F7" },
});
