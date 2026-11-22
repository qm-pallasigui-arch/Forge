import type { Exercise } from './fitness';
import type { Workout } from './workout';
import { names } from './body-artwork';
export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const weekday = (date: Date) => (date.getDay() + 6) % 7;
export const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export type SessionExercise = { entryId: string; exerciseId: string; name: string; muscle: string; equipment: string; plannedSets: number; setsDone: number; reps: number; weight: number };
export type Session = { id: string; startedAt: number; endedAt: number; durationSec: number; weekday: number; exercises: SessionExercise[]; migrated?: true; muscles?: string[] };
export function finishSession(w: Workout, endedAt: number): Session {
  return { id: w.id, startedAt: w.startedAt, endedAt, durationSec: Math.max(0, Math.floor((endedAt-w.startedAt)/1000)), weekday: weekday(new Date(w.startedAt)), exercises: w.exercises.map(e => ({entryId:e.id,exerciseId:e.id,name:e.name,muscle:e.muscle,equipment:e.equipment,plannedSets:e.sets,setsDone:w.completed[e.id]?.length ?? 0,reps:e.reps,weight:e.equipment.toLowerCase()==='bodyweight'?0:e.weight})) };
}
const finite = (n: unknown): n is number => typeof n==='number' && Number.isFinite(n) && n>=0;
function validSession(s: Session): boolean {
  return !!s && typeof s.id==='string' && !!s.id && finite(s.startedAt) && finite(s.endedAt) && s.endedAt>=s.startedAt && finite(s.durationSec) && Number.isInteger(s.durationSec) && Number.isInteger(s.weekday) && s.weekday>=0 && s.weekday<=6 && Array.isArray(s.exercises) && s.exercises.length<=200 && new Set(s.exercises.map(e=>e?.entryId)).size===s.exercises.length && (s.migrated===undefined || (s.migrated===true && s.exercises.length===0 && s.durationSec===0 && Array.isArray(s.muscles) && s.muscles.every(m=>typeof m==='string'))) && s.exercises.every(e=>!!e && [e.entryId,e.exerciseId,e.name,e.muscle,e.equipment].every(x=>typeof x==='string' && x.length>0) && Number.isInteger(e.plannedSets) && e.plannedSets>0 && e.plannedSets<=100 && Number.isInteger(e.setsDone) && e.setsDone>=0 && e.setsDone<=e.plannedSets && Number.isInteger(e.reps) && e.reps>0 && e.reps<=999 && finite(e.weight) && e.weight<=999 && (e.equipment.toLowerCase()!=='bodyweight' || e.weight===0));
}
export function validateHistory(value: unknown): Session[] {
  try { if (!Array.isArray(value) || !value.every(validSession) || new Set(value.map(s=>s.id)).size!==value.length) return []; return value.map(s=>({...s,exercises:s.exercises.map((e: SessionExercise)=>({...e})),...(s.muscles?{muscles:[...s.muscles]}:{})})).sort((a,b)=>a.endedAt-b.endedAt).slice(-1000); } catch { return []; }
}
export function sessionMuscles(s: Session) { return s.migrated ? s.muscles ?? [] : [...new Set(s.exercises.filter(e=>e.setsDone>0).map(e=>e.muscle))]; }
export function historyLog(history: Session[]) {
  const log: Record<string,{at:number;muscles:string[]}> = {};
  for(const s of history) { const key=localDate(new Date(s.endedAt)); const ids=Object.keys(names).filter(id=>sessionMuscles(s).includes(names[id])); log[key]={at:s.endedAt,muscles:[...new Set([...(log[key]?.muscles??[]),...ids])]}; }
  return log;
}
export function lastExerciseLog(history: Session[]) { const log: Record<string,{weight:number;reps:number;at:number}>={}; for(const s of history) for(const e of s.exercises) if(e.setsDone) log[e.exerciseId]={weight:e.weight,reps:e.reps,at:s.endedAt}; return log; }
export function migrateHistory(oldHistory: unknown, oldLog: unknown): Session[] {
  if(!Array.isArray(oldHistory)) return [];
  try {
    const sessions: Session[]=oldHistory.map((w: Workout | Session) => 'endedAt' in w ? w : finishSession(w, w.finishedAt!));
    if(sessions.length && !validateHistory(sessions).length)return [];
    const dates=new Set(sessions.map(s=>localDate(new Date(s.endedAt))));
    if(oldLog && typeof oldLog==='object') for(const [date,value] of Object.entries(oldLog)) { const row=value as {at:number;muscles:string[]}; const d=new Date(`${date}T12:00:00`); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||localDate(d)!==date||!row||!Array.isArray(row.muscles)||!finite(row.at))continue; if(dates.has(date))continue; const at=localDate(new Date(row.at))===date?row.at:d.getTime(); sessions.push({id:`migrated-${date}`,startedAt:at,endedAt:at,durationSec:0,weekday:weekday(d),exercises:[],migrated:true,muscles:row.muscles.filter(id=>Object.hasOwn(names,id)).map(id=>names[id])}); }
    return validateHistory(sessions);
  } catch {return [];}
}
export function migrateRoutineDays(routine: Exercise[], schedule: unknown): Exercise[] {
  return routine.map(e=>({...e,days:Array.isArray(e.days)?[...new Set(e.days.filter(d=>Number.isInteger(d)&&d>=0&&d<7))].sort():Array.from({length:7},(_,day)=>day).filter(day=>{const old=Array.isArray(schedule)?schedule[(day+1)%7]:undefined;return old?.muscles?.some((id:string)=>names[id]===e.muscle || id===e.muscle);})}));
}
