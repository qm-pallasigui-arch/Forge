import { Platform } from "react-native";
import type * as Notifications from "expo-notifications";
import { validDateKey, type PlannedReminder } from "./scheduler";

export const CHANNEL = "fitmap-workouts";
export type NotificationAPI = typeof Notifications;
export async function loadNotifications(): Promise<NotificationAPI> {
  if (Platform.OS === "web") throw new Error("Notifications require the Android app.");
  const api = await import("expo-notifications");
  api.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  if (Platform.OS === "android") await api.setNotificationChannelAsync(CHANNEL, { name: "Workout reminders", importance: api.AndroidImportance.DEFAULT });
  await api.setNotificationCategoryAsync("fitmap-workout", [
    { identifier: "snooze", buttonTitle: "Snooze 10 min", options: { opensAppToForeground: true } },
    { identifier: "skip", buttonTitle: "Skip today", options: { opensAppToForeground: true } },
  ]);
  return api;
}
export function reminderData(data: Record<string, unknown> | undefined) {
  return data?.fitmap === true && validDateKey(data.date) ? { date: data.date, screen: data.screen === "plan" ? "plan" as const : "routine" as const } : null;
}
export async function scheduleOne(api: NotificationAPI, reminder: PlannedReminder) {
  await api.scheduleNotificationAsync({ identifier: reminder.identifier, content: { title: reminder.title, body: reminder.body, data: reminder.data, categoryIdentifier: "fitmap-workout", sound: "default" }, trigger: { type: api.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL } });
}
