import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { auth } from '@/config/firebase';
import { analytics } from '@/services/analytics';
import { onAuthStateChanged } from 'firebase/auth';

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackScreen: (screenName: string, properties?: Record<string, any>) => Promise<void>;
  updateUserProperties: (properties: Record<string, any>) => Promise<void>;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionStartTime = useRef<Date | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastSessionEventTime = useRef<number>(0);

  // Throttle session events to max once per 5 minutes to reduce costs
  const SESSION_THROTTLE_MS = 5 * 60 * 1000;

  useEffect(() => {
    // Initialize analytics on mount
    const initAnalytics = async () => {
      try {
        await analytics.initialize();
        setIsInitialized(true);

        // Track session start
        sessionStartTime.current = new Date();
        await analytics.trackSessionStart();
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initAnalytics();
  }, []);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        await analytics.identifyUser(user.uid, {
          phone: user.phoneNumber,
          email: user.email,
          signInMethod: user.providerData[0]?.providerId,
        });
      } else {
        // User is signed out - reset analytics
        if (isInitialized) {
          await analytics.trackLogout('unknown');
        }
      }
    });

    return () => unsubscribe();
  }, [isInitialized]);

  useEffect(() => {
    // Track app state changes (foreground/background) with throttling
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const now = Date.now();
      const timeSinceLastEvent = now - lastSessionEventTime.current;

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        // Only track if enough time has passed (5 minutes) or first session
        if (timeSinceLastEvent >= SESSION_THROTTLE_MS || lastSessionEventTime.current === 0) {
          sessionStartTime.current = new Date();
          lastSessionEventTime.current = now;
          await analytics.trackSessionStart();
          console.log('✅ Session start tracked (throttled)');
        } else {
          console.log(`⏭️  Session start skipped - throttled (${Math.floor(timeSinceLastEvent / 1000)}s since last event)`);
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        if (sessionStartTime.current) {
          const sessionDuration = new Date().getTime() - sessionStartTime.current.getTime();
          // Only track if session was at least 10 seconds (avoid quick app switches)
          if (sessionDuration >= 10000) {
            await analytics.trackSessionEnd(Math.floor(sessionDuration / 1000));
            console.log(`✅ Session end tracked (${Math.floor(sessionDuration / 1000)}s)`);
          } else {
            console.log(`⏭️  Session end skipped - too short (${Math.floor(sessionDuration / 1000)}s)`);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionStartTime.current) {
        const sessionDuration = new Date().getTime() - sessionStartTime.current.getTime();
        analytics.trackSessionEnd(Math.floor(sessionDuration / 1000));
      }
    };
  }, []);

  const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
    if (!isInitialized) {
      console.warn('Analytics not initialized yet');
      return;
    }
    await analytics.track(eventName, properties);
  };

  const trackScreen = async (screenName: string, properties?: Record<string, any>) => {
    if (!isInitialized) {
      console.warn('Analytics not initialized yet');
      return;
    }
    await analytics.trackScreen(screenName, properties);
  };

  const updateUserProperties = async (properties: Record<string, any>) => {
    if (!isInitialized) {
      console.warn('Analytics not initialized yet');
      return;
    }
    await analytics.updateUserProperties(properties);
  };

  const value: AnalyticsContextType = {
    trackEvent,
    trackScreen,
    updateUserProperties,
    isInitialized,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Custom hook to track screen views automatically
export function useScreenTracking(screenName: string, properties?: Record<string, any>) {
  const { trackScreen, isInitialized } = useAnalytics();

  useEffect(() => {
    if (isInitialized) {
      trackScreen(screenName, properties);
    }
  }, [screenName, isInitialized]);
}
