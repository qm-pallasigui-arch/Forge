import type { Exercise } from './fitness';
import type { Workout } from './workout';
export type SessionPicker = { onAdd: (exercise: Exercise) => void; onDone: () => void; added: number; included: string[]; alsoPlan: boolean; setAlsoPlan: (value: boolean) => void };
export function insertSessionExercise(workout: Workout, exercise: Exercise, after?: string): Workout {
  if (workout.exercises.length >= 200 || workout.exercises.some(e => e.id === exercise.id)) return workout;
  const exercises = [...workout.exercises], index = exercises.findIndex(e => e.id === after);
  exercises.splice(index < 0 ? exercises.length : index + 1, 0, { ...exercise, days: [...exercise.days] });
  return { ...workout, exercises, completed: { ...workout.completed, [exercise.id]: [] } };
}
