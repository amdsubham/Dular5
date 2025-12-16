import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, savePushTokenToFirestore } from './notifications';
import { analytics } from './analytics';

const PHONE_NUMBER_KEY = '@dular:phone_number';
const OTP_KEY = '@dular:otp';

export interface PhoneAuthResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

/**
 * Send OTP via external API
 * Uses custom OTP service instead of Firebase phone auth
 */
export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: any // Not used, kept for compatibility
): Promise<PhoneAuthResult> => {
  try {
    // Format phone number (remove + if present)
    const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/^91/, '');

    console.log('📱 Sending OTP to:', formattedPhone);

    // Store phone number
    await AsyncStorage.setItem(PHONE_NUMBER_KEY, formattedPhone);

    // Generate OTP (6 digits)
    // Special OTP for test number
    const otp = formattedPhone === '7008105210'
      ? '121212'
      : Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporarily for verification
    await AsyncStorage.setItem(OTP_KEY, otp);

    console.log('🔐 Generated OTP:', otp); // For testing - remove in production

    // Call external OTP API
    const response = await fetch('https://odicult.fruitnasta.com/api/user/sendotp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        assignedOtp: otp,
      }),
    });

    const data = await response.json();

    console.log('📊 OTP API Response:', data);

    if (data.status === 'OK') {
      console.log('✅ OTP sent successfully via API');

      // Track OTP sent event
      await analytics.track('otp_sent', {
        phoneNumber: formattedPhone,
        method: 'api',
      });

      return {
        success: true,
        verificationId: data.msgid || 'api-verification',
      };
    } else {
      console.error('❌ OTP API failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to send OTP. Please try again.',
      };
    }
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);

    // Track OTP error
    await analytics.trackError(error, {
      action: 'send_otp',
      phoneNumber: phoneNumber,
    });

    return {
      success: false,
      error: error.message || 'Failed to send OTP. Please try again.',
    };
  }
};

/**
 * Verify OTP and create/login Firebase user
 * Timeout wrapper to prevent infinite loader
 */
const verifyOTPInternal = async (code: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    // Get stored OTP and phone number
    const storedOtp = await AsyncStorage.getItem(OTP_KEY);
    const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);

    if (!storedOtp || !phoneNumber) {
      return {
        success: false,
        error: 'Verification session expired. Please request a new code.',
      };
    }

    console.log('🔐 Verifying OTP...');
    console.log('Entered:', code, 'Stored:', storedOtp);

    // Verify OTP matches
    if (code !== storedOtp) {
      return {
        success: false,
        error: 'Invalid verification code. Please try again.',
      };
    }

    console.log('✅ OTP verified successfully');

    // Create Firebase email/password credentials
    const email = `${phoneNumber}@gmail.com`;
    const password = phoneNumber;

    console.log('🔑 Firebase credentials:', { email, password: '***' });

    let userCredential;
    let isNewUser = false;

    try {
      // Try to sign in first
      console.log('🔐 Attempting to sign in existing user...');
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Signed in existing user');
    } catch (signInError: any) {
      console.log('ℹ️ Sign in failed, creating new user:', signInError.code);

      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        // User doesn't exist, create new account
        console.log('👤 Creating new user account...');
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        isNewUser = true;
        console.log('✅ New user created');

        // Update profile with phone number
        await updateProfile(userCredential.user, {
          displayName: phoneNumber,
        });
        console.log('✅ Profile updated with phone number');
      } else {
        throw signInError;
      }
    }

    // Store user data in Firestore with timeout
    try {
      const userDoc = doc(db, 'users', userCredential.user.uid);

      // Set a shorter timeout for Firestore operations
      const firestoreTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 10000)
      );

      const userSnapshot = await Promise.race([
        getDoc(userDoc),
        firestoreTimeout
      ]);

      if (!userSnapshot.exists() || isNewUser) {
        console.log('💾 Storing user data in Firestore...');
        await Promise.race([
          setDoc(userDoc, {
            phoneNumber: `+91${phoneNumber}`,
            email: email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true }),
          firestoreTimeout
        ]);
        console.log('✅ User data stored in Firestore');
      }
    } catch (firestoreError) {
      console.warn('⚠️ Firestore operation failed, but login succeeded:', firestoreError);
      // Continue anyway - user is authenticated even if Firestore write fails
    }

    // Clear stored OTP
    await AsyncStorage.removeItem(OTP_KEY);

    console.log('📊 User status:', isNewUser ? 'New user' : 'Returning user');

    // Run analytics and push notifications in background (non-blocking)
    // This prevents infinite loader in production
    Promise.all([
      // Track login/signup event (non-blocking)
      (async () => {
        try {
          if (isNewUser) {
            await analytics.trackSignup('phone', userCredential.user.uid, {
              phoneNumber: `+91${phoneNumber}`,
            });
          } else {
            await analytics.trackLogin('phone', userCredential.user.uid, {
              phoneNumber: `+91${phoneNumber}`,
            });
          }
        } catch (error) {
          console.warn('⚠️ Analytics tracking failed:', error);
        }
      })(),

      // Register for push notifications (non-blocking)
      (async () => {
        try {
          console.log('🔔 Registering for push notifications...');
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            console.log('📱 Push token obtained:', pushToken);
            await savePushTokenToFirestore(pushToken);
            console.log('✅ Push token saved to Firestore');
          } else {
            console.warn('⚠️ Could not get push token - notifications may not work');
          }
        } catch (notifError) {
          console.warn('⚠️ Push notifications setup failed:', notifError);
        }
      })()
    ]).catch(err => {
      console.warn('⚠️ Background tasks failed:', err);
    });

    // Return immediately without waiting for background tasks
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    // Track OTP verification error
    await analytics.trackError(error, {
      action: 'verify_otp',
    });

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'This phone number is already registered. Please try signing in.',
      };
    }

    if (error.code === 'auth/weak-password') {
      return {
        success: false,
        error: 'Authentication error. Please try again.',
      };
    }

    if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.',
      };
    }

    return {
      success: false,
      error: error.message || 'Verification failed. Please try again.',
    };
  }
};

/**
 * Verify OTP with timeout to prevent infinite loader
 */
export const verifyOTP = async (code: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  return Promise.race([
    verifyOTPInternal(code),
    new Promise<{ success: boolean; error: string }>((resolve) =>
      setTimeout(() => {
        console.error('⏰ OTP verification timeout after 30 seconds');
        resolve({
          success: false,
          error: 'Verification is taking too long. Please check your internet connection and try again.',
        });
      }, 30000) // 30 second timeout
    ),
  ]);
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
    await AsyncStorage.removeItem(OTP_KEY);

    // Track logout event
    if (userId) {
      await analytics.trackLogout(userId);
    }

    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get authentication state listener
 */
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};

/**
 * Auto-login user if they have a stored phone number
 */
export const autoLogin = async (): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);

    if (!phoneNumber) {
      return { success: false, error: 'No stored credentials' };
    }

    const email = `${phoneNumber}@gmail.com`;
    const password = phoneNumber;

    console.log('🔄 Attempting auto-login...');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    console.log('✅ Auto-login successful');

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.log('ℹ️ Auto-login failed:', error.code);
    return {
      success: false,
      error: error.message,
    };
  }
};
