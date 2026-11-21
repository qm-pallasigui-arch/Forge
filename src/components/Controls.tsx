import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, useFitMap } from "../state/FitMapStore";

export function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { accent } = useFitMap();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        s.choice,
        active && { backgroundColor: accent, borderColor: accent },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[s.label, active && { color: "#101215", fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}
export function Stepper({
  label,
  value,
  onChange,
  min = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <View style={s.stepper}>
      <Text style={s.muted}>{label}</Text>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(Math.max(min, value - 1))}
          style={s.step}
        >
          <Text style={s.sign}>−</Text>
        </Pressable>
        <Text style={s.value}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(value + 1)}
          style={s.step}
        >
          <Text style={s.sign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  choice: {
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.muted, fontSize: 12 },
  muted: { color: colors.muted, fontSize: 11 },
  stepper: { gap: 5 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: {
    width: 44,
    height: 44,
    borderRadius: 20,
    backgroundColor: colors.raised,
    alignItems: "center",
    justifyContent: "center",
  },
  sign: { color: colors.text, fontSize: 22 },
  value: { color: colors.text, minWidth: 24, textAlign: "center", fontWeight: "700" },
});
