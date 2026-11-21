import { useEffect, useMemo, useState } from "react";
import { PanResponder, Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Polyline, Stop } from "react-native-svg";
import { artwork, back, names, anchors, details } from "../shared/body-artwork";
import { useFitMap, type BodyView } from "../state/FitMapStore";

type Props = {
  view: BodyView;
  depth: boolean;
  selected: string | null;
  onSelect: (id: string, view: BodyView) => void;
  part?: string | null;
};
function Figure({
  view,
  selected,
  onSelect,
  silhouette = false,
  part,
}: Omit<Props, "depth"> & { silhouette?: boolean }) {
  const { accent, theme, routine, mode, recent } = useFitMap();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (silhouette || mode !== "recovery") return;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [silhouette, mode]);
  const regions =
    view === "front"
      ? Object.fromEntries(Object.entries(artwork.regions).filter(([id]) => id !== "traps"))
      : back;
  const volumes = Object.fromEntries(
    Object.keys(names).map((id) => [
      id,
      routine.filter((x) => x.muscle === names[id]).reduce((n, x) => n + x.sets * x.reps, 0),
    ]),
  );
  const max = Math.max(1, ...Object.values(volumes));
  const connected = Object.keys(regions).filter((id) => volumes[id] > 0);
  const fill = (id: string) => {
    if (id === selected) return accent;
    if (mode === "heatmap") return volumes[id] ? accent : "#3a4453";
    if (mode === "recovery") {
      const stamp = recent[`${view}:${id}`];
      if (!stamp) return "#3a4453";
      const hours = (now - stamp) / 3600000;
      return hours < 12 ? accent : hours < 36 ? "#e9a13b" : "#59d482";
    }
    return mode === "constellation" ? "#3a4453" : "url(#muscle)";
  };
  const markerY = selected === "calves" ? (part === "soleus" ? 803 : 740) : 264;
  const markerX = selected === "calves" ? 225 : part === "side" ? 178 : 195;
  return (
    <Svg width="100%" height="100%" viewBox="112 60 350 900">
      <Defs>
        <LinearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8d98a9" />
          <Stop offset="0.48" stopColor="#d6dce4" />
          <Stop offset="1" stopColor="#929cad" />
        </LinearGradient>
        <LinearGradient id="muscle" x1="0" y1="0" x2="1" y2="0.65">
          <Stop offset="0" stopColor="#f0f3f7" />
          <Stop offset="0.45" stopColor="#dce2ea" />
          <Stop offset="1" stopColor="#a5b0c0" />
        </LinearGradient>
      </Defs>
      {silhouette ? (
        <Path d={artwork.body} fill="#6c7888" />
      ) : (
        <>
          <G
            fill={theme === "blueprint" ? "#7992ac" : theme === "neon" ? "#59645c" : "url(#skin)"}
            stroke="#687486"
            strokeWidth={1.4}
            strokeLinejoin="round"
          >
            <Path d={artwork.body} />
            {Object.entries(artwork.decor)
              .filter(([id]) => view === "front" || id !== "pelvis")
              .flatMap(([id, paths]) => paths.map((d, i) => <Path key={`${id}-${i}`} d={d} />))}
            {(view === "front" ? artwork.regions.traps : artwork.regions.forearms).map((d, i) => (
              <Path key={i} d={d} />
            ))}
          </G>
          {Object.entries(regions).map(([id, paths]) => (
            <G<{ onClick?: () => void }>
              key={id}
              fill={fill(id)}
              opacity={
                mode === "heatmap" && volumes[id] && selected !== id
                  ? 0.35 + (0.65 * volumes[id]) / max
                  : 1
              }
              stroke={selected === id ? accent : "#657184"}
              strokeWidth={selected === id ? 3 : 1.5}
              strokeLinejoin="round"
              {...(Platform.OS === "web"
                // The SVG web adapter needs null to preserve the DOM click handler.
                ? { onPress: null as never, onClick: () => onSelect(id, view), accessibilityLabel: names[id] }
                : {
                    onPress: () => onSelect(id, view),
                    accessible: true,
                    accessibilityRole: "button" as const,
                    accessibilityLabel: names[id],
                    accessibilityState: { selected: selected === id },
                  })}
            >
              {paths.map((d, i) => (
                <Path key={i} d={d} />
              ))}
            </G>
          ))}
          <G
            pointerEvents="none"
            fill="none"
            stroke="#536074"
            strokeWidth={1.8}
            opacity={0.42}
            strokeLinecap="round"
          >
            {details[view].map((d, i) => (
              <Path key={i} d={d} />
            ))}
          </G>
          {mode === "constellation" && connected.length > 0 && (
            <G pointerEvents="none">
              <Polyline
                points={connected.map((id) => anchors[id].join(",")).join(" ")}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeDasharray="5 6"
              />
              {connected.map((id) => (
                <Circle
                  key={id}
                  cx={anchors[id][0]}
                  cy={anchors[id][1]}
                  r={5}
                  fill="white"
                  stroke={accent}
                  strokeWidth={2}
                />
              ))}
            </G>
          )}
          {selected && part && (
            <G pointerEvents="none">
              {[markerX, 574 - markerX].map((x) => (
                <Circle
                  key={x}
                  cx={x}
                  cy={markerY}
                  r={5}
                  fill="white"
                  stroke={accent}
                  strokeWidth={2}
                />
              ))}
            </G>
          )}
        </>
      )}
    </Svg>
  );
}

function createRotationGesture(onChange: (angle: number) => void, enabled: boolean) {
  let current = 0,
    start = 0,
    dragging = false;
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => enabled && Math.abs(gesture.dx) > 8,
    onMoveShouldSetPanResponderCapture: (_, gesture) => enabled && Math.abs(gesture.dx) > 8,
    onPanResponderGrant: () => {
      start = current;
      dragging = true;
    },
    onPanResponderMove: (_, move) => {
      current = start + move.dx * 0.7;
      onChange(current);
    },
    onPanResponderRelease: () => {
      dragging = false;
    },
    onPanResponderTerminate: () => {
      dragging = false;
    },
  });
  return { handlers: pan.panHandlers, isDragging: () => dragging };
}

export default function BodyMap(props: Props) {
  const [angle, setAngle] = useState(0);
  const gesture = useMemo(() => createRotationGesture(setAngle, props.depth), [props.depth]);
  const normalized = ((angle % 360) + 360) % 360;
  const flipped = normalized > 90 && normalized < 270;
  const visibleView = flipped ? (props.view === "front" ? "back" : "front") : props.view;
  const displayAngle = flipped ? angle + 180 : angle;
  const transform = [{ perspective: 1000 }, { rotateY: `${props.depth ? displayAngle : 0}deg` }];
  const offset = Math.sin((angle * Math.PI) / 180) * 9;
  const select = (id: string, view: BodyView) => {
    if (!gesture.isDragging()) props.onSelect(id, view);
  };
  return (
    <View style={styles.container} {...gesture.handlers} testID="body-map">
      {props.depth &&
        [1, 2, 3, 4].map((layer) => (
          <View
            key={layer}
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX: (-offset * layer) / 4 }, ...transform] },
            ]}
          >
            <Figure {...props} view={visibleView} silhouette />
          </View>
        ))}
      <View style={[StyleSheet.absoluteFill, { transform }]}>
        <Figure {...props} view={visibleView} onSelect={select} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, minHeight: 240 } });
