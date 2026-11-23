import type { Exercise } from './fitness';
import type { Schedule } from '../notify/scheduler';
import { workoutEntryState } from './workout-entry';
import { localDate, weekday } from './sessions';

export function weekDates(now: Date, offset = 0) {
  return Array.from({ length: 7 }, (_, day) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday(now) + offset * 7 + day, 12));
}
export function todayCard(input: Parameters<typeof workoutEntryState>[0]) {
  const entry = workoutEntryState(input);
  const sessions = input.history.filter(s => localDate(new Date(s.endedAt)) === localDate(input.now));
  const kind = input.workout ? 'running' : sessions.length ? 'done' : entry.planned.length ? 'planned' : 'empty';
  return { ...entry, kind, sessions: sessions.length };
}
// Copy replaces only the destination's membership and reminder settings.
// Prescriptions are shared by exercise; active sessions and history are untouched.
export function copyDay(routine: Exercise[], schedule: Schedule, source: number, destination: number) {
  if (![source, destination].every(d => Number.isInteger(d) && d >= 0 && d < 7) || source === destination) return { routine, schedule };
  return {
    routine: routine.map(e => ({ ...e, days: [...e.days.filter(d => d !== destination), ...(e.days.includes(source) ? [destination] : [])].sort() })),
    schedule: schedule.map((p, i) => i === destination ? { ...schedule[source] } : p),
  };
}
