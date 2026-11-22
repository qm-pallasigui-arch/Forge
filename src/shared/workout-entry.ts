import type { Exercise } from './fitness';
import type { Workout } from './workout';
import type { Schedule } from '../notify/scheduler';
import { localDate, weekday, type Session } from './sessions';
export function workoutEntryState({routine,schedule,history,workout,now}: {routine:Exercise[];schedule:Schedule;history:Session[];workout:Workout|null;now:Date}) {
  const day=weekday(now),planned=schedule[day]?.on ? routine.filter(e=>e.days.includes(day)) : [];
  const exercises=planned.length?planned:routine;
  const today=history.filter(s=>localDate(new Date(s.endedAt))===localDate(now));
  const latest=today[today.length-1];
  const kind=workout?'running':!exercises.length?'empty':latest?'logged':'planned';
  const label=kind==='running'?'Resume workout':kind==='logged'?'Start another workout':'Start workout';
  return {kind,label,exercises,planned,latest,minutes:Math.round(today.reduce((n,s)=>n+s.durationSec,0)/60),day};
}
