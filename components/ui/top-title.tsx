import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { ArrowLeft, Ellipsis } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopTitleProps {
  title: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  backgroundColor?: string;
  showMoreMenu?: boolean;
  menuOptions?: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  }[];
}

export default function TopTitle({
  title,
  showBack = true,
  rightContent,
  backgroundColor = "bg-white",
  showMoreMenu = false,
  menuOptions = [],
}: TopTitleProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isBackPressed, setIsBackPressed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuVisible(true);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIsMenuVisible(false);
      });
    }
  }, [isMenuOpen, fadeAnim]);

  const handleMenuItemPress = (onPress: () => void) => {
    setIsMenuOpen(false);
    onPress();
  };

  return (
    <>
      {/* 菜单遮罩层 - 放在最顶层 */}
      {isMenuVisible && (
        <Animated.View
          className="absolute top-0 left-0 right-0 bottom-0 bg-black z-40"
          style={{
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.2],
            }),
          }}
          pointerEvents="auto"
        >
          <Pressable
            onPress={() => setIsMenuOpen(false)}
            className="w-full h-full"
          />
        </Animated.View>
      )}

      {/* 菜单 - 放在遮罩上方 */}
      {isMenuVisible && menuOptions.length > 0 && (
        <Animated.View
          className="absolute right-4 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 min-w-40"
          style={{
            top: insets.top + 50,
            opacity: fadeAnim,
          }}
          pointerEvents="auto"
        >
          {menuOptions.map((option, index) => (
            <Pressable
              key={index}
              onPress={() => handleMenuItemPress(option.onPress)}
              android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
              className={`px-4 py-2 flex-row items-center gap-2 ${
                index !== menuOptions.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              {option.icon && (
                <View className="flex-shrink-0">{option.icon}</View>
              )}
              <Text className="text-gray-800 text-base">{option.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      <View
        className={`absolute bg-white dark:bg-gray-900 top-0 left-0 right-0 z-50 px-4 py-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 ${backgroundColor}`}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-start gap-3 flex-1">
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              onPressIn={() => setIsBackPressed(true)}
              onPressOut={() => setIsBackPressed(false)}
              android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: true }}
              className={`rounded-full`}
            >
              <ArrowLeft size={24} color={colorScheme === "dark" ? "white" : "black"} />
            </Pressable>
          )}
          <Text className="text-2xl font-bold text-black dark:text-white">{title}</Text>
        </View>
        <View className="flex-row items-center justify-end gap-2">
          {rightContent && (
            <View className="flex-row items-center gap-2">{rightContent}</View>
          )}
          {showMoreMenu && (
            <Pressable
              onPress={() => setIsMenuOpen(!isMenuOpen)}
              android_ripple={{
                color: "rgba(0, 0, 0, 0.1)",
                borderless: true,
              }}
              className="rounded-full"
            >
              <Ellipsis size={24} color={colorScheme === "dark" ? "white" : "black"} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={{ height: insets.top + 40 }} />
    </>
  );
}
