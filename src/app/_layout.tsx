import TabIcon from "../components/TabIcon";
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
            tabBarIcon: ({ color }) => <TabIcon name="routine" color={color} />,
          }}
        />
        <Tabs.Screen name="plan" options={{ title: "Plan", tabBarIcon: ({ color }) => <TabIcon name="plan" color={color} /> }} />
      </Tabs>
    </>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <FitMapProvider>
        <Navigation />
      </FitMapProvider>
    </SafeAreaProvider>
  );
}
