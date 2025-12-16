import { Platform } from 'react-native';
import * as SMS from 'expo-sms';

/**
 * Extract OTP from SMS message
 * Supports multiple formats:
 * - "Your OTP is 123456"
 * - "OTP: 123456"
 * - "123456 is your verification code"
 * - "Your OTP- One Time Password is 272607"
 */
export const extractOTPFromMessage = (message: string): string | null => {
  console.log('📱 Extracting OTP from message:', message);

  // Pattern 1: "Your OTP- One Time Password is 272607" (mTalkz format)
  const pattern1 = /(?:Your OTP[^0-9]*|OTP[^0-9]*|One Time Password[^0-9]*is[^0-9]*)(\d{4,6})/i;

  // Pattern 2: Standard "OTP is 123456" or "OTP: 123456"
  const pattern2 = /(?:OTP|code|pin)[^\d]*(\d{4,6})/i;

  // Pattern 3: "123456 is your" (OTP at start)
  const pattern3 = /^(\d{4,6})\s+is\s+your/i;

  // Pattern 4: Any 4-6 digit number (fallback)
  const pattern4 = /\b(\d{4,6})\b/;

  const patterns = [pattern1, pattern2, pattern3, pattern4];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const otp = match[1];
      console.log('✅ OTP extracted:', otp);
      return otp;
    }
  }

  console.warn('⚠️ Could not extract OTP from message');
  return null;
};

/**
 * Request SMS permissions
 */
export const requestSMSPermission = async (): Promise<boolean> => {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.warn('⚠️ SMS is not available on this device');
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Error requesting SMS permission:', error);
    return false;
  }
};

/**
 * Listen for incoming SMS (Android only)
 * Note: This is a simplified implementation. For production, you should use
 * react-native-otp-verify or similar library that uses SMS Retriever API
 */
export const startSMSListener = (
  onOTPReceived: (otp: string) => void
): (() => void) => {
  if (Platform.OS !== 'android') {
    console.log('ℹ️ SMS auto-read is only supported on Android');
    return () => {};
  }

  console.log('📱 Starting SMS listener for OTP...');

  // For Android, we'll use the OTP Verify package
  // This is a placeholder - the actual implementation will use react-native-otp-verify
  try {
    const OtpVerify = require('react-native-otp-verify');

    // Start listening for OTP
    OtpVerify.getOtp()
      .then(() => {
        console.log('✅ OTP listener started');
      })
      .catch((error: any) => {
        console.error('❌ Error starting OTP listener:', error);
      });

    // Add listener for OTP received
    OtpVerify.addListener((message: string) => {
      console.log('📨 SMS received:', message);
      const otp = extractOTPFromMessage(message);
      if (otp) {
        onOTPReceived(otp);
        OtpVerify.removeListener();
      }
    });

    // Return cleanup function
    return () => {
      console.log('🛑 Stopping SMS listener');
      OtpVerify.removeListener();
    };
  } catch (error) {
    console.error('❌ Error with OTP listener:', error);
    return () => {};
  }
};

/**
 * Get hash for SMS Retriever API (Android only)
 * This hash should be included in your SMS message for automatic OTP reading
 */
export const getAppHash = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const OtpVerify = require('react-native-otp-verify');
    const hash = await OtpVerify.getHash();
    console.log('📱 App hash for SMS Retriever:', hash);
    return hash[0];
  } catch (error) {
    console.error('❌ Error getting app hash:', error);
    return null;
  }
};
