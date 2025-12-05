import { Stack } from "expo-router";

export default function DeviceLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add" />
      <Stack.Screen name="ota" />
      <Stack.Screen name="map" />
    </Stack>
  );
}
