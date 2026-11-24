import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperience } from "../state/Experience";
import { accents, colors, useFitMap } from "../state/FitMapStore";
import { Choice } from "./Controls";

export default function LayersSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets(), store = useFitMap(), ux = useExperience();
  return <Modal transparent animationType="none" onRequestClose={onClose}>
    <View style={s.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close settings" accessibilityRole="button" />
      <View accessibilityViewIsModal style={[s.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <View style={s.header}><Text style={s.title}>Settings</Text><Choice label="Done" onPress={onClose} /></View>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          <Text style={s.label}>Appearance</Text>
          <View style={s.row}>{(["classic", "blueprint", "neon"] as const).map(theme => <Pressable key={theme} accessibilityRole="radio" accessibilityLabel={theme[0].toUpperCase() + theme.slice(1)} accessibilityState={{checked: store.theme === theme}} aria-checked={store.theme === theme} onPress={() => store.setTheme(theme)} style={[s.option, {minHeight:44, flexDirection:"row", alignItems:"center", borderColor: store.theme === theme ? store.accent : colors.border}]}><View style={{width:18,height:18,borderRadius:9,backgroundColor:accents[theme]}}/><Text style={s.label}>{theme[0].toUpperCase()+theme.slice(1)}{store.theme === theme ? " \u2713" : ""}</Text></Pressable>)}</View>
          <Text style={s.label}>Data</Text><Choice label="Backup and restore" onPress={() => { onClose(); router.navigate("/backup"); }} />
          <Text style={s.label}>Help</Text><Choice label="Replay guide" onPress={() => { ux.replay(); onClose(); }} />
          <Text style={s.label}>About</Text><Text style={s.detail}>For general fitness information only.</Text>
        </ScrollView>
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
