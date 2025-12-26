/**
 * useSubscription Hook
 *
 * A convenience hook that wraps the SubscriptionContext
 * and provides additional utilities for components.
 */

import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { UseSubscriptionReturn } from "@/types/subscription";

/**
 * Hook to access subscription data and actions
 *
 * @returns Subscription state and helper functions
 *
 * @example
 * ```tsx
 * const { canSwipe, swipesRemaining, incrementSwipe, isPremium } = useSubscription();
 *
 * if (!canSwipe) {
 *   return <SwipeLimitModal />;
 * }
 *
 * const handleSwipe = async () => {
 *   await incrementSwipe();
 *   // Continue with swipe logic
 * };
 * ```
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const {
    subscription,
    loading,
    error,
    canSwipe,
    swipesRemaining,
    isPremium,
    isExpired,
    daysRemaining,
    subscriptionEnabled,
    checkCanSwipe,
    incrementSwipe,
    refreshSubscription,
    upgradePlan,
    cancelPlan,
  } = useSubscriptionContext();

  /**
   * Wrapper for incrementSwipe with error handling
   */
  const handleIncrementSwipe = async (): Promise<void> => {
    try {
      await incrementSwipe();
    } catch (err) {
      console.error("Error incrementing swipe:", err);
      throw err;
    }
  };

  /**
   * Wrapper for upgradePlan with error handling
   */
  const handleUpgradePlan = async (planId: string, transactionId: string): Promise<void> => {
    try {
      await upgradePlan(planId, transactionId);
    } catch (err) {
      console.error("Error upgrading plan:", err);
      throw err;
    }
  };

  /**
   * Wrapper for cancelSubscription with error handling
   */
  const handleCancelSubscription = async (): Promise<void> => {
    try {
      await cancelPlan();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    canSwipe,
    swipesRemaining,
    incrementSwipe: handleIncrementSwipe,
    refreshSubscription,
    upgradePlan: handleUpgradePlan,
    cancelSubscription: handleCancelSubscription,
    isPremium,
    isExpired,
    daysRemaining,
    subscriptionEnabled,
  };
};
