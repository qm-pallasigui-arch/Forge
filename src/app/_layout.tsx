import { ExperienceProvider, ExperienceSurface, TourTarget } from "../state/Experience";
import TabIcon from "../components/TabIcon";
import { ReminderProvider } from "../notify/useReminders";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FitMapProvider, colors, useFitMap } from "../state/FitMapStore";

function Navigation() {
  const store = useFitMap();
  if (!store.ready)
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={store.accent} accessibilityLabel="Loading saved workouts" />
      </View>
    );
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: store.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarBadgeStyle: { backgroundColor: store.accent, color: "#101215" },
          tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Body",
            tabBarIcon: ({ color }) => <TabIcon name="body" color={color} />,
          }}
        />
        <Tabs.Screen
          name="routine"
          options={{
            title: "Routine",
            tabBarBadge: store.routine.length || undefined,
            tabBarIcon: ({ color }) => <TourTarget name="routine" style={{ minWidth: 52, minHeight: 36, alignItems: "center", justifyContent: "center" }}><TabIcon name="routine" color={color} /></TourTarget>,
          }}
        />
        <Tabs.Screen name="plan" options={{ title: "Plan", tabBarIcon: ({ color }) => <TabIcon name="plan" color={color} /> }} />
        <Tabs.Screen name="workout" options={{ tabBarStyle: { display: "none" }, tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
        <Tabs.Screen name="backup" options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }} />
      </Tabs>
    </>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <FitMapProvider>
        <ExperienceProvider><ReminderProvider><ExperienceSurface><Navigation /></ExperienceSurface></ReminderProvider></ExperienceProvider>
      </FitMapProvider>
    </SafeAreaProvider>
  );
}
