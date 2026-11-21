import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { artwork, back, names } from "../shared/body-artwork";
import BodyMap from "../components/BodyMap";
import LayersSheet from "../components/LayersSheet";
import ExerciseSheet from "../components/ExerciseSheet";
import { Choice } from "../components/Controls";
import { colors, useFitMap, type BodyView, type Mode } from "../state/FitMapStore";

export default function BodyScreen() {
  const store = useFitMap();
  const [view, setView] = useState<BodyView>("front"),
    [depth, setDepth] = useState(false),
    [browse, setBrowse] = useState(false),
    [layers, setLayers] = useState(false);
  const [selected, setSelected] = useState<{ id: string; view: BodyView } | null>(null);
  const pick = (id: string, side: BodyView) => {
    setView(side);
    setSelected({ id, view: side });
  };
  const ids = Object.keys(view === "front" ? artwork.regions : back).filter(
    (id) => view === "back" || id !== "traps",
  );
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <Text style={[s.logo, { color: store.accent }]}>
          FIT<Text style={{ color: colors.text }}>MAP</Text>
        </Text>
        <Choice label="Layers" onPress={() => setLayers(true)} />
      </View>
      {store.error && (
        <Text accessibilityRole="alert" style={s.error}>
          {store.error}
        </Text>
      )}
      <View style={s.modes} accessibilityRole="radiogroup">{([["map", "Muscles"], ["heatmap", "Heatmap"], ["recovery", "Recent"], ["constellation", "Connect"]] as [Mode, string][]).map(([mode, label]) => <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: store.mode === mode }} aria-checked={store.mode === mode} onPress={() => store.setMode(mode)} style={[s.mode, store.mode === mode && { backgroundColor: store.accent }]}><Text style={[s.modeText, store.mode === mode && { color: "#101215" }]}>{label}</Text></Pressable>)}</View>
      {store.mode === "recovery" && <Text style={s.legend}>Added under 12 h / 12?36 h / 36 h+</Text>}
      {store.mode === "constellation" && <Text style={s.legend}>Connect: muscle groups included in your routine</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: browse }}
        onPress={() => setBrowse(!browse)}
        style={s.browse}
      >
        <Text style={s.browseLabel}>{browse ? "Hide muscle list" : "Choose muscle by name"}</Text>
      </Pressable>
      {browse && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.names}
          contentContainerStyle={{ gap: 7 }}
        >
          {ids.map((id) => (
            <Choice key={id} label={names[id]} onPress={() => pick(id, view)} />
          ))}
        </ScrollView>
      )}
      <View style={s.figure}>
        <BodyMap
          key={`${view}-${depth}`}
          view={view}
          depth={depth}
          selected={selected?.id ?? null}
          onSelect={pick}
        />
      {selected && (
        <ExerciseSheet
          key={`${selected.view}:${selected.id}`}
          {...selected}
          onClose={() => setSelected(null)}
        />
      )}
      </View>
      <Text style={s.hint}>Tap a muscle to see exercises</Text>
      <View style={s.center}>
        {(["front", "back"] as const).map((side) => (
          <Choice
            key={side}
            label={side === "front" ? "Front" : "Back"}
            active={view === side}
            onPress={() => { setView(side); setSelected(null); }}
          />
        ))}
      </View>
      <Text style={s.disclaimer}>For general fitness information only.</Text>
      {layers && <LayersSheet depth={depth} setDepth={setDepth} onClose={() => setLayers(false)} />}

    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  modes: { flexDirection: "row", borderRadius: 24, backgroundColor: colors.surface, padding: 3 },
  mode: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  modeText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  legend: { color: colors.muted, fontSize: 10, textAlign: "center", paddingTop: 5 },
  disclaimer: { color: colors.muted, fontSize: 10, textAlign: "center", paddingBottom: 5 },
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 17, fontWeight: "900", letterSpacing: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  muted: { color: colors.muted, fontSize: 12 },
  theme: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  center: { flexDirection: "row", justifyContent: "center", gap: 7, marginBottom: 8 },
  browse: { minHeight: 44, justifyContent: "center" },
  names: { maxHeight: 50, marginBottom: 5 },
  figure: { flex: 1, minHeight: 180, paddingTop: 8 },
  hint: { paddingBottom: 6, color: "#c4cedd", fontSize: 12, textAlign: "center", marginTop: 8 },
  browseLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
  footer: { color: colors.muted, fontSize: 10, textAlign: "center", paddingVertical: 12 },
  error: { color: "#ff9a89", fontSize: 12, marginBottom: 8 },
});
