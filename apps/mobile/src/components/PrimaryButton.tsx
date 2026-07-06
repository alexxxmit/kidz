import { ArrowRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { colors, typography } from "../theme";

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 20,
        paddingRight: 8,
        backgroundColor: disabled ? "#B8BBC4" : pressed ? "#2B2F3A" : colors.graphite,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={{ color: colors.paper, fontFamily: typography.bodySemibold, fontSize: 16 }}>{label}</Text>
      <View style={{ width: 42, height: 42, backgroundColor: colors.ultraviolet, alignItems: "center", justifyContent: "center" }}>
        <ArrowRight size={20} color={colors.paper} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}
