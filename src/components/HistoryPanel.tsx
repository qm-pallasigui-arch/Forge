import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFitMap, colors } from '../state/FitMapStore';
import { Choice } from './Controls';
import BodyMap from './BodyMap';
import { sessionMuscles, type Session } from '../shared/sessions';
import { repeatExercises, exerciseChange, fourWeekDots, plannedSets, sessionHighlights, setsDone, weekTotals, weightLifted } from '../shared/history-summary';
const dateLabel=(s:Session)=>new Date(s.endedAt).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const month=(s:Session)=>new Date(s.endedAt).toLocaleDateString(undefined,{month:'long',year:'numeric'});
function Muscles({session,large=false}:{session:Session;large?:boolean}) {
  const muscles=sessionMuscles(session);
  return <View accessible accessibilityLabel={`Muscles: ${muscles.join(', ')}`} style={{height:large?210:100,width:large?'100%':76,flexDirection:'row'}}><View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{flex:1,flexDirection:'row'}}>{(['front','back'] as const).map(view=><BodyMap key={view} staticFigure depth={false} selected={null} view={view} highlighted={muscles} onSelect={()=>{}}/>)}</View></View>;
}
export default function HistoryPanel({selectedId,onSelect,now}:{selectedId:string|null;onSelect:(id:string|null)=>void;now:Date}) {
  const store=useFitMap(),[deleting,setDeleting]=useState(false);
  const session=store.history.find(s=>s.id===selectedId),totals=weekTotals(store.history,now),dots=fourWeekDots(store.history,now),rows=[...store.history].reverse();
  if(session) {
    const repeat=repeatExercises(session,store.routine);
    return <ScrollView contentContainerStyle={s.content}>
      <Choice label="Back to history" onPress={()=>{setDeleting(false);onSelect(null);}}/>
      <Text accessibilityRole="header" style={s.title}>{dateLabel(session)}</Text><Text style={s.heading}>{sessionMuscles(session).join(' + ') || 'Workout'}</Text>
      {!session.migrated&&<Text style={s.text}>{Math.round(session.durationSec/60)} min {'\u00b7'} {setsDone(session)} of {plannedSets(session)} sets{weightLifted(session)>0?` \u00b7 ${weightLifted(session).toLocaleString()} kg lifted`:''}</Text>}
      <Muscles session={session} large/>
      {session.exercises.map(e=><View key={e.entryId} style={s.card}><Text style={s.heading}>{e.name}</Text><Text style={s.text}>{e.setsDone} of {e.plannedSets} sets {'\u00b7'} {e.equipment.toLowerCase()==='bodyweight'?`${e.reps} reps \u00b7 Bodyweight`:`${e.weight} kg \u00d7 ${e.reps}`}</Text><Text style={s.muted}>{exerciseChange(store.history,session,e)}</Text></View>)}
      {sessionHighlights(store.history,session).map(line=><Text key={line} style={[s.text,{color:store.accent}]}>{line}</Text>)}
      {!session.migrated&&<>{repeat.length<session.exercises.length&&<Text style={s.muted}>{session.exercises.length-repeat.length} exercises are no longer in your routine.</Text>}{store.workout?<Choice label="Resume workout" onPress={()=>router.navigate('/workout')}/>:repeat.length>0?<Choice label="Repeat this workout" onPress={()=>{store.startWorkout(repeat);router.navigate('/workout');}}/>:<Text style={s.muted}>Add these exercises to your routine to repeat this workout.</Text>}</>}
      <Choice label="Delete session" onPress={()=>setDeleting(true)}/>
      <Modal visible={deleting} transparent animationType="none" onRequestClose={()=>setDeleting(false)}><View style={s.scrim}><View style={s.card}><Text style={s.heading}>Delete this session?</Text><Text style={s.text}>Its history and summary will be removed. Your routine stays saved.</Text><Choice label="Confirm delete session" onPress={()=>{store.deleteSession(session.id);setDeleting(false);onSelect(null);}}/><Choice label="Keep session" onPress={()=>setDeleting(false)}/></View></View></Modal>
    </ScrollView>;
  }
  return <FlatList data={rows} keyExtractor={s=>s.id} contentContainerStyle={s.content} initialNumToRender={8} windowSize={5} ListHeaderComponent={<View style={{gap:12}}><Text style={s.heading}>This week</Text><Text style={s.text}>{totals.sessions} sessions {'\u00b7'} {totals.sets} sets{totals.weight>0?` \u00b7 ${totals.weight.toLocaleString()} kg lifted`:''}</Text><Text style={s.muted}>Last 28 days</Text><View style={{gap:8}}>{[0,1,2,3].map(row=><View key={row} style={{flexDirection:'row',justifyContent:'space-between'}}>{dots.slice(row*7,row*7+7).map(dot=><View key={dot.date} accessible accessibilityLabel={`${dot.date}: ${dot.filled?'workout logged':'no session'}`} style={{width:20,height:20,borderRadius:10,borderWidth:1,borderColor:store.accent,backgroundColor:dot.filled?store.accent:'transparent'}}/>)}</View>)}</View></View>} ListEmptyComponent={<Text style={s.text}>No workouts yet. Finish a workout and it will show up here.</Text>} renderItem={({item,index})=><View>{(index===0||month(rows[index-1])!==month(item))&&<Text accessibilityRole="header" style={[s.heading,{marginVertical:14}]}>{month(item)}</Text>}<Pressable accessibilityRole="button" accessibilityLabel={`View session ${dateLabel(item)}, ${sessionMuscles(item).join(' + ')}`} onPress={()=>onSelect(item.id)} style={[s.card,{flexDirection:'row',gap:10}]}><View style={{flex:1,gap:8}}><Text style={s.muted}>{dateLabel(item)}</Text><Text style={s.heading}>{sessionMuscles(item).join(' + ') || 'Workout'}</Text>{!item.migrated&&<Text style={s.text}>{item.exercises.length} exercises {'\u00b7'} {setsDone(item)} sets {'\u00b7'} {Math.round(item.durationSec/60)} min</Text>}</View><Muscles session={item}/></Pressable></View>}/>;
}
const s=StyleSheet.create({content:{padding:16,gap:14,paddingBottom:32},title:{color:colors.text,fontSize:24,fontWeight:'800'},heading:{color:colors.text,fontSize:17,fontWeight:'700',flexShrink:1},text:{color:colors.text,fontSize:14,flexShrink:1},muted:{color:colors.muted,fontSize:13,flexShrink:1},card:{padding:16,gap:10,borderRadius:18,backgroundColor:colors.surface,marginBottom:8},scrim:{flex:1,backgroundColor:'#000a',justifyContent:'center',padding:24}});
