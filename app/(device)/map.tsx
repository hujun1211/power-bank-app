import GMapView from "@/components/gmap-view";
import TopTitle from "@/components/ui/top-title";
import { useLocalSearchParams } from "expo-router";
import { Locate } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapPage() {
  const { t } = useTranslation();
  const { lng, lat } = useLocalSearchParams<{ lng: string; lat: string }>();
  const [location, setLocation] = useState({
    lng: parseFloat(lng || "120.123"),
    lat: parseFloat(lat || "30.456"),
  });
  const insets = useSafeAreaInsets();

  const routeCoords = [
    { lng: 120.123, lat: 30.456, color: "#000", isStart: true },
    { lng: 120.124, lat: 30.457, color: "red", isStay: true },
    { lng: 120.125, lat: 30.459, color: "#000", isEnd: true },
  ];

  return (
    <>
      <TopTitle
        title={t("map-header-title")}
        showBack={true}
        showMoreMenu={true}
        menuOptions={[
          {
            icon: <Locate size={18} />,
            label: t("map-header-more-refresh-location"),
            onPress: () => console.log(t("map-header-more-refresh-location")),
          },
        ]}
      />

      <View className="flex-1">
        <GMapView
          // coord={location}
          // routeCoords={routeCoords}
          // onCoordinateChange={setLocation}
        />

        {/* 底部悬浮 */}
        <View
          style={{ bottom: insets.bottom + 15 }}
          className="absolute left-4 right-4 bg-white rounded-xl p-4 shadow-xl"
        >
          <Text className="text-base font-medium text-gray-800">
            {t("map-current-location")}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {t("map-current-location-lng")}：{location.lng}
          </Text>
          <Text className="text-sm text-gray-600">
            {t("map-current-location-lat")}：{location.lat}
          </Text>
        </View>
      </View>
    </>
  );
}
