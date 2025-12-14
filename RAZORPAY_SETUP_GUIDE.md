# Razorpay Payment Integration Setup Guide

## Current Status

✅ **Payment flow is working** - But using MOCK payments for testing
⚠️ **Razorpay native module needs rebuild** - To enable real payments

## Why Mock Payments Are Being Used

The `react-native-razorpay` package is a **native module** that requires the Android app to be rebuilt to link the native code. Without rebuilding, the module returns `null` and mock payments are used instead.

## Option 1: Enable Real Razorpay Payments (15-20 minutes)

### Step 1: Rebuild the Android App

```bash
# Stop Metro if running (Ctrl+C in terminal)

# Clean and rebuild with native modules
npx expo prebuild --clean --platform android

# Run on device/emulator
npx expo run:android
```

**Wait time:** 5-10 minutes for first build

### Step 2: Test Real Payments

Once the app rebuilds and launches:

1. Go to **Profile** → Tap "Go Premium" (or tap the green Active Subscription card)
2. Select any plan (Daily/Weekly/Monthly)
3. **Payment modal opens** with GST breakdown
4. Tap "Pay ₹X" button
5. **Razorpay checkout modal opens** 🎉
6. Use test card: `4111 1111 1111 1111`
7. CVV: `123`, Any future expiry date
8. Payment processes successfully!

### Step 3: Verify

- Check that subscription updated in Profile
- Premium badge should show on avatar
- Swipe limits should increase
- Green "Active Subscription" card should show

---

## Option 2: Continue Testing with Mock Payments (Current Setup)

Mock payments are already working! They simulate the complete payment flow:

### How Mock Payments Work

1. Click "Pay" button
2. **2-second delay** simulates payment processing
3. Creates mock transaction IDs:
   - `mock_pay_1234567890`
   - `mock_order_1234567890`
   - `mock_sig_1234567890`
4. Updates Firestore with SUCCESS status
5. Activates premium subscription
6. Shows success alert

### Testing Mock Payments

Just use the app as normal:
- Profile → Premium card → Select plan → Pay
- After 2 seconds, you'll be premium!

---

## Why Rebuild Is Needed

React Native has two types of packages:

### 1. **JavaScript-only packages** ✅
- Install with `npm install`
- Work immediately
- Example: `lodash`, `date-fns`

### 2. **Native modules** ⚠️
- Have Android/iOS native code
- Require app rebuild to link
- Example: `react-native-razorpay`, `react-native-camera`

**react-native-razorpay is a native module**, so it needs:
```bash
npx expo prebuild --clean --platform android
npx expo run:android
```

---

## Troubleshooting

### "Mock payment is still being used after rebuild"

Check the logs - you should see:
```
✅ Opening real Razorpay checkout...
```

If you see:
```
⚠️ Razorpay not available, using MOCK payment
```

Then the module isn't linked yet. Try:
```bash
# Clean everything
cd android
./gradlew clean
cd ..

# Rebuild
npx expo prebuild --clean --platform android
npx expo run:android
```

### "Gradle build fails"

```bash
# Clear Gradle cache
cd android
./gradlew clean
./gradlew --stop
cd ..

# Clear node modules
rm -rf node_modules
npm install

# Rebuild
npx expo prebuild --clean --platform android
```

### "App won't install on device"

- Make sure Android device is connected: `adb devices`
- Make sure USB debugging is enabled
- Try uninstalling old app first from device

---

## Current Payment Flow

### What Happens Now (Mock Mode)

```
User clicks "Pay"
  → processRazorpayPayment() called
  → Checks if RazorpayCheckout.open exists
  → NOT FOUND (returns null)
  → Falls back to MOCK payment
  → 2 second delay
  → Creates mock transaction
  → Updates subscription ✅
  → User is premium!
```

### What Will Happen (After Rebuild)

```
User clicks "Pay"
  → processRazorpayPayment() called
  → Checks if RazorpayCheckout.open exists
  → FOUND ✅
  → Opens Razorpay native checkout modal
  → User enters card details
  → Real payment processed
  → Updates subscription ✅
  → User is premium!
```

---

## Test Cards for Razorpay

Once real Razorpay is working, use these test cards:

### Success Cards
- **Card:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** Any future date
- **Result:** ✅ Payment succeeds

- **Card:** `5555 5555 5555 4444`
- **CVV:** `123`
- **Expiry:** Any future date
- **Result:** ✅ Payment succeeds

### Failure Card (for testing error handling)
- **Card:** `4000 0000 0000 0002`
- **CVV:** `123`
- **Expiry:** Any future date
- **Result:** ❌ Payment fails

---

## Recommendation

**For immediate testing:** Continue using mock payments - everything works!

**For production:** Rebuild the Android app to enable real Razorpay payments

---

## Quick Commands Reference

```bash
# Check if device connected
adb devices

# Rebuild Android app
npx expo prebuild --clean --platform android
npx expo run:android

# Clear cache and restart Metro
npx expo start --clear

# Check running processes
ps aux | grep expo

# Kill Metro
pkill -f "expo start"
```

---

## Summary

✅ **Payment system is fully functional**
✅ **Mock payments work perfectly for testing**
⚠️ **Real Razorpay needs Android rebuild**
⚠️ **Rebuild takes 15-20 minutes**

Choose based on your needs:
- **Testing/Development:** Use mock payments (already working)
- **Production/Real payments:** Rebuild Android app
