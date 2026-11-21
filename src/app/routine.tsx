import { useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Exercise } from "../shared/fitness";
import { colors, useFitMap } from "../state/FitMapStore";
import { Stepper } from "../components/Controls";

function WeightField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const parsed = Number((draft ?? String(value)).replace(",", "."));
    if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
    setDraft(null);
  };
  return (
    <View style={s.weightField}>
      <Text style={s.muted}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          value={draft ?? String(value)}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          accessibilityLabel={`${label} in kilograms`}
          selectTextOnFocus
          style={s.input}
        />
        <Text style={s.muted}>kg</Text>
      </View>
    </View>
  );
}
function RoutineCard({ exercise }: { exercise: Exercise }) {
  const { update, remove, accent } = useFitMap();
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.exercise}>{exercise.name}</Text>
          <Text style={s.muted}>{exercise.equipment}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${exercise.name}`}
          onPress={() => remove(exercise.id)}
          style={s.remove}
        >
          <Text style={s.removeText}>Remove</Text>
        </Pressable>
      </View>
      <View style={s.values}>
        <Stepper
          label="Sets"
          value={exercise.sets}
          onChange={(sets) => update({ ...exercise, sets })}
        />
        <Stepper
          label="Reps"
          value={exercise.reps}
          onChange={(reps) => update({ ...exercise, reps })}
        />
      </View>
      <View style={s.weights}>
        <WeightField
          label="Working weight"
          value={exercise.weight}
          onChange={(weight) => update({ ...exercise, weight })}
        />
        <WeightField
          label="Next increase"
          value={exercise.progression}
          onChange={(progression) => update({ ...exercise, progression })}
        />
      </View>
      <Text style={[s.target, { color: accent }]}>
        {Number((exercise.weight + exercise.progression).toFixed(2))} kg next target
      </Text>
    </View>
  );
}
export default function RoutineScreen() {
  const store = useFitMap();
  const groups = [...new Set(store.routine.map((x) => x.muscle))];
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.header}>
          <Text style={s.title}>Your routine</Text>
          <Text style={s.muted}>
            {store.routine.length} exercises · {store.routine.reduce((n, x) => n + x.sets, 0)} total
            sets
          </Text>
        </View>
        {store.error && (
          <Text accessibilityRole="alert" style={s.removeText}>
            {store.error}
          </Text>
        )}
        {!store.routine.length ? (
          <View style={s.empty}>
            <Text style={[s.emptyIcon, { color: store.accent }]}>◇</Text>
            <Text style={s.emptyTitle}>Start with a muscle.</Text>
            <Text style={s.emptyText}>
              Choose an exercise on the body map to build your workout.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.navigate("/")}
              style={[s.cta, { backgroundColor: store.accent }]}
            >
              <Text style={s.ctaText}>Explore body map</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            {groups.map((group) => (
              <View key={group}>
                <Text style={s.groupTitle}>{group.toUpperCase()}</Text>
                {store.routine
                  .filter((x) => x.muscle === group)
                  .map((x) => (
                    <RoutineCard key={x.id} exercise={x} />
                  ))}
              </View>
            ))}
          </ScrollView>
        )}
        <Text style={{ color: colors.muted, fontSize: 10, textAlign: "center", padding: 8 }}>For general fitness information only.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { padding: 22, gap: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  groupTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  exercise: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 5 },
  remove: { minHeight: 44, paddingLeft: 10, justifyContent: "center" },
  removeText: { color: "#ff9687", fontSize: 12 },
  values: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  weights: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  weightField: { flex: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    minHeight: 44,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  target: { fontSize: 11, marginTop: 15 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { fontSize: 60 },
  emptyTitle: { fontSize: 23, fontWeight: "700", color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 23 },
  cta: { borderRadius: 24, paddingHorizontal: 24, paddingVertical: 15, marginTop: 12 },
  ctaText: { color: "#111", fontWeight: "700" },
});
