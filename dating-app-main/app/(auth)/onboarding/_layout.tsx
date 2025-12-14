import React from "react";
import { Stack } from "expo-router";
import { Box } from "@/components/ui/box";

const layout = () => {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      screenLayout={({ children }) => (
        <Box className="flex-1 bg-background-0">{children}</Box>
      )}
    >
      <Stack.Screen name="dob" />
      <Stack.Screen name="done" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="interest" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="looking-for" />
      <Stack.Screen name="name" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="pictures" />
      <Stack.Screen name="profile-answers" />
      <Stack.Screen name="verified" />
    </Stack>
  );
};

export default layout;
