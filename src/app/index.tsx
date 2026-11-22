import WorkoutEntry from "../components/WorkoutEntry";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurTargetView } from "expo-blur";
import Svg, { Circle, Path } from "react-native-svg";
import { artwork, back, names, anchors } from "../shared/body-artwork";
import { focusCamera, placeCard, projectAnchor, sideAtAngle } from "../shared/body-projection";
import BodyMap from "../components/BodyMap";
import LayersSheet from "../components/LayersSheet";
import ExerciseSheet from "../components/ExerciseSheet";
import { Choice } from "../components/Controls";
import { colors, useFitMap, type BodyView, type Mode } from "../state/FitMapStore";
import { OneTimeHint, Pulse, TourTarget, useExperience } from "../state/Experience";

export default function BodyScreen() {
  const store = useFitMap(), ux = useExperience();
  const [angle, setAngle] = useState(0), [depth, setDepth] = useState(true), [browse, setBrowse] = useState(false), [layers, setLayers] = useState(false);
  const [selected, setSelected] = useState<{ id: string; view: BodyView } | null>(null), [expanded, setExpanded] = useState(false), [part, setPart] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [targetCamera, setTargetCamera] = useState({ zoom: 1, x: 0, y: 0 });
  const [animatedCamera, setCamera] = useState(targetCamera), cameraRef = useRef(animatedCamera), blurTarget = useRef<ComponentRef<typeof View>>(null);
  const camera = ux.reducedMotion ? targetCamera : animatedCamera;
  const view = sideAtAngle(angle), unlocked = ux.guide.unlocked || store.routine.length > 0;
  const mode = unlocked ? store.mode : "map";
  useEffect(() => {
    if (ux.reducedMotion) { cameraRef.current = targetCamera; return; }
    const start = performance.now(), from = cameraRef.current; let frame = 0;
    const tick = () => { const progress = Math.min(1, (performance.now() - start) / 260), eased = 1 - (1 - progress) ** 3;
      const next = { zoom: from.zoom + (targetCamera.zoom - from.zoom) * eased, x: from.x + (targetCamera.x - from.x) * eased, y: from.y + (targetCamera.y - from.y) * eased };
      cameraRef.current = next; setCamera(next); if (progress < 1) frame = requestAnimationFrame(tick);
    }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [targetCamera, ux.reducedMotion]);
  const pick = (id: string, side: BodyView) => {
    const nextAngle = side === view ? angle : side === "front" ? 0 : 180;
    setAngle(nextAngle); setSelected({ id, view: side }); setExpanded(false); setPart(null); ux.mark("select");
    setTargetCamera(focusCamera(...anchors[id], size.width, size.height, nextAngle));
  };
  const clear = () => { setSelected(null); setExpanded(false); setPart(null); setTargetCamera({ zoom: 1, x: 0, y: 0 }); };
  const turn = (side: BodyView) => { setAngle(side === "front" ? 0 : 180); };
  const ids = Object.keys(view === "front" ? artwork.regions : back).filter((id) => view === "back" || id !== "traps");
  const anchor = selected ? anchors[selected.id] : anchors.chest;
  const pin = projectAnchor(...anchor, size.width, size.height, depth ? angle : view === "back" ? 180 : 0, camera.zoom, camera.x, camera.y);
  const lower = anchor[1] >= 490;
  const card = placeCard(size.height * (lower ? 0.64 : 0.3), size.height, lower, expanded);
  const pinVisible = selected?.view === view && Math.abs(Math.cos(angle * Math.PI / 180)) > 0.08 && pin.x >= 0 && pin.x <= size.width && pin.y >= 0 && pin.y <= size.height;
  const edge = card.below ? card.top : card.top + card.height;
  const hints: Partial<Record<Mode, string>> = { heatmap: "Brighter muscles have more planned sets x reps. Gray means no exercises.", recovery: "Recent shows time since an exercise was added or a workout logged: accent under 12 h, amber 12-36 h, green 36 h+.", constellation: "Connect links muscle groups with exercises in your routine. It does not show anatomical connections." };
  const hintKey = `mode-${mode}`;
  const showHint = mode !== "map" && (!ux.active || !ux.step) && ux.ready;
  return <SafeAreaView style={s.screen} edges={["left", "right"]}>
    <View style={s.header}><Text style={[s.logo, { color: store.accent }]}>FIT<Text style={{ color: colors.text }}>MAP</Text></Text><Choice label="Menu" onPress={() => setLayers(true)} /></View>
    {store.error && <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>}
    {unlocked && <View style={s.modes} accessibilityRole="radiogroup">{([["map", "Muscles"], ["heatmap", "Heatmap"], ["recovery", "Recent"], ["constellation", "Connect"]] as [Mode, string][]).map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: mode === value }} aria-checked={mode === value} onPress={() => store.setMode(value)} style={[s.mode, mode === value && { backgroundColor: store.accent }]}><Text style={[s.modeText, mode === value && { color: "#101215" }]}>{label}</Text></Pressable>)}</View>}
    {showHint && <OneTimeHint key={hintKey} name={hintKey} message={hints[mode] ?? ""}><View style={s.row}>{!store.routine.length && <Choice label="Add exercises" onPress={() => { store.setMode("map"); setBrowse(true); }} />}</View></OneTimeHint>}
    <TourTarget name="muscle"><Pressable accessibilityRole="button" accessibilityState={{ expanded: browse }} onPress={() => setBrowse(!browse)} style={s.browse}><Text style={s.browseLabel}>{browse ? "Hide muscle list" : "Choose muscle by name"}</Text></Pressable></TourTarget>
    {browse && <View><View style={s.row}><Choice label="Show front muscles" active={view === "front"} onPress={() => turn("front")} /><Choice label="Show back muscles" active={view === "back"} onPress={() => turn("back")} /></View><ScrollView horizontal style={s.names} contentContainerStyle={{ gap: 7 }}>{ids.map((id) => <Choice key={id} label={names[id]} onPress={() => pick(id, view)} />)}</ScrollView></View>}
    <TourTarget name="figure" style={s.figure}>
      <View style={s.canvas} onLayout={(event) => { const { width, height } = event.nativeEvent.layout; if (size.width !== width || size.height !== height) { setSize({ width, height }); setTargetCamera(selected ? focusCamera(...anchors[selected.id], width, height, angle) : { zoom: 1, x: 0, y: 0 }); } }}>
        <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
          <BodyMap view={view} angle={angle} onAngle={setAngle} camera={camera} depth={depth} selected={selected?.view === view ? selected.id : null} part={part} onSelect={pick} />
        </BlurTargetView>
        {selected && <>
          <Svg pointerEvents="none" width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
            {pinVisible && <Path d={`M ${pin.x} ${pin.y} L ${size.width / 2} ${edge}`} stroke={store.accent} strokeWidth={1.5} strokeDasharray="4 5" />}
            <Circle cx={size.width / 2} cy={edge} r={4} fill={store.accent} />
          </Svg>
          {pinVisible && <View testID="muscle-pin" pointerEvents="none" style={{ position: "absolute", left: pin.x - 12, top: pin.y - 12 }}><Pulse size={24} /><View style={{ position: "absolute", left: 9, top: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: "white" }} /></View>}
          <ExerciseSheet key={`${selected.view}:${selected.id}`} {...selected} onClose={clear} top={card.top} height={card.height} expanded={expanded} onExpand={() => setExpanded(!expanded)} blurTarget={blurTarget} part={part} setPart={setPart} />
        </>}
      </View>
    </TourTarget>
    <WorkoutEntry exercises={store.routine} />
    <Text style={s.hint}>Tap a muscle to see exercises</Text>
    <View style={s.center}>{(["front", "back"] as const).map((side) => <Choice key={side} label={side === "front" ? "Front" : "Back"} active={view === side} onPress={() => turn(side)} />)}</View>
    <Text style={s.disclaimer}>For general fitness information only.</Text>
    {layers && <LayersSheet depth={depth} setDepth={(value) => { setDepth(value); if (!value) setAngle(view === "front" ? 0 : 180); }} onClose={() => setLayers(false)} />}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 }, header: { height: 54, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, logo: { fontSize: 17, fontWeight: "900", letterSpacing: 2 },
  modes: { flexDirection: "row", borderRadius: 24, backgroundColor: colors.surface, padding: 3 }, mode: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }, modeText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  browse: { minHeight: 44, justifyContent: "center" }, browseLabel: { color: colors.text, fontSize: 13, fontWeight: "600" }, names: { maxHeight: 50, marginBottom: 5, marginTop: 5 },
  figure: { flex: 1, minHeight: 180 }, canvas: { flex: 1, overflow: "hidden" }, hint: { paddingVertical: 6, color: "#c4cedd", fontSize: 12, textAlign: "center" }, center: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 8 }, disclaimer: { color: colors.muted, fontSize: 10, textAlign: "center", paddingBottom: 5 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, hintCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 10, gap: 5 }, hintText: { color: colors.text, fontSize: 12, lineHeight: 17 }, error: { color: "#ff9a89", fontSize: 12 },
});
