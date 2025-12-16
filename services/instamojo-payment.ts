/**
 * Instamojo Smart Links Payment Service
 *
 * This service handles payment integration with Instamojo using smart links.
 * Users are redirected to Instamojo smart link for payment, and webhook handles
 * the payment confirmation.
 */

import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { PaymentProvider, PaymentStatus, PlanType } from '@/types/subscription';
import { getAuth } from 'firebase/auth';

/**
 * Get Instamojo configuration from Firestore
 */
export const getInstamojoConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'subscriptionConfig', 'instamojo'));

    if (!configDoc.exists()) {
      throw new Error('Instamojo configuration not found');
    }

    return configDoc.data();
  } catch (error) {
    console.error('❌ Error fetching Instamojo config:', error);
    throw error;
  }
};

/**
 * Create a transaction record for Instamojo payment
 */
export const createInstamojoTransaction = async (
  userId: string,
  planId: PlanType,
  amount: number
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user details from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const phoneNumber = userData.phoneNumber || '';
    const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';

    // Get plan details
    const planDoc = await getDoc(doc(db, 'subscriptionPlans', planId));
    if (!planDoc.exists()) {
      throw new Error('Plan not found');
    }

    const planData = planDoc.data();

    // Generate a unique order ID
    const orderId = `ORDER_${Date.now()}_${userId.substring(0, 8)}`;

    // Create transaction record
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      userId,
      userEmail: user.email || '',
      userName: name,
      userPhone: phoneNumber,
      planId,
      planName: planData.name || planId,
      amount,
      currency: 'INR',
      provider: PaymentProvider.INSTAMOJO,
      orderId,
      status: PaymentStatus.PENDING,
      createdAt: serverTimestamp(),
      completedAt: null,
    });

    console.log('✅ Transaction created:', transactionRef.id);
    return transactionRef.id;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  }
};

/**
 * Get smart link URL for a specific plan
 */
export const getSmartLinkForPlan = async (planId: PlanType): Promise<string> => {
  try {
    const config = await getInstamojoConfig();

    if (!config.instamojoSmartLinks || !config.instamojoSmartLinks[planId]) {
      throw new Error(`Smart link not configured for plan: ${planId}`);
    }

    return config.instamojoSmartLinks[planId];
  } catch (error) {
    console.error('❌ Error getting smart link:', error);
    throw error;
  }
};

/**
 * Initiate Instamojo payment
 * Returns the smart link URL that user should be redirected to
 */
export const initiateInstamojoPayment = async (
  planId: PlanType,
  userId: string
): Promise<{
  success: boolean;
  smartLinkUrl?: string;
  transactionId?: string;
  error?: string;
}> => {
  try {
    console.log('🚀 Initiating Instamojo payment for plan:', planId);

    // Get plan details
    const planDoc = await getDoc(doc(db, 'subscriptionPlans', planId));
    if (!planDoc.exists()) {
      return {
        success: false,
        error: 'Plan not found',
      };
    }

    const planData = planDoc.data();
    const amount = planData.price;

    // Create transaction record
    const transactionId = await createInstamojoTransaction(userId, planId, amount);

    // Get smart link URL
    const smartLinkUrl = await getSmartLinkForPlan(planId);

    console.log('✅ Payment initiated successfully');
    console.log('📝 Transaction ID:', transactionId);
    console.log('🔗 Smart Link URL:', smartLinkUrl);

    return {
      success: true,
      smartLinkUrl,
      transactionId,
    };
  } catch (error: any) {
    console.error('❌ Error initiating payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment',
    };
  }
};

/**
 * Get transaction by ID
 */
export const getTransaction = async (transactionId: string) => {
  try {
    const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));

    if (!transactionDoc.exists()) {
      throw new Error('Transaction not found');
    }

    return {
      id: transactionDoc.id,
      ...transactionDoc.data(),
    };
  } catch (error) {
    console.error('❌ Error fetching transaction:', error);
    throw error;
  }
};

/**
 * Get transaction by order ID
 */
export const getTransactionByOrderId = async (orderId: string) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('orderId', '==', orderId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Transaction not found');
    }

    const transactionDoc = querySnapshot.docs[0];
    return {
      id: transactionDoc.id,
      ...transactionDoc.data(),
    };
  } catch (error) {
    console.error('❌ Error fetching transaction by order ID:', error);
    throw error;
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (userId: string, limit: number = 10) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt descending
    transactions.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });

    return transactions.slice(0, limit);
  } catch (error) {
    console.error('❌ Error fetching user transactions:', error);
    throw error;
  }
};
