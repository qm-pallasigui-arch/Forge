import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperience } from "../state/Experience";
import { colors, useFitMap } from "../state/FitMapStore";
import { Choice } from "./Controls";

export default function LayersSheet({ depth, setDepth, onClose }: { depth: boolean; setDepth: (value: boolean) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets(), store = useFitMap(), ux = useExperience();
  return <Modal transparent animationType="none" onRequestClose={onClose}>
    <View style={s.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close layers" accessibilityRole="button" />
      <View accessibilityViewIsModal style={[s.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <View style={s.header}><Text style={s.title}>Menu</Text><Choice label="Done" onPress={onClose} /></View>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          <Choice label="Backup and restore" onPress={() => { onClose(); router.navigate("/backup"); }} />
          <Text style={s.label}>Body view</Text>
          <View style={s.row}><Choice label="Illustration" active={!depth} onPress={() => setDepth(false)} /><Choice label="Depth view" active={depth} onPress={() => setDepth(true)} /></View>
          <Text style={s.detail}>Depth view: drag to rotate a layered version of the illustration.</Text>
        <Text style={s.label}>Theme: {store.theme}</Text><Choice label="Change theme" onPress={store.cycleTheme} /><Choice label="Replay guide" onPress={() => { ux.replay(); onClose(); }} /></ScrollView>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0009" },
  sheet: { maxHeight: "90%", width: "100%", maxWidth: 480, alignSelf: "center", backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: "700" },
  label: { color: colors.text, fontSize: 15, fontWeight: "600" },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, gap: 5 },
});
