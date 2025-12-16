# 🔧 Instamojo Smart Link Configuration Guide

## 🚨 CRITICAL: Smart Links Must Collect Phone Number

The webhook **REQUIRES** the phone number from the payment to match with users in your database. Without this, payments will fail to activate subscriptions.

---

## ✅ Step-by-Step Configuration

### **For Each Smart Link (Daily, Weekly, Monthly):**

1. Go to [Instamojo Dashboard](https://www.instamojo.com/@subham_routray)

2. Click on **"Links"** or **"Payment Links"** in the left menu

3. Find your smart links:
   - Daily Plan: https://imjo.in/hbvW2s
   - Weekly Plan: https://imjo.in/xU7gCw
   - Monthly Plan: https://imjo.in/qQBgZ7

4. Click **"Edit"** or **"Settings"** for each link

### **Required Fields Configuration:**

Enable and make **REQUIRED** these fields:

#### ✅ **Phone Number** (CRITICAL!)
- Field name: `Phone Number` or `Mobile Number`
- **Must be REQUIRED** (not optional)
- This is the field the webhook uses to identify the user

#### ✅ **Name**
- Field name: `Name` or `Buyer Name`
- Required (for transaction records)

#### ✅ **Email**
- Field name: `Email`
- Required (for transaction records)

### **Webhook URL Configuration:**

In the same settings page, find **"Webhook URL"** section:

1. Enable webhook notifications
2. Add this URL:
   ```
   https://us-central1-dular5.cloudfunctions.net/instamojoWebhook
   ```
3. Make sure webhook is **ACTIVE**

### **Other Important Settings:**

- **Redirect URL after success**: Optional (can leave empty)
- **Redirect URL after failure**: Optional (can leave empty)
- **Send confirmation email**: Enable (optional but recommended)
- **Show thank you page**: Enable

---

## 🧪 Testing the Configuration

### **Step 1: Check Current Configuration**

Make a test payment and check Firebase logs:

```bash
firebase functions:log --only instamojoWebhook
```

Look for these lines:
```
📦 Extracted fields:
  - buyer_phone: 7008105210     ← MUST be present!
  - buyer_name: Test User
  - buyer_email: test@example.com
  - phone: 7008105210            ← Alternative field name
```

### **Step 2: What the Logs Tell You**

#### ✅ **GOOD - Phone number is being sent:**
```
📋 ALL WEBHOOK FIELDS: payment_id, status, amount, buyer_phone, buyer_name, buyer_email, ...
🔍 Looking up user with phone (raw): 7008105210
✅ Found user with phone format: 7008105210
👤 User found by phone: abc123xyz
```

#### ❌ **BAD - Phone number is missing:**
```
📋 ALL WEBHOOK FIELDS: payment_id, status, amount, link_id, mac
🔍 Phone source field: unknown
❌ Could not determine user for this payment
❌ Phone from webhook: undefined
```

**Solution:** Go back to Instamojo and enable the Phone Number field in your smart link!

---

## 📱 Phone Number Format

The webhook tries **6 different formats** to find the user:

1. As-is (e.g., `7008105210`)
2. Without +91 prefix (e.g., `7008105210` from `+917008105210`)
3. Without 91 prefix (e.g., `7008105210` from `917008105210`)
4. Cleaned (spaces, dashes, parentheses removed)
5. Cleaned + without +91
6. Cleaned + without 91

**Users in your database should have phone numbers stored as:** `7008105210` (10 digits, no country code)

---

## 🔍 Troubleshooting

### **Issue: "User not found - phone number required"**

**Cause:** Either:
1. Smart link is not collecting phone number
2. User entered a different phone number than they registered with
3. Phone number format in database doesn't match

**Solution:**
1. Check smart link configuration (enable Phone Number field)
2. Check Firebase logs to see what phone number was sent
3. Verify user exists with that phone in Firestore: `users` collection

### **Issue: "No buyer_phone provided"**

**Cause:** Instamojo smart link is not configured to collect phone number

**Solution:**
1. Edit smart link in Instamojo
2. Go to "Custom Fields" or "Required Information"
3. Enable and require "Phone Number" field
4. Save changes
5. Test again

### **Issue: Payment succeeds but subscription not activated**

**Causes:**
1. Webhook received payment but couldn't find user
2. Phone number mismatch between payment and database
3. Webhook error (check Firebase logs)

**Solution:**
1. Check Firebase logs: `firebase functions:log --only instamojoWebhook`
2. Look for the phone number that was sent
3. Search Firestore `users` collection for that phone
4. If user exists with different format, the webhook should still find them
5. If user doesn't exist, they need to register first with that phone number

---

## 📊 Expected Webhook Flow

```
1. User makes payment on Instamojo
   ↓
2. Instamojo sends webhook with payment details
   ↓
3. Webhook extracts phone number from webhook payload
   ↓
4. Webhook searches Firestore for user with that phone
   ↓
5. Webhook creates/updates transaction record
   ↓
6. Webhook activates subscription for that user
   ↓
7. App polls subscription status and detects activation
   ↓
8. App shows "Payment Successful!"
```

---

## 🎯 Quick Checklist

Before going live, verify:

- [ ] All 3 smart links (Daily, Weekly, Monthly) are configured
- [ ] Phone Number field is **enabled** and **required** in each link
- [ ] Name and Email fields are also enabled
- [ ] Webhook URL is added to each link
- [ ] Webhook URL is: `https://us-central1-dular5.cloudfunctions.net/instamojoWebhook`
- [ ] Made a test payment to verify webhook receives phone number
- [ ] Checked Firebase logs show phone number in webhook payload
- [ ] Test user's subscription was activated after test payment

---

## 🔗 Useful Links

- **Instamojo Dashboard**: https://www.instamojo.com/@subham_routray
- **Firebase Console**: https://console.firebase.google.com/project/dular5
- **Firebase Functions Logs**: https://console.firebase.google.com/project/dular5/functions/logs
- **Webhook URL**: https://us-central1-dular5.cloudfunctions.net/instamojoWebhook

---

## 💡 Pro Tips

1. **Test with small amounts first** (₹1-10) before going live
2. **Always check Firebase logs** after each test payment
3. **Keep a test account** with a known phone number for testing
4. **Document any issues** in Firebase logs for debugging
5. After enabling phone field, **wait 5 minutes** before testing (Instamojo may cache settings)
