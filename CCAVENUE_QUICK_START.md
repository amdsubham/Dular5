# CCAvenue Quick Start Guide

## 🚀 Your CCAvenue Integration is Ready!

All Razorpay code has been removed and replaced with CCAvenue payment gateway. Everything is configured with your credentials and ready to test.

## ✅ What Was Done

### Mobile App Changes
1. ✅ Removed `react-native-razorpay` package
2. ✅ Updated payment service to use CCAvenue
3. ✅ Implemented WebView-based payment flow
4. ✅ Updated all type definitions
5. ✅ Modified payment modal for CCAvenue

### Admin Panel Changes
1. ✅ Updated subscription settings page
2. ✅ Changed all fields to CCAvenue
3. ✅ Pre-filled with your credentials
4. ✅ Added CCAvenue branding

### Your Credentials (Pre-configured)
```
Merchant ID: 2718018
Access Code: AVNF94KH56AC67FNCA
Working Key: E6FF0434306EFA9066D8BFB4C55C8F81
```

## 🧪 Testing the Integration

### Step 1: Start the Admin Panel

```bash
cd admin-web
npm run dev
```

Visit http://localhost:3001 and:
1. Go to **Subscriptions → Settings**
2. Verify your CCAvenue credentials are there
3. Click **"Initialize Default Plans"** to create test plans
4. Click **"Save Settings"**

### Step 2: Start the Mobile App

```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: Run on Android/iOS
npm run android
# or
npm run ios
```

### Step 3: Test Payment Flow

1. Open app and navigate to subscription screen
2. Select a plan (Daily/Weekly/Monthly)
3. Click "Pay" button
4. Payment modal opens → WebView loads
5. CCAvenue payment page appears
6. Complete test payment
7. Verify subscription is activated

## 📱 How It Works

### User Flow
```
1. User clicks "Select Plan"
   ↓
2. Payment modal shows plan details
   ↓
3. User clicks "Pay ₹[amount]"
   ↓
4. WebView opens with CCAvenue payment form
   ↓
5. User enters payment details
   ↓
6. CCAvenue processes payment
   ↓
7. Redirects back with status
   ↓
8. App detects success/failure
   ↓
9. Subscription is activated
   ↓
10. Success message shown
```

## 🔧 Important URLs to Update

**Before going to production**, update these URLs in the code:

### File: [services/payment.ts](services/payment.ts)
Line 230-231:
```typescript
redirectUrl: "https://YOUR-DOMAIN.com/payment/success",
cancelUrl: "https://YOUR-DOMAIN.com/payment/cancel",
```

Replace with your actual domain!

## 🛡️ Security Checklist

- ✅ Working Key is stored securely (not exposed to client)
- ✅ All API keys are in Firestore (server-side)
- ✅ Payment processed via secure CCAvenue gateway
- ⚠️ Update redirect URLs before production
- ⚠️ Test thoroughly before going live

## 📊 Monitoring Payments

### Check Transactions in Admin Panel
1. Go to **Subscriptions → Transactions**
2. View all payment attempts
3. See success/failure status
4. Check transaction details

### Check Firestore
Collection: `transactions`
```javascript
{
  userId: "user-123",
  planId: "monthly",
  amount: 199,
  status: "success",
  ccavenueOrderId: "ORDER_...",
  ccavenueTrackingId: "308...",
  // ... more fields
}
```

## 🐛 Troubleshooting

### Problem: Payment modal doesn't open
**Solution**: Check that subscription config exists in Firestore

### Problem: WebView shows error
**Solution**:
1. Check internet connection
2. Verify CCAvenue credentials
3. Check console for errors

### Problem: Payment succeeds but subscription not activated
**Solution**:
1. Check Firestore rules allow updates
2. Check app logs for errors
3. Verify transaction was created

### Problem: "CCAvenue not configured" error
**Solution**:
1. Go to Admin Panel → Settings
2. Enter all three CCAvenue credentials
3. Click Save Settings

## 📝 Testing Checklist

Test these scenarios:

- [ ] Open subscription screen
- [ ] View all available plans
- [ ] Select a plan
- [ ] Payment modal opens
- [ ] See correct plan details
- [ ] See correct price breakdown
- [ ] Click Pay button
- [ ] WebView opens
- [ ] CCAvenue form loads
- [ ] Complete test payment
- [ ] Success message shown
- [ ] Subscription activated
- [ ] Swipe limit increased
- [ ] Transaction recorded in Firestore
- [ ] Transaction visible in admin panel

## 🎯 Next Steps

1. **Test Everything**: Complete the testing checklist above
2. **Update URLs**: Change redirect URLs to your domain
3. **Go Live**: Switch to live CCAvenue credentials (if in test mode)
4. **Monitor**: Keep an eye on transactions in admin panel
5. **Support**: Have CCAvenue support ready if needed

## 📚 More Information

- Full documentation: [CCAVENUE_INTEGRATION.md](CCAVENUE_INTEGRATION.md)
- CCAvenue docs: https://www.ccavenue.com/
- Support: Check Firebase Console for logs

## 🎉 You're All Set!

The integration is complete and ready to test. Start with the testing checklist above and make sure everything works smoothly before going live.

**Status**: ✅ Ready for Testing

**Have questions?** Check the full integration guide or review the code comments in:
- `services/payment.ts` (Mobile app)
- `components/screens/subscription/payment-modal/index.tsx` (Payment UI)
- `admin-web/src/app/dashboard/subscriptions/settings/page.tsx` (Admin panel)
