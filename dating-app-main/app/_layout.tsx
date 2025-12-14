import "@/global.css";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { BottomSheetModalProvider } from "@/components/shared/bottom-sheet";
import { SplashScreen } from "@/components/shared/splash-screen";

// Prevent native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const colorMode = "dark" as "light" | "dark";

  useEffect(() => {
    // Hide the native splash screen immediately
    SplashScreenExpo.hideAsync();

    // Simulate loading time - replace with actual initialization logic
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1800); // Show splash screen for 1.8 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GluestackUIProvider mode={colorMode}>
      <StatusBar
        barStyle={colorMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorMode === "light" ? "#fff" : "#121212"}
      />
      <SafeAreaView className="flex-1 bg-background-0">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <Slot />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaView>
    </GluestackUIProvider>
  );
}
