import { insertSessionExercise } from "../shared/session-picker";
import { copyDay } from "../shared/plan-layout";
import { finishSession, historyLog, lastExerciseLog, validateHistory } from "../shared/sessions";
import { completedSets, newWorkout, toggleSet, progressRoutine, adjustRest, editWorkoutExercise, remainingSets } from "../shared/workout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { names } from "../shared/body-artwork";
import { normalizeSchedule, normalizeSkips, type ReminderPrefs, type DayPlan } from "../notify/scheduler";
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
  copyDay: (source: number, destination: number) => void;
  clearPlanDay: (day: number) => void;
  targetWeekday: number | null;
  returnWeekday: number | null;
  beginDay: (day: number) => void;
  endDay: () => void;
  clearDay: () => void;
  assignDay: (id: string, day: number, included: boolean) => void;
  log: ReturnType<typeof historyLog>;
  lastLog: ReturnType<typeof lastExerciseLog>;
  deleteSession: (id: string) => void;
  exportState: () => State;
  importState: (state: State) => void;
  startWorkout: (exercises: Exercise[]) => void;
  checkSet: (id: string, index: number) => void;
  stopRest: () => void;
  adjustRest: (seconds: number) => void;
  editWorkout: (id: string, patch: Partial<Pick<Exercise, "weight" | "reps" | "progression">>) => void;
  addWorkoutExercise: (exercise: Exercise, after?: string, day?: number) => void;
  includeExercises: (exercises: Exercise[]) => void;
  skipExercise: (id: string) => void;
  discardWorkout: () => void;
  finishWorkout: () => void;
  ready: boolean;
  error: string | null;
  accent: string;
  add: (exercise: Exercise, view: BodyView, muscle: string) => void;
  update: (exercise: Exercise) => void;
  remove: (id: string) => void;
  restore: (exercise: Exercise, index: number) => void;
  setNote: (key: string, note: string) => void;
  setMode: (mode: Mode) => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  setDayPlan: (day: number, plan: DayPlan) => void;
  setReminders: (prefs: ReminderPrefs) => void;
  skipDay: (date: string) => void;
  togglePlanMuscle: (day: number, muscle: string) => void;
};
const Context = createContext<Store | null>(null);
export function FitMapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [targetWeekday, setTargetWeekday] = useState<number | null>(null), [returnWeekday,setReturnWeekday] = useState<number | null>(null);
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
        ["fitmap.state.v2", JSON.stringify(state)],
        ["fitmap.history.v1", JSON.stringify(state.history)],
      ]))
      .then(() => setError(null))
      .catch(() => setError("Changes could not be saved to this device."));
  }, [state, ready]);
  const derivedLog = useMemo(() => historyLog(state.history), [state.history]);
  const derivedLastLog = useMemo(() => lastExerciseLog(state.history), [state.history]);
  const add: Store["add"] = (exercise, view, muscle) =>
    setState((old) => ({
      ...old,
      routine: [...old.routine.filter((x) => x.id !== exercise.id), normalizeExercise({...exercise, days: targetWeekday === null ? (old.routine.find(e=>e.id===exercise.id)?.days ?? exercise.days ?? []) : [...new Set([...(old.routine.find(e=>e.id===exercise.id)?.days ?? []), targetWeekday])]})],
      schedule: old.schedule.map((d,i)=>i===targetWeekday?{...d,on:true}:d),
      recent: { ...old.recent, [`${view}:${muscle}`]: Date.now() },
    }));
  return (
    <Context.Provider
      value={{
        ...state,
        copyDay: (source, destination) => setState(old => ({ ...old, ...copyDay(old.routine, old.schedule, source, destination) })),
        clearPlanDay: day => setState(old => ({ ...old, routine: old.routine.map(e => ({ ...e, days: e.days.filter(d => d !== day) })), schedule: old.schedule.map((p,i) => i === day ? { ...p, on: false } : p) })),
        targetWeekday, returnWeekday,
        beginDay: (day) => { if(Number.isInteger(day)&&day>=0&&day<7){setTargetWeekday(day);setReturnWeekday(null);} },
        endDay: () => {setReturnWeekday(targetWeekday);setTargetWeekday(null);},
        clearDay: () => setTargetWeekday(null),
        assignDay: (id,day,included) => setState(old=>({...old,routine:old.routine.map(e=>e.id===id?{...e,days:included?[...new Set([...e.days,day])].sort():e.days.filter(d=>d!==day)}:e),schedule:old.schedule.map((d,i)=>i===day&&included?{...d,on:true}:d)})),
        log: derivedLog,
        lastLog: derivedLastLog,
        deleteSession: (id) => setState(old => ({...old, history:old.history.filter(s=>s.id!==id)})),
        exportState: () => state,
        importState: (next) => setState({ ...next, reminders: { ...next.reminders, enabled: false } }),
        startWorkout: (exercises) => setState((old) => old.workout || !exercises.length ? old : { ...old, workout: newWorkout(exercises) }),
        checkSet: (id, index) => setState((old) => old.workout ? { ...old, workout: toggleSet(old.workout, id, index) } : old),
        stopRest: () => setState((old) => old.workout ? { ...old, workout: { ...old.workout, restUntil: null } } : old),
        adjustRest: (seconds) => setState(old => old.workout ? { ...old, workout: adjustRest(old.workout, seconds) } : old),
        editWorkout: (id, patch) => setState(old => old.workout ? { ...old, workout: editWorkoutExercise(old.workout, id, patch) } : old),
        addWorkoutExercise: (exercise, after, day) => setState(old => {
          if (!old.workout) return old;
          const e = normalizeExercise(exercise), workout = insertSessionExercise(old.workout, e, after);
          if (workout === old.workout) return old;
          if (day === undefined || !Number.isInteger(day) || day < 0 || day > 6) return { ...old, workout };
          const existing = old.routine.find(x => x.id === e.id);
          const entry = { ...(existing ?? e), days: [...new Set([...(existing?.days ?? []),day])].sort() };
          return { ...old, workout, routine: existing ? old.routine.map(x => x.id === e.id ? entry : x) : [...old.routine,entry], schedule: old.schedule.map((p,i)=>i === day ? {...p,on:true} : p) };
        }),
        includeExercises: (exercises) => setState(old => { if (!old.workout) return old; const added = exercises.filter(e => !old.workout!.exercises.some(x => x.id === e.id)); return { ...old, workout: { ...old.workout, exercises: [...old.workout.exercises, ...added.map(e => ({...e}))], completed: { ...old.workout.completed, ...Object.fromEntries(added.map(e => [e.id, []])) } } }; }),
        skipExercise: (id) => setState(old => { if (!old.workout) return old; const w = { ...old.workout, skipped: [...new Set([...(old.workout.skipped ?? []), id])] }; return { ...old, workout: { ...w, restUntil: remainingSets(w) ? w.restUntil : null } }; }),
        discardWorkout: () => setState((old) => ({ ...old, workout: null })),
        finishWorkout: () => setState((old) => {
          const w = old.workout; if (!w || !completedSets(w)) return old;
          const at = Math.max(Date.now(), w.startedAt);
          const labels = w.exercises.filter((e) => w.completed[e.id]?.length).map((e) => e.muscle);
          const ids = Object.keys(names).filter((id) => labels.includes(names[id]));
          return { ...old, routine: progressRoutine(old.routine, w), workout: null, history: validateHistory([...old.history, finishSession(w,at)]), recent: { ...old.recent, ...Object.fromEntries(ids.flatMap((id) => [[`front:${id}`, at], [`back:${id}`, at]])) } };
        }),
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
        setTheme: theme => setState(old => ({...old,theme})),
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
