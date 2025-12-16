# 🧪 Testing Guide - API Authentication

## ✅ **Implementation Complete!**

Your app now uses:
- ✅ Your custom OTP API (`odicult.fruitnasta.com`)
- ✅ Firebase email/password authentication
- ✅ Works in Expo Go (no build needed!)

---

## 🚀 **Quick Test Commands**

### **Start the App:**
```bash
npx expo start
```

**Then press:**
- `a` for Android
- `i` for iOS
- Scan QR code with Expo Go app

---

## 📱 **Test Flow**

### **Step 1: Enter Phone Number**
```
Phone: 7008105210
       (or any 10-digit number)
```

### **Step 2: Click Next**

**Expected Console Logs:**
```
📱 Sending OTP to: 7008105210
🔐 Generated OTP: 123456  ← Use this OTP!
📊 OTP API Response: { status: "OK", ... }
✅ OTP sent successfully via API
```

### **Step 3: Enter OTP**
```
OTP: 123456  (from console logs above)
```

**Expected Console Logs:**
```
🔐 Verifying OTP...
Entered: 123456 Stored: 123456
✅ OTP verified successfully
🔑 Firebase credentials: { email: "7008105210@gmail.com" }
🔐 Attempting to sign in existing user...
✅ Signed in existing user (or ✅ New user created)
💾 Storing user data in Firestore...
✅ User data stored in Firestore
📊 User status: New user (or Returning user)
```

### **Step 4: Success!**
```
✅ Navigate to next screen
✅ User authenticated
✅ Data stored in Firestore
```

---

## 🎯 **Test Scenarios**

### **Scenario 1: New User (First Time Login)**

```bash
Phone: 7008105210
OTP: (from console)

Expected:
✅ New user created
✅ Profile created with phone number
✅ Data stored in Firestore
✅ Navigate to onboarding
```

### **Scenario 2: Returning User**

```bash
Phone: 7008105210 (same number again)
OTP: (from console)

Expected:
✅ Signed in existing user
✅ Updated data in Firestore
✅ Navigate to home screen
```

### **Scenario 3: Wrong OTP**

```bash
Phone: 7008105210
OTP: 999999 (wrong OTP)

Expected:
❌ Error: "Invalid verification code. Please try again."
```

### **Scenario 4: Different Phone Numbers**

```bash
Test 1: 7008105210
Test 2: 9876543210
Test 3: 1234567890

Expected:
✅ Each creates separate Firebase account
✅ Each has unique email (phone@gmail.com)
```

---

## 🔍 **Where to Find the OTP**

### **Option 1: Console Logs (Development)**
```bash
# Look for this line in terminal:
🔐 Generated OTP: 123456
```

### **Option 2: User's Phone (Production)**
```
User receives SMS with OTP
Via your API: odicult.fruitnasta.com
```

### **Option 3: Test with Specific OTP**

**For testing, you can modify the code temporarily:**

In `services/auth.ts` line 40:
```typescript
// Change from random OTP:
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// To fixed OTP for testing:
const otp = "123456"; // Always use 123456 for testing
```

---

## 📊 **Console Log Checklist**

### **Successful Flow Should Show:**

1. **Sending OTP:**
   - [x] 📱 Sending OTP to: {phone}
   - [x] 🔐 Generated OTP: {otp}
   - [x] 📊 OTP API Response: { status: "OK" }
   - [x] ✅ OTP sent successfully via API

2. **Verifying OTP:**
   - [x] 🔐 Verifying OTP...
   - [x] ✅ OTP verified successfully
   - [x] 🔑 Firebase credentials created
   - [x] 🔐 Attempting to sign in...
   - [x] ✅ Signed in (or created)
   - [x] 💾 Storing user data...
   - [x] ✅ User data stored

3. **Push Notifications:**
   - [x] 🔔 Registering for push notifications...
   - [x] ✅ Push token saved

---

## 🧪 **Quick Test Script**

```bash
# Terminal 1: Start app with logs
npx expo start | tee test.log

# Terminal 2: Watch for OTP
tail -f test.log | grep "Generated OTP"

# When you see OTP, use it in the app!
```

---

## 🎨 **Visual Test Flow**

```
┌─────────────────────┐
│  Login Screen       │
│                     │
│  Enter Phone:       │
│  [7008105210]       │
│                     │
│  [Next Button] ────┼──► Send OTP API
│                     │
└─────────────────────┘
         │
         │ (OTP sent via SMS)
         │ (Check console for OTP)
         ▼
┌─────────────────────┐
│  OTP Screen         │
│                     │
│  Enter Code:        │
│  [1] [2] [3] [4]    │
│  [5] [6]            │
│                     │
│  [Verify Button] ──┼──► Verify OTP
│                     │      │
└─────────────────────┘      │
         │                   │
         │ (OTP matches!)    │
         ▼                   ▼
┌─────────────────────┐  Firebase Auth
│  Success!           │   ✅ Email/Password
│                     │   ✅ Store in Firestore
│  Welcome!           │   ✅ Push token
│                     │
└─────────────────────┘
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Can't find OTP in console**

**Solution:**
```bash
# Clear logs and restart
npx expo start --clear

# Filter for OTP only
npx expo start | grep "Generated OTP"
```

### **Issue 2: API call fails**

**Check:**
```bash
# Test API directly with curl:
curl -X POST https://odicult.fruitnasta.com/api/user/sendotp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"7008105210","assignedOtp":"123456"}'
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "message Submitted successfully"
}
```

### **Issue 3: Firebase auth fails**

**Check Console Logs:**
```
❌ Error code: auth/...
❌ Error message: ...
```

**Common Fixes:**
- Enable Email/Password auth in Firebase Console
- Check network connection
- Verify Firebase config is correct

### **Issue 4: OTP mismatch**

**Solution:**
```bash
# Make sure you're using the OTP from console:
# Look for: 🔐 Generated OTP: 123456
# Enter exactly: 123456
```

---

## 📱 **Test on Real Device**

### **Via Expo Go (Easiest):**

```bash
# 1. Install Expo Go from Play Store/App Store
# 2. Start app
npx expo start

# 3. Scan QR code with:
#    - Android: Expo Go app
#    - iOS: Camera app
```

### **Via APK (Production):**

```bash
# Build APK
npx expo run:android

# Or use existing build
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

---

## ✅ **Success Criteria**

Your implementation is working if:

1. ✅ **Phone number entry works**
2. ✅ **OTP appears in console**
3. ✅ **API call succeeds** (status: "OK")
4. ✅ **User can enter OTP**
5. ✅ **OTP verification succeeds**
6. ✅ **Firebase user created**
7. ✅ **Data saved to Firestore**
8. ✅ **Navigate to next screen**

---

## 🎯 **Expected Results**

### **Firebase Console (Authentication):**
```
Users:
├── uid: "abc123..."
│   ├── Email: 7008105210@gmail.com
│   ├── Provider: Email/Password
│   └── Created: 2025-12-14
```

### **Firestore (Database):**
```
users/
├── abc123.../
│   ├── phoneNumber: "+917008105210"
│   ├── email: "7008105210@gmail.com"
│   ├── createdAt: "2025-12-14T..."
│   └── updatedAt: "2025-12-14T..."
```

---

## 🚀 **Ready to Test!**

```bash
# Start the app
npx expo start

# Test flow:
1. Enter phone: 7008105210
2. Click Next
3. Check console for OTP
4. Enter OTP
5. ✅ Success!
```

---

**No more Firebase phone auth issues!** 🎉

**Date:** December 14, 2025
**Status:** ✅ Ready for testing
**Method:** Custom API + Firebase Email/Password
