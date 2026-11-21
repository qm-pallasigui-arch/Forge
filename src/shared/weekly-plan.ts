import type { Exercise } from "./fitness";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export type WeeklyPlan = Record<string, string[]>;

export function parseWeeklyPlan(value: unknown): WeeklyPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([day]) => /^[0-6]$/.test(day)).map(([day, muscles]) => [day,
    Array.isArray(muscles) ? [...new Set(muscles.filter((m): m is string => typeof m === "string" && m.length > 0 && m.length < 80))] : [],
  ]));
}

export function exercisesForDay(routine: Exercise[], plan: WeeklyPlan, day: number) {
  return routine.filter((exercise) => (plan[String(day)] ?? []).includes(exercise.muscle));
}
