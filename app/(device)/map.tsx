import TopTitle from "@/components/ui/top-title";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { AMapSdk, MapType, MapView } from "react-native-amap3d";

export default function MapPage() {
  useEffect(() => {
    AMapSdk.init(
      Platform.select({
        android: "3fff9be5d3c2a35509e2b8f828b1db5e",
        ios: "3e90ddbaaf65d923d7492b521ab35f1a",
      })
    );
  }, []);
  return (
    <>
      <TopTitle title="设备位置" showBack={true} />
      <View className="flex-1">
        <MapView
          mapType={MapType.Satellite}
          initialCameraPosition={{
            target: {
              latitude: 39.91095,
              longitude: 116.37296,
            },
            zoom: 8,
          }}
        />
      </View>
    </>
  );
}
