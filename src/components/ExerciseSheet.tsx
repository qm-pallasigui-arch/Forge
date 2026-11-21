import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXERCISES, SUBPARTS, type Exercise, type ExerciseDef } from "../shared/fitness";
import { names } from "../shared/body-artwork";
import { colors, useFitMap, type BodyView } from "../state/FitMapStore";
import { Choice, Stepper } from "./Controls";

function ExerciseRow({ item, id, view }: { item: ExerciseDef; id: string; view: BodyView }) {
  const store = useFitMap();
  const existing = store.routine.find((x) => x.id === item.id);
  const [sets, setSets] = useState(existing?.sets ?? 3),
    [reps, setReps] = useState(existing?.reps ?? 10);
  const add = () =>
    store.add(
      {
        ...item,
        muscle: names[id],
        sets,
        reps,
        weight: existing?.weight ?? 0,
        progression: existing?.progression ?? 2.5,
      } as Exercise,
      view,
      id,
    );
  return (
    <View style={s.exercise}>
      <Text style={s.exerciseName}>{item.name}</Text>
      <Text style={s.muted}>{item.equipment}</Text>
      <View style={s.row}>
        <Stepper label="Sets" value={sets} onChange={setSets} />
        <Stepper label="Reps" value={reps} onChange={setReps} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${existing ? "Update" : "Add"} ${item.name}`}
          onPress={add}
          style={[s.add, { backgroundColor: store.accent }]}
        >
          <Text style={s.addText}>{existing ? "✓" : "+"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
export default function ExerciseSheet({
  id,
  view,
  onClose,
}: {
  id: string;
  view: BodyView;
  onClose: () => void;
}) {
  const store = useFitMap(),
    insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"exercises" | "passport" | "notes">("exercises");
  const [part, setPart] = useState<string | null>(null);
  const key = `${view}:${id}`;
  const exercises = (EXERCISES[id] ?? []).filter((item) => !part || item.parts?.includes(part));
  const saved = store.routine.filter((item) => item.muscle === names[id]);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modal}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Dismiss muscle details"
          onPress={onClose}
        />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>MUSCLE DETAILS</Text>
              <Text style={s.title}>{names[id]}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={s.close}
            >
              <Text style={s.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={s.tabs}>
            {(["exercises", "passport", "notes"] as const).map((value) => (
              <Choice
                key={value}
                label={value[0].toUpperCase() + value.slice(1)}
                active={tab === value}
                onPress={() => setTab(value)}
              />
            ))}
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            {tab === "exercises" && (
              <>
                {SUBPARTS[id] && (
                  <View style={s.parts}>
                    <Choice label="All" active={!part} onPress={() => setPart(null)} />
                    {SUBPARTS[id].map((p) => (
                      <Choice
                        key={p.id}
                        label={p.label}
                        active={part === p.id}
                        onPress={() => setPart(p.id)}
                      />
                    ))}
                  </View>
                )}
                {exercises.map((item) => (
                  <ExerciseRow key={item.id} item={item} id={id} view={view} />
                ))}
              </>
            )}
            {tab === "passport" && (
              <View style={s.passport}>
                <Text style={s.exerciseName}>Your {names[id].toLowerCase()} routine</Text>
                <Text style={s.muted}>
                  {saved.length} exercises · {saved.reduce((n, item) => n + item.sets, 0)} sets
                </Text>
                <Text style={s.muted}>
                  Last added:{" "}
                  {store.recent[key]
                    ? new Date(store.recent[key]).toLocaleString()
                    : "Not yet added"}
                </Text>
                {saved.map((item) => (
                  <Text key={item.id} style={s.exerciseName}>
                    {item.name} · {item.sets} × {item.reps}
                  </Text>
                ))}
              </View>
            )}
            {tab === "notes" && (
              <>
                <Text style={s.muted}>Saved on this device</Text>
                <TextInput
                  multiline
                  accessibilityLabel={`${names[id]} notes`}
                  placeholder="Cues, goals, or things to remember…"
                  placeholderTextColor={colors.muted}
                  value={store.notes[key] ?? ""}
                  onChangeText={(note) => store.setNote(key, note)}
                  style={s.notes}
                  textAlignVertical="top"
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0008" },
  sheet: {
    maxHeight: "84%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: "#596170",
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 10,
  },
  header: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: colors.text, fontSize: 25, fontWeight: "700", marginTop: 4 },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 1.4 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.muted, fontSize: 30 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  exercise: { paddingVertical: 16, borderTopWidth: 1, borderColor: colors.border, gap: 5 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  add: { width: 48, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 16 },
  addText: { fontSize: 27, color: "#111" },
  parts: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  passport: { gap: 18, paddingVertical: 15 },
  notes: {
    minHeight: 200,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
  },
});
