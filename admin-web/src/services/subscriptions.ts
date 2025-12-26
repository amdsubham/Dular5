/**
 * Subscription Services for Admin Panel
 *
 * Handles all subscription-related operations including:
 * - Plans management
 * - Configuration
 * - User subscriptions
 * - Transactions and analytics
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // in days
  swipeLimit: number; // -1 for unlimited
  features: string[];
  active: boolean;
  popular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionConfig {
  freeTrialSwipeLimit: number;
  subscriptionEnabled: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export interface UserSubscription {
  userId: string;
  currentPlan: 'free' | 'daily' | 'weekly' | 'monthly';
  planStartDate: Date | null;
  planEndDate: Date | null;
  swipesUsedToday: number;
  swipesLimit: number;
  lastSwipeDate: Date | null;
  totalSwipesAllTime: number;
  isActive: boolean;
  isPremium: boolean;
  autoRenew: boolean;
  paymentHistory: Array<{
    transactionId: string;
    planId: string;
    amount: number;
    date: Date;
    status: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  provider: string;
  instamojoPaymentId?: string | null;
  instamojoPaymentRequestId?: string | null;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  completedAt: Date | null;
  metadata?: any;
}

export interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageOrderValue: number;
  revenueByPlan: {
    [planId: string]: {
      revenue: number;
      count: number;
    };
  };
}

export interface SubscriptionStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  dailyPlanUsers: number;
  weeklyPlanUsers: number;
  monthlyPlanUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  conversionRate: number;
}

// ============================================================================
// Subscription Plans Management
// ============================================================================

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plansDoc = await getDoc(doc(db, 'subscriptionPlans', 'plans'));

    if (!plansDoc.exists()) {
      return [];
    }

    const data = plansDoc.data();
    const plans: SubscriptionPlan[] = [];

    // Convert the nested object to array
    Object.keys(data).forEach((key) => {
      if (data[key] && typeof data[key] === 'object') {
        plans.push({
          ...data[key],
          id: key,
          createdAt: data[key].createdAt?.toDate() || new Date(),
          updatedAt: data[key].updatedAt?.toDate() || new Date(),
        });
      }
    });

    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}

/**
 * Get a single subscription plan by ID
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const plansDoc = await getDoc(doc(db, 'subscriptionPlans', 'plans'));

    if (!plansDoc.exists()) {
      return null;
    }

    const data = plansDoc.data();
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
    console.error('Error fetching subscription plan:', error);
    throw error;
  }
}

/**
 * Create or update a subscription plan
 */
export async function saveSubscriptionPlan(planData: Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    const plansDoc = await getDoc(plansRef);

    const currentData = plansDoc.exists() ? plansDoc.data() : {};
    const isNewPlan = !currentData[planData.id];

    const updatedPlan = {
      ...planData,
      createdAt: isNewPlan ? Timestamp.now() : currentData[planData.id]?.createdAt,
      updatedAt: Timestamp.now(),
    };

    await setDoc(
      plansRef,
      {
        [planData.id]: updatedPlan,
      },
      { merge: true }
    );

    console.log(`✅ Plan ${planData.id} saved successfully`);
  } catch (error) {
    console.error('Error saving subscription plan:', error);
    throw error;
  }
}

/**
 * Delete a subscription plan
 */
export async function deleteSubscriptionPlan(planId: string): Promise<void> {
  try {
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    const plansDoc = await getDoc(plansRef);

    if (!plansDoc.exists()) {
      throw new Error('Plans document not found');
    }

    const currentData = plansDoc.data();
    const { [planId]: _, ...remainingPlans } = currentData;

    await setDoc(plansRef, remainingPlans);

    console.log(`✅ Plan ${planId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    throw error;
  }
}

// ============================================================================
// Subscription Configuration
// ============================================================================

/**
 * Get subscription configuration
 */
export async function getSubscriptionConfig(): Promise<SubscriptionConfig | null> {
  try {
    const configDoc = await getDoc(doc(db, 'subscriptionConfig', 'default'));

    if (!configDoc.exists()) {
      return null;
    }

    const data = configDoc.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as SubscriptionConfig;
  } catch (error) {
    console.error('Error fetching subscription config:', error);
    throw error;
  }
}

/**
 * Update subscription configuration
 */
export async function updateSubscriptionConfig(config: Partial<SubscriptionConfig>): Promise<void> {
  try {
    const configRef = doc(db, 'subscriptionConfig', 'default');

    await setDoc(
      configRef,
      {
        ...config,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log('✅ Subscription config updated successfully');
  } catch (error) {
    console.error('Error updating subscription config:', error);
    throw error;
  }
}

// ============================================================================
// User Subscriptions
// ============================================================================

/**
 * Get all user subscriptions with pagination
 */
export async function getUserSubscriptions(limitCount: number = 50): Promise<UserSubscription[]> {
  try {
    const subscriptionsRef = collection(db, 'userSubscriptions');
    const q = query(subscriptionsRef, orderBy('updatedAt', 'desc'), firestoreLimit(limitCount));

    const snapshot = await getDocs(q);
    const subscriptions: UserSubscription[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push({
        userId: doc.id,
        ...data,
        planStartDate: data.planStartDate?.toDate() || null,
        planEndDate: data.planEndDate?.toDate() || null,
        lastSwipeDate: data.lastSwipeDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        paymentHistory: data.paymentHistory || [],
      } as UserSubscription);
    });

    return subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
}

/**
 * Get premium users only
 */
export async function getPremiumUsers(): Promise<UserSubscription[]> {
  try {
    const subscriptionsRef = collection(db, 'userSubscriptions');
    const q = query(
      subscriptionsRef,
      where('isPremium', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const subscriptions: UserSubscription[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push({
        userId: doc.id,
        ...data,
        planStartDate: data.planStartDate?.toDate() || null,
        planEndDate: data.planEndDate?.toDate() || null,
        lastSwipeDate: data.lastSwipeDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        paymentHistory: data.paymentHistory || [],
      } as UserSubscription);
    });

    return subscriptions;
  } catch (error) {
    console.error('Error fetching premium users:', error);
    throw error;
  }
}

/**
 * Get a single user's subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const subscriptionDoc = await getDoc(doc(db, 'userSubscriptions', userId));

    if (!subscriptionDoc.exists()) {
      return null;
    }

    const data = subscriptionDoc.data();
    return {
      userId,
      ...data,
      planStartDate: data.planStartDate?.toDate() || null,
      planEndDate: data.planEndDate?.toDate() || null,
      lastSwipeDate: data.lastSwipeDate?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      paymentHistory: data.paymentHistory || [],
    } as UserSubscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
}

// ============================================================================
// Transactions
// ============================================================================

/**
 * Get all transactions with pagination
 */
export async function getTransactions(limitCount: number = 100): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || null,
      } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(status: 'pending' | 'success' | 'failed'): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      firestoreLimit(100)
    );

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || null,
      } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions by status:', error);
    throw error;
  }
}

// ============================================================================
// Analytics & Statistics
// ============================================================================

/**
 * Get revenue statistics
 */
export async function getRevenueStats(): Promise<RevenueStats> {
  try {
    const transactions = await getTransactions(1000); // Get more for accurate stats

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: RevenueStats = {
      totalRevenue: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      totalTransactions: transactions.length,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageOrderValue: 0,
      revenueByPlan: {},
    };

    transactions.forEach((txn) => {
      if (txn.status === 'success') {
        stats.successfulTransactions++;
        stats.totalRevenue += txn.amount;

        // Today's revenue
        if (txn.createdAt >= todayStart) {
          stats.todayRevenue += txn.amount;
        }

        // Month's revenue
        if (txn.createdAt >= monthStart) {
          stats.monthRevenue += txn.amount;
        }

        // Revenue by plan
        if (!stats.revenueByPlan[txn.planId]) {
          stats.revenueByPlan[txn.planId] = { revenue: 0, count: 0 };
        }
        stats.revenueByPlan[txn.planId].revenue += txn.amount;
        stats.revenueByPlan[txn.planId].count++;
      } else if (txn.status === 'failed') {
        stats.failedTransactions++;
      }
    });

    stats.averageOrderValue =
      stats.successfulTransactions > 0 ? stats.totalRevenue / stats.successfulTransactions : 0;

    return stats;
  } catch (error) {
    console.error('Error calculating revenue stats:', error);
    throw error;
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  try {
    const subscriptions = await getUserSubscriptions(1000);

    const stats: SubscriptionStats = {
      totalUsers: subscriptions.length,
      freeUsers: 0,
      premiumUsers: 0,
      dailyPlanUsers: 0,
      weeklyPlanUsers: 0,
      monthlyPlanUsers: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      conversionRate: 0,
    };

    const now = new Date();

    subscriptions.forEach((sub) => {
      if (sub.currentPlan === 'free') {
        stats.freeUsers++;
      } else {
        stats.premiumUsers++;

        if (sub.currentPlan === 'daily') stats.dailyPlanUsers++;
        if (sub.currentPlan === 'weekly') stats.weeklyPlanUsers++;
        if (sub.currentPlan === 'monthly') stats.monthlyPlanUsers++;

        if (sub.isActive && sub.planEndDate && sub.planEndDate > now) {
          stats.activeSubscriptions++;
        } else {
          stats.expiredSubscriptions++;
        }
      }
    });

    stats.conversionRate =
      stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0;

    return stats;
  } catch (error) {
    console.error('Error calculating subscription stats:', error);
    throw error;
  }
}

// ============================================================================
// Default Plans Initialization (Admin Only)
// ============================================================================

/**
 * Initialize default subscription plans (Admin function)
 * Creates default daily, weekly, and monthly plans if they don't exist
 */
export async function initializeDefaultPlans(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Check if plans already exist
    const existingPlans = await getSubscriptionPlans();
    if (existingPlans.length > 0) {
      return {
        success: true,
        message: `Plans already exist (${existingPlans.length} plans found). No action needed.`,
      };
    }

    // Default plans data
    const defaultPlansData = {
      daily: {
        id: 'daily',
        name: 'Daily Plan',
        displayName: 'Daily Plan',
        description: 'Perfect for casual dating',
        price: 30,
        currency: 'INR',
        duration: 1,
        swipeLimit: 50,
        features: [
          '50 daily swipes',
          'See who likes you',
          'Priority matching',
          'No ads',
        ],
        active: true,
        popular: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      weekly: {
        id: 'weekly',
        name: 'Weekly Plan',
        displayName: 'Weekly Plan',
        description: 'Most popular choice for serious daters',
        price: 100,
        currency: 'INR',
        duration: 7,
        swipeLimit: 100,
        features: [
          '100 daily swipes',
          'See who likes you',
          'Priority matching',
          'Profile boost',
          'Advanced filters',
          'No ads',
        ],
        active: true,
        popular: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      monthly: {
        id: 'monthly',
        name: 'Monthly Plan',
        displayName: 'Monthly Plan',
        description: 'Best value for unlimited dating',
        price: 300,
        currency: 'INR',
        duration: 30,
        swipeLimit: -1, // Unlimited
        features: [
          'Unlimited daily swipes',
          'See who likes you',
          'Priority matching',
          'Daily profile boost',
          'Advanced filters',
          'Read receipts',
          'No ads',
        ],
        active: true,
        popular: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    };

    // Create default configuration
    const defaultConfig = {
      freeTrialSwipeLimit: 5,
      subscriptionEnabled: true,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin',
    };

    // Write plans to Firestore
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    await setDoc(plansRef, defaultPlansData);

    // Write config to Firestore
    const configRef = doc(db, 'subscriptionConfig', 'default');
    await setDoc(configRef, defaultConfig);

    console.log('✅ Default plans and config created successfully');

    return {
      success: true,
      message: 'Successfully created 3 default plans (Daily, Weekly, Monthly) and subscription configuration!',
    };
  } catch (error: any) {
    console.error('❌ Error initializing default plans:', error);
    return {
      success: false,
      message: 'Failed to create default plans',
      error: error?.message || 'Unknown error occurred',
    };
  }
}
