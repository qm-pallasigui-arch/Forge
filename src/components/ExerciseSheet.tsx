import { useEffect, useState, type ComponentRef, type RefObject } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { EXERCISES, SUBPARTS, type Exercise, type ExerciseDef } from "../shared/fitness";
import { names } from "../shared/body-artwork";
import { colors, useFitMap, type BodyView } from "../state/FitMapStore";
import { TourTarget, useExperience } from "../state/Experience";
import { Choice, Stepper } from "./Controls";

function ExerciseRow({ item, id, view, compact, first }: { item: ExerciseDef; id: string; view: BodyView; compact: boolean; first: boolean }) {
  const store = useFitMap(), ux = useExperience();
  const existing = store.routine.find((x) => x.id === item.id);
  const [sets, setSets] = useState(existing?.sets ?? 3), [reps, setReps] = useState(existing?.reps ?? 10);
  const add = () => {
    store.add({ ...item, muscle: names[id], sets, reps, weight: existing?.weight ?? 0, progression: existing?.progression ?? 2.5 } as Exercise, view, id);
    ux.mark("add"); ux.notify(existing ? "Routine updated" : "Added to routine", "View", () => router.navigate("/routine"));
  };
  const button = <Pressable accessibilityRole="button" accessibilityLabel={`${existing ? "Update" : "Add"} ${item.name}`} onPress={add} style={[s.add, { backgroundColor: store.accent }]}><Text style={s.addText}>{existing ? "\u2713" : "+"}</Text></Pressable>;
  return <View style={s.exercise}>
    <View style={s.row}><View style={{ flex: 1 }}><Text style={s.exerciseName}>{item.name}</Text><Text style={s.muted}>{item.equipment}</Text></View>{compact && (first ? <TourTarget name="add">{button}</TourTarget> : button)}</View>
    {!compact && <View style={s.row}><Stepper label="Sets" value={sets} onChange={setSets} /><Stepper label="Reps" value={reps} onChange={setReps} />{first ? <TourTarget name="add">{button}</TourTarget> : button}</View>}
  </View>;
}
export default function ExerciseSheet({ id, view, onClose, top, height, expanded, onExpand, blurTarget, part, setPart }: {
  id: string; view: BodyView; onClose: () => void; top: number; height: number; expanded: boolean; onExpand: () => void; blurTarget: RefObject<ComponentRef<typeof View> | null>; part: string | null; setPart: (value: string | null) => void;
}) {
  const store = useFitMap();
  useEffect(() => { const listener = BackHandler.addEventListener("hardwareBackPress", () => { onClose(); return true; }); return () => listener.remove(); }, [onClose]);
  const [tab, setTab] = useState<"exercises" | "summary" | "notes">("exercises");
  const key = `${view}:${id}`;
  const exercises = (EXERCISES[id] ?? []).filter((item) => !part || item.parts?.includes(part));
  const saved = store.routine.filter((item) => item.muscle === names[id]);
  return <View testID="exercise-popover" style={[s.sheet, { top, height }]}>
    <BlurView pointerEvents="none" blurTarget={blurTarget} blurMethod="dimezisBlurView" intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${names[id]} exercises`} accessibilityState={{ expanded }} onPress={onExpand} style={s.expand}><Text style={s.title}>{names[id]}</Text><Text style={s.muted}>{expanded ? "Tap to collapse" : "Tap for all exercises"}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={s.close}><Text style={s.closeText}>{"\u00d7"}</Text></Pressable>
    </View>
    {expanded && <View style={s.tabs}>{(["exercises", "summary", "notes"] as const).map((value) => <Choice key={value} label={value[0].toUpperCase() + value.slice(1)} active={tab === value} onPress={() => setTab(value)} />)}</View>}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      {(!expanded || tab === "exercises") && <>
        {expanded && SUBPARTS[id] && <View style={s.parts}><Choice label="All" active={!part} onPress={() => setPart(null)} />{SUBPARTS[id].map((p) => <Choice key={p.id} label={p.label} active={part === p.id} onPress={() => setPart(p.id)} />)}</View>}
        {(expanded ? exercises : exercises.slice(0, 1)).map((item, index) => <ExerciseRow key={item.id} item={item} id={id} view={view} compact={!expanded} first={index === 0} />)}
        {!expanded && <Choice label={`See ${exercises.length} exercises`} onPress={onExpand} />}
      </>}
      {expanded && tab === "summary" && <View style={s.summary}><Text style={s.exerciseName}>Your {names[id].toLowerCase()} routine</Text><Text style={s.muted}>{saved.length} exercises / {saved.reduce((n, item) => n + item.sets, 0)} sets</Text><Text style={s.muted}>Last activity: {store.recent[key] ? new Date(store.recent[key]).toLocaleString() : "No activity yet"}</Text>{saved.map((item) => <Text key={item.id} style={s.exerciseName}>{item.name} / {item.sets} x {item.reps}</Text>)}</View>}
      {expanded && tab === "notes" && <><Text style={s.muted}>Saved on this device</Text><TextInput multiline accessibilityLabel={`${names[id]} notes`} placeholder="Cues or things to remember" placeholderTextColor={colors.muted} value={store.notes[key] ?? ""} onChangeText={(note) => store.setNote(key, note)} style={s.notes} textAlignVertical="top" /></>}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  sheet: { position: "absolute", left: 4, right: 4, overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#70809677", backgroundColor: "#151a2355" },
  header: { paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, expand: { flex: 1, minHeight: 56, justifyContent: "center" }, title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, closeText: { color: colors.text, fontSize: 28 }, tabs: { flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingBottom: 8 },
  content: { paddingHorizontal: 12, paddingBottom: 12 }, exercise: { paddingVertical: 9, borderTopWidth: 1, borderColor: colors.border, gap: 5 }, exerciseName: { color: colors.text, fontSize: 14, fontWeight: "600" }, muted: { color: "#bbc4d2", fontSize: 11, lineHeight: 18 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 }, add: { width: 44, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 14 }, addText: { fontSize: 25, color: "#111" }, parts: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 8 }, summary: { gap: 14, paddingVertical: 12 }, notes: { minHeight: 100, backgroundColor: "#1119", color: colors.text, borderRadius: 14, padding: 12, fontSize: 15 },
});
