import { useEffect, useRef, useState, type ComponentRef } from "react";
import { AppState, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Choice } from "../components/Controls";
import DayExercise from "../components/DayExercise";
import { GuideScrollView, GuideTarget, useExperience } from "../state/Experience";
import { colors, useFitMap } from "../state/FitMapStore";
import { DAYS, localDate, weekday } from "../shared/sessions";
import { todayCard, weekDates } from "../shared/plan-layout";
import { completedSets } from "../shared/workout";
import { dayExercises, dayLabel, planReminders, type DayPlan } from "../notify/scheduler";
import { useReminderControls } from "../notify/useReminders";
function TimePicker({ day, plan, onChange }: { day: string; plan: DayPlan; onChange: (plan: DayPlan) => void }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const valid = /^\d{1,2}$/.test(hour) && +hour < 24 && /^\d{1,2}$/.test(minute) && +minute < 60;
  return <>
    <Choice label={`\u25f7 ${plan.time}`} onPress={() => { setHour(String(Number(plan.time.split(":")[0]))); setMinute(String(Number(plan.time.split(":")[1])).padStart(2, "0")); setOpen(true); }} />
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
  const store = useFitMap(), controls = useReminderControls(), ux = useExperience(), path = usePathname();
  const [now, setNow] = useState(() => new Date()), [offset, setOffset] = useState(0), [selected, setSelected] = useState(() => weekday(new Date()));
  const [sheet, setSheet] = useState<"reminders" | "menu" | "copy" | "clear" | null>(null), [copyTo, setCopyTo] = useState<number | null>(null), [testSent, setTestSent] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null), detailY = useRef(0);
  useEffect(() => { const tick = () => setNow(new Date()); const timer = setInterval(tick, 1000), sub = AppState.addEventListener("change", tick); return () => { clearInterval(timer); sub.remove(); }; }, []);
  const returnDay = store.returnWeekday;
  const returnKey = `${path}:${returnDay}`, [lastReturn, setLastReturn] = useState(returnKey);
  if (lastReturn !== returnKey) { setLastReturn(returnKey); if(path === "/plan" && returnDay !== null) { setSelected(returnDay); setOffset(0); } }
  useEffect(() => { if (path !== "/plan" || returnDay === null) return; const timer = setTimeout(() => scroll.current?.scrollTo({ y: detailY.current, animated: !ux.reducedMotion }), 150); return () => clearTimeout(timer); }, [path, returnDay, ux.reducedMotion]);
  const entry = todayCard({ ...store, now }), dates = weekDates(now, offset), date = dates[selected], items = dayExercises(store.routine, selected), plan = store.schedule[selected];
  const add = (day: number) => { store.beginDay(day); router.navigate("/"); };
  const start = (all = false) => { store.startWorkout(all ? store.routine : entry.exercises); ux.mark("start"); router.navigate("/workout"); };
  const viewSummary = () => router.navigate({ pathname: "./history", params: { session: entry.latest?.id } });
  const next = planReminders({ now, routine: store.routine, schedule: store.schedule, history: store.history, skips: store.skips, prefs: store.reminders })[0];
  const reason = !controls.available ? "Notifications unavailable in this app build" : controls.permission === "denied" ? "Notifications blocked" : !store.reminders.enabled ? "Reminders are off" : controls.permission !== "granted" ? "Notification permission needed" : null;
  const elapsed = store.workout ? Math.max(0, Math.floor((+now - store.workout.startedAt) / 1000)) : 0;
  const title = entry.kind === "running" ? "Workout in progress" : entry.kind === "done" ? "Done today" : entry.kind === "planned" ? dayLabel(store.routine, entry.day) : "Nothing planned today";
  return <SafeAreaView style={s.screen} edges={["left", "right"]}><View style={{ padding: 16, gap: 6 }}><Text style={s.title}>Plan</Text><Text style={s.muted}>Start today&apos;s workout or choose a day to edit.</Text></View>
    <GuideScrollView scrollRef={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {store.error && <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>}
      <View style={s.card}><Text style={s.eyebrow}>TODAY</Text><Text style={s.heading}>{title}</Text>
        {entry.kind === "running" && store.workout && <Text style={s.body}>{[...new Set(store.workout.exercises.map(e => e.muscle))].join(" + ")} &middot; {completedSets(store.workout)} of {store.workout.exercises.reduce((n,e) => n + e.sets, 0)} sets &middot; {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2,"0")}</Text>}
        {entry.kind === "done" && <Text style={s.body}>{entry.minutes} min &middot; {entry.sessions} {entry.sessions === 1 ? "session" : "sessions"}</Text>}
        {entry.kind === "planned" && <Text style={s.body}>{entry.planned.length} {entry.planned.length === 1 ? "exercise" : "exercises"}</Text>}
        {entry.kind === "empty" && <Text style={s.body}>Add a workout from the body model</Text>}
        <GuideTarget name="start"><Action label={entry.kind === "running" ? "Resume workout" : entry.kind === "done" ? "View summary" : entry.kind === "planned" ? "Start workout" : "Add workout"} onPress={() => entry.kind === "done" ? viewSummary() : entry.kind === "empty" ? add(entry.day) : start()} /></GuideTarget>
        {entry.kind === "done" && store.routine.length > 0 && <Choice label="Start another workout" onPress={() => start()}/>}
        {entry.kind === "empty" && store.routine.length > 0 && <Choice label="Start from all exercises" onPress={() => start(true)}/>}
        {entry.kind === "planned" && <Choice label="Edit today" onPress={() => { setOffset(0); setSelected(entry.day); scroll.current?.scrollTo({ y: detailY.current, animated: !ux.reducedMotion }); }}/>}
      </View>
      <View style={{ gap: 8 }}><Text style={s.muted}>{reason ?? (next ? `Next reminder: ${next.date.toLocaleDateString(undefined,{weekday:"short"})} ${store.schedule[weekday(next.date)].time} \u00b7 ${dayLabel(store.routine, weekday(next.date))}` : "No upcoming reminders. Add exercises and turn on Remind me for a day.")}</Text><Choice label={reason ? "Set up reminders" : "Reminders - On"} onPress={() => setSheet("reminders")}/></View>
      <View style={s.row}><Text style={[s.heading, s.grow]}>Week of {dates[0].toLocaleDateString(undefined,{day:"numeric",month:"short"})}</Text><Choice label="Previous week" onPress={() => setOffset(offset - 1)}/><Choice label="Next week" onPress={() => setOffset(offset + 1)}/></View>
      <ScrollView horizontal contentContainerStyle={{ gap: 4 }} accessibilityLabel="Week dates">{dates.map((d, i) => { const key = localDate(d), done = store.history.some(h => localDate(new Date(h.endedAt)) === key), today = key === localDate(now), planned = store.schedule[i].on && dayExercises(store.routine,i).length > 0; return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${DAYS[i]} ${d.toLocaleDateString()}, ${done ? "done" : planned ? "planned" : "rest"}${today ? ", today" : ""}`} accessibilityState={{ selected: selected === i }} onPress={() => setSelected(i)} style={{ minWidth: 44, minHeight: 80, padding: 6, gap: 5, alignItems: "center", borderRadius: 14, borderWidth: today ? 2 : 1, borderColor: today ? store.accent : colors.border, backgroundColor: selected === i ? store.accent : colors.surface }}><Text style={{ color: selected === i ? colors.background : colors.text }}>{DAYS[i].slice(0,1)}</Text><Text style={{ color: selected === i ? colors.background : colors.text, fontWeight: "700" }}>{d.getDate()}</Text><Text style={{ color: selected === i ? colors.background : colors.muted }}>{done ? "\u2713" : planned ? "\u25cf" : key < localDate(now) ? " " : "\u25cb"}</Text></Pressable>; })}</ScrollView>
      <View testID={`plan-day-${selected}`} onLayout={event => { detailY.current = event.nativeEvent.layout.y; }} style={s.card}>
        <View style={s.row}><Text style={[s.heading, s.grow]}>{date.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"})}</Text><Choice label="Day options" onPress={() => setSheet("menu")}/></View>
        <Text style={s.muted}>{items.length ? dayLabel(store.routine, selected) : "Rest day"}</Text>
        {!!items.length && <><View style={s.row}><Text style={[s.body, s.grow]}>Remind me</Text><Switch accessibilityLabel="Remind me" value={plan.on} onValueChange={on => store.setDayPlan(selected,{...plan,on})} thumbColor="#ffffff" trackColor={{ false: colors.border, true: store.accent }}/></View><TimePicker day={DAYS[selected]} plan={plan} onChange={p => store.setDayPlan(selected,p)}/></>}
        {!items.length && <Text style={s.body}>No exercises yet</Text>}
        {items.map(e => <DayExercise key={`${selected}:${e.id}`} exercise={e} day={selected}/>)}
        <Choice label="+ Add exercises" onPress={() => add(selected)}/>
      </View>
    </GuideScrollView>
    <Modal visible={sheet !== null} transparent animationType="none" onRequestClose={() => {setSheet(null);setCopyTo(null);}}><View style={s.overlay}><View style={[s.card, s.dialog, {maxHeight:"90%"}]}><ScrollView contentContainerStyle={{ gap: 12 }}>
      {sheet === "reminders" && <><Text style={s.heading}>Reminders</Text><View style={s.row}><Text style={[s.body,s.grow]}>Enable reminders</Text><Switch accessibilityLabel="Enable reminders" value={store.reminders.enabled} disabled={!controls.available || controls.busy} onValueChange={value => void controls.enable(value)} thumbColor="#fff" trackColor={{false:colors.border,true:store.accent}}/></View><Text style={s.muted}>{controls.available ? `Permission: ${controls.permission}` : "Install the updated FitMap app to use notifications."}</Text>{controls.permission === "denied" && <Choice label="Open notification settings" onPress={() => void Linking.openSettings()}/>}<View style={s.row}><Text style={[s.body,s.grow]}>Hide workout details</Text><Switch accessibilityLabel="Hide workout details" value={store.reminders.private} onValueChange={value => store.setReminders({...store.reminders, private:value})} thumbColor="#fff" trackColor={{false:colors.border,true:store.accent}}/></View><Choice label="Send test notification" onPress={() => { if(controls.available && controls.permission === "granted") void controls.test().then(sent => setTestSent(!!sent)); }}/>{testSent && <Text style={s.muted}>Test notification will arrive shortly.</Text>}{controls.error && <Text style={s.error}>{controls.error}</Text>}</>}
      {sheet === "menu" && <><Text style={s.heading}>{DAYS[selected]} options</Text><Choice label="Copy this day to..." onPress={() => setSheet("copy")}/><Choice label="Clear day" destructive onPress={() => setSheet("clear")}/></>}
      {sheet === "copy" && <><Text style={s.heading}>Copy {DAYS[selected]} to...</Text><Text style={s.muted}>Replace the selected day&apos;s exercises and reminder time. Exercise weights and reps are shared across days.</Text>{DAYS.map((name, i) => i !== selected && <Choice key={name} label={name} active={copyTo === i} onPress={() => setCopyTo(i)}/>)}{copyTo !== null && <Action label={`Replace ${DAYS[copyTo]} plan`} onPress={() => { store.copyDay(selected,copyTo); setSheet(null);setCopyTo(null);ux.notify("Day copied"); }}/>}</>}
      {sheet === "clear" && <><Text style={s.heading}>Clear {DAYS[selected]}?</Text><Text style={s.body}>Remove its exercises and turn off its reminder. Other days and workout history stay unchanged.</Text><Choice label="Confirm clear day" destructive onPress={() => {store.clearPlanDay(selected);setSheet(null);}}/></>}
      <Choice label="Done" onPress={() => {setSheet(null);setCopyTo(null);}}/>
    </ScrollView></View></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" }, heading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  card: { padding: 18, gap: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 }, body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }, grow: { flex: 1 }, switch: { minHeight: 44, minWidth: 48 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, error: { color: "#ff9a89", fontSize: 13 },
  action: { minHeight: 44, padding: 12, justifyContent: "center", alignItems: "center", borderRadius: 22 }, actionText: { color: "#101215", fontWeight: "700", fontSize: 13 },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000a", padding: 20 }, dialog: { width: "100%", maxWidth: 400 },
  input: { minHeight: 48, width: 80, color: colors.text, backgroundColor: colors.raised, padding: 12, borderRadius: 10, fontSize: 20 },
});
