import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";
import { Box } from "@/components/ui/box";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      screenLayout={({ children }) => (
        <Box className="flex-1 bg-background-0">{children}</Box>
      )}
      backBehavior="history"
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{animation: "fade", sceneStyle:{backgroundColor: "transparent"}}}/>
      <Tabs.Screen name="matches" options={{animation: "fade", sceneStyle:{backgroundColor: "transparent"}}}/>
      <Tabs.Screen name="chats" options={{animation: "fade", sceneStyle:{backgroundColor: "transparent"}}}/>
      <Tabs.Screen name="profile" options={{animation: "fade", sceneStyle:{backgroundColor: "transparent"}}}/>
    </Tabs>
  );
}
