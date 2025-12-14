import { Stack } from "expo-router";
import { Box } from "@/components/ui/box";

function RootLayout({ children }: { children: React.ReactNode }) {
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
