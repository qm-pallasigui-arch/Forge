import { historyLog, weekday, type Session } from "../shared/sessions";
import { names } from "../shared/body-artwork";
import type { Exercise } from "../shared/fitness";

export type DayPlan = { on: boolean; time: string };
export type Schedule = DayPlan[];
export type WorkoutLog = Record<string, { at: number; muscles: string[] }>;
export type Skips = Record<string, boolean>;
export type ReminderPrefs = { enabled: boolean; private: boolean };
export const MUSCLES = Object.entries(names).map(([id, label]) => ({ id, label }));
export function normalizeSchedule(value: unknown): Schedule {
  return Array.from({ length: 7 }, (_, day) => {
    const item = Array.isArray(value) ? value[day] : undefined;
    return { on: item?.on === true, time: typeof item?.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ? item.time : "18:00" };
  });
}
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return dateKey(new Date(year, month - 1, day)) === value;
}
export function normalizeLog(value: unknown): WorkoutLog {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => validDateKey(key) && item && typeof item.at === "number" && Number.isFinite(item.at) && item.at >= 0 && Array.isArray(item.muscles)).map(([key, item]) => [key, { at: item.at, muscles: item.muscles.filter((id: string) => Object.hasOwn(names, id)) }]));
}
export function normalizeSkips(value: unknown): Skips {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, skip]) => validDateKey(key) && skip === true));
}
export function dayExercises(routine: Exercise[], day: number) { return routine.filter(e => e.days?.includes(day)); }
export function dayLabel(routine: Exercise[], day: number) { return [...new Set(dayExercises(routine,day).map(e=>e.muscle))].join(" + "); }
export function exerciseCount(routine: Exercise[], day: number) { return dayExercises(routine,day).length; }
export type PlannedReminder = { identifier: string; date: Date; title: string; body: string; data: { fitmap: true; date: string; screen: "routine" | "plan" } };
export function renewalReminder(now: Date, planned: PlannedReminder[]): PlannedReminder | null {
  if (!planned.length) return null;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 26, 18, 0);
  return { identifier: "fitmap.renewal", date, title: "Keep your reminders going", body: "Open FitMap to keep reminders going.", data: { fitmap: true, date: dateKey(date), screen: "plan" } };
}
export function planReminders({ now, routine, schedule, history, skips, prefs }: { now: Date; routine: Exercise[]; schedule: Schedule; history: Session[]; skips: Skips; prefs: ReminderPrefs }): PlannedReminder[] {
  if (!prefs.enabled) return [];
  const days = normalizeSchedule(schedule), log = historyLog(history);
  const planned: PlannedReminder[] = [];
  for (let offset = 0; offset < 28; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = dateKey(date), day = days[weekday(date)];
    const exercises = dayExercises(routine, weekday(date));
    if (!day.on || !exercises.length || log[key] || skips[key]) continue;
    const [hour, minute] = day.time.split(":").map(Number);
    date.setHours(hour, minute, 0, 0);
    if (date <= now) continue;
    const labels = [...new Set(exercises.map((exercise) => exercise.muscle))];
    planned.push({ identifier: `fitmap.plan.${key}`, date, title: "FitMap reminder", body: prefs.private ? "Your planned workout is ready to view." : `${labels.join(" + ")}: ${exercises.length} exercise${exercises.length === 1 ? "" : "s"} planned.`, data: { fitmap: true, date: key, screen: "routine" } });
  }
  return planned;
}
