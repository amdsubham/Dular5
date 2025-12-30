/**
 * Subscription Service
 *
 * This service handles all subscription-related operations for the mobile app:
 * - Fetching user subscription status
 * - Managing swipe limits and counting
 * - Checking if user can perform actions
 * - Upgrading and managing subscriptions
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  UserSubscription,
  SubscriptionConfig,
  SubscriptionPlan,
  PlanType,
  shouldResetSwipeCount,
  isSubscriptionExpired,
  getDaysRemaining,
  Transaction,
  PaymentStatus,
} from "@/types/subscription";

// ============================================================================
// Constants
// ============================================================================

const COLLECTIONS = {
  SUBSCRIPTIONS: "userSubscriptions",
  PLANS: "subscriptionPlans",
  CONFIG: "subscriptionConfig",
  TRANSACTIONS: "transactions",
};

const DEFAULT_CONFIG_DOC_ID = "default";

// ============================================================================
// Subscription Config Functions
// ============================================================================

/**
 * Get global subscription configuration
 */
export const getSubscriptionConfig = async (): Promise<SubscriptionConfig> => {
  try {
    const configRef = doc(db, COLLECTIONS.CONFIG, DEFAULT_CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      // Return default config if not found
      return {
        freeTrialSwipeLimit: 5,
        ccavenueAccessCode: "",
        ccavenueMerchantId: "",
        ccavenueWorkingKey: "",
        subscriptionEnabled: true,
        updatedAt: new Date(),
        updatedBy: "system",
      };
    }

    const data = configSnap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as SubscriptionConfig;
  } catch (error) {
    console.error("Error fetching subscription config:", error);
    throw error;
  }
};

// ============================================================================
// Subscription Plan Functions
// ============================================================================

/**
 * Get all active subscription plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const plansRef = collection(db, COLLECTIONS.PLANS);
    const plansSnap = await getDoc(doc(plansRef, "plans"));

    if (!plansSnap.exists()) {
      return [];
    }

    const data = plansSnap.data();
    const plans: SubscriptionPlan[] = [];

    // Get all plan types
    for (const planId of ["daily", "weekly", "monthly"]) {
      if (data[planId]) {
        plans.push({
          ...data[planId],
          id: planId as PlanType,
          createdAt: data[planId].createdAt?.toDate() || new Date(),
          updatedAt: data[planId].updatedAt?.toDate() || new Date(),
        });
      }
    }

    // Filter only active plans
    return plans.filter((plan) => plan.active);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

/**
 * Get a specific subscription plan by ID
 */
export const getSubscriptionPlan = async (
  planId: PlanType
): Promise<SubscriptionPlan | null> => {
  try {
    const planRef = doc(db, COLLECTIONS.PLANS, "plans");
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return null;
    }

    const data = planSnap.data();
    const planData = data[planId];

    if (!planData) {
      return null;
    }

    return {
      ...planData,
      id: planId,
      createdAt: planData.createdAt?.toDate() || new Date(),
      updatedAt: planData.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error(`Error fetching plan ${planId}:`, error);
    throw error;
  }
};

// ============================================================================
// User Subscription Functions
// ============================================================================

/**
 * Get user's current subscription status
 */
export const getUserSubscription = async (
  userId: string
): Promise<UserSubscription | null> => {
  try {
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);
    const subscriptionSnap = await getDoc(subscriptionRef);

    if (!subscriptionSnap.exists()) {
      // Create default free subscription for new user
      const defaultSubscription = await createDefaultSubscription(userId);
      return defaultSubscription;
    }

    const data = subscriptionSnap.data();
    return {
      ...data,
      planStartDate: data.planStartDate?.toDate() || null,
      planEndDate: data.planEndDate?.toDate() || null,
      lastSwipeDate: data.lastSwipeDate?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      paymentHistory: data.paymentHistory?.map((payment: any) => ({
        ...payment,
        date: payment.date?.toDate() || new Date(),
      })) || [],
    } as UserSubscription;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    throw error;
  }
};

/**
 * Listen to user subscription changes in real-time
 */
export const subscribeToUserSubscription = (
  userId: string,
  callback: (subscription: UserSubscription | null) => void
): (() => void) => {
  const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);

  const unsubscribe = onSnapshot(
    subscriptionRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();
      const subscription: UserSubscription = {
        ...data,
        planStartDate: data.planStartDate?.toDate() || null,
        planEndDate: data.planEndDate?.toDate() || null,
        lastSwipeDate: data.lastSwipeDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        paymentHistory: data.paymentHistory?.map((payment: any) => ({
          ...payment,
          date: payment.date?.toDate() || new Date(),
        })) || [],
      } as UserSubscription;

      callback(subscription);
    },
    (error) => {
      console.error("Error listening to subscription changes:", error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Create default free subscription for new user
 */
const createDefaultSubscription = async (
  userId: string
): Promise<UserSubscription> => {
  try {
    const config = await getSubscriptionConfig();

    const defaultSubscription: UserSubscription = {
      userId,
      currentPlan: "free",
      planStartDate: new Date(),
      planEndDate: null,
      swipesUsedToday: 0,
      swipesLimit: config.freeTrialSwipeLimit,
      lastSwipeDate: null,
      totalSwipesAllTime: 0,
      isActive: true,
      isPremium: false,
      autoRenew: false,
      paymentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);
    await setDoc(subscriptionRef, {
      ...defaultSubscription,
      planStartDate: Timestamp.fromDate(defaultSubscription.planStartDate),
      createdAt: Timestamp.fromDate(defaultSubscription.createdAt),
      updatedAt: Timestamp.fromDate(defaultSubscription.updatedAt),
    });

    return defaultSubscription;
  } catch (error) {
    console.error("Error creating default subscription:", error);
    throw error;
  }
};

// ============================================================================
// Swipe Limit Functions
// ============================================================================

/**
 * Check if user can swipe (has not exceeded limit)
 */
export const canUserSwipe = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;

    // Check if subscription is expired
    if (subscription.isPremium && isSubscriptionExpired(subscription)) {
      // Downgrade to free plan if expired
      await downgradeToFreePlan(userId);
      const updatedSubscription = await getUserSubscription(userId);
      if (!updatedSubscription) return false;

      // Handle unlimited swipes for downgraded subscription
      if (updatedSubscription.swipesLimit === -1 || updatedSubscription.swipesLimit >= 999999) {
        return true;
      }
      return updatedSubscription.swipesUsedToday < updatedSubscription.swipesLimit;
    }

    // Handle unlimited swipes (monthly plan with -1 or 999999)
    if (subscription.swipesLimit === -1 || subscription.swipesLimit >= 999999) {
      return true;
    }

    // Check if swipe count needs to be reset (new day)
    if (shouldResetSwipeCount(subscription.lastSwipeDate)) {
      await resetDailySwipeCount(userId);
      return true; // New day, so user can swipe
    }

    // Check if user has swipes remaining
    return subscription.swipesUsedToday < subscription.swipesLimit;
  } catch (error) {
    console.error("Error checking swipe limit:", error);
    return false;
  }
};

/**
 * Get number of swipes remaining for today
 */
export const getSwipesRemaining = async (userId: string): Promise<number> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return 0;

    // Handle unlimited swipes (represented as -1 or 999999)
    if (subscription.swipesLimit === -1 || subscription.swipesLimit >= 999999) {
      return 999999;
    }

    // Check if swipe count needs to be reset (new day)
    if (shouldResetSwipeCount(subscription.lastSwipeDate)) {
      return subscription.swipesLimit;
    }

    return Math.max(0, subscription.swipesLimit - subscription.swipesUsedToday);
  } catch (error) {
    console.error("Error getting swipes remaining:", error);
    return 0;
  }
};

/**
 * Increment swipe count after user swipes
 */
export const incrementSwipeCount = async (userId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);

    await runTransaction(db, async (transaction) => {
      const subscriptionSnap = await transaction.get(subscriptionRef);

      if (!subscriptionSnap.exists()) {
        throw new Error("Subscription not found");
      }

      const data = subscriptionSnap.data();
      const lastSwipeDate = data.lastSwipeDate?.toDate() || null;

      // Check if we need to reset the count (new day)
      if (shouldResetSwipeCount(lastSwipeDate)) {
        transaction.update(subscriptionRef, {
          swipesUsedToday: 1,
          lastSwipeDate: Timestamp.fromDate(new Date()),
          totalSwipesAllTime: increment(1),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      } else {
        // Increment count
        transaction.update(subscriptionRef, {
          swipesUsedToday: increment(1),
          lastSwipeDate: Timestamp.fromDate(new Date()),
          totalSwipesAllTime: increment(1),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
    });
  } catch (error) {
    console.error("Error incrementing swipe count:", error);
    throw error;
  }
};

/**
 * Reset daily swipe count (called at start of new day)
 */
const resetDailySwipeCount = async (userId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);
    await updateDoc(subscriptionRef, {
      swipesUsedToday: 0,
      lastSwipeDate: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error resetting swipe count:", error);
    throw error;
  }
};

// ============================================================================
// Subscription Management Functions
// ============================================================================

/**
 * Upgrade user to a premium plan after successful payment
 */
export const upgradeSubscription = async (
  userId: string,
  planId: PlanType,
  transactionId: string
): Promise<UserSubscription> => {
  try {
    // SECURITY: Verify transaction exists and was successful
    const { getTransaction } = await import("./payment");
    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "success") {
      throw new Error(`Transaction status is ${transaction.status}, not success`);
    }

    if (transaction.userId !== userId) {
      throw new Error("Transaction does not belong to this user");
    }

    // Get the plan details
    const plan = await getSubscriptionPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Calculate plan start and end dates
    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setDate(planEndDate.getDate() + plan.duration);

    // Get current subscription to preserve history
    const currentSubscription = await getUserSubscription(userId);

    // Update subscription
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);
    const updatedSubscription: UserSubscription = {
      userId,
      currentPlan: planId,
      planStartDate,
      planEndDate,
      swipesUsedToday: 0,
      swipesLimit: plan.swipeLimit,
      lastSwipeDate: new Date(),
      totalSwipesAllTime: currentSubscription?.totalSwipesAllTime || 0,
      isActive: true,
      isPremium: true,
      autoRenew: false,
      paymentHistory: [
        {
          transactionId,
          planId,
          amount: plan.price,
          date: new Date(),
          status: PaymentStatus.SUCCESS,
        },
        ...(currentSubscription?.paymentHistory?.slice(0, 9) || []), // Keep last 9 + new one = 10 total
      ],
      createdAt: currentSubscription?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await setDoc(subscriptionRef, {
      ...updatedSubscription,
      planStartDate: Timestamp.fromDate(updatedSubscription.planStartDate),
      planEndDate: Timestamp.fromDate(updatedSubscription.planEndDate),
      lastSwipeDate: Timestamp.fromDate(updatedSubscription.lastSwipeDate),
      createdAt: Timestamp.fromDate(updatedSubscription.createdAt),
      updatedAt: Timestamp.fromDate(updatedSubscription.updatedAt),
      paymentHistory: updatedSubscription.paymentHistory.map((payment) => ({
        ...payment,
        date: Timestamp.fromDate(payment.date),
      })),
    });

    return updatedSubscription;
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    throw error;
  }
};

/**
 * Downgrade user to free plan (when subscription expires or is cancelled)
 */
export const downgradeToFreePlan = async (userId: string): Promise<void> => {
  try {
    const config = await getSubscriptionConfig();
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);

    await updateDoc(subscriptionRef, {
      currentPlan: "free",
      planStartDate: Timestamp.fromDate(new Date()),
      planEndDate: null,
      swipesUsedToday: 0,
      swipesLimit: config.freeTrialSwipeLimit,
      isActive: true,
      isPremium: false,
      autoRenew: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error downgrading to free plan:", error);
    throw error;
  }
};

/**
 * Cancel user's subscription (will remain active until end date)
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, userId);
    await updateDoc(subscriptionRef, {
      autoRenew: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if subscription has expired and downgrade to free if needed
 */
export const checkAndExpireSubscription = async (
  userId: string
): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;

    // If not premium or already inactive, nothing to check
    if (!subscription.isPremium || !subscription.isActive) {
      return false;
    }

    // Check if subscription has expired
    const hasExpired = isSubscriptionExpired(subscription);

    if (hasExpired) {
      console.log(`⏰ Subscription expired for user ${userId}, downgrading to free plan`);
      await downgradeToFreePlan(userId);
      return true; // Subscription was expired and downgraded
    }

    return false; // Subscription is still active
  } catch (error) {
    console.error("Error checking subscription expiration:", error);
    return false;
  }
};

/**
 * Check if user has an active premium subscription
 */
export const isPremiumUser = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;

    return subscription.isPremium && !isSubscriptionExpired(subscription);
  } catch (error) {
    console.error("Error checking premium status:", error);
    return false;
  }
};

/**
 * Get subscription summary for display
 */
export const getSubscriptionSummary = async (userId: string) => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return {
        planName: "Free",
        isPremium: false,
        swipesRemaining: 0,
        daysRemaining: 0,
        isExpired: false,
      };
    }

    const swipesRemaining = shouldResetSwipeCount(subscription.lastSwipeDate)
      ? subscription.swipesLimit
      : subscription.swipesLimit - subscription.swipesUsedToday;

    return {
      planName: subscription.currentPlan.charAt(0).toUpperCase() + subscription.currentPlan.slice(1),
      isPremium: subscription.isPremium,
      swipesRemaining,
      daysRemaining: getDaysRemaining(subscription),
      isExpired: isSubscriptionExpired(subscription),
    };
  } catch (error) {
    console.error("Error getting subscription summary:", error);
    throw error;
  }
};
