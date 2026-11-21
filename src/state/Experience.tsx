import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { usePathname } from "expo-router";
import { colors, useFitMap } from "./FitMapStore";
import { completeStep, newGuide, nextStep, parseGuide, type GuideStep } from "../shared/onboarding";

type Toast = { message: string; action?: string; run?: () => void; id: number };
type Target = "figure" | "muscle" | "add" | "routine" | "weight";
type Rect = { x: number; y: number; width: number; height: number };
function useExperienceState() {
  const [guide, setGuide] = useState(newGuide), [ready, setReady] = useState(false), [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true), [toast, setToast] = useState<Toast | null>(null);
  const writable = useRef(false), writes = useRef(Promise.resolve());
  const earlyActions = useRef<GuideStep[]>([]);
  const targets = useRef(new Map<Target, Set<ComponentRef<typeof View>>>());
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem("fitmap-onboarding-v1").then((raw) => { if (alive) { setGuide(earlyActions.current.reduce(completeStep, parseGuide(raw))); writable.current = true; } }).catch(() => { if (alive) setError("Guide progress could not be loaded."); }).finally(() => { if (alive) setReady(true); });
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReducedMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { alive = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (!ready || !writable.current) return;
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem("fitmap-onboarding-v1", JSON.stringify(guide))).catch(() => setError("Guide progress could not be saved."));
  }, [guide, ready]);
  const mark = useCallback((step: GuideStep) => { if (!writable.current) earlyActions.current.push(step); setGuide((old) => completeStep(old, step)); }, []);
  const unlock = useCallback(() => setGuide((old) => old.unlocked ? old : { ...old, unlocked: true }), []);
  const notify = useCallback((message: string, action?: string, run?: () => void) => setToast({ message, action, run, id: Date.now() }), []);
  const seen = useCallback((hint: string) => setGuide((old) => old.hints.includes(hint) ? old : { ...old, hints: [...old.hints, hint] }), []);
  const register = useCallback((name: Target, node: ComponentRef<typeof View>) => {
    const set = targets.current.get(name) ?? new Set<ComponentRef<typeof View>>(); set.add(node); targets.current.set(name, set);
    return () => { set.delete(node); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => setToast((old) => old?.id === toast.id ? null : old), toast.action ? 12000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  return { guide, ready, error, reducedMotion, mark, unlock, notify, toast, setToast, targets, register,
    step: nextStep(guide), active: ready && !guide.paused && !guide.dismissed,
    skip: () => setGuide((old) => ({ ...old, paused: true })),
    resume: () => setGuide((old) => ({ ...old, paused: false })),
    dismiss: () => setGuide((old) => ({ ...old, dismissed: true })),
    replay: () => setGuide((old) => ({ ...newGuide(), unlocked: old.unlocked, hints: old.hints })),
    seen,
  };
}
const Context = createContext<ReturnType<typeof useExperienceState> | null>(null);
export function useExperience() { const value = useContext(Context); if (!value) throw new Error("Missing ExperienceProvider"); return value; }
export function OneTimeHint({ name, message, children }: { name: string; message: string; children?: ReactNode }) {
  const { guide, seen } = useExperience();
  const [visible, setVisible] = useState(() => !guide.hints.includes(name));
  useEffect(() => { if (visible) seen(name); }, [visible, name, seen]);
  if (!visible) return null;
  return <View style={{ padding: 10, backgroundColor: colors.surface, borderRadius: 12 }}><Text style={s.text}>{message}</Text>{children}<Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={s.button}><Text style={s.text}>Got it</Text></Pressable></View>;
}
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const experience = useExperienceState();
  return <Context.Provider value={experience}>{children}</Context.Provider>;
}
export function TourTarget({ name, children, style, enabled = true }: { name: Target; children: ReactNode; style?: StyleProp<ViewStyle>; enabled?: boolean }) {
  const ref = useRef<ComponentRef<typeof View>>(null), { register } = useExperience();
  useEffect(() => { if (enabled && ref.current) return register(name, ref.current); }, [enabled, name, register]);
  return <View ref={ref} collapsable={false} testID={`tour-${name}`} style={style}>{children}</View>;
}
export function Pulse({ size = 28 }: { size?: number }) {
  const { reducedMotion } = useExperience(), { accent } = useFitMap();
  const [value] = useState(() => new Animated.Value(1));
  useEffect(() => {
    value.setValue(1); if (reducedMotion) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(value, { toValue: 1.35, duration: 850, useNativeDriver: true }), Animated.timing(value, { toValue: 1, duration: 850, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [reducedMotion, value]);
  return <Animated.View pointerEvents="none" style={{ width: size, height: size, borderRadius: size, borderWidth: 2, borderColor: accent, transform: [{ scale: value }] }} />;
}
export function ExperienceSurface({ children }: { children: ReactNode }) {
  const ux = useExperience(), store = useFitMap(), path = usePathname();
  const { targets, active, step, ready, mark, unlock } = ux;
  const root = useRef<ComponentRef<typeof View>>(null), [rect, setRect] = useState<(Rect & { target: Target; path: string }) | null>(null), [size, setSize] = useState({ width: 0, height: 0 });
  const target: Target | undefined = ux.step === "rotate" ? "figure" : ux.step === "select" ? "muscle" : ux.step === "add" ? "add" : ux.step === "routine" ? "routine" : ux.step === "weight" ? "weight" : undefined;
  const equipment = store.routine[0]?.equipment.toLowerCase();
  const message = ux.step === "rotate" ? "Drag to turn the body around. Or use Front / Back in the muscle list." : ux.step === "select" ? "Tap a muscle to see exercises." : ux.step === "add" ? "Add an exercise to your routine." : ux.step === "routine" ? "Your workout lives here. Open Routine." : equipment === "bodyweight" ? "Adjust sets or reps for your first exercise." : equipment === "barbell" ? "Tap plates to set your weight." : "Open the weight control and set your weight.";
  useEffect(() => { if (path === "/routine" && store.ready && ready) mark("routine"); }, [path, store.ready, ready, mark]);
  useEffect(() => { if (store.routine.length && ready) unlock(); }, [store.routine.length, ready, unlock]);
  useEffect(() => { if (active) AccessibilityInfo.announceForAccessibility(step ? message : "You're set. Your routine views are unlocked."); }, [active, step, message]);
  useEffect(() => {
    if (!active || !target) return;
    const measure = () => root.current?.measureInWindow((rootX, rootY) => {
      const candidates = [...(targets.current.get(target) ?? [])];
      void Promise.all(candidates.map((node) => new Promise<Rect>((resolve) => node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }))))).then((boxes) => {
        const box = boxes.find(({ x, y, width, height }) => width > 0 && height > 0 && y >= rootY && y + height <= rootY + size.height + 1 && x >= rootX - 1 && x < rootX + size.width);
        setRect(box ? { target, path, x: box.x - rootX, y: box.y - rootY, width: box.width, height: box.height } : null);
      });
    });
    measure(); const timer = setInterval(measure, 250); return () => clearInterval(timer);
  }, [target, active, targets, size, path]);
  return <SafeAreaView edges={["top"]} ref={root} onLayout={(event) => setSize(event.nativeEvent.layout)} style={s.root}>
    {ux.active && <View style={s.guide}>
      <View style={{ flex: 1 }}><Text style={[s.title, { color: store.accent }]}>{ux.step ? `Build your first workout / ${ux.guide.completed.length}/5` : "You're set"}</Text><Text style={s.text}>{ux.step ? message : "Heatmap, Recent and Connect are now unlocked."}</Text></View>
      <Pressable accessibilityRole="button" onPress={ux.step ? ux.skip : ux.dismiss} style={s.button}><Text style={s.text}>{ux.step ? "Skip" : "Dismiss"}</Text></Pressable>
    </View>}
    {!ux.active && ux.ready && ux.guide.paused && !ux.guide.dismissed && <Pressable accessibilityRole="button" onPress={ux.resume} style={s.resume}><Text style={[s.title, { color: store.accent }]}>Getting started {ux.guide.completed.length}/5 / Resume</Text></Pressable>}
    {ux.error && <Text accessibilityRole="alert" style={s.text}>{ux.error}</Text>}
    <View style={{ flex: 1 }}>{children}</View>
    {ux.active && rect && rect.target === target && rect.path === path && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[s.shade, { left: 0, top: 0, width: size.width, height: rect.y }]} />
      <View style={[s.shade, { left: 0, top: rect.y, width: rect.x, height: rect.height }]} />
      <View style={[s.shade, { left: rect.x + rect.width, top: rect.y, right: 0, height: rect.height }]} />
      <View style={[s.shade, { left: 0, top: rect.y + rect.height, right: 0, bottom: 0 }]} />
      <View style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.width, height: rect.height, borderWidth: 2, borderColor: store.accent, borderRadius: 12 }} />
    </View>}
    {ux.toast && <View accessibilityLiveRegion="polite" style={s.toast}><Text style={[s.text, { flex: 1 }]}>{ux.toast.message}</Text>{ux.toast.action && <Pressable accessibilityRole="button" onPress={() => { ux.toast?.run?.(); ux.setToast(null); }} style={s.button}><Text style={[s.title, { color: store.accent }]}>{ux.toast.action}</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => ux.setToast(null)} style={s.button}><Text style={s.text}>Close</Text></Pressable></View>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", backgroundColor: colors.background },
  guide: { zIndex: 10, backgroundColor: colors.raised, padding: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  title: { fontSize: 12, fontWeight: "700" }, text: { color: colors.text, fontSize: 12, lineHeight: 18 },
  button: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  resume: { minHeight: 44, justifyContent: "center", alignItems: "center" }, shade: { position: "absolute", backgroundColor: "#0004" },
  toast: { position: "absolute", bottom: 80, left: 12, right: 12, zIndex: 30, backgroundColor: "#252b35", borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10, flexDirection: "row", alignItems: "center", gap: 4 },
});
