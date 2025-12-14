# Admin Subscription Management System

Complete guide for managing subscriptions, plans, payments, and revenue through the admin web panel.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Accessing the Admin Panel](#accessing-the-admin-panel)
3. [Dashboard Features](#dashboard-features)
4. [Managing Subscription Plans](#managing-subscription-plans)
5. [Configuration & Settings](#configuration--settings)
6. [User Subscriptions](#user-subscriptions)
7. [Transactions & Revenue](#transactions--revenue)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The admin subscription management system provides complete control over:
- ✅ Subscription plans (pricing, features, limits)
- ✅ Payment gateway configuration (Razorpay keys)
- ✅ User subscription statuses
- ✅ Transaction history and revenue analytics
- ✅ Free trial settings

**Tech Stack:**
- Frontend: Next.js 14 (App Router)
- Database: Firebase Firestore
- Payment Gateway: Razorpay
- Styling: Tailwind CSS

---

## Accessing the Admin Panel

### URLs

**Development:**
```
http://localhost:3001/dashboard/subscriptions
```

**Production:**
```
https://your-admin-domain.com/dashboard/subscriptions
```

### Navigation

Once logged in, find subscription management in the sidebar:
- **Premium & Revenue** section
  - 📊 Subscriptions (Overview)
  - 📦 Plans (Add/Edit Plans)
  - ⚙️ Settings (Razorpay & Config)

---

## Dashboard Features

### Main Subscription Dashboard
**Path:** `/dashboard/subscriptions`

#### Key Metrics Displayed:

1. **Total Revenue**
   - All-time revenue
   - Today's revenue
   - Click to view transactions

2. **Premium Users**
   - Current premium user count
   - Conversion rate percentage
   - Click to view user details

3. **Active Subscriptions**
   - Currently active subscriptions
   - Expired subscriptions count
   - Click for detailed breakdown

4. **Successful Payments**
   - Successful transaction count
   - Failed transaction count
   - Click for payment history

#### Subscription Plans Overview

Visual cards showing:
- Plan name and description
- Pricing and duration
- Swipe limits
- Features list
- Revenue generated per plan
- Sales count per plan
- Active/Inactive status
- Popular badge

#### Configuration Summary

Quick view of:
- Free trial swipe limit
- Razorpay key status (test/live mode)
- Subscription system enabled/disabled
- Last update timestamp

---

## Managing Subscription Plans

### Viewing All Plans
**Path:** `/dashboard/subscriptions/plans`

**Features:**
- Table view of all plans
- Quick enable/disable toggle
- Delete plans
- Edit plans
- View plan features
- Revenue per plan

### Creating a New Plan
**Path:** `/dashboard/subscriptions/plans/new`

**Steps:**

1. **Basic Information:**
   - **Plan ID** (unique, lowercase, no spaces) - e.g., `weekly`
   - **Internal Name** - e.g., `Weekly Plan`
   - **Display Name** - User-facing name
   - **Description** - Short description

2. **Pricing & Limits:**
   - **Price** - Amount in rupees (e.g., 100)
   - **Currency** - INR, USD, EUR
   - **Duration** - Number of days (e.g., 7)
   - **Swipe Limit** - Daily swipes (-1 for unlimited)

3. **Features:**
   - Add multiple features
   - Remove features
   - Features display in app

4. **Settings:**
   - ✅ **Active** - Plan available for purchase
   - ✅ **Popular** - Show "Popular" badge

5. **Preview:**
   - See how plan appears in app
   - Real-time preview updates

**Example Plan:**
```javascript
{
  id: "weekly",
  name: "Weekly Plan",
  displayName: "Weekly Plan",
  description: "Most popular choice for serious daters",
  price: 100,
  currency: "INR",
  duration: 7,
  swipeLimit: 100,
  features: [
    "100 daily swipes",
    "See who likes you",
    "Priority matching",
    "Profile boost",
    "Advanced filters",
    "No ads"
  ],
  active: true,
  popular: true
}
```

### Editing an Existing Plan
**Path:** `/dashboard/subscriptions/plans/{planId}`

- All fields editable except Plan ID
- Changes take effect immediately
- Existing subscribers unaffected until renewal
- Preview updates in real-time

### Deleting a Plan

1. Go to Plans page
2. Click delete icon next to plan
3. Confirm deletion
4. Plan removed from Firestore

**⚠️ Warning:**
- Cannot delete if users have active subscriptions
- Consider deactivating instead

---

## Configuration & Settings

### Subscription Settings Page
**Path:** `/dashboard/subscriptions/settings`

#### General Settings

**Free Trial Swipe Limit:**
- Number of swipes per day for free users
- Default: 5 swipes
- Range: 0-999

**Enable Subscriptions:**
- Toggle to enable/disable entire subscription system
- When disabled:
  - Payment flows blocked
  - Users cannot upgrade
  - Existing subscriptions continue

#### Razorpay Configuration

**Razorpay Key ID:**
- Your public API key
- Visible during checkout
- Format: `rzp_test_xxxx` or `rzp_live_xxxx`

**Razorpay Key Secret:**
- Your private API secret
- Never shared publicly
- Password-protected input
- Click eye icon to show/hide

**Mode Detection:**
- **Test Mode** (keys start with `rzp_test_`)
  - No real charges
  - Use test cards
  - Safe for development

- **Live Mode** (keys start with `rzp_live_`)
  - Real payments processed
  - Production environment
  - Requires KYC verification

#### Getting Razorpay Keys

1. Go to https://dashboard.razorpay.com/signup
2. Create account & complete KYC
3. Navigate to **Settings** → **API Keys**
4. Generate keys:
   - **Test Keys**: For development/testing
   - **Live Keys**: For production
5. Copy both Key ID and Key Secret
6. Paste in admin settings

**Security Best Practices:**
- ✅ Use test keys for development
- ✅ Never commit keys to git
- ✅ Rotate keys regularly
- ✅ Enable webhook verification
- ✅ Use environment variables

---

## User Subscriptions

### User Subscriptions Page
**Path:** `/dashboard/subscriptions/users`

#### Filters Available:

- **All Users** - Show everyone
- **Premium Only** - Only premium users
- **Free Only** - Only free users
- **Active Subscriptions** - Currently active
- **Expired** - Expired premium users

#### User Data Displayed:

**User Information:**
- User ID (truncated)
- Join date

**Current Plan:**
- Plan badge (Free/Daily/Weekly/Monthly)
- Premium crown icon

**Swipes Usage:**
- Current usage (e.g., 45/100)
- Progress bar visualization
- Unlimited shown as ∞

**Subscription Period:**
- Start date
- End date
- Days remaining
- Expired indicator

**Status:**
- Active (green badge)
- Expired (yellow badge)
- Free (gray badge)

**Lifetime Swipes:**
- Total swipes ever made
- Trending indicator

#### Payment History Summary

View by plan:
- User count per plan
- Total revenue per plan
- Average revenue per user
- Conversion potential for free users

---

## Transactions & Revenue

### Transactions Page
**Path:** `/dashboard/subscriptions/transactions`

#### Revenue Statistics Cards:

1. **Total Revenue**
   - All-time earnings
   - Historical data

2. **This Month**
   - Current month revenue
   - Today's revenue

3. **Success Rate**
   - Percentage successful
   - Total vs successful count

4. **Average Order Value**
   - Average transaction amount
   - Per successful payment

#### Revenue by Plan

Breakdown showing:
- Total revenue per plan
- Transaction count per plan
- Average transaction value

#### Transaction Filters:

- **All** - All transactions
- **Success** - Completed payments
- **Failed** - Failed attempts
- **Pending** - In-progress payments

#### Transaction Details:

**Transaction Info:**
- Transaction ID
- Payment provider (Razorpay)

**User Details:**
- User name
- Email address

**Plan & Amount:**
- Plan name
- Amount in INR/USD/EUR

**Status:**
- ✅ Success (green)
- ❌ Failed (red)
- ⏱️ Pending (yellow)

**Timestamps:**
- Creation date & time
- Completion date

**Payment ID:**
- Razorpay payment ID
- For reconciliation

#### Export Transactions

Click **Export CSV** to download:
- All filtered transactions
- CSV format
- Columns: ID, User, Plan, Amount, Status, Date, Payment ID
- Filename: `transactions_YYYY-MM-DD.csv`

---

## Common Tasks

### Task 1: Change Free Trial Limit

1. Go to **Settings**
2. Update "Free Trial Swipe Limit"
3. Click **Save Settings**
4. ✅ New users get new limit immediately

### Task 2: Add a New Premium Plan

1. Go to **Plans** → **Add New Plan**
2. Fill in all details:
   - Plan ID: `premium_plus`
   - Price: ₹500
   - Duration: 30 days
   - Swipe Limit: -1 (unlimited)
3. Add features
4. Enable & mark as popular
5. Click **Create Plan**
6. ✅ Plan available in app immediately

### Task 3: Switch from Test to Live Mode

1. Go to **Settings**
2. Get live keys from Razorpay
3. Update both Key ID and Key Secret
4. Verify keys start with `rzp_live_`
5. Click **Save Settings**
6. ⚠️ Test payments with small amounts first
7. ✅ Live payments now processing

### Task 4: Disable a Plan Temporarily

1. Go to **Plans**
2. Find plan in table
3. Click **Active** toggle button
4. Plan becomes **Inactive**
5. ✅ Users can't purchase, existing users unaffected

### Task 5: View Revenue for Last Month

1. Go to **Transactions**
2. Check "This Month" card
3. View month revenue
4. Click **Export CSV** for details
5. Filter by plan if needed
6. ✅ Complete revenue report

### Task 6: Find User's Subscription Status

1. Go to **User Subscriptions**
2. Scroll through list or use filters
3. Find user by ID
4. View:
   - Current plan
   - Days remaining
   - Usage stats
5. ✅ Complete user subscription info

### Task 7: Update Plan Pricing

1. Go to **Plans**
2. Click plan name
3. Update price field
4. Click **Save Changes**
5. ⚠️ Existing subscribers keep old price until renewal
6. ✅ New purchases use new price

### Task 8: Add Feature to Existing Plan

1. Go to **Plans**
2. Click plan to edit
3. Scroll to **Features** section
4. Type new feature
5. Click **Add**
6. Click **Save Changes**
7. ✅ Feature shows in app immediately

---

## Troubleshooting

### Plans Not Loading in App

**Symptoms:**
- App shows "Loading plans..."
- No plans visible
- Empty plans page

**Solutions:**
1. Check Firestore:
   - Collection: `subscriptionPlans`
   - Document: `plans`
   - Verify data exists

2. Run initialization:
   ```bash
   # In app directory
   npm run start
   # Open subscription page in app
   # Data auto-initializes
   ```

3. Check console for errors
4. Verify Firebase config

### Payments Failing

**Symptoms:**
- All payments fail
- "Payment failed" error
- Transactions stuck in pending

**Solutions:**
1. **Check Razorpay Keys:**
   - Go to Settings
   - Verify Key ID is correct
   - Verify Key Secret is correct
   - Check mode (test/live)

2. **Verify Test Cards:**
   - Use: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Check Razorpay Dashboard:**
   - Login to Razorpay
   - Check for blocks/restrictions
   - Verify account status

4. **Check Console Logs:**
   - Open browser console
   - Look for payment errors
   - Check network tab

### Users Can't Swipe After Purchase

**Symptoms:**
- Payment successful
- Still shows "limit reached"
- Swipes not increased

**Solutions:**
1. **Check Transaction:**
   - Go to Transactions page
   - Find user's payment
   - Verify status is "Success"

2. **Check User Subscription:**
   - Go to User Subscriptions
   - Find user
   - Verify:
     - isPremium = true
     - currentPlan = purchased plan
     - swipesLimit = plan limit

3. **Manual Fix (if needed):**
   - Go to Firestore console
   - Collection: `userSubscriptions`
   - Document: `{userId}`
   - Update fields manually

4. **Refresh App:**
   - User should close and reopen app
   - Subscription data reloads

### Revenue Stats Not Updating

**Symptoms:**
- Revenue shows $0
- Old data displayed
- Stats don't match transactions

**Solutions:**
1. **Refresh Page:**
   - Hard refresh (Cmd/Ctrl + Shift + R)
   - Clear browser cache

2. **Check Transactions:**
   - Go to Transactions page
   - Verify transactions exist
   - Check status is "success"

3. **Check Time Filters:**
   - Stats calculate from transaction dates
   - Verify transaction timestamps
   - Check timezone

4. **Firestore Query:**
   - Verify indexes exist
   - Check permissions
   - Review console errors

### Can't Access Admin Panel

**Symptoms:**
- Login page redirects
- 403 Forbidden
- Page not found

**Solutions:**
1. **Verify URL:**
   - Dev: `http://localhost:3001`
   - Prod: Your admin domain

2. **Check Authentication:**
   - Ensure logged in
   - Check session validity
   - Clear cookies and re-login

3. **Verify Role:**
   - Check Firebase user
   - Verify admin claims
   - Review auth rules

4. **Start Server:**
   ```bash
   cd admin-web
   npm run dev
   ```

---

## Database Structure Reference

### Collections Used:

**1. subscriptionPlans/plans**
```javascript
{
  daily: { id, name, price, duration, ... },
  weekly: { id, name, price, duration, ... },
  monthly: { id, name, price, duration, ... }
}
```

**2. subscriptionConfig/default**
```javascript
{
  freeTrialSwipeLimit: 5,
  razorpayKeyId: "rzp_test_xxx",
  razorpayKeySecret: "secret_xxx",
  subscriptionEnabled: true,
  updatedAt: Timestamp,
  updatedBy: "admin"
}
```

**3. userSubscriptions/{userId}**
```javascript
{
  userId: "user123",
  currentPlan: "weekly",
  isPremium: true,
  swipesUsedToday: 45,
  swipesLimit: 100,
  planStartDate: Timestamp,
  planEndDate: Timestamp,
  paymentHistory: [...]
}
```

**4. transactions/{transactionId}**
```javascript
{
  id: "txn_xxx",
  userId: "user123",
  planId: "weekly",
  amount: 100,
  status: "success",
  razorpayPaymentId: "pay_xxx",
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

---

## API Endpoints Reference

### Admin Services (`/admin-web/src/services/subscriptions.ts`)

**Plans:**
- `getSubscriptionPlans()` - Fetch all plans
- `getSubscriptionPlan(planId)` - Get single plan
- `saveSubscriptionPlan(planData)` - Create/update plan
- `deleteSubscriptionPlan(planId)` - Delete plan

**Config:**
- `getSubscriptionConfig()` - Get configuration
- `updateSubscriptionConfig(config)` - Update settings

**Users:**
- `getUserSubscriptions(limit)` - Get all user subscriptions
- `getPremiumUsers()` - Get premium users only
- `getUserSubscription(userId)` - Get single user

**Transactions:**
- `getTransactions(limit)` - Get all transactions
- `getTransactionsByStatus(status)` - Filter by status

**Analytics:**
- `getRevenueStats()` - Revenue statistics
- `getSubscriptionStats()` - Subscription metrics

---

## Best Practices

### Security:
1. ✅ Never share Razorpay secrets
2. ✅ Use test mode for development
3. ✅ Rotate keys regularly
4. ✅ Enable 2FA on Razorpay account
5. ✅ Review transactions weekly

### Plan Management:
1. ✅ Test plans before activating
2. ✅ Use descriptive plan IDs
3. ✅ Update features regularly
4. ✅ Monitor plan performance
5. ✅ A/B test pricing

### User Experience:
1. ✅ Keep free trial generous (5-10 swipes)
2. ✅ Mark one plan as "Popular"
3. ✅ Price competitively
4. ✅ Offer value in features
5. ✅ Communicate benefits clearly

### Revenue Optimization:
1. ✅ Monitor conversion rates
2. ✅ Track revenue by plan
3. ✅ Identify drop-off points
4. ✅ Optimize pricing based on data
5. ✅ Experiment with plan tiers

---

## Support & Resources

### Documentation:
- [Subscription System Overview](SUBSCRIPTION_SYSTEM.md)
- [Razorpay Setup Guide](RAZORPAY_SETUP.md)
- [Premium Features Complete](PREMIUM_SUBSCRIPTION_COMPLETE.md)

### External Resources:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Next.js Documentation](https://nextjs.org/docs)

### Getting Help:
1. Check this documentation
2. Review console errors
3. Check Firestore data
4. Verify Razorpay dashboard
5. Test with fresh data

---

## Summary

The admin subscription management system provides:

✅ **Complete Control**
- Manage all subscription plans
- Configure payment gateway
- Monitor all transactions
- View user subscriptions
- Track revenue metrics

✅ **Easy to Use**
- Intuitive web interface
- Real-time updates
- Visual analytics
- One-click exports

✅ **Production Ready**
- Secure payment handling
- Comprehensive error handling
- Transaction logging
- Revenue tracking

✅ **Fully Integrated**
- Syncs with mobile app
- Real-time Firestore
- Razorpay payments
- Automatic updates

---

**Admin Panel Version:** 1.0.0
**Last Updated:** December 10, 2025
**Status:** ✅ Production Ready

---

## Quick Reference Card

| Task | Path | Action |
|------|------|--------|
| Add Plan | `/subscriptions/plans/new` | Fill form → Save |
| Edit Plan | `/subscriptions/plans/{id}` | Update → Save |
| Settings | `/subscriptions/settings` | Update keys → Save |
| View Revenue | `/subscriptions/transactions` | View stats → Export |
| Check Users | `/subscriptions/users` | Filter → View |
| Dashboard | `/subscriptions` | Overview stats |

---

**🎉 You're all set to manage subscriptions like a pro!**
