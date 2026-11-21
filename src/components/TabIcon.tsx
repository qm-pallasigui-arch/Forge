import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { ColorValue } from "react-native";

export default function TabIcon({ name, color }: { name: "body" | "routine" | "plan"; color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {name === "body" ? <><Circle cx={12} cy={4} r={2} /><Path d="M5 9l7-2 7 2M12 7v7m0 0l-4 7m4-7 4 7" /></>
        : name === "routine" ? <><Path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1" /></>
        : <><Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M7 3v4m10-4v4M3 11h18m-14 5h3m4 0h3" /></>}
    </Svg>
  );
}
