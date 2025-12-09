import { 
  PhoneAuthProvider, 
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseAuthApplicationVerifier } from 'expo-firebase-recaptcha';

const PHONE_NUMBER_KEY = '@dular:phone_number';
const VERIFICATION_ID_KEY = '@dular:verification_id';

export interface PhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

/**
 * Send OTP to phone number
 * Requires reCAPTCHA verifier instance from expo-firebase-recaptcha
 */
// Firebase test phone numbers (for development without billing)
// Add your test numbers in Firebase Console: Authentication > Sign-in method > Phone > Phone numbers for testing
const TEST_PHONE_NUMBERS = [
  '+917008105210', // Add your test numbers here
];

export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier: FirebaseAuthApplicationVerifier
): Promise<PhoneAuthResult> => {
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    console.log('Sending OTP to:', formattedPhone);
    console.log('reCAPTCHA verifier:', recaptchaVerifier);
    
    // Store phone number
    await AsyncStorage.setItem(PHONE_NUMBER_KEY, formattedPhone);

    const phoneProvider = new PhoneAuthProvider(auth);
    
    console.log('Calling verifyPhoneNumber...');
    
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('OTP request timed out after 60 seconds. Please check your internet connection and try again.'));
      }, 60000); // 60 second timeout
    });

    // Request verification code with reCAPTCHA verifier
    const verificationId = await Promise.race([
      phoneProvider.verifyPhoneNumber(formattedPhone, recaptchaVerifier),
      timeoutPromise
    ]) as string;

    console.log('Verification ID received:', verificationId);

    // Store verification ID
    await AsyncStorage.setItem(VERIFICATION_ID_KEY, verificationId);

    console.log('OTP sent successfully. Verification ID:', verificationId);

    return {
      success: true,
      verificationId,
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
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
    
    // Handle other common errors
    if (error.code === 'auth/invalid-phone-number') {
      return {
        success: false,
        error: 'Invalid phone number format. Please enter a valid phone number with country code.',
      };
    }
    
    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
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

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
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
    await auth.signOut();
    await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
    await AsyncStorage.removeItem(VERIFICATION_ID_KEY);
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

