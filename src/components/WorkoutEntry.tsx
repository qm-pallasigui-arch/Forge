import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import type { Exercise } from "../shared/fitness";
import { colors, useFitMap } from "../state/FitMapStore";
import { GuideTarget, useExperience } from "../state/Experience";
export default function WorkoutEntry({ exercises }: { exercises: Exercise[] }) {
  const store = useFitMap(), ux = useExperience();
  if (!store.workout && !exercises.length) return null;
  return <GuideTarget name="start"><Pressable accessibilityRole="button" onPress={() => { store.startWorkout(exercises); ux.mark("start"); router.navigate("/workout"); }} style={{ minHeight: 48, borderRadius: 24, padding: 12, backgroundColor: store.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.background, fontWeight: "700" }}>{store.workout ? "Resume workout" : "Start workout"}</Text></Pressable></GuideTarget>;
}
