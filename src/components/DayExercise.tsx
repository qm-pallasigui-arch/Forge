import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { Exercise } from '../shared/fitness';
import { createSwipeGesture } from '../shared/gestures';
import { colors, useFitMap } from '../state/FitMapStore';
import { useExperience } from '../state/Experience';
import { Choice, Stepper } from './Controls';
import WeightControl from './WeightControl';
export default function DayExercise({ exercise: e, day }: { exercise: Exercise; day: number }) {
  const store = useFitMap(), ux = useExperience();
  const [expanded, setExpanded] = useState(false), [confirm, setConfirm] = useState(false), [swipe] = useState(createSwipeGesture);
  const erase = () => { const plan = store.schedule[day]; store.assignDay(e.id, day, false); ux.notify('Exercise removed from day', 'Undo', () => { store.assignDay(e.id, day, true); store.setDayPlan(day, plan); }); setConfirm(false); };
  useEffect(() => { swipe.update(() => {}, erase); });
  return <View {...swipe.handlers} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, gap: 10 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${e.name}`} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, gap: 5 }}><Text style={{ color: colors.text, fontWeight: '700' }}>{e.name}</Text><Text style={{ color: colors.muted }}>{e.sets} × {e.reps}{e.equipment.toLowerCase() !== 'bodyweight' ? ` · ${e.weight} kg` : ''} · {e.muscle}</Text></Pressable>
    {expanded && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}><Stepper label="Sets" value={e.sets} onChange={sets => store.update({ ...e, sets })}/><Stepper label="Reps" value={e.reps} onChange={reps => store.update({ ...e, reps })}/></View><WeightControl exercise={e}/><Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={{ minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10 }}><Text style={{ color: '#ff9687' }}>Remove {e.name}</Text></Pressable></>}
    <Modal visible={confirm} transparent onRequestClose={() => setConfirm(false)}><View style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 24 }}><View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 20, gap: 12 }}><Text style={{ color: colors.text }}>Remove {e.name} from this day?</Text><Choice label="Confirm remove" destructive onPress={erase}/><Choice label="Keep exercise" onPress={() => setConfirm(false)}/></View></View></Modal>
  </View>;
}
