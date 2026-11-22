import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type RefObject, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View, ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";
import { usePathname } from "expo-router";
import { colors, useFitMap } from "./FitMapStore";
import { completeStep, newGuide, nextStep, parseGuide, type GuideStep } from "../shared/onboarding";

type Toast = { message: string; action?: string; run?: () => void; id: number };
type Target = "figure" | "muscle" | "add" | "start" | "routine" | "weight";
function useExperienceState() {
  const {targetWeekday}=useFitMap();
  const [guide, setGuide] = useState(newGuide), [ready, setReady] = useState(false), [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true), [toast, setToast] = useState<Toast | null>(null);
  const writable = useRef(false), writes = useRef(Promise.resolve());
  const earlyActions = useRef<GuideStep[]>([]);
  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet(["fitmap-onboarding-v2", "fitmap-onboarding-v1"]).then((entries) => entries[0][1] ?? entries[1][1]).then((raw) => { if (alive) { setGuide(earlyActions.current.reduce(completeStep, parseGuide(raw))); writable.current = true; } }).catch(() => { if (alive) setError("Guide progress could not be loaded."); }).finally(() => { if (alive) setReady(true); });
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReducedMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { alive = false; listener.remove(); };
  }, []);
  useEffect(() => {
    if (!ready || !writable.current) return;
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem("fitmap-onboarding-v2", JSON.stringify(guide))).catch(() => setError("Guide progress could not be saved."));
  }, [guide, ready]);
  const mark = useCallback((step: GuideStep) => { if (!writable.current) earlyActions.current.push(step); setGuide((old) => completeStep(old, step)); }, []);
  const unlock = useCallback(() => setGuide((old) => old.unlocked ? old : { ...old, unlocked: true }), []);
  const notify = useCallback((message: string, action?: string, run?: () => void) => setToast({ message, action, run, id: Date.now() }), []);
  const seen = useCallback((hint: string) => setGuide((old) => old.hints.includes(hint) ? old : { ...old, hints: [...old.hints, hint] }), []);
  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(() => setToast((old) => old?.id === toast.id ? null : old), toast.action ? 12000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  return { guide, ready, error, reducedMotion, mark, unlock, notify, toast, setToast,
    step: nextStep(guide), active: ready && !guide.paused && !guide.dismissed && targetWeekday === null,
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
const ScrollContext = createContext<((node: ComponentRef<typeof View>) => void) | null>(null);
export function GuideScrollView({ children, onScroll, scrollRef, ...props }: ScrollViewProps & {scrollRef?: RefObject<ComponentRef<typeof ScrollView> | null>}) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null), offset = useRef(0), { reducedMotion } = useExperience();
  const reveal = useCallback((node: ComponentRef<typeof View>) => {
    ref.current?.measureInWindow((_x, top, _width, height) => node.measureInWindow((_tx, y, _tw, h) => {
      if (y < top || y + h > top + height) ref.current?.scrollTo({ y: Math.max(0, offset.current + y - top - 16), animated: !reducedMotion });
    }));
  }, [reducedMotion]);
  return <ScrollContext.Provider value={reveal}><ScrollView {...props} ref={node=>{ref.current=node;if(scrollRef)scrollRef.current=node;}} scrollEventThrottle={16} onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.y; onScroll?.(event); }}>{children}</ScrollView></ScrollContext.Provider>;
}
export function GuideTarget({ name, children, style, enabled = true }: { name: Target; children: ReactNode; style?: StyleProp<ViewStyle>; enabled?: boolean }) {
  const ref = useRef<ComponentRef<typeof View>>(null), reveal = useContext(ScrollContext), ux = useExperience(), { accent } = useFitMap(), path = usePathname();
  const highlighted = enabled && ux.active && ((ux.step === "select" && (name === "figure" || name === "muscle")) || ux.step === name);
  useEffect(() => { if (!highlighted) return; const timer = setTimeout(() => { if (ref.current) reveal?.(ref.current); }, 100); return () => clearTimeout(timer); }, [highlighted, reveal, path]);
  return <View ref={ref} collapsable={false} testID={`guide-${name}`} style={[{ borderWidth: 2, borderColor: highlighted ? accent : "transparent", borderRadius: 12 }, style]} onLayout={() => { if (highlighted && ref.current) reveal?.(ref.current); }}>{children}</View>;
}
export const TourTarget = GuideTarget;
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
  const ux = useExperience(), store = useFitMap();
  const { active, step, ready, unlock } = ux;
  const message = step === "select" ? "Tap a muscle to see exercises." : step === "add" ? "Add an exercise to your routine." : "Tap Start workout to begin.";
  useEffect(() => { if (store.routine.length && ready) unlock(); }, [store.routine.length, ready, unlock]);
  useEffect(() => { if (active) AccessibilityInfo.announceForAccessibility(step ? message : "You're ready. Enjoy your workout."); }, [active, step, message]);
  return <SafeAreaView edges={["top"]} style={s.root}>
    {!active && ready && ux.guide.paused && !ux.guide.dismissed && <Pressable accessibilityRole="button" onPress={ux.resume} style={s.resume}><Text style={[s.title, { color: store.accent }]}>Getting started {ux.guide.completed.length}/3 / Resume</Text></Pressable>}
    {ux.error && <Text accessibilityRole="alert" style={s.text}>{ux.error}</Text>}
    <View style={{ flex: 1 }}>{children}</View>
    {ux.toast && <View accessibilityLiveRegion="polite" style={s.toast}><Text style={[s.text, { flex: 1 }]}>{ux.toast.message}</Text>{ux.toast.action && <Pressable accessibilityRole="button" onPress={() => { ux.toast?.run?.(); ux.setToast(null); }} style={s.button}><Text style={[s.title, { color: store.accent }]}>{ux.toast.action}</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => ux.setToast(null)} style={s.button}><Text style={s.text}>Close</Text></Pressable></View>}
    {active && <SafeAreaView edges={["bottom"]} style={s.guide} testID="guide-card"><View style={{ flex: 1 }}><Text style={[s.title, { color: store.accent }]}>{step ? `Build your first workout / ${ux.guide.completed.length}/3` : "You're set"}</Text><Text style={s.text}>{step ? message : "Your workout is ready. You can replay this guide from Menu."}</Text></View><Pressable accessibilityRole="button" onPress={step ? ux.skip : ux.dismiss} style={s.button}><Text style={s.text}>{step ? "Skip" : "Dismiss"}</Text></Pressable></SafeAreaView>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", backgroundColor: colors.background },
  guide: { backgroundColor: colors.raised, padding: 12, flexDirection: "row", gap: 8, alignItems: "center" },
  title: { fontSize: 12, fontWeight: "700" }, text: { color: colors.text, fontSize: 12, lineHeight: 18 },
  button: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  resume: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  toast: { backgroundColor: "#252b35", borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10, flexDirection: "row", alignItems: "center", gap: 4 },
});
