import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { names } from "../shared/body-artwork";
import { dateKey, normalizeSchedule, normalizeSkips, type ReminderPrefs, type DayPlan } from "../notify/scheduler";
import type { Exercise } from "../shared/fitness";
import { initial, KEYS, hydrateState, normalizeExercise, type State, type Theme, type Mode, type BodyView } from "./persistence";
export type { Theme, Mode, BodyView } from "./persistence";

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

type Store = State & {
  ready: boolean;
  error: string | null;
  accent: string;
  add: (exercise: Exercise, view: BodyView, muscle: string) => void;
  update: (exercise: Exercise) => void;
  remove: (id: string) => void;
  restore: (exercise: Exercise, index: number) => void;
  setNote: (key: string, note: string) => void;
  setMode: (mode: Mode) => void;
  cycleTheme: () => void;
  setDayPlan: (day: number, plan: DayPlan) => void;
  setReminders: (prefs: ReminderPrefs) => void;
  logWorkout: (muscles: string[]) => void;
  skipDay: (date: string) => void;
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
    AsyncStorage.multiGet(KEYS)
      .then((entries) => {
        const next = hydrateState(entries);
        if (alive) {
          persistenceEnabled.current = true;
          setState(next);
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
      .then(() => AsyncStorage.multiSet([
        ["fitmap.routine.v1", JSON.stringify(state.routine)],
        ["fitmap.prefs.v1", JSON.stringify({ theme: state.theme, mode: state.mode, reminders: state.reminders })],
        ["fitmap.schedule.v1", JSON.stringify(state.schedule)],
        ["fitmap.log.v1", JSON.stringify(state.log)],
        ["fitmap.skips.v1", JSON.stringify(state.skips)],
        ["fitmap-muscle-notes", JSON.stringify(state.notes)],
        ["fitmap-recovery-times", JSON.stringify(state.recent)],
      ]))
      .then(() => setError(null))
      .catch(() => setError("Changes could not be saved to this device."));
  }, [state, ready]);
  const add: Store["add"] = (exercise, view, muscle) =>
    setState((old) => ({
      ...old,
      routine: [...old.routine.filter((x) => x.id !== exercise.id), normalizeExercise(exercise)],
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
            routine: old.routine.map((x) => (x.id === exercise.id ? normalizeExercise(exercise) : x)),
          })),
        remove: (id) =>
          setState((old) => ({ ...old, routine: old.routine.filter((x) => x.id !== id) })),
        restore: (exercise, index) => setState((old) => { if (old.routine.some((item) => item.id === exercise.id)) return old; const routine = [...old.routine]; routine.splice(Math.min(index, routine.length), 0, exercise); return { ...old, routine }; }),
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
        setDayPlan: (day, plan) => setState((old) => ({ ...old, schedule: normalizeSchedule(old.schedule.map((item, index) => index === day ? plan : item)) })),
        setReminders: (reminders) => setState((old) => ({ ...old, reminders })),
        skipDay: (date) => setState((old) => ({ ...old, skips: normalizeSkips({ ...old.skips, [date]: true }) })),
        logWorkout: (muscles) => {
          const at = Date.now(), key = dateKey(new Date(at));
          const ids = muscles.filter((id) => Object.hasOwn(names, id));
          setState((old) => ({ ...old, log: { ...old.log, [key]: { at, muscles: ids } }, recent: { ...old.recent, ...Object.fromEntries(ids.flatMap((id) => [[`front:${id}`, at], [`back:${id}`, at]])) } }));
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
