import { useColorScheme } from "@/hooks/use-color-scheme";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();



  return (
    <SafeAreaProvider>
      <ActionSheetProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(auth)"
              options={{ animation: "fade_from_bottom" }}
            />
          </Stack>

          <StatusBar style="auto" />
        </ThemeProvider>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}
