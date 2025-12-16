# 🔍 How to View Webhook Logs

## ✅ Webhook is Now Deployed with ENHANCED LOGGING!

The webhook has been updated with comprehensive, detailed logging that shows you EXACTLY what happens during payment processing.

---

## 📊 What the Logs Will Show You

When a payment is made, you'll see:

### 1. **Webhook Call Information**
```
═══════════════════════════════════════════════════════════
🔔 INSTAMOJO WEBHOOK CALLED!
═══════════════════════════════════════════════════════════
⏰ Timestamp: 2025-12-15T10:30:45.123Z
📨 Request method: POST
📍 Request path: /
🌐 Request IP: 1.2.3.4
```

### 2. **Request Headers**
```
📋 REQUEST HEADERS:
  • content-type: application/x-www-form-urlencoded
  • user-agent: Instamojo-Webhook/1.0
  • ...
```

### 3. **Complete Raw Webhook Data**
```
📦 RAW WEBHOOK BODY (COMPLETE):
{
  "payment_id": "MOJO1234567890",
  "buyer_phone": "7008105210",
  "buyer_name": "Test User",
  "amount": "49.00",
  "status": "Credit",
  ...
}
```

### 4. **Field-by-Field Breakdown**
```
📊 FIELD-BY-FIELD BREAKDOWN:
  • payment_id: "MOJO1234567890" (type: string)
  • buyer_phone: "7008105210" (type: string)
  • buyer_name: "Test User" (type: string)
  • status: "Credit" (type: string)
  • amount: "49.00" (type: string)
  ...
```

### 5. **Extracted Payment Fields**
```
💳 EXTRACTED PAYMENT FIELDS:
  • payment_id: MOJO1234567890
  • status: Credit
  • amount: 49.00
  • currency: INR
  • link_id: l0cf9af1578e34d01abe8e12ac9bb5f5a
```

### 6. **Extracted User Fields**
```
👤 EXTRACTED USER FIELDS:
  • buyer_phone: 7008105210 ✅ or ❌ MISSING
  • buyer_name: Test User ✅ or ❌ MISSING
  • buyer_email: test@example.com ✅ or ❌ MISSING
```

### 7. **Phone Number Detection**
```
📞 PHONE NUMBER DETECTION:
  ✅ Phone found: 7008105210
  📍 Source field: buyer_phone
```

### 8. **User Lookup Process**
```
🔍 USER LOOKUP STARTING:
  • Raw phone from webhook: 7008105210
  • Source field: buyer_phone
  • Trying 6 different formats:
    1. "7008105210"
    2. "008105210"
    3. "7008105210"
    ...

  🔎 Searching Firestore users collection...
    • Checking format: "7008105210"
    ✅ MATCH FOUND with format: "7008105210"

✅ USER FOUND!
  • User ID: abc123xyz
  • User Name: Test User
  • User Phone (in DB): 7008105210
  • Matched with format: 7008105210
```

### 9. **Transaction Processing**
```
📄 Transaction found: txn_abc123
✅ Transaction updated successfully
```

### 10. **Subscription Activation**
```
📅 CALCULATING SUBSCRIPTION DATES:
  • Current time: 2025-12-15T10:30:45.123Z
  • Plan type: daily
  • Duration: 1 day
  • End date: 2025-12-16T10:30:45.123Z

💾 UPDATING FIRESTORE SUBSCRIPTION:
  • Subscription path: userSubscriptions/abc123xyz
  • Action: UPDATING existing subscription
  ✅ Subscription UPDATED!

✅ SUBSCRIPTION ACTIVATION COMPLETE!
  • User ID: abc123xyz
  • Plan: daily
  • Is Active: true
  • Start: 2025-12-15T10:30:45.123Z
  • End: 2025-12-16T10:30:45.123Z
```

### 11. **Final Summary**
```
═══════════════════════════════════════════════════════════
✅ WEBHOOK PROCESSING COMPLETE!
═══════════════════════════════════════════════════════════
📊 SUMMARY:
  • Payment ID: MOJO1234567890
  • User ID: abc123xyz
  • Phone: 7008105210
  • Plan: daily
  • Amount: 49.00 INR
  • Subscription Active: ✅ YES
  • End Date: 2025-12-16T10:30:45.123Z
═══════════════════════════════════════════════════════════
```

---

## 🖥️ How to View Logs

### **Method 1: Terminal (Real-time)**

```bash
firebase functions:log --only instamojoWebhook
```

This shows the most recent logs and keeps updating in real-time.

**To filter and follow live:**
```bash
firebase functions:log --only instamojoWebhook | grep -E "🔔|📦|👤|✅|❌"
```

### **Method 2: Firebase Console (Web UI)**

1. Go to: https://console.firebase.google.com/project/dular5/functions/logs
2. Click on "Function name" dropdown
3. Select: `instamojoWebhook`
4. Click on any log entry to expand and see full details

**Direct link:**
https://console.firebase.google.com/project/dular5/functions/logs?search=instamojoWebhook

### **Method 3: Google Cloud Console (Most Detailed)**

1. Go to: https://console.cloud.google.com/logs/query?project=dular5
2. In the query editor, paste:
   ```
   resource.type="cloud_function"
   resource.labels.function_name="instamojoWebhook"
   ```
3. Click "Run query"
4. Click on any log entry to see full JSON payload

---

## 🧪 Testing Steps

### **Step 1: Make a Test Payment**

1. Open your app
2. Login with: `7008105210`
3. Go to Subscription page
4. Select Daily Plan (₹49)
5. Click "Pay Now"
6. **IMPORTANT:** Fill in phone number: `7008105210` (same as login)
7. Complete payment

### **Step 2: Watch the Logs**

In a terminal, run:
```bash
firebase functions:log --only instamojoWebhook
```

You should see the webhook being called within 5-10 seconds after payment.

### **Step 3: Check What You See**

#### ✅ **SUCCESS Case - Phone Number Present:**

You should see:
```
👤 EXTRACTED USER FIELDS:
  • buyer_phone: 7008105210 ✅

📞 PHONE NUMBER DETECTION:
  ✅ Phone found: 7008105210

✅ USER FOUND!
  • User ID: [your_user_id]

✅ SUBSCRIPTION ACTIVATION COMPLETE!
  • Subscription Active: ✅ YES
```

**Result:** App should show "Payment Successful!" after 5-10 seconds

#### ❌ **FAILURE Case - Phone Number Missing:**

You'll see:
```
👤 EXTRACTED USER FIELDS:
  • buyer_phone: ❌ MISSING

📞 PHONE NUMBER DETECTION:
  ❌ NO PHONE NUMBER IN WEBHOOK!
  ❌ This means Instamojo smart link is NOT configured to collect phone number

❌ Could not determine user for this payment
```

**Result:** App will keep showing "Verifying Payment..." and eventually timeout

---

## 🔍 Debugging Common Issues

### **Issue 1: No Webhook Logs at All**

**Symptoms:**
- No logs appear after payment
- `firebase functions:log` shows nothing

**Possible Causes:**
1. Webhook URL not configured in Instamojo smart link
2. Payment failed (check Instamojo dashboard)
3. Looking at wrong Firebase project

**Solution:**
1. Check webhook URL in Instamojo: https://us-central1-dular5.cloudfunctions.net/instamojoWebhook
2. Verify payment shows as "Successful" in Instamojo dashboard
3. Verify you're logged into correct Firebase project: `firebase projects:list`

---

### **Issue 2: Webhook Called But No Phone Number**

**Symptoms:**
- Webhook logs show:
  ```
  👤 EXTRACTED USER FIELDS:
    • buyer_phone: ❌ MISSING
  ```

**Cause:**
Instamojo smart link is NOT configured to collect phone number

**Solution:**
See: [INSTAMOJO_PHONE_FIELD_SETUP.md](INSTAMOJO_PHONE_FIELD_SETUP.md)

You MUST add "Phone Number" custom field to your Instamojo smart link!

---

### **Issue 3: Phone Number Present But User Not Found**

**Symptoms:**
- Webhook logs show:
  ```
  📞 PHONE NUMBER DETECTION:
    ✅ Phone found: 7008105210

  ❌ USER NOT FOUND!
    • Tried all 6 formats
    • None matched any user in Firestore
  ```

**Possible Causes:**
1. User entered different phone number than they registered with
2. User doesn't exist in Firestore
3. Phone number format in database is very unusual

**Solution:**
1. Check Firestore console: https://console.firebase.google.com/project/dular5/firestore/data/users
2. Search for user with phone `7008105210`
3. Verify `phoneNumber` field matches exactly

---

### **Issue 4: Everything Looks Good But App Doesn't Update**

**Symptoms:**
- Webhook logs show:
  ```
  ✅ SUBSCRIPTION ACTIVATION COMPLETE!
  ```
- But app still shows "Verifying Payment..."

**Possible Causes:**
1. App polling finished before webhook completed
2. Firestore security rules blocking read
3. User logged out or changed accounts

**Solution:**
1. Check Firestore security rules
2. Manually refresh subscription page in app
3. Check if subscription was actually updated in Firestore console:
   - Path: `userSubscriptions/[user_id]`
   - Look for: `isActive: true`, `currentPlan: "daily"`

---

## 📋 What to Look For

### **When NO phone field is configured:**

```
🔑 ALL WEBHOOK KEYS RECEIVED:
  • Total fields: 6
  • Fields: payment_id, link_id, status, currency, amount, mac

👤 EXTRACTED USER FIELDS:
  • buyer_phone: ❌ MISSING
  • buyer_name: ❌ MISSING
  • buyer_email: ❌ MISSING

📞 PHONE NUMBER DETECTION:
  ❌ NO PHONE NUMBER IN WEBHOOK!
```

### **When phone field IS configured:**

```
🔑 ALL WEBHOOK KEYS RECEIVED:
  • Total fields: 12
  • Fields: payment_id, link_id, status, buyer_phone, buyer_name, buyer_email, currency, amount, mac, ...

👤 EXTRACTED USER FIELDS:
  • buyer_phone: 7008105210 ✅
  • buyer_name: Test User ✅
  • buyer_email: test@example.com ✅

📞 PHONE NUMBER DETECTION:
  ✅ Phone found: 7008105210
  📍 Source field: buyer_phone
```

---

## 🎯 Quick Checklist

After making a test payment, verify:

- [ ] Webhook was called (see timestamp in logs)
- [ ] Request method is POST
- [ ] Webhook received data (see RAW WEBHOOK BODY)
- [ ] Phone number is present in data
- [ ] User was found in Firestore
- [ ] Transaction was created/updated
- [ ] Subscription was activated
- [ ] Response 200 OK sent to Instamojo
- [ ] App detected subscription and showed success

---

## 💡 Pro Tips

1. **Keep logs open during testing:**
   ```bash
   firebase functions:log --only instamojoWebhook
   ```
   In a separate terminal window while testing payments

2. **Search logs by payment ID:**
   ```bash
   firebase functions:log --only instamojoWebhook | grep "MOJO1234567890"
   ```

3. **See only errors:**
   ```bash
   firebase functions:log --only instamojoWebhook | grep "❌"
   ```

4. **See only successful activations:**
   ```bash
   firebase functions:log --only instamojoWebhook | grep "SUBSCRIPTION ACTIVATION COMPLETE"
   ```

5. **Export logs to file:**
   ```bash
   firebase functions:log --only instamojoWebhook > webhook-logs.txt
   ```

---

## 🆘 If You Still Have Issues

Share the logs with me! Copy the entire log output from:
```
═══════════════════════════════════════════════════════════
🔔 INSTAMOJO WEBHOOK CALLED!
```

To:
```
═══════════════════════════════════════════════════════════
✅ WEBHOOK PROCESSING COMPLETE!
```

Or if there's an error:
```
❌ ERROR PROCESSING WEBHOOK!
```

This will show me EXACTLY what Instamojo is sending and where the process is failing.

---

## 🔗 Useful Links

- **Firebase Functions Logs:** https://console.firebase.google.com/project/dular5/functions/logs
- **Firestore Console:** https://console.firebase.google.com/project/dular5/firestore
- **Instamojo Dashboard:** https://www.instamojo.com/@subham_routray
- **Webhook URL:** https://us-central1-dular5.cloudfunctions.net/instamojoWebhook

---

**NOW YOU CAN SEE EVERYTHING! 🚀**

Make a test payment and watch the logs in real-time to see exactly what's happening!
