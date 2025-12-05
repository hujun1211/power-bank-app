import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}
    >
      <Stack.Screen name="login" options={{ animation: "none" }} />
      <Stack.Screen name="login-pass" options={{ animation: "none" }} />
      <Stack.Screen name="signup" options={{ animation: "default" }} />
    </Stack>
  );
}
