import WorkoutEntry from "../components/WorkoutEntry";
import { GuideScrollView } from "../state/Experience";
import { useEffect, useState } from "react";
import { AppState, Linking, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Choice } from "../components/Controls";
import { colors, useFitMap } from "../state/FitMapStore";
import { DAYS as WEEKDAYS, weekday } from "../shared/sessions";
import { MUSCLES, dateKey, dayExercises, type DayPlan } from "../notify/scheduler";
import { useReminderControls } from "../notify/useReminders";

function TimePicker({ day, plan, onChange }: { day: string; plan: DayPlan; onChange: (plan: DayPlan) => void }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const valid = /^\d{1,2}$/.test(hour) && +hour < 24 && /^\d{1,2}$/.test(minute) && +minute < 60;
  return <>
    <Choice label={`${day} time: ${String(Number(plan.time.split(":")[0])).padStart(2, "0")}:${String(Number(plan.time.split(":")[1])).padStart(2, "0")}`} onPress={() => { setHour(String(Number(plan.time.split(":")[0]))); setMinute(String(Number(plan.time.split(":")[1])).padStart(2, "0")); setOpen(true); }} />
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
      <View style={s.overlay}><View accessibilityViewIsModal style={[s.card, s.dialog]}>
        <Text style={s.heading}>{day} reminder time</Text><Text style={s.muted}>24-hour time</Text>
        <View style={s.row}>
          <View><Text style={s.body}>Hour</Text><TextInput accessibilityLabel="Hour, 0 to 23" keyboardType="number-pad" maxLength={2} selectTextOnFocus value={hour} onChangeText={setHour} style={s.input} /></View>
          <Text style={s.heading}>:</Text>
          <View><Text style={s.body}>Minute</Text><TextInput accessibilityLabel="Minute, 0 to 59" keyboardType="number-pad" maxLength={2} selectTextOnFocus value={minute} onChangeText={setMinute} style={s.input} /></View>
        </View>
        {!valid && <Text style={s.error}>Enter an hour from 0 to 23 and a minute from 0 to 59.</Text>}
        <Action label="Save time" disabled={!valid} onPress={() => { onChange({ ...plan, time: `${hour.padStart(2,"0")}:${minute.padStart(2,"0")}` }); setOpen(false); }} />
        <Choice label="Cancel" onPress={() => setOpen(false)} />
      </View></View>
    </Modal>
  </>;
}
function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { accent } = useFitMap();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[s.action, { backgroundColor: accent, opacity: disabled ? 0.5 : 1 }]}><Text style={s.actionText}>{label}</Text></Pressable>;
}
export default function PlanScreen() {
  const store = useFitMap(), controls = useReminderControls();
  const [now, setNow] = useState(() => new Date());
  const [testSent, setTestSent] = useState(false);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const today = weekday(now), key = dateKey(now), plan = store.schedule[today];
  const exercises = plan.on ? dayExercises(store.routine, today) : [];
  const trained = MUSCLES.filter(({ label }) => exercises.some((exercise) => exercise.muscle === label));
  return <SafeAreaView style={s.screen} edges={["left", "right"]}><GuideScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>Plan</Text>
    {store.error && <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>}
    <View style={[s.card, { borderColor: store.accent }]}>
      <Text style={[s.eyebrow, { color: store.accent }]}>TODAY / {WEEKDAYS[today].toUpperCase()}</Text>
      <Text style={s.heading}>{!plan.on ? "Rest day" : trained.length ? trained.map(({ label }) => label).join(" + ") : "No exercises planned"}</Text>
      <Text style={s.muted}>{exercises.length} exercises{store.skips[key] ? " / Reminder skipped today" : ""}</Text>
      {exercises.map((exercise) => <Text key={exercise.id} style={s.body}>{exercise.name} / {exercise.sets} x {exercise.reps}</Text>)}
      <WorkoutEntry exercises={exercises} />
      <Choice label="Open routine" onPress={() => router.navigate("/routine")} />

    </View>
    <View style={s.card}>
      <View style={s.row}><Text style={[s.heading, s.grow]}>Reminders</Text><Switch accessibilityLabel="Enable reminders" value={store.reminders.enabled} disabled={!controls.available || controls.busy} onValueChange={(value) => void controls.enable(value)} trackColor={{ true: store.accent }} style={s.switch} /></View>
      <Text style={s.muted}>Local reminders for the next 28 days. Opening FitMap refreshes your schedule. A final reminder asks you to reopen FitMap before the window ends.</Text>
      {!controls.available && <Text style={s.muted}>Reminders require the updated native app.</Text>}
      {controls.available && controls.permission !== "granted" && controls.permission !== "denied" && <Action label="Enable notifications" disabled={controls.busy} onPress={() => void controls.enable(true)} />}
      {controls.permission === "denied" && <><Text style={s.body}>Turn on notifications in Android Settings, Apps, FitMap, Notifications</Text><Choice label="Open notification settings" onPress={() => void Linking.openSettings()} /></>}
      <View style={s.row}><Text style={[s.body, s.grow]}>Hide workout details in notifications</Text><Switch accessibilityLabel="Hide workout details in notifications" value={store.reminders.private} onValueChange={(value) => store.setReminders({ ...store.reminders, private: value })} trackColor={{ true: store.accent }} style={s.switch} /></View>
      <Action label="Send test notification" disabled={!controls.available || controls.permission !== "granted" || controls.busy} onPress={() => { setTestSent(false); void controls.test().then((sent) => setTestSent(!!sent)); }} />
      {testSent && <Text accessibilityLiveRegion="polite" style={s.muted}>Test scheduled for about 5 seconds from now.</Text>}
      {controls.error && <><Text accessibilityRole="alert" style={s.error}>{controls.error}</Text><Choice label="Retry reminders" onPress={controls.retry} /></>}
    </View>
    <Text style={s.heading}>Your week</Text><Text style={s.muted}>Enable days, choose a time, and select muscle groups. Each day includes their saved routine exercises.</Text>
    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
      const item = store.schedule[day], label = WEEKDAYS[day];
      return <View key={day} style={s.card}>
        <View style={s.row}><Text style={[s.heading, s.grow]}>{label}</Text><Switch accessibilityLabel={`${label} workout`} value={item.on} onValueChange={(enabled) => store.setDayPlan(day, { ...item, on: enabled })} trackColor={{ true: store.accent }} style={s.switch} /></View>
        {item.on ? <><TimePicker day={label} plan={item} onChange={(value) => store.setDayPlan(day, value)} /><View style={s.chips}>{MUSCLES.map(({ id, label: muscle }) => <Choice key={id} label={muscle} active={dayExercises(store.routine, day).some(e=>e.muscle===muscle)} onPress={() => { const assigned=dayExercises(store.routine,day).some(e=>e.muscle===muscle); store.routine.filter(e=>e.muscle===muscle).forEach(e=>store.update({...e,days:assigned?e.days.filter(d=>d!==day):[...e.days,day]})); }} />)}</View><Text style={s.muted}>{dayExercises(store.routine, day).length} exercises in your routine</Text></> : <Text style={s.muted}>Rest day</Text>}
      </View>;
    })}
    <Text style={s.muted}>For general fitness information only.</Text>
  </GuideScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" }, heading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  card: { padding: 18, gap: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 }, body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 }, grow: { flex: 1 }, switch: { minHeight: 44, minWidth: 48 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, error: { color: "#ff9a89", fontSize: 13 },
  action: { minHeight: 44, padding: 12, justifyContent: "center", alignItems: "center", borderRadius: 22 }, actionText: { color: "#101215", fontWeight: "700", fontSize: 13 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000a", padding: 20 }, dialog: { width: "100%", maxWidth: 400 },
  input: { minHeight: 48, width: 80, color: colors.text, backgroundColor: colors.raised, padding: 12, borderRadius: 10, fontSize: 20 },
});
