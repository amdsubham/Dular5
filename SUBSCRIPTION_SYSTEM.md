# Premium Subscription System

## Overview

A complete premium subscription system with Razorpay payment integration, swipe limit enforcement, and admin panel management.

---

## Features Implemented

### ✅ Core Features
- **3 Subscription Plans**: Daily (₹30), Weekly (₹100), Monthly (₹300)
- **Swipe Limit Enforcement**: Tracks daily swipe usage and enforces limits
- **Free Trial**: Configurable free swipe limit (default: 5 swipes)
- **Real-time Subscription Status**: Auto-updates across the app
- **Swipe Limit Modal**: Shows when user reaches their daily limit
- **Subscription Plans Page**: Beautiful UI to view and select plans
- **Auto-Reset**: Daily swipe count resets automatically at midnight

### 🏗️ Architecture Components

#### 1. Type System (`/types/subscription.ts`)
- Complete TypeScript interfaces for all subscription entities
- Helper functions for validation and formatting
- Enums for payment status and providers

#### 2. Service Layer (`/services/subscription.ts`)
- `getUserSubscription()` - Fetch user's current subscription
- `canUserSwipe()` - Check if user can swipe
- `incrementSwipeCount()` - Increment after swipe
- `upgradeSubscription()` - Upgrade to premium plan
- `getSubscriptionPlans()` - Fetch available plans
- `getSubscriptionConfig()` - Get global settings

#### 3. Context & State (`/contexts/SubscriptionContext.tsx`)
- Global subscription state management
- Real-time Firestore listeners
- Auto-refresh on changes
- Provides data to entire app

#### 4. Custom Hook (`/hooks/useSubscription.ts`)
- Convenient wrapper around SubscriptionContext
- Error handling built-in
- Simple API for components

#### 5. UI Components
- **Swipe Limit Modal** (`/components/screens/home/swipe-limit-modal/index.tsx`)
  - Shows when limit reached
  - Displays usage stats
  - Upgrade CTA for free users

- **Subscription Plans Page** (`/app/(protected)/subscription/index.tsx`)
  - View all available plans
  - Current plan status
  - Swipe usage stats
  - Beautiful plan cards with features

---

## Firestore Database Structure

### Collections

#### 1. `subscriptionPlans`
Stores available subscription plans.

**Document: `plans`**
```javascript
{
  daily: {
    id: "daily",
    name: "Daily Plan",
    displayName: "Daily Plan",
    description: "Perfect for casual dating",
    price: 30,
    currency: "INR",
    duration: 1,
    swipeLimit: 50,
    features: ["50 daily swipes", "See who likes you", ...],
    active: true,
    popular: false,
    createdAt: Timestamp,
    updatedAt: Timestamp
  },
  weekly: { ... },
  monthly: { ... }
}
```

#### 2. `subscriptionConfig`
Global subscription configuration.

**Document: `default`**
```javascript
{
  freeTrialSwipeLimit: 5,
  razorpayKeyId: "rzp_test_...",
  razorpayKeySecret: "...",
  subscriptionEnabled: true,
  updatedAt: Timestamp,
  updatedBy: "admin_user_id"
}
```

#### 3. `userSubscriptions`
Per-user subscription status.

**Document ID: `userId`**
```javascript
{
  userId: "user123",
  currentPlan: "free" | "daily" | "weekly" | "monthly",
  planStartDate: Timestamp,
  planEndDate: Timestamp,
  swipesUsedToday: 0,
  swipesLimit: 5,
  lastSwipeDate: Timestamp,
  totalSwipesAllTime: 0,
  isActive: true,
  isPremium: false,
  autoRenew: false,
  paymentHistory: [
    {
      transactionId: "txn_123",
      planId: "weekly",
      amount: 100,
      date: Timestamp,
      status: "success"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4. `transactions`
Payment transaction records.

**Document ID: Auto-generated**
```javascript
{
  id: "doc_id",
  userId: "user123",
  userEmail: "user@example.com",
  userName: "John Doe",
  planId: "weekly",
  planName: "Weekly Plan",
  amount: 100,
  currency: "INR",
  provider: "razorpay",
  razorpayOrderId: "order_123",
  razorpayPaymentId: "pay_123",
  razorpaySignature: "signature",
  status: "success" | "pending" | "failed",
  statusMessage: "Payment successful",
  createdAt: Timestamp,
  completedAt: Timestamp,
  metadata: {
    deviceInfo: "iOS 15.0",
    appVersion: "1.0.0"
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install react-native-razorpay
npm install firebase-admin  # For initialization script
```

### 2. Initialize Firestore Data

Run the initialization script to create default plans and config:

```bash
node scripts/init-subscriptions.js
```

This will create:
- 3 subscription plans (Daily, Weekly, Monthly)
- Default configuration with Razorpay test keys
- Free trial limit (5 swipes)

### 3. Configure Razorpay

The script automatically sets up test keys:
- **Test API Key**: `rzp_test_RppoO9N9nmGALz`
- **Test Key Secret**: `FJm3HQKomPlfTHt1xknBUCDW`

**For Production:**
1. Go to admin panel
2. Navigate to Settings > Subscription
3. Update with production Razorpay keys

### 4. Test the Flow

1. **Free User Experience**:
   - New users get 5 free swipes per day
   - After 5 swipes, swipe limit modal appears
   - Modal prompts to upgrade to premium

2. **View Plans**:
   - Navigate to `/subscription` page
   - View available plans
   - See current plan status

3. **Upgrade Flow** (TODO: Razorpay integration):
   - Select a plan
   - Payment modal opens (coming soon)
   - Complete payment
   - Subscription activated

---

## How It Works

### Swipe Flow

```
User attempts to swipe
        ↓
Check: canSwipe()
        ↓
    [Yes] ─────────→ Increment count → Record swipe
        ↓
    [No]
        ↓
Show Swipe Limit Modal
        ↓
User clicks "Upgrade"
        ↓
Navigate to /subscription
        ↓
User selects plan
        ↓
Payment modal (TODO)
        ↓
Complete payment
        ↓
Upgrade subscription
        ↓
Swipe limits updated
```

### Daily Reset Logic

Swipes automatically reset at midnight:
- `shouldResetSwipeCount()` checks if it's a new day
- Compares `lastSwipeDate` with current date
- If different day, resets `swipesUsedToday` to 0
- Happens automatically on next swipe attempt

### Subscription Expiry

For premium users:
- `isSubscriptionExpired()` checks if `planEndDate` has passed
- If expired, automatically downgrades to free plan
- User notified to renew subscription

---

## Usage in Components

### Check if User Can Swipe

```typescript
import { useSubscription } from "@/hooks/useSubscription";

function MyComponent() {
  const { canSwipe, swipesRemaining } = useSubscription();

  if (!canSwipe) {
    return <SwipeLimitModal />;
  }

  return <SwipeInterface />;
}
```

### Increment Swipe Count

```typescript
const { incrementSwipe } = useSubscription();

const handleSwipe = async () => {
  if (!canSwipe) {
    setShowLimitModal(true);
    return;
  }

  await incrementSwipe();
  // Continue with swipe logic
};
```

### Get Subscription Info

```typescript
const {
  subscription,
  isPremium,
  swipesRemaining,
  swipesUsedToday,
  swipesLimit,
  daysRemaining,
} = useSubscription();
```

---

## Admin Panel Integration

### TODO: Admin Features

The following admin features need to be implemented:

1. **Subscription Dashboard** (`/admin-web/src/app/dashboard/subscriptions/page.tsx`)
   - Total users by plan
   - Revenue metrics
   - Conversion rates
   - Recent transactions

2. **Plans Management** (`/admin-web/src/app/dashboard/plans/page.tsx`)
   - Edit plan pricing
   - Change swipe limits
   - Enable/disable plans
   - Set popular badge

3. **Settings Page** (`/admin-web/src/app/dashboard/settings/page.tsx`)
   - Update Razorpay keys
   - Set free trial limit
   - Enable/disable subscriptions
   - Configure features

4. **Transactions Page** (`/admin-web/src/app/dashboard/transactions/page.tsx`)
   - View all transactions
   - Filter by status
   - Export to CSV
   - Refund management

---

## Payment Integration (TODO)

### Next Steps for Razorpay

1. **Create Payment Modal** (`/components/screens/subscription/payment-modal/index.tsx`)
   - Display plan summary
   - Show Razorpay checkout
   - Handle payment callbacks

2. **Create Order API** (`/services/payment.ts`)
   ```typescript
   const createRazorpayOrder = async (planId: string) => {
     // Call your backend to create Razorpay order
     // Backend should use Razorpay API
   };
   ```

3. **Verify Payment** (Backend required)
   - Verify Razorpay signature
   - Update user subscription
   - Create transaction record

4. **Handle Webhooks** (Backend required)
   - Listen for Razorpay webhooks
   - Handle payment events
   - Update subscription status

### Payment Flow

```
User selects plan
      ↓
Create Razorpay order (backend)
      ↓
Open Razorpay checkout
      ↓
User completes payment
      ↓
Verify signature (backend)
      ↓
Update user subscription
      ↓
Create transaction record
      ↓
Show success message
```

---

## Testing

### Test Free Trial

1. Create a new user account
2. Go to home screen and swipe
3. After 5 swipes, you should see the limit modal
4. Click "Upgrade Now" to see subscription plans

### Test Premium Features

To manually test premium features:

1. Go to Firestore console
2. Find your user in `userSubscriptions` collection
3. Update fields:
   ```javascript
   currentPlan: "weekly"
   isPremium: true
   swipesLimit: 100
   planStartDate: [current date]
   planEndDate: [7 days from now]
   ```
4. Refresh the app
5. You should have 100 swipes per day

### Reset Swipe Count

To test daily reset:

1. Set `lastSwipeDate` to yesterday's date
2. Attempt a swipe
3. System should automatically reset `swipesUsedToday` to 0

---

## Configuration

### Adjust Swipe Limits

**Option 1: Firestore Console**
```
subscriptionPlans/plans/daily/swipeLimit: 50 → 75
```

**Option 2: Admin Panel (TODO)**
- Go to Plans Management
- Edit Daily Plan
- Change "Daily Swipe Limit" to 75
- Save changes

### Change Free Trial Limit

**Option 1: Firestore Console**
```
subscriptionConfig/default/freeTrialSwipeLimit: 5 → 10
```

**Option 2: Admin Panel (TODO)**
- Go to Settings
- Change "Free Trial Swipe Limit" to 10
- Save changes

### Update Pricing

**Option 1: Firestore Console**
```
subscriptionPlans/plans/weekly/price: 100 → 150
```

**Option 2: Admin Panel (TODO)**
- Go to Plans Management
- Edit Weekly Plan
- Change "Price (INR)" to 150
- Save changes

---

## Security Considerations

### Firestore Security Rules

Add these rules to protect subscription data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Subscription plans (read-only for users)
    match /subscriptionPlans/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // Subscription config (read-only for users)
    match /subscriptionConfig/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write
    }

    // User subscriptions (users can only read their own)
    match /userSubscriptions/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only backend/admin can write
    }

    // Transactions (users can only read their own)
    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false; // Only backend can write
    }
  }
}
```

### Important Notes

- ⚠️ **Never expose Razorpay Key Secret to client**
- ⚠️ **Always verify payments on backend**
- ⚠️ **Use Firestore Security Rules to protect data**
- ⚠️ **Implement rate limiting for swipe actions**

---

## Troubleshooting

### Issue: Swipe limit not updating

**Solution**:
- Check if `incrementSwipe()` is being called
- Verify Firestore write permissions
- Check console for errors

### Issue: Plans not loading

**Solution**:
- Run `node scripts/init-subscriptions.js`
- Verify Firestore collections exist
- Check network connectivity

### Issue: Subscription not syncing

**Solution**:
- Check if SubscriptionProvider is in _layout.tsx
- Verify Firebase is initialized
- Check real-time listener in SubscriptionContext

---

## Future Enhancements

### Planned Features

1. **Auto-Renewal**
   - Automatic subscription renewal
   - Renewal reminders

2. **Promo Codes**
   - Discount codes
   - Referral bonuses

3. **Multiple Payment Options**
   - UPI
   - Credit/Debit cards
   - Net banking
   - Wallets

4. **Subscription Analytics**
   - User behavior tracking
   - Conversion funnels
   - Revenue reports

5. **Push Notifications**
   - Swipe limit reminders
   - Subscription expiry alerts
   - Special offers

6. **A/B Testing**
   - Test different pricing
   - Feature experiments
   - UI variations

---

## Support

For issues or questions:
- Check the troubleshooting section
- Review Firestore console for data integrity
- Check browser/app console for errors
- Contact development team

---

## Summary

✅ **Completed**:
- TypeScript types and interfaces
- Subscription service layer
- Context and custom hook
- Swipe limit enforcement
- Swipe limit modal
- Subscription plans page
- Firestore initialization script

🚧 **TODO**:
- Razorpay payment modal
- Payment verification (backend)
- Admin panel pages
- Subscription analytics
- Auto-renewal logic

---

**Last Updated**: 2025-12-10
**Version**: 1.0.0
