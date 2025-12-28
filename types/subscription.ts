/**
 * Subscription System Types
 *
 * This file contains all TypeScript type definitions for the premium subscription system.
 * These types are used across both the mobile app and admin panel.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Available subscription plan types
 */
export type PlanType = "free" | "daily" | "weekly" | "monthly";

/**
 * Payment transaction status
 */
export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

/**
 * Payment gateway provider
 */
export enum PaymentProvider {
  GOOGLE_PLAY = "google_play",
  APPLE_IAP = "apple_iap", // For future iOS support
}

// ============================================================================
// Subscription Plan Interfaces
// ============================================================================

/**
 * Subscription plan configuration stored in Firestore
 * Collection: subscriptionPlans
 */
export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  displayName: string;
  description: string;
  price: number; // Price in INR
  currency: string; // "INR"
  duration: number; // Duration in days
  swipeLimit: number; // Daily swipe limit (-1 for unlimited)
  features: string[]; // List of features to display in UI
  active: boolean; // Whether the plan is currently available
  popular?: boolean; // Mark as "Most Popular" plan
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Global subscription configuration
 * Collection: subscriptionConfig (single document)
 */
export interface SubscriptionConfig {
  // Free trial settings
  freeTrialSwipeLimit: number; // Number of swipes allowed in free trial (e.g., 5)

  // Google Play settings
  googlePlay?: {
    packageName: string; // Android app package name (e.g., "com.dular.app")
    serviceAccountKey: string; // Google Play service account JSON key (stringified)
  };

  // Apple IAP settings (for future iOS support)
  appleIAP?: {
    bundleId: string; // iOS bundle identifier
    sharedSecret: string; // App-specific shared secret
  };

  // Feature flags
  subscriptionEnabled: boolean; // Master toggle for subscription feature
  paymentProvider: PaymentProvider; // Active payment provider

  // Timestamps
  updatedAt: Date;
  updatedBy: string; // Admin user ID who made the update
}

// ============================================================================
// User Subscription Interfaces
// ============================================================================

/**
 * User's current subscription status
 * Collection: userSubscriptions
 * Document ID: userId
 */
export interface UserSubscription {
  userId: string;

  // Current plan details
  currentPlan: PlanType;
  planStartDate: Date | null; // When the current plan started
  planEndDate: Date | null; // When the current plan expires

  // Swipe tracking
  swipesUsedToday: number; // Number of swipes used today
  swipesLimit: number; // Daily swipe limit based on plan
  lastSwipeDate: Date | null; // Date of last swipe (for daily reset)
  totalSwipesAllTime: number; // Total swipes across all time

  // Status flags
  isActive: boolean; // Whether subscription is currently active
  isPremium: boolean; // Whether user has any premium plan
  autoRenew: boolean; // Whether to auto-renew subscription

  // Google Play specific fields
  googlePlayPurchaseToken?: string; // Google Play purchase token (unique identifier)
  googlePlayOrderId?: string; // Google Play order ID
  googlePlaySubscriptionId?: string; // Google Play subscription product ID

  // Apple IAP specific fields (for future iOS support)
  appleTransactionId?: string; // Apple transaction ID
  appleOriginalTransactionId?: string; // Apple original transaction ID

  // Payment history (last 10 transactions)
  paymentHistory: {
    transactionId: string;
    planId: PlanType;
    amount: number;
    date: Date;
    status: PaymentStatus;
  }[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Transaction Interfaces
// ============================================================================

/**
 * Payment transaction record
 * Collection: transactions
 */
export interface Transaction {
  id: string; // Auto-generated Firestore document ID

  // User details
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;

  // Plan details
  planId: PlanType;
  planName: string;
  planType?: PlanType; // Duplicate of planId for backwards compatibility

  // Payment details
  amount: number; // Amount in local currency
  currency: string; // Currency code (INR, USD, etc.)
  provider: PaymentProvider;

  // Google Play specific fields
  googlePlayPurchaseToken?: string; // Google Play purchase token
  googlePlayOrderId?: string; // Google Play order ID
  googlePlaySubscriptionId?: string; // Google Play subscription product ID
  googlePlayNotificationType?: string; // Notification type (PURCHASED, RENEWED, etc.)

  // Apple IAP specific fields (for future iOS support)
  appleTransactionId?: string; // Apple transaction ID
  appleOriginalTransactionId?: string; // Apple original transaction ID
  appleReceiptData?: string; // Apple receipt data

  // Status
  status: PaymentStatus;
  statusMessage?: string; // Error message if failed

  // Timestamps
  createdAt: Date;
  completedAt: Date | null;

  // Webhook data (for debugging)
  webhookData?: Record<string, any>;

  // Metadata
  metadata?: {
    deviceInfo?: string;
    appVersion?: string;
    [key: string]: any;
  };
}

// ============================================================================
// Payment Interfaces (for mobile app)
// ============================================================================

/**
 * CCAvenue order creation request
 */
export interface CreateOrderRequest {
  planId: PlanType;
  userId: string;
}

/**
 * CCAvenue order creation response
 */
export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  encRequest: string; // Encrypted CCAvenue request
  accessCode: string; // CCAvenue Access Code
}

/**
 * Payment verification request
 */
export interface VerifyPaymentRequest {
  ccavenueOrderId: string;
  ccavenueTrackingId: string;
  encResponse: string; // Encrypted CCAvenue response
  userId: string;
  planId: PlanType;
}

/**
 * Payment verification response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  subscription?: UserSubscription;
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Props for SubscriptionCard component
 */
export interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentPlan?: PlanType;
  onSelect: (planId: PlanType) => void;
  loading?: boolean;
}

/**
 * Props for PaymentModal component
 */
export interface PaymentModalProps {
  visible: boolean;
  plan: SubscriptionPlan;
  onClose: () => void;
  onSuccess: (subscription: UserSubscription) => void;
  onError: (error: Error) => void;
}

/**
 * Props for SwipeLimitModal component
 */
export interface SwipeLimitModalProps {
  visible: boolean;
  swipesUsed: number;
  swipesLimit: number;
  onClose: () => void;
  onUpgrade: () => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useSubscription hook
 */
export interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  loading: boolean;
  error: Error | null;

  // Swipe management
  canSwipe: boolean;
  swipesRemaining: number;
  swipesUsedToday: number;
  swipesLimit: number;
  incrementSwipe: () => Promise<void>;

  // Subscription actions
  refreshSubscription: () => Promise<void>;
  upgradePlan: (planId: PlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;

  // Helpers
  isPremium: boolean;
  isExpired: boolean;
  daysRemaining: number;
}

// ============================================================================
// Admin Panel Interfaces
// ============================================================================

/**
 * Subscription analytics for admin dashboard
 */
export interface SubscriptionAnalytics {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;

  // Revenue
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;

  // Plan distribution
  planDistribution: {
    [key in PlanType]: number;
  };

  // Conversion metrics
  conversionRate: number; // % of users who upgraded
  churnRate: number; // % of users who cancelled

  // Recent transactions
  recentTransactions: Transaction[];
}

/**
 * Admin plan update request
 */
export interface UpdatePlanRequest {
  planId: PlanType;
  updates: Partial<Omit<SubscriptionPlan, "id" | "createdAt">>;
}

/**
 * Admin config update request
 */
export interface UpdateConfigRequest {
  updates: Partial<Omit<SubscriptionConfig, "updatedAt" | "updatedBy">>;
  adminUserId: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a plan is premium (not free)
 */
export const isPremiumPlan = (planType: PlanType): boolean => {
  return planType !== "free";
};

/**
 * Get plan duration in human-readable format
 */
export const getPlanDurationText = (duration: number): string => {
  if (duration === 1) return "1 day";
  if (duration === 7) return "1 week";
  if (duration === 30) return "1 month";
  return `${duration} days`;
};

/**
 * Format price in INR
 */
export const formatPrice = (price: number): string => {
  return `₹${price}`;
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionExpired = (subscription: UserSubscription): boolean => {
  if (!subscription.planEndDate) return true;
  return new Date() > new Date(subscription.planEndDate);
};

/**
 * Calculate days remaining in subscription
 */
export const getDaysRemaining = (subscription: UserSubscription): number => {
  if (!subscription.planEndDate) return 0;
  const now = new Date();
  const endDate = new Date(subscription.planEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if swipe limit should reset (new day)
 */
export const shouldResetSwipeCount = (lastSwipeDate: Date | null): boolean => {
  if (!lastSwipeDate) return false;
  const now = new Date();
  const last = new Date(lastSwipeDate);

  // Check if it's a different day
  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
  );
};
