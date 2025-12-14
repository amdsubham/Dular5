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
    // Track app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        sessionStartTime.current = new Date();
        await analytics.trackSessionStart();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        if (sessionStartTime.current) {
          const sessionDuration = new Date().getTime() - sessionStartTime.current.getTime();
          await analytics.trackSessionEnd(Math.floor(sessionDuration / 1000)); // Duration in seconds
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
