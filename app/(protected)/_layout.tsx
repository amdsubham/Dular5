import { Stack } from "expo-router";
import { Box } from "@/components/ui/box";
import { useNotifications } from "@/hooks/useNotifications";
import { usePresenceTracking } from "@/hooks/usePresence";

function RootLayout({ children }: { children: React.ReactNode }) {
  // Setup push notifications
  useNotifications();

  // Setup presence tracking
  usePresenceTracking();

  return (
    <Box className="flex flex-col flex-1 w-screen bg-background-0">
      {children}
    </Box>
  );
}

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      screenLayout={({ children }) => <RootLayout>{children}</RootLayout>}
    >
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="messages/[id]" />
    </Stack>
  );
}
