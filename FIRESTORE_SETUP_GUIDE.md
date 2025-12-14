# Firestore Setup Guide for CCAvenue

## Why is the Pay Button Not Working?

The pay button is not working because the **CCAvenue configuration hasn't been initialized in Firestore yet**. The app needs this configuration to process payments.

## 🚀 Quick Fix - Option 1: Using Firebase Console (Recommended)

### Step 1: Go to Firebase Console

1. Open https://console.firebase.google.com/
2. Select your project: **dular-c0e66**
3. Click on **Firestore Database** in the left menu

### Step 2: Create Subscription Config

1. Click **"Start collection"** (or navigate to existing collections)
2. **Collection ID**: `subscriptionConfig`
3. **Document ID**: `default`
4. Add these fields:

```
Field Name                  Type        Value
-------------------------------------------------
freeTrialSwipeLimit        number      5
ccavenueAccessCode         string      AVNF94KH56AC67FNCA
ccavenueMerchantId         string      2718018
ccavenueWorkingKey         string      E6FF0434306EFA9066D8BFB4C55C8F81
subscriptionEnabled        boolean     true
updatedAt                  timestamp   (current time)
updatedBy                  string      admin
```

### Step 3: Create Subscription Plans

1. Create another collection
2. **Collection ID**: `subscriptionPlans`
3. **Document ID**: `plans`
4. Add a **map** field for each plan:

**Field: `daily` (type: map)**
```
id: "daily"
name: "daily"
displayName: "Daily Premium"
description: "Perfect for trying out premium features"
price: 49
currency: "INR"
duration: 1
swipeLimit: 100
active: true
popular: false
features: ["See who likes you", "Unlimited swipes", "Priority matching", "No ads"]
createdAt: (timestamp - current time)
updatedAt: (timestamp - current time)
```

**Field: `weekly` (type: map)**
```
id: "weekly"
name: "weekly"
displayName: "Weekly Premium"
description: "Best value for exploring your matches"
price: 199
currency: "INR"
duration: 7
swipeLimit: -1
active: true
popular: true
features: ["See who likes you", "Unlimited swipes", "Priority matching", "Profile boost", "Advanced filters", "No ads"]
createdAt: (timestamp - current time)
updatedAt: (timestamp - current time)
```

**Field: `monthly` (type: map)**
```
id: "monthly"
name: "monthly"
displayName: "Monthly Premium"
description: "Ultimate experience with all features"
price: 499
currency: "INR"
duration: 30
swipeLimit: -1
active: true
popular: false
features: ["See who likes you", "Unlimited swipes", "Priority matching", "Daily profile boost", "Advanced filters", "Read receipts", "No ads"]
createdAt: (timestamp - current time)
updatedAt: (timestamp - current time)
```

### Step 4: Restart Your App

1. Stop the app (Ctrl+C in terminal where Expo is running)
2. Restart: `npm start`
3. The pay button should now work!

---

## 🔧 Option 2: Using Admin Web Panel

### Step 1: Start Admin Panel

```bash
cd admin-web
npm install  # if not done already
npm run dev
```

### Step 2: Navigate to Settings

1. Open http://localhost:3001
2. Go to **Dashboard → Subscriptions → Settings**
3. Enter your CCAvenue credentials:
   - Merchant ID: `2718018`
   - Access Code: `AVNF94KH56AC67FNCA`
   - Working Key: `E6FF0434306EFA9066D8BFB4C55C8F81`
4. Set Free Trial Swipe Limit: `5`
5. Enable Subscriptions: ✓
6. Click **"Save Settings"**

### Step 3: Initialize Default Plans

1. Still on the Settings page
2. Click **"Initialize Default Plans"** button
3. Wait for success message

### Step 4: Restart Mobile App

```bash
# In mobile app terminal
npm start
```

---

## 🐛 Option 3: Fix Firestore Security Rules

If you want to use the script, you need to update Firestore security rules:

1. Go to Firebase Console → Firestore → Rules
2. Add these rules (temporarily for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for subscription config and plans
    match /subscriptionConfig/{document=**} {
      allow read, write: if true;  // Change this in production!
    }
    match /subscriptionPlans/{document=**} {
      allow read, write: if true;  // Change this in production!
    }

    // Your other existing rules...
  }
}
```

3. Click **Publish**
4. Run the script again:
```bash
node scripts/init-ccavenue-config.js
```

⚠️ **Warning**: The rules above allow anyone to read/write. Use only for development. Update with proper authentication rules for production!

---

## ✅ How to Verify It's Working

After completing any of the above options:

1. **Open your app**
2. **Navigate to Subscription screen**
3. **Click on any plan**
4. **Click "Pay" button**
5. You should see:
   - ✅ "Processing..." message
   - ✅ WebView opens
   - ✅ CCAvenue payment form loads

If you see an error message, check the console logs for details.

---

## 📊 Verify in Firebase Console

After setup, you should see these collections in Firestore:

```
📁 subscriptionConfig
  └── 📄 default
       ├── ccavenueAccessCode: "AVNF94KH56AC67FNCA"
       ├── ccavenueMerchantId: "2718018"
       ├── ccavenueWorkingKey: "E6FF0434..."
       └── ...

📁 subscriptionPlans
  └── 📄 plans
       ├── daily: { ... }
       ├── weekly: { ... }
       └── monthly: { ... }
```

---

## 🎯 Quick Troubleshooting

### Error: "CCAvenue not configured"
- **Solution**: Follow Option 1 or 2 above to create the config

### Error: "No plans available"
- **Solution**: Create the subscriptionPlans document as shown above

### Error: "Permission denied"
- **Solution**: Update Firestore security rules (Option 3)

### Pay button still not working
- **Solution**:
  1. Check browser console for errors
  2. Verify Firestore collections are created correctly
  3. Restart the app
  4. Clear app cache

---

## 📝 Summary

**Easiest Method**: Use Firebase Console (Option 1)
- Takes 5-10 minutes
- No code changes needed
- Most reliable

**Alternative**: Use Admin Panel (Option 2)
- More user-friendly
- Requires admin panel to be running
- May need authentication setup

Choose the method that works best for you!
