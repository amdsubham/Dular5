import RNIap, {
  Product,
  Purchase,
  PurchaseError,
  Subscription,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, Platform } from 'react-native';

// Subscription SKUs (Product IDs) - Must match Google Play Console
export const SUBSCRIPTION_SKUS = {
  daily: 'dular_daily_subscription',
  weekly: 'dular_weekly_subscription',
  monthly: 'dular_monthly_subscription',
};

export type PlanType = 'daily' | 'weekly' | 'monthly';

let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

/**
 * Initialize Google Play Billing connection
 * Call this when the app starts or before making purchases
 */
export const initializeGooglePlayBilling = async (): Promise<boolean> => {
  try {
    console.log('🔧 Initializing Google Play Billing...');

    // Only run on Android
    if (Platform.OS !== 'android') {
      console.log('⚠️ Google Play Billing only works on Android');
      return false;
    }

    const connected = await RNIap.initConnection();
    console.log('✅ Google Play Billing connection:', connected ? 'Success' : 'Failed');

    // Clear any pending transactions from previous sessions
    await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
    console.log('✅ Cleared pending transactions');

    return connected;
  } catch (error) {
    console.error('❌ Error initializing Google Play Billing:', error);
    return false;
  }
};

/**
 * Get available subscription products from Google Play
 */
export const getAvailableSubscriptions = async (): Promise<Subscription[]> => {
  try {
    console.log('🔍 Fetching available subscriptions...');

    const subscriptions = await RNIap.getSubscriptions({
      skus: Object.values(SUBSCRIPTION_SKUS),
    });

    console.log(`✅ Found ${subscriptions.length} subscriptions:`, subscriptions);
    return subscriptions;
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return [];
  }
};

/**
 * Purchase a subscription via Google Play Billing
 * @param planType - The plan type to purchase (daily, weekly, monthly)
 */
export const purchaseSubscription = async (planType: PlanType): Promise<boolean> => {
  try {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to purchase a subscription');
      return false;
    }

    const userId = user.uid;
    console.log('💳 Starting subscription purchase...');
    console.log('  • User ID:', userId);
    console.log('  • Plan Type:', planType);

    // Get the SKU for this plan type
    const sku = SUBSCRIPTION_SKUS[planType];
    console.log('  • SKU:', sku);

    // Request the subscription purchase
    // obfuscatedAccountId is the userId - Google will pass this back in the webhook!
    const purchase = await RNIap.requestSubscription({
      sku,
      ...(Platform.OS === 'android' && {
        obfuscatedAccountIdAndroid: userId,
      }),
    });

    console.log('✅ Purchase successful!', purchase);
    console.log('  • Purchase Token:', purchase.purchaseToken?.substring(0, 20) + '...');
    console.log('  • Transaction ID:', purchase.transactionId);
    console.log('  • Order ID:', purchase.orderId);

    // Acknowledge the purchase (required for Android)
    if (Platform.OS === 'android' && purchase.purchaseStateAndroid === 1 && !purchase.isAcknowledgedAndroid) {
      await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
      console.log('✅ Purchase acknowledged');
    }

    // Finish the transaction
    await finishTransaction({ purchase, isConsumable: false });
    console.log('✅ Transaction finished');

    return true;
  } catch (error: any) {
    console.error('❌ Error purchasing subscription:', error);

    if (error.code === 'E_USER_CANCELLED') {
      console.log('ℹ️ User cancelled the purchase');
      return false;
    }

    Alert.alert(
      'Purchase Failed',
      error.message || 'Failed to complete the purchase. Please try again.'
    );
    return false;
  }
};

/**
 * Get current user's active subscriptions
 */
export const getCurrentSubscriptions = async (): Promise<Purchase[]> => {
  try {
    console.log('🔍 Fetching current subscriptions...');

    const purchases = await RNIap.getAvailablePurchases();
    console.log(`✅ Found ${purchases.length} active subscriptions`);

    return purchases;
  } catch (error) {
    console.error('❌ Error fetching current subscriptions:', error);
    return [];
  }
};

/**
 * Restore purchases (for users who reinstalled the app)
 */
export const restorePurchases = async (): Promise<boolean> => {
  try {
    console.log('🔄 Restoring purchases...');

    const purchases = await RNIap.getAvailablePurchases();
    console.log(`✅ Restored ${purchases.length} purchases`);

    if (purchases.length === 0) {
      Alert.alert('No Purchases Found', 'You have no active subscriptions to restore.');
      return false;
    }

    // Process each restored purchase
    for (const purchase of purchases) {
      // Acknowledge if needed
      if (Platform.OS === 'android' && purchase.purchaseStateAndroid === 1 && !purchase.isAcknowledgedAndroid) {
        await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
      }

      // Finish the transaction
      await finishTransaction({ purchase, isConsumable: false });
    }

    Alert.alert('Success', `Restored ${purchases.length} purchase(s)`);
    return true;
  } catch (error) {
    console.error('❌ Error restoring purchases:', error);
    Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    return false;
  }
};

/**
 * Set up purchase listeners
 * Call this when the subscription screen is mounted
 */
export const setupPurchaseListeners = (
  onPurchaseSuccess?: (purchase: Purchase) => void,
  onPurchaseError?: (error: PurchaseError) => void
) => {
  // Remove existing listeners if any
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
  }

  // Purchase updated listener (success)
  purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
    console.log('🔔 Purchase updated:', purchase);

    const receipt = purchase.transactionReceipt;
    if (receipt) {
      try {
        // Acknowledge the purchase
        if (Platform.OS === 'android' && purchase.purchaseStateAndroid === 1 && !purchase.isAcknowledgedAndroid) {
          await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
          console.log('✅ Purchase acknowledged in listener');
        }

        // Finish the transaction
        await finishTransaction({ purchase, isConsumable: false });
        console.log('✅ Transaction finished in listener');

        // Call success callback
        onPurchaseSuccess?.(purchase);
      } catch (error) {
        console.error('❌ Error handling purchase update:', error);
      }
    }
  });

  // Purchase error listener
  purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
    console.error('🔔 Purchase error:', error);

    if (error.code !== 'E_USER_CANCELLED') {
      Alert.alert('Purchase Error', error.message);
    }

    // Call error callback
    onPurchaseError?.(error);
  });

  console.log('✅ Purchase listeners set up');
};

/**
 * Remove purchase listeners
 * Call this when the subscription screen is unmounted
 */
export const removePurchaseListeners = () => {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  console.log('✅ Purchase listeners removed');
};

/**
 * End Google Play Billing connection
 * Call this when the app is closing or when done with billing
 */
export const endGooglePlayBilling = async () => {
  try {
    await RNIap.endConnection();
    removePurchaseListeners();
    console.log('✅ Google Play Billing connection ended');
  } catch (error) {
    console.error('❌ Error ending Google Play Billing connection:', error);
  }
};

/**
 * Check if subscription is active from Firestore
 * This is the source of truth for subscription status
 */
export const checkSubscriptionStatus = async (): Promise<{
  isActive: boolean;
  currentPlan: string;
  endDate: Date | null;
}> => {
  try {
    const user = auth.currentUser;

    if (!user) {
      return { isActive: false, currentPlan: 'free', endDate: null };
    }

    const userId = user.uid;
    const subscriptionRef = doc(db, 'userSubscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return { isActive: false, currentPlan: 'free', endDate: null };
    }

    const data = subscriptionDoc.data();
    return {
      isActive: data.isActive || false,
      currentPlan: data.currentPlan || 'free',
      endDate: data.endDate?.toDate() || null,
    };
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return { isActive: false, currentPlan: 'free', endDate: null };
  }
};
