import type { StyleDefinition } from "@kidz/contracts";
import { View } from "react-native";

export function StyleRibbon({ styles }: { styles: StyleDefinition[] }) {
  const colors = styles.flatMap((style) => style.palette.slice(0, 2));
  const palette = colors.length ? colors : ["#6558F5", "#FF7058", "#B9D7FF"];
  return (
    <View style={{ height: 10, flexDirection: "row", overflow: "hidden" }} accessibilityLabel="Style mix palette">
      {palette.map((color, index) => (
        <View key={`${color}-${index}`} style={{ flex: index % 2 === 0 ? 1.35 : 1, backgroundColor: color }} />
      ))}
    </View>
  );
}
