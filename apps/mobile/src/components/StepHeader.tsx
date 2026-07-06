import { Text, View } from "react-native";

import { colors, typography } from "../theme";

export function StepHeader({ eyebrow, title, body, step }: { eyebrow: string; title: string; body: string; step: number }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <Text style={{ color: colors.ultraviolet, fontFamily: typography.bodySemibold, fontSize: 12, letterSpacing: 1.1, textTransform: "uppercase" }}>{eyebrow}</Text>
        <Text style={{ color: "#A4A8B1", fontFamily: typography.displaySoft, fontSize: 14 }}>0{step}</Text>
      </View>
      <Text style={{ color: colors.graphite, fontFamily: typography.display, fontSize: 34, lineHeight: 41, letterSpacing: -1.6, maxWidth: 590 }}>{title}</Text>
      <Text style={{ color: colors.secondary, fontFamily: typography.body, fontSize: 15, lineHeight: 23, marginTop: 14, maxWidth: 590 }}>{body}</Text>
    </View>
  );
}
