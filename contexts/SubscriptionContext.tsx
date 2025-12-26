/**
 * Subscription Context
 *
 * Provides global subscription state management across the app.
 * This context listens to user subscription changes in real-time
 * and provides subscription data and actions to all components.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { auth } from "@/config/firebase";
import {
  UserSubscription,
  SubscriptionConfig,
  SubscriptionPlan,
} from "@/types/subscription";
import {
  getUserSubscription,
  subscribeToUserSubscription,
  getSubscriptionConfig,
  getSubscriptionPlans,
  canUserSwipe,
  getSwipesRemaining,
  incrementSwipeCount,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionSummary,
  checkAndExpireSubscription,
} from "@/services/subscription";
import {
  isSubscriptionExpired,
  getDaysRemaining,
} from "@/types/subscription";

// ============================================================================
// Context Types
// ============================================================================

interface SubscriptionContextValue {
  // Subscription data
  subscription: UserSubscription | null;
  config: SubscriptionConfig | null;
  plans: SubscriptionPlan[];

  // Loading states
  loading: boolean;
  error: Error | null;

  // Swipe management
  canSwipe: boolean;
  swipesRemaining: number;
  swipesUsedToday: number;
  swipesLimit: number;

  // Subscription status
  isPremium: boolean;
  isExpired: boolean;
  isActive: boolean;
  daysRemaining: number;

  // Feature flag
  subscriptionEnabled: boolean;

  // Actions
  checkCanSwipe: () => Promise<boolean>;
  incrementSwipe: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  upgradePlan: (planId: string, transactionId: string) => Promise<void>;
  cancelPlan: () => Promise<void>;

  // Summary
  summary: {
    planName: string;
    isPremium: boolean;
    swipesRemaining: number;
    daysRemaining: number;
    isExpired: boolean;
  } | null;
}

// ============================================================================
// Context Creation
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

// ============================================================================
// Provider Component
// ============================================================================

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState(auth.currentUser);

  // State
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [config, setConfig] = useState<SubscriptionConfig | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [swipesRemaining, setSwipesRemaining] = useState<number>(0);
  const [summary, setSummary] = useState<{
    planName: string;
    isPremium: boolean;
    swipesRemaining: number;
    daysRemaining: number;
    isExpired: boolean;
  } | null>(null);

  // ============================================================================
  // Auth State Listener
  // ============================================================================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================================
  // Initial Load
  // ============================================================================

  useEffect(() => {
    if (!user?.uid) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load config and plans (these don't change often)
        const [configData, plansData] = await Promise.all([
          getSubscriptionConfig(),
          getSubscriptionPlans(),
        ]);

        setConfig(configData);
        setPlans(plansData);

        // Check and expire subscription if needed (BEFORE loading subscription data)
        await checkAndExpireSubscription(user.uid);

        // Load user subscription (will be updated by real-time listener)
        const subscriptionData = await getUserSubscription(user.uid);
        setSubscription(subscriptionData);

        // Load swipes remaining (or set to unlimited if subscriptions disabled)
        if (configData?.subscriptionEnabled !== false) {
          const remaining = await getSwipesRemaining(user.uid);
          setSwipesRemaining(remaining);
        } else {
          setSwipesRemaining(999999); // Unlimited when subscriptions are disabled
        }

        // Load summary
        const summaryData = await getSubscriptionSummary(user.uid);
        setSummary(summaryData);

        setLoading(false);
      } catch (err) {
        console.error("Error loading subscription data:", err);
        setError(err as Error);
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.uid]);

  // ============================================================================
  // Real-time Subscription Listener
  // ============================================================================

  useEffect(() => {
    if (!user?.uid) return;

    console.log("🔔 Setting up real-time subscription listener for user:", user.uid);

    // Subscribe to real-time subscription updates
    const unsubscribe = subscribeToUserSubscription(user.uid, async (updatedSubscription) => {
      console.log("🔔 Real-time update received!");

      if (updatedSubscription) {
        console.log("   • Plan:", updatedSubscription.currentPlan);
        console.log("   • Premium:", updatedSubscription.isPremium);
        console.log("   • Swipe Limit:", updatedSubscription.swipesLimit);
        console.log("   • Swipes Used:", updatedSubscription.swipesUsedToday);
      }

      setSubscription(updatedSubscription);

      // Update swipes remaining when subscription changes
      if (updatedSubscription) {
        const remaining = await getSwipesRemaining(user.uid);
        setSwipesRemaining(remaining);

        // Update summary
        const summaryData = await getSubscriptionSummary(user.uid);
        setSummary(summaryData);
      }
    });

    return () => {
      console.log("🔕 Cleaning up real-time subscription listener");
      unsubscribe();
    };
  }, [user?.uid]);

  // ============================================================================
  // Periodic Expiration Check
  // ============================================================================

  useEffect(() => {
    if (!user?.uid) return;

    // Check for expiration every hour
    const intervalId = setInterval(async () => {
      console.log("🔍 Checking for subscription expiration...");
      const wasExpired = await checkAndExpireSubscription(user.uid);

      if (wasExpired) {
        console.log("⏰ Subscription expired and downgraded");
        // Subscription will be updated via real-time listener
      }
    }, 60 * 60 * 1000); // Check every hour

    // Listen for app state changes (foreground/background)
    // This ensures we check expiration when user returns to app
    const appStateSubscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          console.log("📱 App came to foreground, checking subscription expiration...");
          await checkAndExpireSubscription(user.uid);
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [user?.uid]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Check if subscription feature is enabled
  const subscriptionEnabled = config?.subscriptionEnabled !== false; // Default to true if not set

  // When subscriptions are disabled, everyone has unlimited access
  const isPremium = subscriptionEnabled ? (subscription?.isPremium || false) : false;
  const isExpired = subscriptionEnabled ? (subscription ? isSubscriptionExpired(subscription) : false) : false;
  const isActive = subscriptionEnabled ? (subscription?.isActive || false) : true;
  const daysRemaining = subscriptionEnabled ? (subscription ? getDaysRemaining(subscription) : 0) : 999;
  const swipesUsedToday = subscriptionEnabled ? (subscription?.swipesUsedToday || 0) : 0;
  const swipesLimit = subscriptionEnabled ? (subscription?.swipesLimit || 0) : 999999; // Unlimited when disabled

  // FIXED: Compute canSwipe directly from subscription data instead of swipesRemaining state
  // This prevents the bug where swipesRemaining state is 0 before it's updated
  const canSwipe = subscriptionEnabled
    ? (subscription ? (subscription.swipesUsedToday < subscription.swipesLimit) : false)
    : true; // Always true when disabled

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Check if user can swipe (with latest data from server)
   */
  const checkCanSwipe = async (): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const canSwipeResult = await canUserSwipe(user.uid);

      // Update local state
      const remaining = await getSwipesRemaining(user.uid);
      setSwipesRemaining(remaining);

      return canSwipeResult;
    } catch (err) {
      console.error("Error checking if user can swipe:", err);
      return false;
    }
  };

  /**
   * Increment swipe count after user performs a swipe
   */
  const incrementSwipe = async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      await incrementSwipeCount(user.uid);

      // Update local swipes remaining
      const remaining = await getSwipesRemaining(user.uid);
      setSwipesRemaining(remaining);
    } catch (err) {
      console.error("Error incrementing swipe count:", err);
      throw err;
    }
  };

  /**
   * Manually refresh subscription data from server
   */
  const refreshSubscription = async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      console.log("🔄 Manual refresh subscription called for user:", user.uid);
      setLoading(true);
      const subscriptionData = await getUserSubscription(user.uid);

      if (subscriptionData) {
        console.log("   • Retrieved Plan:", subscriptionData.currentPlan);
        console.log("   • Premium:", subscriptionData.isPremium);
        console.log("   • Swipe Limit:", subscriptionData.swipesLimit);
        console.log("   • Swipes Used Today:", subscriptionData.swipesUsedToday);
      }

      setSubscription(subscriptionData);

      const remaining = await getSwipesRemaining(user.uid);
      setSwipesRemaining(remaining);

      const summaryData = await getSubscriptionSummary(user.uid);
      setSummary(summaryData);

      console.log("✅ Manual refresh completed");
      setLoading(false);
    } catch (err) {
      console.error("❌ Error refreshing subscription:", err);
      setError(err as Error);
      setLoading(false);
    }
  };

  /**
   * Upgrade user to a premium plan after successful payment
   */
  const upgradePlan = async (
    planId: string,
    transactionId: string
  ): Promise<void> => {
    if (!user?.uid) return;

    try {
      const updatedSubscription = await upgradeSubscription(
        user.uid,
        planId as any,
        transactionId
      );

      setSubscription(updatedSubscription);

      const remaining = await getSwipesRemaining(user.uid);
      setSwipesRemaining(remaining);

      const summaryData = await getSubscriptionSummary(user.uid);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error upgrading plan:", err);
      throw err;
    }
  };

  /**
   * Cancel user's subscription (will remain active until end date)
   */
  const cancelPlan = async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      await cancelSubscription(user.uid);
      await refreshSubscription();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      throw err;
    }
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: SubscriptionContextValue = {
    // Data
    subscription,
    config,
    plans,

    // Loading
    loading,
    error,

    // Swipe management
    canSwipe,
    swipesRemaining,
    swipesUsedToday,
    swipesLimit,

    // Status
    isPremium,
    isExpired,
    isActive,
    daysRemaining,

    // Feature flag
    subscriptionEnabled,

    // Actions
    checkCanSwipe,
    incrementSwipe,
    refreshSubscription,
    upgradePlan,
    cancelPlan,

    // Summary
    summary,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access subscription context
 * Must be used within SubscriptionProvider
 */
export const useSubscriptionContext = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);

  if (context === undefined) {
    throw new Error(
      "useSubscriptionContext must be used within a SubscriptionProvider"
    );
  }

  return context;
};
