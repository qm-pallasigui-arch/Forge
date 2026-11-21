import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { router } from "expo-router";
import { useFitMap } from "../state/FitMapStore";
import { dateKey, dayExercises, planReminders } from "./scheduler";
import { CHANNEL, loadNotifications, reminderData, scheduleOne, type NotificationAPI } from "./platform";

function useReminders() {
  const { ready, routine, schedule, log, skips, reminders, setReminders, skipDay } = useFitMap();
  const [api, setAPI] = useState<NotificationAPI | null>(null);
  const [permission, setPermission] = useState("unknown");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, refresh] = useState(0);
  const queue = useRef(Promise.resolve());
  const processed = useRef(new Set<string>());
  const lastContent = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let alive = true;
    loadNotifications().then(async (module) => {
      const status = await module.getPermissionsAsync();
      if (alive) { setAPI(module); setPermission(status.status); }
    }).catch(() => { if (alive) setError("Install the updated FitMap development APK to use reminders."); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refresh((value) => value + 1);
      if (api) void api.getPermissionsAsync().then((value) => setPermission(value.status)).catch(() => setError("Could not read notification permission."));
    });
    return () => subscription.remove();
  }, [api]);
  useEffect(() => {
    if (!ready || !api) return;
    let obsolete = false;
    queue.current = queue.current.catch(() => {}).then(async () => {
      if (obsolete) return;
      const content = JSON.stringify({ routine, schedule, reminders });
      const contentChanged = lastContent.current !== null && lastContent.current !== content;
      const planned = planReminders({ now: new Date(), routine, schedule, log, skips, prefs: { ...reminders, enabled: reminders.enabled && permission === "granted" } });
      const existing = await api.getAllScheduledNotificationsAsync();
      for (const item of existing) {
        const data = reminderData(item.content.data);
        if (item.identifier.startsWith("fitmap.plan.") || (item.identifier.startsWith("fitmap.snooze.") && (contentChanged || !reminders.enabled || permission !== "granted" || !data || log[data.date] || skips[data.date]))) await api.cancelScheduledNotificationAsync(item.identifier);
      }
      for (const item of planned) { if (obsolete) break; await scheduleOne(api, item); }
      if (!obsolete) { lastContent.current = content; setError(null); }
    }).catch(() => setError("Could not update reminders. Open Plan and try again."));
    return () => { obsolete = true; };
  }, [api, ready, routine, schedule, log, skips, reminders, permission, revision]);
  useEffect(() => {
    if (!api || !ready) return;
    const handle: Parameters<NotificationAPI["addNotificationResponseReceivedListener"]>[0] = (response) => {
      const request = response.notification.request, data = reminderData(request.content.data);
      if (!data) return;
      const key = `${request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
      if (processed.current.has(key)) return;
      processed.current.add(key);
      api.clearLastNotificationResponse();
      if (response.actionIdentifier === "skip") {
        skipDay(data.date);
        router.navigate("/plan");
      } else if (response.actionIdentifier === "snooze") {
        router.navigate("/plan");
        if (!reminders.enabled || log[data.date] || skips[data.date] || data.date !== dateKey(new Date())) return;
        const exercises = dayExercises(routine, schedule[new Date().getDay()]);
        if (!exercises.length) return;
        const labels = [...new Set(exercises.map((exercise) => exercise.muscle))];
        const body = reminders.private ? "Your planned workout is ready to view." : `${labels.join(" + ")}: ${exercises.length} exercise${exercises.length === 1 ? "" : "s"} planned.`;
        queue.current = queue.current.catch(() => {}).then(async () => {
          await api.scheduleNotificationAsync({ identifier: `fitmap.snooze.${data.date}`, content: { title: "FitMap reminder", body, data: { fitmap: true, date: data.date, screen: "routine" }, categoryIdentifier: "fitmap-workout", sound: "default" }, trigger: { type: api.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600, channelId: CHANNEL } });
        }).catch(() => setError("Could not snooze this reminder."));
      } else router.navigate(data.screen === "plan" ? "/plan" : "/routine");
    };
    const subscription = api.addNotificationResponseReceivedListener(handle);
    const last = api.getLastNotificationResponse();
    if (last) handle(last);
    return () => subscription.remove();
  }, [api, ready, skipDay, log, skips, reminders, routine, schedule]);
  const enable = async (enabled: boolean) => {
    if (busy) return;
    if (!enabled) { setReminders({ ...reminders, enabled: false }); return; }
    if (!api) return;
    setBusy(true);
    try {
      let status = await api.getPermissionsAsync();
      if (!status.granted && status.canAskAgain) status = await api.requestPermissionsAsync();
      setPermission(status.status);
      setReminders({ ...reminders, enabled: status.granted });
      setError(null);
    } catch { setError("Could not enable reminders. Please try again."); }
    finally { setBusy(false); }
  };
  const test = async () => {
    if (!api || permission !== "granted" || busy) return;
    setBusy(true);
    try {
      await api.scheduleNotificationAsync({ identifier: "fitmap.test", content: { title: "FitMap test", body: "Local notifications are working.", data: { fitmap: true, date: dateKey(new Date()), screen: "plan" }, sound: "default" }, trigger: { type: api.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL } });
      setError(null);
      return true;
    } catch { setError("Could not send the test notification."); }
    finally { setBusy(false); }
  };
  return { available: !!api, permission, error, busy, enable, test, retry: () => refresh((value) => value + 1) };
}
const Context = createContext<ReturnType<typeof useReminders> | null>(null);
export function ReminderProvider({ children }: { children: ReactNode }) {
  const value = useReminders();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useReminderControls() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing ReminderProvider");
  return value;
}
