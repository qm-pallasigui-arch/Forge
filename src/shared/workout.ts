import type { Exercise } from "./fitness";
import { normalizeWeight } from "./weight";
export type Workout = { id: string; startedAt: number; exercises: Exercise[]; completed: Record<string, number[]>; restUntil: number | null; restStartedAt?: number; skipped?: string[]; originalWeights?: Record<string, number>; finishedAt?: number };
export type LastLog = Record<string, { weight: number; reps: number; at: number }>;
export function saveLastLog(previous: LastLog, workout: Workout, at: number): LastLog {
  return { ...previous, ...Object.fromEntries(workout.exercises.filter(e => workout.completed[e.id]?.length).map(e => [e.id, { weight: e.weight, reps: e.reps, at }])) };
}
export function remainingSets(w: Workout) { return w.exercises.reduce((n, e) => n + (w.skipped?.includes(e.id) ? 0 : e.sets - (w.completed[e.id]?.length ?? 0)), 0); }
export function adjustRest(w: Workout, seconds: number, now = Date.now()): Workout {
  if (!w.restUntil || w.restUntil <= now) return w;
  const until = w.restUntil + seconds * 1000;
  return { ...w, restUntil: until > now ? until : null };
}
export function editWorkoutExercise(w: Workout, id: string, patch: Partial<Pick<Exercise, "weight" | "reps" | "progression">>): Workout {
  return { ...w, originalWeights: { ...Object.fromEntries(w.exercises.map(e => [e.id, e.weight])), ...w.originalWeights }, exercises: w.exercises.map(e => e.id === id ? { ...e, ...patch, weight: e.equipment.toLowerCase() === "bodyweight" ? 0 : normalizeWeight(patch.weight ?? e.weight), reps: Math.max(1, Math.min(999, Math.round(patch.reps ?? e.reps))) } : e) };
}
export function newWorkout(exercises: Exercise[], now = Date.now()): Workout {
  return { id: String(now), startedAt: now, exercises: exercises.map((exercise) => ({ ...exercise })), completed: Object.fromEntries(exercises.map((exercise) => [exercise.id, []])), restUntil: null };
}
export function toggleSet(workout: Workout, id: string, index: number, now = Date.now()): Workout {
  const exercise = workout.exercises.find((item) => item.id === id);
  if (!exercise || !Number.isInteger(index) || index < 0 || index >= exercise.sets) return workout;
  const previous = workout.completed[id] ?? [], checked = previous.includes(index);
  const next = { ...workout, ...(workout.skipped ? { skipped: workout.skipped.filter(key => key !== id) } : {}), completed: { ...workout.completed, [id]: checked ? previous.filter((value) => value !== index) : [...previous, index] } };
  return { ...next, restUntil: checked || !remainingSets(next) ? null : now + 90000, ...(!checked && remainingSets(next) ? { restStartedAt: now } : {}) };
}
export function progressRoutine(routine: Exercise[], workout: Workout): Exercise[] {
  return routine.map((exercise) => {
    const planned = workout.exercises.find((item) => item.id === exercise.id);
    if (!planned || exercise.equipment.toLowerCase() === "bodyweight" || (workout.completed[exercise.id]?.length ?? 0) !== planned.sets) return exercise;
    // Preserve deliberate weight edits made while this session was running.
    if (exercise.weight !== (workout.originalWeights?.[exercise.id] ?? planned.weight)) return exercise;
    return { ...exercise, weight: normalizeWeight(planned.weight + planned.progression), reps: planned.reps };
  });
}
export function completedSets(workout: Workout) { return Object.values(workout.completed).reduce((sum, sets) => sum + sets.length, 0); }
export function parseWorkout(value: unknown): Workout | null {
  if (!value || typeof value !== "object") return null;
  const w = value as Workout;
  if (typeof w.id !== "string" || !Number.isFinite(w.startedAt) || !Array.isArray(w.exercises) || !w.exercises.length || w.exercises.length > 200 || !w.completed || typeof w.completed !== "object") return null;
  if (!w.exercises.every((e) => e && [e.id,e.name,e.muscle,e.equipment].every((v) => typeof v === "string") && Number.isInteger(e.sets) && e.sets > 0 && e.sets <= 100 && Number.isInteger(e.reps) && e.reps > 0 && Number.isFinite(e.weight) && e.weight >= 0 && Number.isFinite(e.progression) && e.progression >= 0)) return null;
  if (new Set(w.exercises.map((e) => e.id)).size !== w.exercises.length) return null;
  const completed = Object.fromEntries(w.exercises.map((e) => [e.id, [...new Set((Array.isArray(w.completed[e.id]) ? w.completed[e.id] : []).filter((i) => Number.isInteger(i) && i >= 0 && i < e.sets))]]));
  return { id: w.id, startedAt: w.startedAt, exercises: w.exercises, completed, restUntil: typeof w.restUntil === "number" && Number.isFinite(w.restUntil) ? w.restUntil : null, ...(Number.isFinite(w.restStartedAt) ? { restStartedAt: w.restStartedAt } : {}), ...(Array.isArray(w.skipped) ? { skipped: [...new Set(w.skipped.filter(id => w.exercises.some(e => e.id === id)))] } : {}), ...(w.originalWeights && typeof w.originalWeights === "object" ? { originalWeights: Object.fromEntries(Object.entries(w.originalWeights).filter(([, n]) => Number.isFinite(n) && n >= 0 && n <= 999)) } : {}), ...(typeof w.finishedAt === "number" && Number.isFinite(w.finishedAt) ? { finishedAt: w.finishedAt } : {}) };
}
