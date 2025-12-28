# Payment Transaction Debugging Guide

## Issue
Webhook cannot find transaction when payment is completed, indicating transaction is either:
- Not being created
- Created with wrong data
- Created but query failing to find it

## New Debug Logging Added

### Files Updated
1. `services/instamojo-payment.ts` - Added detailed transaction creation logs (lines 41-130)
2. `components/screens/subscription/payment-modal/instamojo.tsx` - Added payment flow logs (lines 148-250)

### What to Check

#### Step 1: Test Payment Flow
1. **Restart Expo** to load new code:
   ```bash
   # Kill existing process
   pkill -f "expo start"
   
   # Start fresh
   PORT=8080 npx expo start --clear
   ```

2. **Open app** and navigate to subscription screen

3. **Select a plan** (e.g., Daily plan)

4. **Click "Pay" button**

5. **Check console logs** - You should see:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 PAYMENT FLOW STARTED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 Payment Details:
      • Plan ID: daily
      • Plan Name: Daily
      • Plan Price: 99
   👤 User Details:
      • User ID: [your-user-id]
      • Email: [your-email]
      • Phone: +917008105210
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 STEP 1: Creating transaction record...
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 Starting transaction creation...
     • User ID: [user-id]
     • Plan ID: daily
     • Amount: 99
     • Auth user ID: [user-id]
     • Auth user phone: +917008105210
     • Fetching user document from Firestore...
     • User name: Subham
     • User phone: +917008105210
     • Fetching plan details from Firestore...
     • Plans document found, extracting plan: daily
     • Plan found: Daily
     • Generated order ID: ORDER_[timestamp]_[user-id-prefix]
     • Creating transaction document in Firestore...
     • Transaction data: {...}
   ✅ Transaction created successfully!
     • Transaction ID: [firestore-doc-id]
     • Collection path: transactions/[doc-id]
     • Status: PENDING
     • Provider: instamojo
   ```

#### Step 2: Verify Transaction in Firebase Console
1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to: Firestore Database → transactions collection
3. Look for a document with:
   - `userId`: Your user ID
   - `status`: "PENDING"
   - `provider`: "instamojo"
   - `planId`: "daily" (or whichever plan you selected)
   - `createdAt`: Recent timestamp

#### Step 3: Complete Payment (Don't do this until Steps 1-2 work!)
1. In the WebView, complete the payment
2. Check webhook logs:
   ```bash
   npx firebase-tools functions:log --only instamojoWebhook | head -100
   ```

## Expected Outcomes

### If Transaction Creation SUCCEEDS
- Console shows all logs from "🚀 PAYMENT FLOW STARTED" to "✅ Transaction created successfully!"
- Firebase Console shows transaction document with PENDING status
- Webhook should find this transaction when payment completes

### If Transaction Creation FAILS
- Console shows error logs with exact failure reason:
  ```
  ❌ TRANSACTION CREATION FAILED!
     • Error: [specific error]
     • Error Message: [error details]
  ```
- Common errors:
  - "Plan not found" → Plans document structure issue
  - "User not found" → User document missing
  - "Permission denied" → Firestore rules issue
  - Network errors → Connection issue

## Troubleshooting

### Error: "Plan not found in subscription plans"
The plan is not in `subscriptionPlans/plans` document. Check:
```bash
# Verify plans document exists
firebase firestore:get subscriptionPlans/plans
```

Expected structure:
```json
{
  "daily": { "name": "Daily", "price": 99, ... },
  "weekly": { "name": "Weekly", "price": 299, ... },
  "monthly": { "name": "Monthly", "price": 999, ... }
}
```

### Error: "User not authenticated"
User is not logged in. Check:
- Auth state in app
- User ID in console logs
- Firebase Auth console for user existence

### No Logs Appear
Code not loaded. Try:
1. Clear Metro bundler cache: `npx expo start --clear`
2. Reload app (shake device → Reload)
3. Check terminal for bundling errors

## What I Need From You

Please run through Steps 1-2 and send me:

1. **Console logs** - Copy from "🚀 PAYMENT FLOW STARTED" onwards
2. **Firebase Console screenshot** - Showing transactions collection
3. **Any error alerts** - If you see error popup

This will tell us exactly where the transaction creation is failing.
