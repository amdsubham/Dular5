# Instamojo Webhook Setup Guide

## 🚨 CRITICAL: Webhook Configuration Missing

The payment webhook is currently **FAILING** because the Instamojo configuration is not set up in Firestore.

## Error in Firebase Logs:
```
❌ Instamojo configuration not found in Firestore
```

## ✅ How to Fix:

### Step 1: Get Your Instamojo Private Salt

1. Go to [Instamojo Dashboard](https://www.instamojo.com/)
2. Navigate to **API & Plugins** → **Webhooks**
3. Find your **Private Salt** (it looks like a long random string)
4. Copy it

### Step 2: Add Configuration to Firestore

#### Option A: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/dular5/firestore)
2. Navigate to **Firestore Database**
3. Create a new collection called `subscriptionConfig` (if it doesn't exist)
4. Create a new document with ID: `instamojo`
5. Add the following fields:

```
{
  "instamojoPrivateSalt": "YOUR_PRIVATE_SALT_HERE",
  "instamojoSmartLinks": {
    "daily": "https://imjo.in/hbvW2s",
    "weekly": "https://imjo.in/xU7gCw",
    "monthly": "https://imjo.in/qQBgZ7"
  },
  "paymentProvider": "instamojo",
  "subscriptionEnabled": true,
  "freeTrialSwipeLimit": 5,
  "updatedAt": <Timestamp: now>,
  "updatedBy": "system"
}
```

#### Option B: Using Firebase CLI

```bash
# Create a temporary file with the config
cat > /tmp/instamojo-config.json << EOF
{
  "instamojoPrivateSalt": "YOUR_PRIVATE_SALT_HERE",
  "instamojoSmartLinks": {
    "daily": "https://imjo.in/hbvW2s",
    "weekly": "https://imjo.in/xU7gCw",
    "monthly": "https://imjo.in/qQBgZ7"
  },
  "paymentProvider": "instamojo",
  "subscriptionEnabled": true,
  "freeTrialSwipeLimit": 5
}
EOF

# Import to Firestore
firebase firestore:set subscriptionConfig/instamojo /tmp/instamojo-config.json
```

### Step 3: Configure Webhook in Instamojo

For EACH smart link (Daily, Weekly, Monthly), you need to configure the webhook:

1. Go to your [Instamojo Smart Links](https://www.instamojo.com/@subham_routray)
2. Edit each smart link
3. In the settings, find **Webhook URL** section
4. Add this webhook URL:
   ```
   https://us-central1-dular5.cloudfunctions.net/instamojoWebhook
   ```
5. Save the changes

### Step 4: Verify Setup

1. Make a test payment using one of the smart links
2. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only instamojoWebhook
   ```
3. You should see logs like:
   ```
   ✅ MAC verification successful
   💰 Payment successful! Payment ID: MOJO...
   🔍 Looking up user with phone...
   ✅ Found user with phone format: 7008105210
   ✅ User subscription updated successfully
   ```

## 📋 Current Smart Links:

- **Daily Plan (₹49)**: https://imjo.in/hbvW2s
- **Weekly Plan (₹199)**: https://imjo.in/xU7gCw
- **Monthly Plan (₹499)**: https://imjo.in/qQBgZ7

## 🔍 Troubleshooting:

### Issue: "User not found"
- Make sure the phone number in Instamojo matches the phone number in Firebase exactly
- The webhook tries 6 different phone formats, so it should work with +91, 91, or without prefix

### Issue: "Invalid MAC"
- Double-check that you copied the correct Private Salt from Instamojo
- Make sure there are no extra spaces or characters

### Issue: "Transaction not found"
- This is OK - the webhook will create a new transaction automatically
- The plan type is determined by the payment amount

## 📱 Testing Payment Flow:

1. Install the new APK
2. Login with phone: **7008105210**
3. Go to Subscription page
4. Select a plan (e.g., Daily - ₹49)
5. Complete payment on Instamojo
6. Wait on the status page for 3-5 seconds
7. App will automatically verify subscription and show success

The app now polls the subscription status for up to 20 seconds to ensure the webhook has processed the payment before showing success.
