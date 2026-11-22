import { migrateHistory, migrateRoutineDays, validateHistory, type Session } from "../shared/sessions";
import { parseWorkout, type Workout } from "../shared/workout";
import { names } from "../shared/body-artwork";
import { normalizeWeight } from "../shared/weight";
import { normalizeSchedule, normalizeLog, normalizeSkips, type Schedule, type Skips, type ReminderPrefs } from "../notify/scheduler";
import type { Exercise } from "../shared/fitness";
import { parseWeeklyPlan, type WeeklyPlan } from "../shared/weekly-plan";
export type Theme = "classic" | "blueprint" | "neon";
export type Mode = "map" | "heatmap" | "recovery" | "constellation";
export type BodyView = "front" | "back";
export type State = {
  workout: Workout | null;
  history: Session[];
  schedule: Schedule;
  skips: Skips;
  reminders: ReminderPrefs;
  weeklyPlan: WeeklyPlan;
  routine: Exercise[];
  notes: Record<string, string>;
  recent: Record<string, number>;
  theme: Theme;
  mode: Mode;
};
export const initial: State = { workout: null, history: [], schedule: normalizeSchedule(null), skips: {}, reminders: { enabled: false, private: false }, routine: [], notes: {}, recent: {}, theme: "classic", mode: "map", weeklyPlan: {} };
export const KEY = "fitmap.native.v1";
export const KEYS = ["fitmap.state.v2", KEY, "fitmap.lastlog.v1", "fitmap.workout.v1", "fitmap.history.v1", "fitmap.routine.v1", "fitmap.prefs.v1", "fitmap.schedule.v1", "fitmap.log.v1", "fitmap.skips.v1", "fitmap-muscle-notes", "fitmap-recovery-times"];

export function normalizeExercise(exercise: Exercise): Exercise { return { ...exercise, days: [...new Set((exercise.days ?? []).filter(d => Number.isInteger(d) && d >= 0 && d < 7))].sort(), weight: exercise.equipment.toLowerCase() === "bodyweight" ? 0 : normalizeWeight(exercise.weight) }; }
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
      workout: parseWorkout(value.workout),
      history: validateHistory(value.history),
      schedule: normalizeSchedule(value.schedule),
      skips: normalizeSkips(value.skips),
      reminders: { enabled: value.reminders?.enabled === true, private: value.reminders?.private === true },
      weeklyPlan: parseWeeklyPlan(value.weeklyPlan),
      routine: routine.map(normalizeExercise),
      notes,
      recent,
      theme: ["blueprint", "neon"].includes(value.theme) ? value.theme : "classic",
      mode: ["heatmap", "recovery", "constellation"].includes(value.mode) ? value.mode : "map",
    };
  } catch {
    return initial;
  }
}


export function migrateStateV1(value: Record<string, unknown>): State {
  const oldSchedule = Array.isArray(value.schedule) ? value.schedule : Array.from({length:7}, (_, day) => ({ enabled: ((value.weeklyPlan as WeeklyPlan)?.[String(day)] ?? []).length > 0, hour:18, minute:0, muscles: ((value.weeklyPlan as WeeklyPlan)?.[String(day)] ?? []).flatMap(label => Object.keys(names).filter(id=>names[id]===label)) }));
  const old = parseState(JSON.stringify(value));
  const schedule = Array.from({length:7},(_,day)=>{ const item=oldSchedule[(day+1)%7]; const hour=Number.isInteger(item?.hour)&&item.hour>=0&&item.hour<24?item.hour:18; const minute=Number.isInteger(item?.minute)&&item.minute>=0&&item.minute<60?item.minute:0; return {on:item?.enabled===true,time:`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`}; });
  // Normalize first, but preserve the absence of days so legacy membership can be inferred.
  const rawRoutine = Array.isArray(value.routine) ? value.routine : [];
  const routine = migrateRoutineDays(old.routine.map(e=>({...e,days:rawRoutine.find(x=>x.id===e.id)?.days})),oldSchedule);
  return {...old, routine, schedule, history:migrateHistory(value.history ?? [],normalizeLog(value.log))};
}
export function hydrateState(entries: readonly (readonly [string, string | null])[]): State {
  const values=Object.fromEntries(entries);
  const read=(key:string,fallback:unknown)=>{try{return values[key]?JSON.parse(values[key]!):fallback;}catch{return fallback;}};
  if(values["fitmap.state.v2"]!==undefined && values["fitmap.state.v2"]!==null) {
    const state = parseState(values["fitmap.state.v2"]);
    return {...state,history:validateHistory(read("fitmap.history.v1",[]))};
  }
  const legacy=read(KEY,{}) as Record<string,unknown>;
  return migrateStateV1({...legacy,...read("fitmap.prefs.v1",{}) as object, routine:read("fitmap.routine.v1",legacy.routine), workout:read("fitmap.workout.v1",null), history:read("fitmap.history.v1",[]), schedule:read("fitmap.schedule.v1",legacy.schedule), log:read("fitmap.log.v1",legacy.log), skips:read("fitmap.skips.v1",legacy.skips), notes:read("fitmap-muscle-notes",legacy.notes), recent:read("fitmap-recovery-times",legacy.recent)});
}
