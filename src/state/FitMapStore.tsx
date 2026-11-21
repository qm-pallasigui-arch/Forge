import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Exercise } from "../shared/fitness";
import { parseWeeklyPlan, type WeeklyPlan } from "../shared/weekly-plan";

export type Theme = "classic" | "blueprint" | "neon";
export type Mode = "map" | "heatmap" | "recovery" | "constellation";
export type BodyView = "front" | "back";
type State = {
  weeklyPlan: WeeklyPlan;
  routine: Exercise[];
  notes: Record<string, string>;
  recent: Record<string, number>;
  theme: Theme;
  mode: Mode;
};
const initial: State = { routine: [], notes: {}, recent: {}, theme: "classic", mode: "map", weeklyPlan: {} };
const KEY = "fitmap.native.v1";
export const accents: Record<Theme, string> = {
  classic: "#ff5a36",
  blueprint: "#42b7ff",
  neon: "#c8ff3d",
};
export const colors = {
  background: "#0f1115",
  surface: "#1a1d24",
  raised: "#232730",
  border: "#303541",
  text: "#f4f5f7",
  muted: "#9ca5b4",
};

export function parseState(raw: string | null): State {
  if (!raw) return initial;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return initial;
    const routine = Array.isArray(value.routine)
      ? value.routine.filter(
          (x: Exercise) =>
            x &&
            ["id", "name", "equipment", "muscle"].every(
              (k) => typeof x[k as keyof Exercise] === "string",
            ) &&
            [x.sets, x.reps, x.weight, x.progression].every(
              (n) => typeof n === "number" && Number.isFinite(n),
            ) &&
            x.sets >= 1 &&
            x.reps >= 1 &&
            x.weight >= 0 &&
            x.progression >= 0,
        )
      : [];
    const notes = Object.fromEntries(
      Object.entries(value.notes ?? {}).filter(([, v]) => typeof v === "string"),
    ) as Record<string, string>;
    const recent = Object.fromEntries(
      Object.entries(value.recent ?? {}).filter(
        ([, v]) => typeof v === "number" && Number.isFinite(v),
      ),
    ) as Record<string, number>;
    return {
      weeklyPlan: parseWeeklyPlan(value.weeklyPlan),
      routine,
      notes,
      recent,
      theme: ["blueprint", "neon"].includes(value.theme) ? value.theme : "classic",
      mode: ["heatmap", "recovery", "constellation"].includes(value.mode) ? value.mode : "map",
    };
  } catch {
    return initial;
  }
}

type Store = State & {
  ready: boolean;
  error: string | null;
  accent: string;
  add: (exercise: Exercise, view: BodyView, muscle: string) => void;
  update: (exercise: Exercise) => void;
  remove: (id: string) => void;
  setNote: (key: string, note: string) => void;
  setMode: (mode: Mode) => void;
  cycleTheme: () => void;
  togglePlanMuscle: (day: number, muscle: string) => void;
};
const Context = createContext<Store | null>(null);
export function FitMapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  const persistenceEnabled = useRef(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive) {
          persistenceEnabled.current = true;
          setState(parseState(raw));
        }
      })
      .catch(() => {
        if (alive) setError("Could not load saved workouts.");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || !persistenceEnabled.current) return;
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
      .then(() => setError(null))
      .catch(() => setError("Changes could not be saved to this device."));
  }, [state, ready]);
  const add: Store["add"] = (exercise, view, muscle) =>
    setState((old) => ({
      ...old,
      routine: [...old.routine.filter((x) => x.id !== exercise.id), exercise],
      recent: { ...old.recent, [`${view}:${muscle}`]: Date.now() },
    }));
  return (
    <Context.Provider
      value={{
        ...state,
        ready,
        error,
        accent: accents[state.theme],
        add,
        update: (exercise) =>
          setState((old) => ({
            ...old,
            routine: old.routine.map((x) => (x.id === exercise.id ? exercise : x)),
          })),
        remove: (id) =>
          setState((old) => ({ ...old, routine: old.routine.filter((x) => x.id !== id) })),
        setNote: (key, note) =>
          setState((old) => ({ ...old, notes: { ...old.notes, [key]: note } })),
        setMode: (mode) => setState((old) => ({ ...old, mode })),
        togglePlanMuscle: (day, muscle) => {
          if (!Number.isInteger(day) || day < 0 || day > 6) return;
          setState((old) => {
            const muscles = old.weeklyPlan[String(day)] ?? [];
            return { ...old, weeklyPlan: { ...old.weeklyPlan, [day]: muscles.includes(muscle) ? muscles.filter((m) => m !== muscle) : [...muscles, muscle] } };
          });
        },
        cycleTheme: () =>
          setState((old) => ({
            ...old,
            theme:
              old.theme === "classic"
                ? "blueprint"
                : old.theme === "blueprint"
                  ? "neon"
                  : "classic",
          })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFitMap() {
  const state = useContext(Context);
  if (!state) throw new Error("Missing FitMapProvider");
  return state;
}
