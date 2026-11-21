import { useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Choice } from "../components/Controls";
import { colors, useFitMap } from "../state/FitMapStore";
import { exercisesForDay, WEEKDAYS } from "../shared/weekly-plan";

export default function PlanScreen() {
  const store = useFitMap();
  const [today, setToday] = useState(() => new Date().getDay());
  const [day, setDay] = useState(today);
  useEffect(() => {
    const refresh = () => setToday(new Date().getDay());
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const available = [...new Set(store.routine.map((exercise) => exercise.muscle))];
  const todayExercises = exercisesForDay(store.routine, store.weeklyPlan, today);
  const todayMuscles = [...new Set(todayExercises.map((exercise) => exercise.muscle))];
  const selected = store.weeklyPlan[String(day)] ?? [];
  const dayExercises = exercisesForDay(store.routine, store.weeklyPlan, day);
  return <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Plan</Text>
      {store.error && <Text accessibilityRole="alert" style={s.error}>{store.error}</Text>}
      <View style={[s.card, { borderColor: store.accent }]}>
        <Text style={[s.eyebrow, { color: store.accent }]}>TODAY · {WEEKDAYS[today].toUpperCase()}</Text>
        <Text style={s.heading}>{todayMuscles.length ? todayMuscles.join(" + ") : "No workout planned"}</Text>
        <Text style={s.muted}>{todayExercises.length ? `${todayExercises.length} exercise${todayExercises.length === 1 ? "" : "s"} in your routine` : "Choose muscle groups for today below, or keep it a rest day."}</Text>
        {todayExercises.map((exercise) => <Text key={exercise.id} style={s.body}>{exercise.name} · {exercise.sets} × {exercise.reps}</Text>)}
        <Choice label={todayExercises.length ? "View routine" : "Plan today"} onPress={() => todayExercises.length ? router.navigate("/routine") : setDay(today)} />
      </View>
      <Text style={s.heading}>Your week</Text>
      <Text style={s.muted}>Choose a day, then select the muscle groups you want to train. This plan repeats weekly.</Text>
      <View style={s.days}>{[1, 2, 3, 4, 5, 6, 0].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={WEEKDAYS[value]} accessibilityState={{ selected: day === value }} onPress={() => setDay(value)} style={[s.day, day === value && { backgroundColor: store.accent, borderColor: store.accent }]}>
        <Text style={[s.dayText, day === value && { color: "#101215" }]}>{WEEKDAYS[value].slice(0, 3)}</Text>
        <View style={[s.dot, { backgroundColor: exercisesForDay(store.routine, store.weeklyPlan, value).length ? (day === value ? "#101215" : store.accent) : "transparent" }]} />
      </Pressable>)}</View>
      <View style={s.card}>
        <Text style={s.heading}>{WEEKDAYS[day]}</Text>
        <Text style={s.muted}>{dayExercises.length ? `${dayExercises.length} exercises planned` : "Rest day · no exercises planned"}</Text>
        <View style={s.chips}>{available.map((muscle) => <Choice key={muscle} label={muscle} active={selected.includes(muscle)} onPress={() => store.togglePlanMuscle(day, muscle)} />)}</View>
        {!available.length && <><Text style={s.body}>Add exercises to your routine to start planning your week.</Text><Choice label="Choose muscles" onPress={() => router.navigate("/")} /></>}
        {selected.filter((muscle) => !available.includes(muscle)).map((muscle) => <Choice key={muscle} label={`Remove ${muscle} (no exercises)`} onPress={() => store.togglePlanMuscle(day, muscle)} />)}
        {!!available.length && <Text style={s.muted}>All saved exercises for each selected muscle are included. Changes save automatically.</Text>}
      </View>
      <View style={s.card}><Text style={s.heading}>Reminders</Text><Text style={s.muted}>Notifications are not enabled yet. Your weekly plan is saved on this device.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 19, fontWeight: "700" },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  card: { padding: 18, gap: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  day: { flex: 1, minWidth: 38, minHeight: 54, alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  dayText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  dot: { width: 4, height: 4, borderRadius: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  error: { color: "#ff9a89", fontSize: 13 },
});
