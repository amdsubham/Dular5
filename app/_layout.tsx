import "@/global.css";
import "@/config/firebase"; // Initialize Firebase
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { BottomSheetModalProvider } from "@/components/shared/bottom-sheet";
import { SplashScreen } from "@/components/shared/splash-screen";
import { FilterProvider } from "@/contexts/FilterContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

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
    // Filter out informational logs and known warnings
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress the reCAPTCHA Enterprise fallback message (it's just informational)
      if (message.includes('Failed to initialize reCAPTCHA Enterprise config')) {
        return;
      }
      originalLog(...args);
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress known Expo Go limitations warnings
      if (
        message.includes('No native ExponentConstants module found') ||
        message.includes('No native ExpoFirebaseCore module found') ||
        message.includes('expo-notifications') && message.includes('not fully supported in Expo Go')
      ) {
        return;
      }
      originalWarn(...args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress expo-notifications Expo Go error (it's expected)
      if (
        message.includes('expo-notifications') && message.includes('removed from Expo Go')
      ) {
        return;
      }
      originalError(...args);
    };

    // Hide the native splash screen immediately
    SplashScreenExpo.hideAsync();

    // Simulate loading time - replace with actual initialization logic
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 3000); // Show splash screen for 3 seconds

    return () => {
      clearTimeout(timer);
      // Restore original console methods
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GluestackUIProvider mode={colorMode}>
      <AnalyticsProvider>
        <FilterProvider>
          <NotificationProvider>
            <SubscriptionProvider>
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
            </SubscriptionProvider>
          </NotificationProvider>
        </FilterProvider>
      </AnalyticsProvider>
    </GluestackUIProvider>
  );
}
