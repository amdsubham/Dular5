# 📱 IMMEDIATE ACTION: Add Phone Number Field to Instamojo Smart Link

## 🎯 You Are Here:

You're currently on the Instamojo smart link edit page:
- URL: `instamojo.com/links/edit/?id=l0cf9af1578e34d01abe8e12ac9bb5f5a&step=2`
- Link: **Daily Plan** (https://imjo.in/hbvW2s)
- This is for the **₹49 daily subscription**

---

## ✅ STEP-BY-STEP: Add Phone Number Field

### **Step 1: Add Custom Field**

1. Look for the section titled **"Custom Fields"**
2. You'll see text: "+ Add Custom Field"
3. **Click** on "+ Add Custom Field"

### **Step 2: Configure Phone Number Field**

After clicking, a form will appear. Fill it in EXACTLY like this:

```
Field Name: Phone Number
[✓] Required field    ← CHECK THIS BOX! VERY IMPORTANT!
```

**Important Notes:**
- Field name MUST be: `Phone Number` (exactly like this, with capital P and N)
- The "Required field" checkbox MUST be checked (✓)
- Do NOT make it optional - it MUST be required

### **Step 3: Add Name Field**

Click "+ Add Custom Field" again and add:

```
Field Name: Name
[✓] Required field
```

### **Step 4: Add Email Field**

Click "+ Add Custom Field" again and add:

```
Field Name: Email
[✓] Required field
```

### **Step 5: Verify Webhook (Already Done!)**

I can see in your screenshot that the webhook is already configured:
- **Smart Actions** section shows "Add Webhook" is enabled ✅
- Webhook URL: `https://us-central1-dular5...` ✅

**This is correct!** No changes needed here.

### **Step 6: Save the Link**

1. Scroll to the bottom of the page
2. Click **"Save"** or **"Update Link"** button
3. Wait for confirmation message

---

## 🔄 REPEAT FOR OTHER LINKS

After saving the Daily Plan link, you need to do THE SAME THING for the other 2 links:

### **Weekly Plan Link**
- URL: https://imjo.in/xU7gCw
- Price: ₹199
- Add same 3 fields: Phone Number, Name, Email (all required)
- Verify webhook URL

### **Monthly Plan Link**
- URL: https://imjo.in/qQBgZ7
- Price: ₹499
- Add same 3 fields: Phone Number, Name, Email (all required)
- Verify webhook URL

---

## 🧪 TEST AFTER CONFIGURATION

Once you've configured all 3 links, it's time to test!

### **Test Payment Steps:**

1. **Open your app** on the test device
2. **Login** with phone: `7008105210`
3. **Go to Subscription page**
4. **Select Daily Plan** (₹49)
5. **Click "Pay"**
6. **Fill in the payment form** on Instamojo:
   - Phone Number: `7008105210` ← MUST match your registered phone!
   - Name: `Test User`
   - Email: `test@example.com`
   - Payment details
7. **Complete payment**
8. **Wait 5-10 seconds** - app will show "Verifying Payment"
9. **Subscription should activate!** ✅

### **Check Firebase Logs:**

While the payment is processing, check the webhook logs:

```bash
firebase functions:log --only instamojoWebhook
```

**You should now see:**

```
✅ GOOD LOGS (phone number present):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ALL WEBHOOK FIELDS: link_id, payment_id, status, buyer_phone, buyer_name, buyer_email, amount, currency, mac
📦 Extracted fields:
  - payment_id: MOJO...
  - buyer_phone: 7008105210          ← PRESENT! ✅
  - buyer_name: Test User            ← PRESENT! ✅
  - buyer_email: test@example.com    ← PRESENT! ✅
  - phoneFromWebhook: 7008105210
  - amount: 49

🔍 Looking up user with phone (raw): 7008105210
✅ Found user with phone format: 7008105210
👤 User found by phone: xyz123abc
💰 Payment successful! Payment ID: MOJO...
✅ Transaction created: txn_xxx
✅ User subscription updated successfully
```

**If you see this, EVERYTHING IS WORKING! 🎉**

---

## ❌ PREVIOUS BAD LOGS (for comparison)

Before adding the phone field, you were seeing:

```
❌ BAD LOGS (phone number missing):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ALL WEBHOOK FIELDS: link_id, payment_id, status, currency, amount, mac
📦 Extracted fields:
  - buyer_phone: undefined           ← MISSING! ❌
  - buyer_name: undefined            ← MISSING! ❌
  - buyer_email: undefined           ← MISSING! ❌
  - phoneFromWebhook: undefined

❌ Could not determine user for this payment
❌ Phone from webhook: undefined
💡 SOLUTION: Configure your Instamojo smart link to collect 'Phone Number' field
```

---

## 🎯 WHY THIS IS CRITICAL

The payment flow works like this:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER MAKES PAYMENT                                        │
│    - Fills in phone: 7008105210                             │
│    - Completes payment on Instamojo                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. INSTAMOJO SENDS WEBHOOK                                   │
│    - POST request to Firebase function                       │
│    - Includes: payment_id, amount, buyer_phone, etc.        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FIREBASE WEBHOOK RECEIVES DATA                            │
│    - Extracts phone: 7008105210                             │
│    - Searches Firestore for user with this phone            │
│    - Finds user: abc123xyz                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. WEBHOOK ACTIVATES SUBSCRIPTION                            │
│    - Updates userSubscriptions/abc123xyz                     │
│    - Sets: currentPlan = "daily", isActive = true           │
│    - Sets: endDate = today + 1 day                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. APP DETECTS ACTIVATION                                    │
│    - Polls subscription status every 2 seconds              │
│    - Sees: currentPlan = "daily", isActive = true           │
│    - Shows: "Payment Successful! 🎉"                        │
└─────────────────────────────────────────────────────────────┘
```

**WITHOUT phone number:**
- Webhook can't find the user ❌
- Subscription is NOT activated ❌
- App keeps showing "Verifying Payment..." forever ❌
- User is frustrated 😞

**WITH phone number:**
- Webhook finds the user ✅
- Subscription is activated ✅
- App shows success message ✅
- User is happy 😊

---

## 📋 CURRENT STATUS

### ✅ What's Working:
- Firebase webhook is deployed and ready
- Webhook can handle multiple phone formats
- App has payment modal with WebView
- App polls subscription status
- Webhook URL is configured in Instamojo

### ❌ What's Missing:
- Phone Number field in Daily Plan link
- Phone Number field in Weekly Plan link
- Phone Number field in Monthly Plan link

### 🎯 Your Next Action:
**Add the Phone Number field to all 3 smart links (starting with Daily Plan, which you're currently editing)**

---

## 🆘 If You Get Stuck

### **Can't find "+ Add Custom Field"?**
- Look for "Custom Fields" section on the edit page
- It might be under "Additional Information" or "Form Fields"
- Try scrolling down the page

### **Field name options:**
If "Phone Number" doesn't work, try these alternatives:
- `Mobile Number`
- `Phone`
- `Contact Number`

The webhook checks for all these variations:
```typescript
const phoneFromWebhook = buyer_phone || phone || mobile || contact;
```

### **Still not working after configuration?**
1. Wait 5 minutes (Instamojo may cache settings)
2. Clear browser cache and re-edit the link
3. Try viewing the payment link in incognito mode
4. Check if the phone field appears on the payment form

---

## 📞 REMEMBER: Phone Number is the KEY!

```
USER PHONE (on payment form)  =  DATABASE PHONE (in Firestore)
            ↓                            ↓
       7008105210            =      7008105210
            ↓                            ↓
     MATCH FOUND! ✅  →  SUBSCRIPTION ACTIVATED! 🎉
```

Without this match, **nothing works**.

---

## ✅ SUCCESS CHECKLIST

After configuration, you should be able to:

- [ ] See Phone Number field on payment page
- [ ] Complete test payment with phone 7008105210
- [ ] See phone number in Firebase webhook logs
- [ ] See "User found by phone" in logs
- [ ] See "Subscription updated successfully" in logs
- [ ] App shows "Payment Successful! 🎉"
- [ ] Subscription page shows active plan
- [ ] Swipe limit changes from 5 to unlimited (or plan-specific limit)

---

**NOW GO AND ADD THAT PHONE FIELD! 🚀**

You're literally ONE STEP away from having a fully working payment system!
