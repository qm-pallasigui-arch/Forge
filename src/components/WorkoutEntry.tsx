import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Exercise } from '../shared/fitness';
import { colors, useFitMap } from '../state/FitMapStore';
import { GuideTarget, useExperience } from '../state/Experience';
import { workoutEntryState } from '../shared/workout-entry';
export default function WorkoutEntry({ exercises, pill = false }: { exercises?: Exercise[]; pill?: boolean }) {
  const store=useFitMap(),ux=useExperience(),[now,setNow]=useState(()=>new Date());
  useEffect(()=>{const refresh=()=>setNow(new Date());const timer=setInterval(refresh,60000),listener=AppState.addEventListener('change',refresh);return()=>{clearInterval(timer);listener.remove();};},[]);
  const entry=workoutEntryState({...store,now}),selected=exercises??entry.exercises;
  if(!store.workout&&!selected.length)return null;
  const start=(items:Exercise[])=>{store.startWorkout(items);ux.mark('start');router.navigate('/workout');};
  const label=pill&&entry.kind==='planned'?`${entry.label} \u00b7 ${selected.length} ${selected.length === 1 ? "exercise" : "exercises"}`:entry.label;
  return <View><GuideTarget name="start"><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={()=>start(selected)} style={{minHeight:48,borderRadius:24,padding:12,backgroundColor:store.accent,alignItems:'center',justifyContent:'center'}}><Text style={{color:colors.background,fontWeight:'700'}}>{label}</Text></Pressable></GuideTarget>{!pill&&!store.workout&&selected.length<store.routine.length&&<Pressable accessibilityRole="button" onPress={()=>start(store.routine)} style={{minHeight:44,borderWidth:1,borderColor:colors.border,borderRadius:16,justifyContent:'center',alignItems:'center'}}><Text style={{color:colors.text}}>Whole routine</Text></Pressable>}</View>;
}
