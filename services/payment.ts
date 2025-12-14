/**
 * Payment Service - CCAvenue Integration
 *
 * Handles CCAvenue payment integration for subscription purchases.
 * This includes creating orders, processing payments, and verifying transactions.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import {
  Transaction,
  PaymentStatus,
  PaymentProvider,
  SubscriptionPlan,
  PlanType,
} from "@/types/subscription";
import { getSubscriptionConfig } from "@/services/subscription";

// ============================================================================
// Types for CCAvenue
// ============================================================================

interface CCAvenuePaymentData {
  merchant_id: string;
  order_id: string;
  currency: string;
  amount: string;
  redirect_url: string;
  cancel_url: string;
  billing_name: string;
  billing_email: string;
  delivery_name: string;
  delivery_email: string;
  merchant_param1?: string; // userId
  merchant_param2?: string; // planId
}

// ============================================================================
// Create Transaction Record
// ============================================================================

/**
 * Create a pending transaction record in Firestore
 */
const createTransactionRecord = async (
  plan: SubscriptionPlan,
  userId: string,
  userEmail: string,
  userName: string
): Promise<string> => {
  try {
    const transactionData: Omit<Transaction, "id"> = {
      userId,
      userEmail,
      userName,
      planId: plan.id,
      planName: plan.displayName,
      amount: plan.price,
      currency: plan.currency,
      provider: PaymentProvider.CCAVENUE,
      ccavenueOrderId: null,
      ccavenueTrackingId: null,
      ccavenuePaymentMode: null,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      completedAt: null,
      metadata: {
        appVersion: "1.0.0",
        deviceInfo: "mobile",
      },
    };

    const transactionsRef = collection(db, "transactions");
    const docRef = await addDoc(transactionsRef, {
      ...transactionData,
      createdAt: Timestamp.fromDate(transactionData.createdAt),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating transaction record:", error);
    throw error;
  }
};

/**
 * Update transaction record with payment details
 */
export const updateTransactionRecord = async (
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> => {
  try {
    const transactionRef = doc(db, "transactions", transactionId);
    await updateDoc(transactionRef, {
      ...updates,
      completedAt: updates.completedAt
        ? Timestamp.fromDate(updates.completedAt)
        : null,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// ============================================================================
// CCAvenue Payment Flow
// ============================================================================

/**
 * Generate CCAvenue payment URL and transaction
 */
export const initiateCCAvenuePayment = async (
  plan: SubscriptionPlan
): Promise<{
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}> => {
  try {
    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Get user profile for email
    const userProfileRef = doc(db, "users", currentUser.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    const userProfile = userProfileSnap.data();

    const userEmail = userProfile?.email || currentUser.email || "";
    const userName = userProfile?.firstName
      ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
      : "User";

    // Get CCAvenue configuration
    const config = await getSubscriptionConfig();
    if (!config.ccavenueMerchantId || !config.ccavenueAccessCode) {
      throw new Error("CCAvenue not configured");
    }

    // Create transaction record
    const transactionId = await createTransactionRecord(
      plan,
      currentUser.uid,
      userEmail,
      userName
    );

    // Generate unique order ID
    const orderId = `ORDER_${transactionId}_${Date.now()}`;

    // Update transaction with order ID
    await updateTransactionRecord(transactionId, {
      ccavenueOrderId: orderId,
    });

    console.log("🚀 CCAvenue payment initiated:", {
      orderId,
      transactionId,
      amount: plan.price,
    });

    return {
      success: true,
      transactionId,
      orderId,
    };
  } catch (error: any) {
    console.error("❌ Payment initiation error:", error);
    return {
      success: false,
      transactionId: "",
      error: error.message || "Failed to initiate payment",
    };
  }
};

/**
 * Get CCAvenue payment configuration for WebView
 */
export const getCCAvenuePaymentConfig = async (
  orderId: string,
  plan: SubscriptionPlan
): Promise<{
  merchantId: string;
  accessCode: string;
  amount: string;
  orderId: string;
  currency: string;
  redirectUrl: string;
  cancelUrl: string;
  billingName: string;
  billingEmail: string;
  billingTel: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
} | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const userProfileRef = doc(db, "users", currentUser.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    const userProfile = userProfileSnap.data();

    const config = await getSubscriptionConfig();

    const userEmail = userProfile?.email || currentUser.email || "user@example.com";
    const userName = userProfile?.firstName
      ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
      : "User";

    // Get phone number and remove country code if present
    let userPhone = userProfile?.phoneNumber || currentUser.phoneNumber || "9999999999";
    // Remove +91, 91, or any other country code prefix
    userPhone = userPhone.replace(/^\+?91/, "").trim();
    // Ensure it's 10 digits
    if (userPhone.length !== 10) {
      userPhone = "9999999999";
    }

    // Get location data if available
    const userCity = userProfile?.city || "Bangalore";
    const userState = userProfile?.state || "Karnataka";

    return {
      merchantId: config.ccavenueMerchantId,
      accessCode: config.ccavenueAccessCode,
      amount: plan.price.toString(),
      orderId: orderId,
      currency: plan.currency,
      redirectUrl: "http://192.168.1.5:3002/api/payment/response",
      cancelUrl: "http://192.168.1.5:3002/api/payment/response",
      billingName: userName,
      billingEmail: userEmail,
      billingTel: userPhone,
      billingAddress: "NA",
      billingCity: userCity,
      billingState: userState,
      billingZip: "560001",
      billingCountry: "India",
    };
  } catch (error) {
    console.error("Error getting payment config:", error);
    return null;
  }
};

/**
 * Verify CCAvenue payment response
 */
export const verifyCCAvenuePayment = async (
  orderId: string,
  trackingId: string,
  status: string
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> => {
  try {
    // Find transaction by order ID
    // Note: In a real implementation, you should query Firestore
    // For now, we'll return success based on status

    if (status === "Success") {
      console.log("✅ Payment verified successfully:", { orderId, trackingId });
      return {
        success: true,
      };
    } else {
      console.error("❌ Payment verification failed:", { orderId, status });
      return {
        success: false,
        error: "Payment verification failed",
      };
    }
  } catch (error: any) {
    console.error("❌ Payment verification error:", error);
    return {
      success: false,
      error: error.message || "Payment verification failed",
    };
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get transaction by ID
 */
export const getTransaction = async (
  transactionId: string
): Promise<Transaction | null> => {
  try {
    const transactionRef = doc(db, "transactions", transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) {
      return null;
    }

    const data = transactionSnap.data();
    return {
      ...data,
      id: transactionSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate() || null,
    } as Transaction;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
};

/**
 * Get transaction by order ID
 */
export const getTransactionByOrderId = async (
  orderId: string
): Promise<Transaction | null> => {
  try {
    // Note: This requires a Firestore query
    // For production, implement proper query with index
    console.warn("getTransactionByOrderId requires Firestore query implementation");
    return null;
  } catch (error) {
    console.error("Error fetching transaction by order ID:", error);
    return null;
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (
  userId: string,
  limit: number = 10
): Promise<Transaction[]> => {
  try {
    // Note: This would require a Firestore query with where clause
    // For now, return empty array
    // TODO: Implement with proper query when needed
    console.warn("getUserTransactions not fully implemented");
    return [];
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }
};
