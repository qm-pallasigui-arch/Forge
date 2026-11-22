import type { Exercise } from "./fitness";
import type { Session, SessionExercise } from './sessions';
import { localDate, weekday } from './sessions';
export const setsDone = (s: Session) => s.exercises.reduce((n,e)=>n+e.setsDone,0);
export const plannedSets = (s: Session) => s.exercises.reduce((n,e)=>n+e.plannedSets,0);
export const weighted = (e: SessionExercise) => e.equipment.toLowerCase()!=='bodyweight' && e.weight>0;
export const weightLifted = (s: Session) => s.exercises.reduce((n,e)=>n+(weighted(e)?e.setsDone*e.reps*e.weight:0),0);
export function weekTotals(history: Session[], now: Date) {
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-weekday(now)),end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+7);
  const sessions=history.filter(s=>s.endedAt>=start.getTime()&&s.endedAt<end.getTime());
  return {sessions:sessions.length,sets:sessions.reduce((n,s)=>n+setsDone(s),0),weight:sessions.reduce((n,s)=>n+weightLifted(s),0)};
}
export function fourWeekDots(history: Session[], now: Date) {
  const dates=new Set(history.map(s=>localDate(new Date(s.endedAt))));
  return Array.from({length:28},(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-27+i);const key=localDate(date);return {date:key,filled:dates.has(key)};});
}
export function previousExercise(history: Session[], sessionId: string, exerciseId: string): SessionExercise | undefined {
  const index=history.findIndex(s=>s.id===sessionId);if(index<0)return;
  for(let i=index-1;i>=0;i--){const e=history[i].exercises.find(e=>e.exerciseId===exerciseId&&e.setsDone>0);if(e)return e;}
}
export function exerciseChange(history: Session[], session: Session, e: SessionExercise) {
  if(!e.setsDone)return 'Not completed';
  const previous=previousExercise(history,session.id,e.exerciseId);if(!previous)return 'First time';
  if(e.equipment.toLowerCase()==='bodyweight')return e.reps===previous.reps?'Same reps':`${e.reps>previous.reps?'+':''}${e.reps-previous.reps} reps`;
  const delta=e.weight-previous.weight;return delta===0?'Same weight':`${delta>0?'+':''}${delta} kg`;
}
export function sessionHighlights(history: Session[], session: Session) {
  const index=history.findIndex(s=>s.id===session.id);if(index<0)return [];
  return session.exercises.filter(e=>e.setsDone>0&&weighted(e)).flatMap(e=>{
    const previous=history.slice(0,index).flatMap(s=>s.exercises.filter(p=>p.exerciseId===e.exerciseId&&p.setsDone>0&&weighted(p)));
    if(!previous.length)return [];const best=Math.max(...previous.map(p=>p.weight));
    return e.weight>best?[`New high: ${e.name} (+${e.weight-best} kg)`]:[];
  }).slice(0,2);
}

export function repeatExercises(session: Session, routine: Exercise[]) { return routine.filter(e=>session.exercises.some(x=>x.exerciseId===e.id)); }
