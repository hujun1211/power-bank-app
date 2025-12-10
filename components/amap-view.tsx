import { useRef } from "react";
import { WebView } from "react-native-webview";

export type RoutePoint = {
  lng: number;
  lat: number;
  color?: string; // 折线到下一点的颜色
  isStart?: boolean;
  isEnd?: boolean;
  isStay?: boolean; // 停留点
};

export default function AMapWebView({
  coord,
  routeCoords,
  onCoordinateChange,
}: {
  coord?: { lng: number; lat: number };
  routeCoords?: RoutePoint[];
  onCoordinateChange?: (coord: { lng: number; lat: number }) => void;
}) {
  const webViewRef = useRef<WebView>(null);

  const routeJs = routeCoords
    ? `[${routeCoords
        .map(
          (c) =>
            `{lng:${c.lng},lat:${c.lat},color:"${c.color ?? "#3366FF"}",isStart:${!!c.isStart},isEnd:${!!c.isEnd},isStay:${!!c.isStay}}`
        )
        .join(",")}]`
    : "[]";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
        <script src="https://webapi.amap.com/maps?v=2.0&key=3e90ddbaaf65d923d7492b521ab35f1a"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const initialCoord = [${coord?.lng ?? 116.397428}, ${coord?.lat ?? 39.90923}];
          const map = new AMap.Map('map', {
            zoom: 14,
            center: initialCoord
          });

          // 初始化时发送一次坐标
          window.ReactNativeWebView.postMessage(JSON.stringify({
            lng: initialCoord[0],
            lat: initialCoord[1]
          }));

          const routePoints = ${routeJs};
          if(routePoints.length > 0){
            // 绘制折线
            for(let i = 0; i < routePoints.length - 1; i++){
              const p1 = routePoints[i];
              const p2 = routePoints[i+1];
              const polyline = new AMap.Polyline({
                path: [[p1.lng,p1.lat],[p2.lng,p2.lat]],
                strokeColor: p1.color,
                strokeWeight: 5
              });
              polyline.setMap(map);
            }

            // 绘制 marker
            routePoints.forEach(p => {
              let iconUrl = "";
              if(p.isStart){
                iconUrl = "https://img.ichiyo.in/2025/12/ddaf751e2a5fecfc78bbeca4b23e57bb.svg?raw=true"; // 起点图标
              } else if(p.isEnd){
                iconUrl = "https://img.ichiyo.in/2025/12/84f72a2aa126fd82c1a37c5e5dd68b0d.svg?raw=true"; // 终点图标
              } else if(p.isStay){
                iconUrl = "https://img.ichiyo.in/2025/12/cd6d17afc37538f53b7454aa1bce9685.svg?raw=true"; // 停留点图标
              }

              if(iconUrl){
                new AMap.Marker({
                  position: [p.lng,p.lat],
                  map,
                  icon: iconUrl,
                  offset: new AMap.Pixel(-12,-12)
                });
              }
            });
          }

          // 点击地图更新坐标
          // map.on('click', function(e) {
          //   window.ReactNativeWebView.postMessage(JSON.stringify({
          //     lng: e.lnglat.lng,
          //     lat: e.lnglat.lat
          //   }));
          // });
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      className="flex-1"
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        onCoordinateChange?.(data);
      }}
    />
  );
}
