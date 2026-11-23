import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistoryPanel from '../components/HistoryPanel';
import { colors } from '../state/FitMapStore';
export default function HistoryScreen() {
  const { session } = useLocalSearchParams<{ session?: string }>();
  const [selected, setSelected] = useState<string | null>(session ?? null);
  const [previous, setPrevious] = useState(session);
  if (previous !== session) { setPrevious(session); setSelected(session ?? null); }
  return <SafeAreaView edges={['left','right']} style={{ flex: 1, backgroundColor: colors.background }}><View style={{ padding: 16, gap: 6 }}><Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>History</Text><Text style={{ color: colors.muted }}>Review your past workouts.</Text></View><HistoryPanel selectedId={selected} onSelect={setSelected} now={new Date()} /></SafeAreaView>;
}
