import { names } from "../shared/body-artwork";
import { normalizeWeight } from "../shared/weight";
import { normalizeSchedule, normalizeLog, normalizeSkips, type Schedule, type WorkoutLog, type Skips, type ReminderPrefs } from "../notify/scheduler";
import type { Exercise } from "../shared/fitness";
import { parseWeeklyPlan, type WeeklyPlan } from "../shared/weekly-plan";
export type Theme = "classic" | "blueprint" | "neon";
export type Mode = "map" | "heatmap" | "recovery" | "constellation";
export type BodyView = "front" | "back";
export type State = {
  schedule: Schedule;
  log: WorkoutLog;
  skips: Skips;
  reminders: ReminderPrefs;
  weeklyPlan: WeeklyPlan;
  routine: Exercise[];
  notes: Record<string, string>;
  recent: Record<string, number>;
  theme: Theme;
  mode: Mode;
};
export const initial: State = { schedule: normalizeSchedule(null), log: {}, skips: {}, reminders: { enabled: false, private: false }, routine: [], notes: {}, recent: {}, theme: "classic", mode: "map", weeklyPlan: {} };
export const KEY = "fitmap.native.v1";
export const KEYS = [KEY, "fitmap.routine.v1", "fitmap.prefs.v1", "fitmap.schedule.v1", "fitmap.log.v1", "fitmap.skips.v1", "fitmap-muscle-notes", "fitmap-recovery-times"];

export function normalizeExercise(exercise: Exercise): Exercise { return { ...exercise, weight: exercise.equipment.toLowerCase() === "bodyweight" ? 0 : normalizeWeight(exercise.weight) }; }
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
      schedule: normalizeSchedule(value.schedule),
      log: normalizeLog(value.log),
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


export function hydrateState(entries: readonly (readonly [string, string | null])[]): State {
        const values = Object.fromEntries(entries);
        const legacy = parseState(values[KEY]);
        const read = (key: string, fallback: unknown) => { if (!values[key]) return fallback; try { return JSON.parse(values[key]!); } catch { return fallback; } };
        const migratedSchedule = Array.from({ length: 7 }, (_, day) => { const muscles = (legacy.weeklyPlan[String(day)] ?? []).flatMap((label) => Object.keys(names).filter((id) => names[id] === label)); return { enabled: muscles.length > 0, hour: 18, minute: 0, muscles }; });
        const prefs = read("fitmap.prefs.v1", { theme: legacy.theme, mode: legacy.mode, reminders: legacy.reminders });
        return parseState(JSON.stringify({ ...legacy, ...prefs, routine: read("fitmap.routine.v1", legacy.routine), notes: read("fitmap-muscle-notes", legacy.notes), recent: read("fitmap-recovery-times", legacy.recent), schedule: read("fitmap.schedule.v1", migratedSchedule), log: read("fitmap.log.v1", legacy.log), skips: read("fitmap.skips.v1", legacy.skips) }));
}
