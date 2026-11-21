import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import type { Exercise } from "../shared/fitness";
import { normalizeWeight, plateChange } from "../shared/weight";
import { colors, useFitMap } from "../state/FitMapStore";
import { OneTimeHint, TourTarget, useExperience } from "../state/Experience";
import { Choice } from "./Controls";

export default function WeightControl({ exercise, featured = false }: { exercise: Exercise; featured?: boolean }) {
  const ux = useExperience();
  const [expanded, setExpanded] = useState(false);
  const { update, accent } = useFitMap();
  const [draft, setDraft] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [remove, setRemove] = useState(false);
  const barbell = exercise.equipment.toLowerCase() === "barbell";
  if (exercise.equipment.toLowerCase() === "bodyweight") return null;
  const change = (value: number) => {
    const weight = normalizeWeight(value);
    ux.mark("weight");
    if (weight === exercise.weight) return;
    setHistory((old) => [...old.slice(-19), exercise.weight]);
    update({ ...exercise, weight });
  };
  const commit = () => {
    if (draft !== null && draft.trim() !== "") {
      const value = Number(draft.replace(",", "."));
      if (Number.isFinite(value)) change(value);
    }
    setDraft(null);
  };
  const open = expanded || (featured && ux.active && ux.step === "weight");
  const summary = <Pressable accessibilityRole="button" accessibilityLabel={`Edit weight for ${exercise.name}`} accessibilityState={{ expanded: open }} onPress={() => setExpanded(!open)} style={s.summary}><Text style={s.label}>{exercise.weight} kg {"\u00b7"} {exercise.progression ? `+${exercise.progression} next` : "same weight next"}</Text><Text style={s.note}>{open ? "Collapse" : "Edit"}</Text></Pressable>;
  const wrap = (children: React.ReactNode) => featured ? <TourTarget name="weight">{children}</TourTarget> : children;
  return <View style={s.container}>
    {!open ? wrap(summary) : summary}
    {open && <>
    <View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.label}>Working weight</Text>{history.length > 0 && <Choice label="Undo weight change" onPress={() => { update({ ...exercise, weight: history[history.length - 1] }); setHistory((old) => old.slice(0, -1)); }} />}</View>
    {(!barbell ? wrap : (children: React.ReactNode) => children)(<View style={s.total}>
      {!barbell && <Choice label="-0.5 kg" onPress={() => change(exercise.weight - 0.5)} />}
      <TextInput style={s.input} accessibilityLabel="Working weight in kilograms" value={draft ?? String(exercise.weight)} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} selectTextOnFocus keyboardType="decimal-pad" returnKeyType="done" />
      <Text style={s.label}>kg</Text>
      {!barbell && <Choice label="+0.5 kg" onPress={() => change(exercise.weight + 0.5)} />}
    </View>)}
    {barbell && <>
      <Svg width="100%" height={48} viewBox="0 0 300 48" accessibilityLabel="Barbell with paired plates">
        <Path d="M10 24H290" stroke={colors.muted} strokeWidth={6} />
        {[40, 62, 218, 240].map((x, i) => <Rect key={x} x={x} y={i === 1 || i === 2 ? 3 : 10} width={18} height={i === 1 || i === 2 ? 42 : 28} rx={3} fill={accent} />)}
      </Svg>
      <Text style={s.note}>Total includes the bar. Plate buttons change both sides.</Text>
      <View style={s.row}><Choice label="Add plates" active={!remove} onPress={() => setRemove(false)} /><Choice label="Remove plates" active={remove} onPress={() => { setRemove(true); }} /></View>
      {remove && ux.ready && <OneTimeHint name="remove-plates" message="Tap plates to take them off. Undo is top right." />}
      {wrap(<View style={s.row}>{[20, 10, 5, 2.5, 1.25].map((plate) => <Pressable key={plate} accessibilityRole="button" accessibilityLabel={`${remove ? "Remove" : "Add"} ${plate} kilograms`} accessibilityHint={`Changes total weight by ${plate * 2} kilograms, one plate per side`} onPress={() => change(plateChange(exercise.weight, plate, remove))} style={s.plate}><Text style={s.label}>{plate} kg</Text></Pressable>)}</View>)}
    </>}
    <Text style={s.label}>Next-workout increase</Text>
    <View style={s.row} accessibilityRole="radiogroup">{[0, 0.5, 1, 2.5, 5].map((step) => <Pressable key={step} accessibilityRole="radio" accessibilityLabel={`${step} kilograms next workout`} accessibilityState={{ checked: exercise.progression === step }} aria-checked={exercise.progression === step} onPress={() => update({ ...exercise, progression: step })} style={[s.plate, exercise.progression === step && { borderColor: accent }]}><Text style={[s.label, exercise.progression === step && { color: accent }]}>{step === 0 ? "Same" : `+${step}`}</Text></Pressable>)}</View>
    <Text style={[s.note, { color: accent }]}>{normalizeWeight(exercise.weight + exercise.progression)} kg next target</Text>
    </>}
  </View>;
}
const s = StyleSheet.create({
  container: { marginTop: 10, gap: 10 },
  summary: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderColor: colors.border },
  total: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minHeight: 44, color: colors.text, fontSize: 24, fontWeight: "700", borderBottomWidth: 1, borderColor: colors.border, textAlign: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  plate: { minWidth: 44, minHeight: 44, paddingHorizontal: 9, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  label: { color: colors.text, fontSize: 13 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
