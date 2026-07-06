import {
  Unbounded_600SemiBold,
  Unbounded_700Bold,
} from "@expo-google-fonts/unbounded";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "../src/theme";

export default function RootLayout() {
  const [loaded] = useFonts({
    Unbounded_600SemiBold,
    Unbounded_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.porcelain }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.porcelain } }} />
    </SafeAreaProvider>
  );
}
