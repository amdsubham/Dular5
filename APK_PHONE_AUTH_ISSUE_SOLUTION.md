# APK Build - Phone Authentication Issue & Solution

## 🚨 **Critical Issue Identified**

**Problem:** Phone authentication works perfectly in Expo development (`npx expo start`) but **hangs/loads infinitely** in production APK builds.

**Root Cause:** `expo-firebase-recaptcha` package is **DEPRECATED** and has known issues in production/standalone builds.

---

## Why It Works in Development But Not in APK

### In Expo Development (`npx expo start`):
- ✅ Expo's development server provides additional JavaScript bridge
- ✅ Web-based reCAPTCHA modal works through Expo's web view
- ✅ Firebase SDK has fallback mechanisms
- ✅ Everything runs in a controlled environment

### In Production APK:
- ❌ No Expo development bridge
- ❌ `expo-firebase-recaptcha` web modal doesn't work in standalone builds
- ❌ `FirebaseRecaptchaVerifierModal` crashes or hangs
- ❌ No fallback mechanism available
- ❌ Firebase requests timeout

---

## The Real Problem: Deprecated Package

According to official sources:

### From Expo Documentation:
> "The `expo-firebase-recaptcha` package has been **deprecated and removed** as of SDK 48."

### Community Reports:
- [Firebase Recaptcha crashes in production on Android](https://github.com/expo/expo/issues/15840)
- [Why is FirebaseRecaptcha getting deprecated?](https://github.com/expo/expo/discussions/20149)

**Your Current Setup:**
```json
"expo-firebase-recaptcha": "^2.3.1"  // ⚠️ DEPRECATED
"firebase": "12.6.0"
```

---

## The Correct Solution: Use React Native Firebase

### Why React Native Firebase?

1. ✅ **Native implementation** - works in production builds
2. ✅ **Play Integrity support** - no reCAPTCHA popup
3. ✅ **Actively maintained** (updated 2025)
4. ✅ **Production-ready** - used by thousands of apps
5. ✅ **Full Firebase feature set**

### What Changes:

#### Current (Broken in APK):
```
Expo JS → expo-firebase-recaptcha → Firebase JS SDK → Network
            ↑ Breaks here in production APK
```

#### Correct (Works Everywhere):
```
React Native → @react-native-firebase/auth → Native Android SDK → Network
                   ↑ Native bridge, always works
```

---

## Implementation Steps

### Step 1: Install React Native Firebase Auth

```bash
npm install @react-native-firebase/auth
```

**Note:** You already have `@react-native-firebase/app@23.7.0` installed!

### Step 2: Update Phone Authentication Code

Replace the current implementation with React Native Firebase:

#### In `services/auth.ts`:

**Remove:**
```typescript
import {
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
```

**Add:**
```typescript
import auth from '@react-native-firebase/auth';
```

**New sendOTP implementation:**
```typescript
export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier | null
): Promise<PhoneAuthResult> => {
  try {
    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    console.log('Sending OTP to:', formattedPhone);

    // Store phone number
    await AsyncStorage.setItem(PHONE_NUMBER_KEY, formattedPhone);

    // Use React Native Firebase (works in production!)
    const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

    // Store confirmation (verification ID)
    await AsyncStorage.setItem(VERIFICATION_ID_KEY, JSON.stringify(confirmation));

    console.log('OTP sent successfully');

    // Track OTP sent event
    await analytics.track('otp_sent', {
      phoneNumber: formattedPhone,
      method: 'phone',
    });

    return {
      success: true,
      verificationId: 'stored_in_confirmation',
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);

    await analytics.trackError(error, {
      action: 'send_otp',
      phoneNumber: phoneNumber,
    });

    // Handle errors
    if (error.code === 'auth/invalid-phone-number') {
      return {
        success: false,
        error: 'Invalid phone number format.',
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
      error: error.message || 'Failed to send OTP.',
    };
  }
};
```

**New verifyOTP implementation:**
```typescript
export const verifyOTP = async (code: string): Promise<{ success: boolean; error?: string; user?: any }> => {
  try {
    // Get the confirmation object
    const confirmationJson = await AsyncStorage.getItem(VERIFICATION_ID_KEY);

    if (!confirmationJson) {
      return {
        success: false,
        error: 'Verification session expired. Please request a new code.',
      };
    }

    const confirmation = JSON.parse(confirmationJson);

    // Confirm the code
    const userCredential = await confirmation.confirm(code);

    // Clear stored verification
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

    // Register for push notifications
    console.log('🔔 Registering for push notifications...');
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await savePushTokenToFirestore(pushToken);
      }
    } catch (notifError) {
      console.error('❌ Error setting up push notifications:', notifError);
    }

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);

    await analytics.trackError(error, {
      action: 'verify_otp',
    });

    if (error.code === 'auth/invalid-verification-code') {
      return {
        success: false,
        error: 'Invalid verification code.',
      };
    }

    return {
      success: false,
      error: error.message || 'Verification failed.',
    };
  }
};
```

### Step 3: Update Login Screen

#### In `app/(auth)/index.tsx`:

**Remove:**
```typescript
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "@/config/firebase";

const recaptchaVerifier = useRef(null);

// ... and remove the modal component:
<FirebaseRecaptchaVerifierModal
  ref={recaptchaVerifier}
  firebaseConfig={app.options}
  attemptInvisibleVerification={true}
/>
```

**Keep simple:**
```typescript
const handleSendOTP = async () => {
  if (!isValid || !phoneNumber) {
    Alert.alert("Error", "Please enter a valid phone number");
    return;
  }

  setLoading(true);

  try {
    // No verifier needed with React Native Firebase!
    const result = await sendOTP(phoneNumber, null);

    if (result.success) {
      router.push("/onboarding/otp");
    } else {
      Alert.alert("Error", result.error);
    }
  } catch (error: any) {
    Alert.alert("Error", error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Update Firebase Config

#### In `config/firebase.ts`:

Keep it simple for React Native Firebase:

```typescript
// React Native Firebase doesn't need manual initialization
// It reads from google-services.json automatically

// Keep your Firestore and Storage setup
// Remove Firebase JS SDK auth initialization if present
```

### Step 5: Enable Play Integrity in Firebase Console

This is **CRITICAL** for production APK to work without reCAPTCHA:

#### 5.1: Add SHA-256 Fingerprints to Firebase

Go to [Firebase Console - Project Settings](https://console.firebase.google.com/project/dular5/settings/general)

Your fingerprints (I've verified these):
- **Release:** `50:38:FC:DF:35:7C:01:49:FB:BF:9C:6C:EC:73:08:FC:45:39:0F:AF:23:5C:E9:54:8A:07:89:02:EB:34:1A:A5`
- **Debug:** `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

**Steps:**
1. Find your Android app: `com.santali.dating`
2. Click **Add fingerprint**
3. Add **BOTH** fingerprints above
4. Click **Save**

#### 5.2: Enable Play Integrity API

Go to [Google Cloud Console - Play Integrity API](https://console.cloud.google.com/apis/library/playintegrity.googleapis.com?project=dular5)

1. Click **Enable**
2. Wait 1-2 minutes

#### 5.3: Configure App Check

Go to [Firebase Console - App Check](https://console.firebase.google.com/project/dular5/appcheck)

1. Click **Get started**
2. Find app: `com.santali.dating`
3. Click **⋮** → **Manage**
4. Select **Play Integrity** provider
5. Click **Save**

---

## Testing the Fix

### Test 1: Development Build
```bash
npx expo run:android
```

**Expected:**
- ✅ Enter phone number
- ✅ Click Next
- ✅ OTP sent (2-3 seconds)
- ✅ No reCAPTCHA popup needed
- ✅ Navigate to OTP screen

### Test 2: Production APK
```bash
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

**Expected:**
- ✅ Enter phone number
- ✅ Click Next
- ✅ OTP sent via Play Integrity (2-3 seconds)
- ✅ No reCAPTCHA popup
- ✅ No infinite loader
- ✅ Navigate to OTP screen

---

## Why This Solution Works

### React Native Firebase Advantages:

1. **Native Bridge**: Uses native Android Firebase SDK
   ```
   JavaScript → Native Module → Android Firebase SDK → Firebase Servers
   ```

2. **Play Integrity Support**: Built-in support for Play Integrity API
   - Automatically verifies app integrity
   - No reCAPTCHA popup needed
   - Works seamlessly in production

3. **No Web Dependencies**: Doesn't rely on web views or JavaScript-only implementations

4. **Production Ready**: Used by thousands of apps in production

5. **Better Error Handling**: Native error codes and messages

---

## Before vs After

### Before (Current - Broken in APK):
```
expo-firebase-recaptcha@2.3.1 (DEPRECATED)
  ↓
Firebase JS SDK (web-based)
  ↓
FirebaseRecaptchaVerifierModal (breaks in APK)
  ↓
❌ Infinite loader in production
```

### After (React Native Firebase):
```
@react-native-firebase/auth@23.7.0
  ↓
Native Android Bridge
  ↓
Android Firebase SDK
  ↓
Play Integrity API (when configured)
  ↓
✅ Works everywhere, no popup
```

---

## Timeline

- **Step 1-4 (Code Changes):** 30 minutes
- **Step 5 (Firebase Console):** 10 minutes
- **Testing:** 10 minutes
- **Total:** ~50 minutes

---

## Important Notes

### About expo-firebase-recaptcha:

1. **Deprecated**: Package removed from Expo SDK 48+
2. **Unmaintained**: No new updates or bug fixes
3. **Production Issues**: Known to crash/hang in standalone builds
4. **Web-only**: Designed for web, not native mobile

### About React Native Firebase:

1. **Active Development**: Regular updates (latest: Jan 2025)
2. **Native First**: Built for React Native from the ground up
3. **Full Feature Set**: Complete Firebase API coverage
4. **Production Tested**: Used by major apps globally

---

## Sources & References

- [Phone Authentication | React Native Firebase](https://rnfirebase.io/auth/phone-auth)
- [Disabling reCaptcha with Play Integrity API (2025)](https://www.devgem.io/posts/disabling-recaptcha-in-firebase-phone-authentication-using-play-integrity-api-2025-guide)
- [Firebase Recaptcha crashes in production](https://github.com/expo/expo/issues/15840)
- [Why is FirebaseRecaptcha deprecated?](https://github.com/expo/expo/discussions/20149)
- [React Native Firebase Docs](https://rnfirebase.io/)

---

## Status

**Current:** ❌ Production APK has infinite loader (expo-firebase-recaptcha issue)
**Solution:** ✅ Migrate to @react-native-firebase/auth
**Estimated Time:** 50 minutes
**Difficulty:** Medium (straightforward migration)

---

**Date:** December 14, 2025
**Issue:** expo-firebase-recaptcha doesn't work in production APK
**Solution:** Migrate to React Native Firebase with Play Integrity
