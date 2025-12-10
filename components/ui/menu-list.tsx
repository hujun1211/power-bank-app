import { useColorScheme } from "@/hooks/use-color-scheme";
import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

interface MenuListProps {
  items: MenuItem[];
}

export default function MenuList({ items }: MenuListProps) {
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  return (
    <View className="bg-white/80 dark:bg-gray-800 rounded-2xl overflow-hidden">
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          onPressIn={() => setPressedItem(item.id)}
          onPressOut={() => setPressedItem(null)}
          className={`flex-row items-center px-4 py-4 ${
            pressedItem === item.id ? "bg-gray-100 dark:bg-gray-700" : ""
          } ${
            index !== items.length - 1
              ? "border-b border-gray-200 dark:border-gray-700"
              : ""
          }`}
          android_ripple={{ color: "rgba(0, 0, 0, 0.05)" }}
        >
          <View className="mr-4">
            {React.isValidElement(item.icon)
              ? React.cloneElement(
                  item.icon as React.ReactElement<{ color: string }>,
                  { color: colorScheme === "dark" ? "white" : "#666" }
                )
              : item.icon}
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-black dark:text-white">
              {item.title}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.subtitle}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color={colorScheme === "dark" ? "white" : "#999"}
          />
        </Pressable>
      ))}
    </View>
  );
}
