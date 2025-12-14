import {
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, savePushTokenToFirestore } from './notifications';
import { analytics } from './analytics';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const PHONE_NUMBER_KEY = '@dular:phone_number';
const VERIFICATION_ID_KEY = '@dular:verification_id';

export interface PhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

/**
 * Send OTP to phone number
 * Uses Firebase App Check for automatic verification (no reCAPTCHA needed)
 */
// Firebase test phone numbers (for development without billing)
// Add your test numbers in Firebase Console: Authentication > Sign-in method > Phone > Phone numbers for testing
const TEST_PHONE_NUMBERS = [
  '+917008105210', // Add your test numbers here
];

export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier | null
): Promise<PhoneAuthResult> => {
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    console.log('Sending OTP to:', formattedPhone);

    if (!recaptchaVerifier) {
      console.warn('⚠️ No reCAPTCHA verifier provided. This may fail on production.');
      console.warn('💡 Make sure to pass recaptchaVerifier from FirebaseRecaptchaVerifierModal');
    } else {
      console.log('✅ Using expo-firebase-recaptcha verifier');
    }

    // Store phone number
    await AsyncStorage.setItem(PHONE_NUMBER_KEY, formattedPhone);

    const phoneProvider = new PhoneAuthProvider(auth);

    console.log('Calling verifyPhoneNumber...');

    // Add timeout wrapper - allows time for reCAPTCHA to complete
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('OTP request timed out. Please check your internet connection and try again.'));
      }, 60000); // 60 second timeout - enough time for user to complete reCAPTCHA
    });

    // Use the provided recaptcha verifier (from expo-firebase-recaptcha)
    // This works on React Native and shows the reCAPTCHA modal when needed
    const verificationId = await Promise.race([
      phoneProvider.verifyPhoneNumber(formattedPhone, recaptchaVerifier!),
      timeoutPromise
    ]) as string;

    console.log('Verification ID received:', verificationId);

    // Store verification ID
    await AsyncStorage.setItem(VERIFICATION_ID_KEY, verificationId);

    console.log('OTP sent successfully. Verification ID:', verificationId);

    // Track OTP sent event
    await analytics.track('otp_sent', {
      phoneNumber: formattedPhone,
      method: 'phone',
    });

    return {
      success: true,
      verificationId,
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);

    // Track OTP error
    await analytics.trackError(error, {
      action: 'send_otp',
      phoneNumber: phoneNumber,
    });
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle timeout
    if (error.message && error.message.includes('timed out')) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    // Handle billing error specifically
    if (error.code === 'auth/billing-not-enabled') {
      return {
        success: false,
        error: 'Firebase billing is not enabled. For development, please:\n1. Enable billing in Firebase Console, OR\n2. Add test phone numbers in Firebase Console > Authentication > Sign-in method > Phone > Phone numbers for testing',
      };
    }
    
    // Handle reCAPTCHA errors
    if (error.code === 'auth/internal-error' || error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network error or reCAPTCHA verification failed. Please check your internet connection and try again.',
      };
    }
    
    // Handle argument error (missing verifier)
    if (error.code === 'auth/argument-error') {
      return {
        success: false,
        error: 'Phone authentication setup incomplete.\n\nFor testing:\n1. Open Firebase Console\n2. Go to Authentication > Sign-in method > Phone\n3. Add test phone number: ' + phoneNumber + '\n4. Use code: 123456\n\nFor production: Enable Firebase Blaze plan.',
      };
    }

    // Handle other common errors
    if (error.code === 'auth/invalid-phone-number') {
      return {
        success: false,
        error: 'Invalid phone number format. Please enter a valid phone number with country code (e.g., +917008105210).',
      };
    }

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Too many requests. Please wait a few minutes and try again.',
      };
    }

    if (error.code === 'auth/quota-exceeded') {
      return {
        success: false,
        error: 'Firebase quota exceeded. Please enable Firebase Blaze (Pay as you go) plan in Firebase Console.',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to send OTP. Please try again.',
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (code: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    const verificationId = await AsyncStorage.getItem(VERIFICATION_ID_KEY);
    
    if (!verificationId) {
      return {
        success: false,
        error: 'Verification ID not found. Please request a new code.',
      };
    }

    // Create credential
    const credential = PhoneAuthProvider.credential(verificationId, code);

    // Sign in with credential
    const userCredential = await signInWithCredential(auth, credential);

    // Clear stored verification ID
    await AsyncStorage.removeItem(VERIFICATION_ID_KEY);

    // Check if user is new or returning
    const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

    // Track login/signup event
    if (isNewUser) {
      await analytics.trackSignup('phone', userCredential.user.uid, {
        phoneNumber: userCredential.user.phoneNumber,
      });
    } else {
      await analytics.trackLogin('phone', userCredential.user.uid, {
        phoneNumber: userCredential.user.phoneNumber,
      });
    }

    // Register for push notifications after successful login
    console.log('🔔 Registering for push notifications...');
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        console.log('📱 Push token obtained:', pushToken);
        await savePushTokenToFirestore(pushToken);
        console.log('✅ Push token saved to Firestore');
      } else {
        console.warn('⚠️ Could not get push token - notifications may not work');
      }
    } catch (notifError) {
      console.error('❌ Error setting up push notifications:', notifError);
      // Don't fail login if notifications fail
    }

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);

    // Track OTP verification error
    await analytics.trackError(error, {
      action: 'verify_otp',
    });
    return {
      success: false,
      error: error.message || 'Invalid verification code. Please try again.',
    };
  }
};

/**
 * Get current user's phone number
 */
export const getStoredPhoneNumber = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PHONE_NUMBER_KEY);
  } catch (error) {
    console.error('Error getting stored phone number:', error);
    return null;
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;

    await auth.signOut();
    await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
    await AsyncStorage.removeItem(VERIFICATION_ID_KEY);

    // Track logout event
    if (userId) {
      await analytics.trackLogout(userId);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

