import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  color: string;
}

const bannerData: BannerItem[] = [
  {
    id: "1",
    title: "此处展示 Banner",
    subtitle: "这是一个示例横幅",
    color: "#FF6B6B",
  },
  {
    id: "2",
    title: "示例横幅 2",
    subtitle: "这是第二个示例横幅",
    color: "#4ECDC4",
  },
  {
    id: "3",
    title: "示例横幅 3",
    subtitle: "这是第三个示例横幅",
    color: "#1A535C",
  },
];

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % bannerData.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const renderItem = ({ item }: { item: BannerItem }) => (
    <View
      className="rounded-2xl p-6 items-center justify-center"
      style={{
        backgroundColor: item.color,
        height: 200,
        width: width - 32,
        marginHorizontal: 16,
      }}
    >
      <Text className="text-white text-2xl font-bold mb-2">{item.title}</Text>
      <Text className="text-white text-base">{item.subtitle}</Text>
    </View>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (width - 32 + 32));
    setActiveIndex(Math.max(0, Math.min(currentIndex, bannerData.length - 1)));
  };

  return (
    <View className="mt-4">
      <FlatList
        className="rounded-2xl"
        ref={flatListRef}
        data={bannerData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        snapToAlignment="center"
        decelerationRate="fast"
        snapToInterval={width}
      />

      {/* 指示点 */}
      <View className="flex-row items-center justify-center gap-2 mt-4">
        {bannerData.map((_, index) => (
          <View
            key={index}
            className={`rounded-full ${
              index === activeIndex
                ? colorScheme === "dark" ? "bg-white" : "bg-gray-800"
                : colorScheme === "dark" ? "bg-gray-400" : "bg-gray-300"
            }`}
            style={{
              width: index === activeIndex ? 8 : 6,
              height: 6,
            }}
          />
        ))}
      </View>
    </View>
  );
}
