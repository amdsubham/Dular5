# Razorpay Payment Integration Setup Guide

## 🎉 Implementation Complete!

The Razorpay payment integration is now fully implemented and ready to test!

---

## What's Been Implemented

### ✅ Payment Service (`/services/payment.ts`)
- Razorpay checkout integration
- Transaction record creation and updates
- Payment success/failure handling
- Transaction history tracking

### ✅ Payment Modal (`/components/screens/subscription/payment-modal/index.tsx`)
- Beautiful payment summary UI
- Price breakdown with GST calculation
- Feature preview
- Secure payment badge
- Loading states during payment

### ✅ Subscription Page Integration (`/app/(protected)/subscription/index.tsx`)
- Opens payment modal on plan selection
- Handles payment success with subscription upgrade
- Shows success/error alerts
- Refreshes subscription data after payment

---

## Installation Steps

### 1. Install react-native-razorpay

```bash
npm install react-native-razorpay
```

### 2. For iOS (if building for iOS)

```bash
cd ios && pod install && cd ..
```

### 3. Initialize Firestore Data

```bash
node scripts/init-subscriptions.js
```

This will create:
- Subscription plans (Daily ₹30, Weekly ₹100, Monthly ₹300)
- Configuration with Razorpay test keys
- Free trial limit (5 swipes)

---

## Testing the Payment Flow

### Test Credentials

The app is configured with **Razorpay Test Mode** credentials:
- **Test Key ID**: `rzp_test_RppoO9N9nmGALz`
- **Test Key Secret**: `FJm3HQKomPlfTHt1xknBUCDW`

### Test Flow Steps

1. **Open the app and test swipe limits**:
   - Go to home screen
   - Swipe on 5 profiles
   - On 6th swipe, limit modal appears

2. **Navigate to subscription plans**:
   - Click "Upgrade Now" in limit modal
   - Or navigate to subscription page directly

3. **Select a plan**:
   - Choose any plan (Daily, Weekly, or Monthly)
   - Payment modal opens with plan summary

4. **Complete test payment**:
   - Click "Pay ₹XX" button
   - Razorpay checkout will open
   - Use Razorpay test cards (see below)

5. **Verify success**:
   - Payment success alert should appear
   - Subscription updated in Firestore
   - Swipe limits increased
   - Transaction recorded

### Razorpay Test Cards

Use these cards for testing (from Razorpay documentation):

**✅ Success Scenarios:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Status: Payment will succeed

**❌ Failure Scenarios:**
- Card: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date
- Status: Payment will fail

**Other Test Methods:**
- **UPI**: Use `success@razorpay` (succeeds) or `failure@razorpay` (fails)
- **NetBanking**: All test banks will succeed
- **Wallet**: All test wallets will succeed

---

## Payment Flow Diagram

```
User selects plan
       ↓
Payment modal opens
       ↓
User clicks "Pay ₹XX"
       ↓
[Payment Service]
  - Creates transaction record (status: pending)
  - Opens Razorpay checkout
       ↓
User completes payment in Razorpay
       ↓
[Success Case]
  - Update transaction (status: success)
  - Store payment ID & signature
  - Upgrade user subscription
  - Update swipe limits
  - Show success alert
       ↓
[Failure Case]
  - Show error alert
  - Keep transaction as pending/failed
```

---

## What Happens Behind the Scenes

### 1. Transaction Record Created

When user clicks "Pay", a transaction document is created in Firestore:

```javascript
{
  userId: "user123",
  userEmail: "user@example.com",
  userName: "John Doe",
  planId: "weekly",
  planName: "Weekly Plan",
  amount: 100,
  currency: "INR",
  status: "pending",
  createdAt: Timestamp,
  // Razorpay details filled after payment
}
```

### 2. Razorpay Checkout Opens

The app calls `RazorpayCheckout.open()` with:
- Plan amount (in paise: ₹100 = 10000 paise)
- User details (prefilled)
- Razorpay key ID
- Brand color and name

### 3. Payment Completed

On success, Razorpay returns:
```javascript
{
  razorpay_payment_id: "pay_xxxxx",
  razorpay_order_id: "order_xxxxx" (optional),
  razorpay_signature: "signature" (optional)
}
```

### 4. Subscription Updated

The app then:
1. Updates transaction with payment details
2. Calls `upgradeSubscription(userId, planId, transactionId)`
3. Updates user's subscription in Firestore:
   ```javascript
   {
     currentPlan: "weekly",
     isPremium: true,
     swipesLimit: 100,
     planStartDate: now,
     planEndDate: now + 7 days,
     paymentHistory: [...]
   }
   ```

---

## Firestore Changes During Payment

### Before Payment:
```javascript
// userSubscriptions/user123
{
  currentPlan: "free",
  swipesLimit: 5,
  swipesUsedToday: 5,  // At limit
  isPremium: false
}
```

### After Successful Payment:
```javascript
// userSubscriptions/user123
{
  currentPlan: "weekly",
  swipesLimit: 100,
  swipesUsedToday: 0,  // Reset
  isPremium: true,
  planStartDate: "2025-12-10",
  planEndDate: "2025-12-17"
}

// transactions/txn123
{
  status: "success",
  razorpayPaymentId: "pay_xxxxx",
  completedAt: "2025-12-10T10:30:00Z"
}
```

---

## Error Handling

The payment system handles various error scenarios:

### 1. User Cancels Payment
```javascript
// Error code from Razorpay
{
  code: "2",
  description: "Payment cancelled by user"
}
```
**Handling**: Shows friendly error message, doesn't charge user

### 2. Payment Fails
```javascript
{
  code: "1",
  description: "Payment failed"
}
```
**Handling**: Updates transaction status, shows error alert

### 3. Network Error
```javascript
{
  message: "Network request failed"
}
```
**Handling**: Catches error, shows generic error message

### 4. Already Subscribed
```javascript
// Checked before opening payment modal
if (subscription.currentPlan === planId) {
  Alert: "Already Subscribed"
}
```

---

## Security Notes

### ⚠️ Important Security Considerations

1. **Test Mode Only**: Current setup uses test keys
   - **Do NOT use in production without backend verification**
   - Test keys start with `rzp_test_`

2. **Payment Verification**:
   - Currently done on client (NOT secure for production)
   - **Recommended**: Implement backend verification
   - Backend should verify payment signature using Razorpay secret

3. **Firestore Security Rules**:
   ```javascript
   // Users can read their own subscriptions
   match /userSubscriptions/{userId} {
     allow read: if request.auth.uid == userId;
     allow write: if false; // Only backend should write
   }

   // Users can read their own transactions
   match /transactions/{transactionId} {
     allow read: if request.auth.uid == resource.data.userId;
     allow write: if false; // Only backend should write
   }
   ```

4. **Never Expose Secret Key**:
   - Key Secret should ONLY be on backend
   - Current implementation stores in Firestore (for admin use only)
   - Client only needs Key ID for checkout

---

## Production Setup (When Ready)

### Step 1: Get Production Keys

1. Sign up at https://dashboard.razorpay.com/
2. Complete KYC verification
3. Go to Settings > API Keys
4. Generate production keys (start with `rzp_live_`)

### Step 2: Update Configuration

**Option A: Via Firestore Console**
```javascript
// subscriptionConfig/default
{
  razorpayKeyId: "rzp_live_YOUR_KEY",
  razorpayKeySecret: "YOUR_SECRET" // Store securely!
}
```

**Option B: Via Admin Panel** (when implemented)
- Go to Admin > Settings > Subscription
- Update Razorpay keys
- Enable production mode

### Step 3: Implement Backend Verification

Create a Cloud Function or API endpoint:

```javascript
// Firebase Cloud Function example
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  const { paymentId, orderId, signature } = data;

  // Verify signature
  const crypto = require('crypto');
  const secret = functions.config().razorpay.secret;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === signature) {
    // Payment verified! Update subscription
    await updateUserSubscription(context.auth.uid, planId);
    return { success: true };
  } else {
    throw new Error('Payment verification failed');
  }
});
```

### Step 4: Test in Production

1. Start with small amount
2. Complete a real payment
3. Verify transaction in Razorpay dashboard
4. Check subscription update in Firestore
5. Test all edge cases

---

## Monitoring & Analytics

### Check Payment Success Rate

**Firestore Query:**
```javascript
db.collection('transactions')
  .where('status', '==', 'success')
  .orderBy('createdAt', 'desc')
  .limit(100)
```

### Track Revenue

**Query by Date Range:**
```javascript
db.collection('transactions')
  .where('status', '==', 'success')
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
```

### Razorpay Dashboard

View detailed analytics at:
https://dashboard.razorpay.com/

- Payment success/failure rates
- Settlement reports
- Refund management
- Customer details

---

## Troubleshooting

### Issue: "Razorpay is not configured"

**Solution:**
- Run `node scripts/init-subscriptions.js`
- Verify `subscriptionConfig/default` exists in Firestore
- Check that `razorpayKeyId` is set

### Issue: Payment modal doesn't open

**Solution:**
- Check if `react-native-razorpay` is installed
- On iOS, make sure pods are installed
- Check console for errors

### Issue: Payment succeeds but subscription not updated

**Solution:**
- Check transaction record in Firestore
- Verify `upgradeSubscription` function is called
- Check console logs for errors
- Verify Firestore permissions

### Issue: "Amount cannot be zero"

**Solution:**
- Check plan price in Firestore (`subscriptionPlans/plans`)
- Ensure price is a number (not string)
- Amount should be in paise (₹100 = 10000)

---

## Testing Checklist

### Before Testing:
- [ ] `react-native-razorpay` installed
- [ ] Firestore initialized with subscription data
- [ ] Test keys configured in Firestore
- [ ] App running on device/emulator

### Payment Flow:
- [ ] Swipe limit modal appears after 5 swipes
- [ ] "Upgrade Now" navigates to subscription page
- [ ] All 3 plans are visible
- [ ] Selecting plan opens payment modal
- [ ] Payment modal shows correct plan details
- [ ] GST calculated correctly (18%)
- [ ] "Pay ₹XX" button opens Razorpay
- [ ] Test payment with success card completes
- [ ] Success alert appears
- [ ] Subscription updated in app
- [ ] Swipe limits increased
- [ ] Can now swipe again

### Error Scenarios:
- [ ] Cancel payment - Shows error message
- [ ] Use failure card - Shows error message
- [ ] Select current plan - Shows "Already Subscribed"
- [ ] Network error - Shows error message

### Data Verification:
- [ ] Transaction created in Firestore (pending)
- [ ] Transaction updated after payment (success)
- [ ] User subscription updated (premium plan)
- [ ] Payment history added to user record
- [ ] Swipe count reset to 0

---

## Support & Help

### Razorpay Documentation
- Integration Guide: https://razorpay.com/docs/payments/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
- React Native SDK: https://razorpay.com/docs/payments/payment-gateway/react-native/

### Common Questions

**Q: Can I test without Razorpay account?**
A: Yes! The test keys are already configured. Just use test cards.

**Q: Is GST included in the price?**
A: No, GST (18%) is added on top of the plan price in the payment modal.

**Q: Can users have multiple active subscriptions?**
A: No, upgrading to a new plan replaces the current plan.

**Q: What happens when subscription expires?**
A: User is automatically downgraded to free plan with 5 swipes/day.

---

## Next Steps

Once testing is complete:

1. **Backend Verification** - Implement secure payment verification
2. **Webhooks** - Set up Razorpay webhooks for payment updates
3. **Auto-Renewal** - Implement subscription auto-renewal
4. **Refunds** - Add refund management
5. **Admin Panel** - Build admin UI for managing subscriptions
6. **Analytics** - Add revenue and conversion tracking
7. **Production Keys** - Switch to live Razorpay keys

---

**Last Updated**: 2025-12-10
**Version**: 1.0.0
**Status**: ✅ Ready for Testing
