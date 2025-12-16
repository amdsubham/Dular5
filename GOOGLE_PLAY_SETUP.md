# Google Play Billing Setup Guide

This guide will walk you through setting up Google Play Billing for your Dular app.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Play Console Setup](#google-play-console-setup)
3. [Configure Subscription Products](#configure-subscription-products)
4. [Create Service Account](#create-service-account)
5. [Setup Real-Time Developer Notifications](#setup-real-time-developer-notifications)
6. [Configure Firebase](#configure-firebase)
7. [Deploy Cloud Functions](#deploy-cloud-functions)
8. [Testing](#testing)

---

## Prerequisites

- Google Play Developer account ($25 one-time fee)
- App published on Google Play (at least in Internal Testing)
- Google Cloud project with billing enabled
- Firebase project connected to your app

---

## Google Play Console Setup

### Step 1: Create Your App

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select your existing app
3. Complete the app setup (store listing, content rating, etc.)
4. Publish to at least Internal Testing track

---

## Configure Subscription Products

### Step 1: Create Subscription Products

1. In Google Play Console, go to **Monetization setup** → **Subscriptions**
2. Click **Create subscription**

Create three subscriptions with these Product IDs:

#### Daily Plan
- **Product ID**: `dular_daily_subscription`
- **Name**: Daily Premium
- **Description**: Premium access for 1 day with unlimited swipes
- **Billing period**: 1 day
- **Price**: ₹30 (or your chosen price)
- **Free trial**: None (optional: 3 days)
- **Grace period**: 3 days (optional)

#### Weekly Plan
- **Product ID**: `dular_weekly_subscription`
- **Name**: Weekly Premium
- **Description**: Premium access for 7 days with unlimited swipes
- **Billing period**: 1 week
- **Price**: ₹180 (or your chosen price)
- **Free trial**: None (optional: 7 days)
- **Grace period**: 3 days (optional)

#### Monthly Plan
- **Product ID**: `dular_monthly_subscription`
- **Name**: Monthly Premium
- **Description**: Premium access for 30 days with unlimited swipes
- **Billing period**: 1 month
- **Price**: ₹450 (or your chosen price)
- **Free trial**: None (optional: 7 days)
- **Grace period**: 3 days (optional)

3. **Activate** all three subscriptions

> **Important**: Product IDs must match exactly with the SKUs defined in `services/google-play-subscription.ts`

---

## Create Service Account

### Step 1: Enable Google Play Developer API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for "Google Play Android Developer API"
5. Click **Enable**

### Step 2: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Enter details:
   - **Name**: `google-play-billing`
   - **Description**: Service account for Google Play Billing webhook
4. Click **Create and Continue**
5. **Grant this service account access**:
   - Skip this step (no role needed here)
6. Click **Done**

### Step 3: Create Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Click **Create** (this will download a JSON file)
6. **Save this file securely** - you'll need it later

### Step 4: Grant API Access in Play Console

1. Go back to [Google Play Console](https://play.google.com/console)
2. Go to **Setup** → **API access**
3. Link your Google Cloud project (if not already linked)
4. Under **Service accounts**, find the service account you created
5. Click **Grant access**
6. **Permissions**:
   - View app information and download bulk reports (read-only)
   - View financial data, orders, and cancellation survey responses
   - Manage orders and subscriptions
7. Click **Invite user**

---

## Setup Real-Time Developer Notifications

### Step 1: Create Pub/Sub Topic

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **Pub/Sub** → **Topics**
3. Click **Create Topic**
4. **Topic ID**: `play-billing-notifications`
5. Click **Create**

### Step 2: Grant Google Play Permission

1. In the topic you just created, click **Permissions**
2. Click **Add Principal**
3. **New principals**: `google-play-developer-notifications@system.gserviceaccount.com`
4. **Role**: Pub/Sub Publisher
5. Click **Save**

### Step 3: Configure in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Go to **Monetization setup** → **Real-time developer notifications**
3. **Topic name**: Enter the full topic path:
   ```
   projects/YOUR-PROJECT-ID/topics/play-billing-notifications
   ```
   Replace `YOUR-PROJECT-ID` with your actual Google Cloud project ID
4. Click **Send test notification** to verify
5. Click **Save**

---

## Configure Firebase

### Step 1: Update Firestore Configuration

1. Go to Firebase Console → Firestore Database
2. Navigate to `subscriptionConfig/default` document
3. Add the following fields:

```json
{
  "googlePlay": {
    "packageName": "com.dular.app",
    "serviceAccountKey": "<PASTE_ENTIRE_SERVICE_ACCOUNT_JSON_HERE>"
  },
  "subscriptionEnabled": true,
  "paymentProvider": "google_play"
}
```

**How to get the serviceAccountKey value**:
1. Open the JSON file you downloaded in Step 3 of "Create Service Account"
2. Copy the **entire contents** of the file
3. Paste it as a string in the `serviceAccountKey` field
4. Make sure it's properly escaped (Firebase console should handle this)

### Step 2: Update Package Name

Make sure your package name matches across:
- `app.json` (in your project root)
- `android/app/build.gradle` (applicationId)
- Firestore config (above)
- Google Play Console app

---

## Deploy Cloud Functions

### Step 1: Build Functions

```bash
cd functions
npm run build
```

### Step 2: Deploy

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy only the Google Play webhook
firebase deploy --only functions:googlePlayWebhook
```

### Step 3: Verify Deployment

1. Go to Firebase Console → Functions
2. You should see `googlePlayWebhook` listed
3. Check the logs for any deployment errors

---

## Testing

### Step 1: Add Test Accounts

1. Go to Google Play Console → **Setup** → **License testing**
2. Add tester email addresses
3. These accounts can make test purchases without being charged

### Step 2: Configure Test Track

1. Go to **Release** → **Testing** → **Internal testing**
2. Create a release with your app
3. Add testers to the testing track
4. Share the opt-in link with testers

### Step 3: Test Purchase Flow

1. Install the app from Google Play (via Internal Testing)
2. Log in with a test account
3. Go to Subscription screen
4. Try purchasing a subscription
5. The purchase should complete successfully

### Step 4: Verify Webhook

1. Go to Firebase Console → Functions → Logs
2. Filter for `googlePlayWebhook`
3. You should see logs showing:
   - Notification received
   - User identified
   - Subscription activated

### Step 5: Verify Firestore

1. Go to Firebase Console → Firestore Database
2. Check `userSubscriptions/{userId}`:
   - `currentPlan` should be updated
   - `isActive` should be `true`
   - `endDate` should be set correctly
3. Check `transactions` collection:
   - New transaction with `provider: "google_play"`
   - Contains `googlePlayPurchaseToken` and `googlePlayOrderId`

---

## Troubleshooting

### Webhook Not Receiving Notifications

1. **Check Pub/Sub Topic**:
   ```bash
   gcloud pubsub topics list
   ```
   Verify `play-billing-notifications` exists

2. **Check Permissions**:
   - Ensure Google Play service account has Publisher role on the topic

3. **Check Function Logs**:
   ```bash
   firebase functions:log --only googlePlayWebhook
   ```

4. **Test Pub/Sub Directly**:
   ```bash
   gcloud pubsub topics publish play-billing-notifications --message '{"test": "message"}'
   ```

### Purchase Not Completing

1. **Check if on Android**:
   - Google Play Billing only works on Android devices
   - Won't work on iOS or emulators without Google Play Services

2. **Check Google Play Services**:
   - Device must have Google Play Services installed and up to date

3. **Check Package Name**:
   - Must match exactly between app and Google Play Console

4. **Check Subscription Status**:
   - Go to Google Play Console → Orders
   - Verify the purchase appears

### Subscription Not Activating

1. **Check User ID**:
   - Verify `obfuscatedAccountIdAndroid` is being passed correctly
   - Check webhook logs for user identification

2. **Check Service Account Key**:
   - Verify it's correctly pasted in Firestore
   - Ensure it has proper permissions

3. **Check Firestore Rules**:
   - Ensure webhook can write to `userSubscriptions`
   - Ensure webhook can write to `transactions`

---

## Security Best Practices

1. **Never commit service account keys** to version control
2. **Store keys only in Firestore** or Firebase Functions config
3. **Enable Firestore security rules** to protect user data
4. **Monitor webhook logs** for suspicious activity
5. **Validate all webhook notifications** before processing

---

## Pricing & Fees

### Google Play Fees

- **15%** for first $1M revenue per year
- **30%** after $1M revenue per year

### Example

If a user purchases a ₹30 subscription:
- Google takes: ₹4.50 (15%)
- You receive: ₹25.50

---

## Next Steps

1. ✅ Complete all setup steps above
2. ✅ Test with test accounts
3. ✅ Verify webhook is working
4. ✅ Update pricing as needed
5. ✅ Publish app to Production track
6. ✅ Monitor analytics and revenue

---

## Support

For issues or questions:
- Google Play Billing docs: https://developer.android.com/google/play/billing
- Firebase Functions docs: https://firebase.google.com/docs/functions
- React Native IAP docs: https://github.com/dooboolab/react-native-iap

---

## Subscription SKU Reference

```typescript
// In services/google-play-subscription.ts
export const SUBSCRIPTION_SKUS = {
  daily: 'dular_daily_subscription',    // Must match Google Play Console
  weekly: 'dular_weekly_subscription',   // Must match Google Play Console
  monthly: 'dular_monthly_subscription', // Must match Google Play Console
};
```

Make sure these match **exactly** with the Product IDs you created in Google Play Console.
