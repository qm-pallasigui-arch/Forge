import { weekday } from "../shared/sessions";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, useFitMap } from "../state/FitMapStore";
import { useExperience } from "../state/Experience";
import { completedSets, remainingSets, progressRoutine } from "../shared/workout";
import { EXERCISES, type Exercise } from "../shared/fitness";
import { names } from "../shared/body-artwork";
import WeightControl from "../components/WeightControl";

function clock(ms: number) { const n = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`; }
function useClock() { const [now, setNow] = useState(Date.now); useEffect(() => { const tick = () => setNow(Date.now()); const timer = setInterval(tick, 1000), listener = AppState.addEventListener("change", tick); return () => { clearInterval(timer); listener.remove(); }; }, []); return now; }
function Elapsed({ start }: { start: number }) { const now = useClock(); return <Text style={s.muted}>{clock(now - start)}</Text>; }
function Action({ label, onPress, accent, disabled = false }: { label: string; onPress: () => void; accent?: string; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={[s.action, accent ? { backgroundColor: accent, borderRadius: 16, opacity: disabled ? 0.4 : 1 } : null]}><Text style={[s.text, accent ? { color: "#111", fontWeight: "800", textAlign: "center" } : null]}>{label}</Text></Pressable>;
}
function RestBar() {
  const store = useFitMap(), w = store.workout, now = Math.max(useClock(), w?.restStartedAt ?? 0), announced = useRef<number | null>(null);
  const until = w?.restUntil ?? null, left = until ? Math.max(0, until - now) : 0;
  useEffect(() => { if (until && !left && announced.current !== until) { announced.current = until; Vibration.vibrate(35); AccessibilityInfo.announceForAccessibility("Rest complete. Ready for your next set."); store.stopRest(); } }, [until, left, store]);
  if (!w || !until || !left || !remainingSets(w)) return null;
  const fraction = Math.min(1, left / Math.max(1, until - (w.restStartedAt ?? until - 90000)));
  return <View testID="rest-bar" style={{ gap: 4 }}><View style={s.row}><Text style={s.title}>Rest {clock(left)}</Text><View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}><View style={{ width: `${fraction * 100}%`, height: 5, backgroundColor: store.accent }} /></View></View><View style={s.row}><Action label="-15 s" onPress={() => store.adjustRest(-15)} /><Action label="+30 s" onPress={() => store.adjustRest(30)} /><Action label="Skip rest" onPress={store.stopRest} /></View></View>;
}
type Summary = { done: number; total: number; minutes: number; updates: number };
export default function WorkoutScreen() {
  const store = useFitMap(), ux = useExperience(), w = store.workout;
  const [menu, setMenu] = useState(false), [confirm, setConfirm] = useState<"finish" | "discard" | null>(null), [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null), [summary, setSummary] = useState<Summary | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null), positions = useRef<Record<string, number>>({});
  const next = w?.exercises.find(e => !w.skipped?.includes(e.id) && (w.completed[e.id]?.length ?? 0) < e.sets), nextId = next?.id;
  const [session, setSession] = useState(w?.id);
  if (w?.id && session !== w.id) { setSession(w.id); setSummary(null); setConfirm(null); setMenu(false); }
  const [previousNext, setPreviousNext] = useState(nextId);
  if (previousNext !== nextId) { setPreviousNext(nextId); setExpanded(null); }
  useEffect(() => { if (nextId) { const timer = setTimeout(() => scroll.current?.scrollTo({ y: positions.current[nextId] ?? 0, animated: !ux.reducedMotion }), 100); return () => clearTimeout(timer); } }, [nextId, ux.reducedMotion]);
  const nextDay = (() => { for (let i = 1; i <= 7; i++) { const d = new Date(); d.setDate(d.getDate() + i); if (store.schedule[weekday(d)]?.on) return `Next workout: ${d.toLocaleDateString(undefined, { weekday: "long" })}`; } return "No next workout scheduled"; })();
  if (!w) return <SafeAreaView edges={["bottom"]} style={s.root}><View style={[s.content, { flex: 1, justifyContent: "center" }]}><Text style={s.heading}>{summary ? "Workout complete" : "Ready when you are"}</Text>{summary && <><Text style={s.title}>{summary.done} of {summary.total} sets {"\u00b7"} {summary.minutes} min</Text><Text style={s.text}>{summary.updates ? `${summary.updates} exercise weights updated for next time.` : "Weights unchanged."}</Text><Text style={s.muted}>{nextDay}</Text></>}<Action label="Back to Plan" onPress={() => router.navigate("/plan")} accent={store.accent} /></View></SafeAreaView>;
  const done = completedSets(w), total = w.exercises.reduce((n, e) => n + e.sets, 0), left = total - done;
  const title = [...new Set(w.exercises.map(e => e.muscle))].join(" + ");
  const excluded = store.routine.filter(e => !w.exercises.some(x => x.id === e.id));
  const upcoming = w.exercises.filter(e => !w.skipped?.includes(e.id) && (w.completed[e.id]?.length ?? 0) < e.sets)[1];
  const finish = () => { const updated = progressRoutine(store.routine, w); const result = { done, total, minutes: Math.max(1, Math.round((Date.now() - w.startedAt) / 60000)), updates: updated.filter((e, i) => e.weight !== store.routine[i].weight).length }; store.finishWorkout(); setSummary(result); setConfirm(null); };
  const candidates: Exercise[] = Object.entries(EXERCISES).flatMap(([muscle, items]) => items.map(e => ({ ...e, muscle: names[muscle], days: [], sets: 3, reps: 10, weight: 0, progression: 2.5 }))).filter((e, i, all) => !w.exercises.some(x => x.id === e.id) && all.findIndex(x => x.id === e.id) === i);
  return <SafeAreaView edges={["bottom"]} style={s.root}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to routine" onPress={() => router.navigate("/routine")} style={s.icon}><Text style={s.title}>{"\u2190"}</Text></Pressable><View style={{ flex: 1 }}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.muted}>{done}/{total} sets {"\u00b7"} <Elapsed start={w.startedAt} /></Text></View><Pressable accessibilityRole="button" accessibilityLabel="Workout menu" onPress={() => setMenu(true)} style={s.icon}><Text style={s.title}>{"\u22ee"}</Text></Pressable></View>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      {store.error && <Text accessibilityRole="alert" style={s.text}>{store.error}</Text>}
      {!!excluded.length && <View><Text style={s.muted}>Today&apos;s plan: {w.exercises.length} of {w.exercises.length + excluded.length} exercises</Text><Action label="Include the rest" onPress={() => store.includeExercises(excluded)} /></View>}
      {w.exercises.map(e => { const checked = w.completed[e.id] ?? [], complete = checked.length === e.sets, skipped = w.skipped?.includes(e.id), open = expanded === e.id || (expanded === null && nextId === e.id), last = store.lastLog[e.id], nextSet = Array.from({ length: e.sets }, (_, i) => i).find(i => !checked.includes(i)); return <View key={e.id} onLayout={event => { positions.current[e.id] = event.nativeEvent.layout.y; }} style={s.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${e.name}, ${complete ? "done" : skipped ? "skipped" : "expand"}`} accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? "" : e.id)} style={s.cardTitle}><Text style={[s.title, { flex: 1 }]}>{e.name}</Text><Text style={[s.muted, complete && { color: store.accent }]}>{complete ? "\u2713 done" : skipped ? "Skipped" : `${checked.length}/${e.sets}`}</Text></Pressable>
        {open && <><Text style={s.text}>{e.equipment.toLowerCase() === "bodyweight" ? "Bodyweight" : `${e.weight} kg`} {"\u00d7"} {e.reps}</Text><Text style={s.muted}>{last ? `Last time: ${last.weight} kg \u00d7 ${last.reps}` : "First session"}</Text>
          <View style={s.row}>{Array.from({ length: e.sets }, (_, i) => { const isDone = checked.includes(i), label = `${e.name}, set ${i + 1} of ${e.sets}, ${isDone ? "done" : "not done"}`; return <View key={i} style={[s.ring, i === nextSet && !skipped && { borderColor: store.accent }]}><Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: isDone }} aria-checked={isDone} onPress={() => { store.checkSet(e.id, i); AccessibilityInfo.announceForAccessibility(`${e.name}, set ${i + 1} of ${e.sets}, ${isDone ? "not done" : "done"}`); }} style={[s.set, { backgroundColor: isDone ? store.accent : colors.background, borderColor: isDone ? store.accent : "#737c8a" }]}><Text style={[s.text, isDone && { color: "#111", fontWeight: "800" }]}>{isDone ? "\u2713 " : ""}{i + 1}</Text></Pressable></View>; })}</View>
          {e.equipment.toLowerCase() !== "bodyweight" && <View style={s.row}><Action label="-0.5 kg" onPress={() => store.editWorkout(e.id, { weight: e.weight - 0.5 })} /><Text style={s.text}>{e.weight} kg</Text><Action label="+0.5 kg" onPress={() => store.editWorkout(e.id, { weight: e.weight + 0.5 })} /></View>}
          <View style={s.row}><Action label="-1 rep" onPress={() => store.editWorkout(e.id, { reps: e.reps - 1 })} /><Text style={s.text}>{e.reps} reps</Text><Action label="+1 rep" onPress={() => store.editWorkout(e.id, { reps: e.reps + 1 })} /></View>
          {e.equipment.toLowerCase() === "barbell" && <WeightControl exercise={e} onChange={changed => store.editWorkout(e.id, changed)} />}
          {!complete && !skipped && <Action label="Skip exercise" onPress={() => store.skipExercise(e.id)} />}
        </>}
      </View>; })}
      {upcoming && <Text style={s.muted}>Up next: {upcoming.name} {"\u00b7"} {upcoming.sets} {"\u00d7"} {upcoming.reps} {"\u00b7"} {upcoming.weight} kg</Text>}
      <Action label="+ Add exercise" onPress={() => setAdding(true)} />
    </ScrollView>
    <View style={s.footer}><RestBar /><Action label="Finish workout" onPress={() => setConfirm("finish")} accent={store.accent} disabled={!done} /></View>
    <Modal visible={menu || !!confirm || adding} transparent animationType="none" onRequestClose={() => { setMenu(false); setConfirm(null); setAdding(false); }}><View style={s.scrim}><View style={s.dialog}><ScrollView contentContainerStyle={{ gap: 12 }}>
      {menu && <><Text style={s.title}>Workout options</Text><Action label="Discard workout" onPress={() => { setMenu(false); setConfirm("discard"); }} /><Action label="Close menu" onPress={() => setMenu(false)} /></>}
      {confirm && <><Text accessibilityRole="header" style={s.title}>{confirm === "discard" ? "Discard this workout?" : left ? `${left} sets left. Finish anyway?` : "Finish workout?"}</Text>{confirm === "discard" && <Text style={s.text}>This session will be deleted. Your routine stays saved.</Text>}<Action label={confirm === "discard" ? "Confirm discard" : "Confirm finish"} onPress={() => { if (confirm === "discard") { store.discardWorkout(); setConfirm(null); router.navigate("/routine"); } else finish(); }} /><Action label="Keep working out" onPress={() => setConfirm(null)} /></>}
      {adding && <><Text style={s.title}>Add an exercise</Text><Action label="Close exercise list" onPress={() => setAdding(false)} />{candidates.map(e => <Action key={e.id} label={`Add ${e.name}`} onPress={() => { store.includeExercises([store.routine.find(x => x.id === e.id) ?? e]); setAdding(false); }} />)}</>}
    </ScrollView></View></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderBottomWidth: 1, borderColor: colors.border }, icon: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" }, content: { padding: 16, gap: 14, paddingBottom: 24 }, heading: { color: colors.text, fontSize: 28, fontWeight: "800" }, title: { color: colors.text, fontSize: 18, fontWeight: "700", flexShrink: 1 }, text: { color: colors.text, fontSize: 15, flexShrink: 1 }, muted: { color: colors.muted, fontSize: 13, flexShrink: 1 }, row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, card: { backgroundColor: colors.surface, padding: 14, borderRadius: 18, gap: 12 }, cardTitle: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 44 }, set: { minWidth: 48, minHeight: 48, padding: 10, borderRadius: 999, borderWidth: 1, justifyContent: "center", alignItems: "center" }, ring: { padding: 3, borderWidth: 1, borderColor: "transparent", borderRadius: 999 }, action: { minHeight: 48, paddingHorizontal: 10, paddingVertical: 12, justifyContent: "center", flexShrink: 1 }, footer: { padding: 12, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background, gap: 8 }, track: { flex: 1, height: 5, minWidth: 80, overflow: "hidden", borderRadius: 5, backgroundColor: colors.border }, scrim: { flex: 1, backgroundColor: "#000a", justifyContent: "center", padding: 20 }, dialog: { maxHeight: "85%", backgroundColor: colors.raised, padding: 20, borderRadius: 20 },
});

