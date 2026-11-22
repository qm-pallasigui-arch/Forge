import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Choice } from "../components/Controls";
import { colors, useFitMap } from "../state/FitMapStore";
import type { State } from "../state/persistence";
import { exportBackup, importBackup } from "../shared/backup";
import { pickBackup, saveBackup } from "../shared/backup-files";
export default function BackupScreen() {
  const store = useFitMap();
  const [pending, setPending] = useState<State | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => { if (busy) return; setBusy(true); setMessage(""); try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "Backup operation failed."); } finally { setBusy(false); } };
  return <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
    <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>Backup and restore</Text>
    <Choice label="Back to Body" onPress={() => router.navigate("/")} />
    <Text style={{ color: colors.muted }}>Save your routine, notes, plans, activity log, workout history, current session and preferences as a JSON file. Guide progress stays on this device.</Text>
    <Text style={{ color: colors.muted }}>Backups contain your workout details and notes. Store your file somewhere private, outside this app.</Text>
    {!busy && <><Choice label="Export JSON backup" onPress={() => void run(async () => { await saveBackup(exportBackup(store.exportState())); setMessage("Export opened. Keep the saved file somewhere you can access on your next phone."); })} /><Choice label="Choose backup to import" onPress={() => void run(async () => { setPending(null); const text = await pickBackup(); if (text !== null) setPending(importBackup(text)); })} /></>}
    {busy && <Text style={{ color: colors.text }}>Working...</Text>}
    {!!message && <Text accessibilityRole="alert" style={{ color: colors.text }}>{message}</Text>}
    {!!store.error && <Text accessibilityRole="alert" style={{ color: "#ff9a89" }}>{store.error}</Text>}
    {pending && <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 16 }}>
      <Text style={{ color: colors.text }}>Ready to import: {pending.routine.length} exercises, {Object.keys(pending.notes).length} notes, {pending.history.length} completed sessions{pending.workout ? ", plus an active workout" : ""}.</Text>
      <Text style={{ color: colors.text }}>This replaces your current workout data, including any active session. Export a backup first if you want to keep it. Reminders will be switched off; enable them again in Plan.</Text>
      <Choice label="Replace local data" onPress={() => { store.importState(pending); setPending(null); setMessage("Backup restored. Enable reminders in Plan when ready."); }} />
      <Choice label="Cancel import" onPress={() => setPending(null)} />
    </View>}
  </ScrollView>;
}
