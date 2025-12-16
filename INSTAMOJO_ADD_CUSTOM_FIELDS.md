# 📱 How to Add Phone Number Field to Instamojo Smart Links

## 🎯 Current Problem:

Based on your webhook test, Instamojo is sending:
```json
{
  "amount": "899.00",
  "buyer": "uhghfyb@gmail.com",        ← Email only, NO phone!
  "currency": "INR",
  "fees": "17.08",
  "status": "Credit",
  "mac": "..."
}
```

**Missing:** `buyer_phone`, `phone`, `mobile` - any phone number field!

---

## ✅ Solution: Add Custom Fields to Smart Links

### **Where to Go:**

1. Login to Instamojo: https://www.instamojo.com/@subham_routray
2. Click **"Links"** in the left sidebar
3. OR directly: https://www.instamojo.com/dashboard/smartlinks/

### **Your 3 Smart Links:**

You have these 3 smart links that need to be updated:

| Plan | Short URL | Link ID |
|------|-----------|---------|
| Daily (₹49) | https://imjo.in/hbvW2s | `l0cf9af1578e34d01abe8e12ac9bb5f5a` |
| Weekly (₹199) | https://imjo.in/xU7gCw | (unknown) |
| Monthly (₹499) | https://imjo.in/qQBgZ7 | (unknown) |

---

## 📝 Step-by-Step Instructions:

### **For EACH of the 3 links above:**

#### **Step 1: Open Link Editor**

1. Find the link in your dashboard
2. Click the **"..."** menu or **"Edit"** button
3. OR click on the link itself to open settings

#### **Step 2: Find Custom Fields Section**

Look for one of these sections:
- **"Custom Fields"**
- **"Form Fields"**
- **"Additional Information"**
- **"Collect Information"**
- **"Required Information"**

It might be:
- On the main edit page
- Under "Advanced Settings"
- Under "Form Settings"
- In a separate tab

#### **Step 3: Add Phone Number Field**

Click **"+ Add Field"** or **"+ Add Custom Field"**

Fill in:
```
Field Name/Label: Phone Number
Field Type: Number (or Text/Mobile)
☑️ Required (MUST CHECK THIS!)
☑️ Include in webhook (if this option exists, CHECK IT!)
```

**Alternative field names that work:**
- `Phone Number`
- `Mobile Number`
- `Phone`
- `Mobile`
- `Contact Number`

Choose whichever option your Instamojo interface provides.

#### **Step 4: Add Name Field (Optional but Recommended)**

Click **"+ Add Field"** again

Fill in:
```
Field Name/Label: Name
Field Type: Text
☑️ Required
☑️ Include in webhook
```

#### **Step 5: Verify Email Field**

Check if email is already being collected:
- If YES: Great! No changes needed
- If NO: Add it as a custom field:
  ```
  Field Name/Label: Email
  Field Type: Email
  ☑️ Required (or Optional)
  ☑️ Include in webhook
  ```

#### **Step 6: Save Changes**

1. Click **"Save"** or **"Update"** at the bottom
2. Wait for confirmation message
3. **Test the link** - open it in browser and verify you see the phone field

---

## 🧪 How to Verify Configuration:

### **Method 1: Test the Link Directly**

1. Open the smart link in incognito/private browser:
   - Daily: https://imjo.in/hbvW2s
2. You should now see a form with:
   - **Phone Number** field ← MUST BE PRESENT!
   - **Name** field
   - **Email** field (if you're not logged in)
   - Amount (₹49 for daily)
   - Payment method options

### **Method 2: Test Webhook with Instamojo Testing Tool**

1. Go to: https://www.instamojo.com/webhook-testing-tool/
2. Select your smart link
3. Enter webhook URL: `https://us-central1-dular5.cloudfunctions.net/instamojoWebhook`
4. Click **"Send Webhook"**
5. Check if webhook now includes:
   ```json
   {
     "buyer_phone": "7008105210",   ← MUST BE PRESENT!
     "buyer_name": "Test User",
     "buyer_email": "test@example.com",
     ...
   }
   ```

### **Method 3: Make a Test Payment**

1. Open app → Go to subscription page
2. Select Daily Plan (₹49)
3. Click "Pay Now"
4. **CHECK:** Does the payment form show a phone number field?
   - ✅ YES: Perfect! Fill it with `7008105210`
   - ❌ NO: Custom fields not configured yet

---

## 🔍 What Each Interface Might Look Like:

### **Possible Interface 1: Custom Fields Tab**

```
┌─────────────────────────────────────────┐
│ Edit Smart Link                         │
├─────────────────────────────────────────┤
│ Tabs: [Basic] [Advanced] [Custom Fields]│
│                                         │
│ Click "Custom Fields" tab →             │
│                                         │
│ Custom Fields:                          │
│ ┌─────────────────────────────────────┐ │
│ │ [+ Add Custom Field]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ After clicking:                         │
│ ┌─────────────────────────────────────┐ │
│ │ Field Name: [Phone Number        ]  │ │
│ │ Field Type: [Number ▼]              │ │
│ │ ☑️ Required                          │ │
│ │ ☐ Include in webhook                │ │
│ │ [Save] [Cancel]                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Possible Interface 2: Form Builder**

```
┌─────────────────────────────────────────┐
│ Payment Form Settings                   │
├─────────────────────────────────────────┤
│ Collect Additional Information:         │
│                                         │
│ ☑️ Name                                  │
│ ☑️ Email                                 │
│ ☐ Phone Number  ← ENABLE THIS!         │
│ ☐ Address                               │
│ ☐ Custom Field 1                        │
│                                         │
│ [Save Changes]                          │
└─────────────────────────────────────────┘
```

### **Possible Interface 3: Advanced Settings**

```
┌─────────────────────────────────────────┐
│ Advanced Settings                       │
├─────────────────────────────────────────┤
│ Required Information:                   │
│                                         │
│ What information do you want to         │
│ collect from buyers?                    │
│                                         │
│ ☑️ Email (default)                       │
│ ☐ Phone Number  ← CHECK THIS!          │
│ ☐ Address                               │
│                                         │
│ Make phone required: ☑️                  │
│                                         │
│ [Update Link]                           │
└─────────────────────────────────────────┘
```

---

## 📊 Before vs After:

### **BEFORE (Current State):**

**Payment Form Shows:**
- Amount: ₹49
- Email (if not logged in)
- Payment Method (UPI/Card/etc.)

**Webhook Receives:**
```json
{
  "payment_id": "MOJO...",
  "amount": "49.00",
  "buyer": "email@example.com",
  "status": "Credit",
  "currency": "INR"
}
```
**Result:** ❌ No phone → Can't find user → Subscription not activated

---

### **AFTER (Once Configured):**

**Payment Form Shows:**
- **Phone Number:** [7008105210]  ← NEW!
- **Name:** [Your Name]  ← NEW!
- Email: test@example.com
- Amount: ₹49
- Payment Method (UPI/Card/etc.)

**Webhook Receives:**
```json
{
  "payment_id": "MOJO...",
  "amount": "49.00",
  "buyer_phone": "7008105210",    ← NEW! ✅
  "buyer_name": "Your Name",      ← NEW! ✅
  "buyer_email": "test@example.com",
  "status": "Credit",
  "currency": "INR"
}
```
**Result:** ✅ Phone found → User matched → Subscription activated! 🎉

---

## 🚨 Important Notes:

1. **Field Name Matters:**
   - Use `Phone Number` or `Mobile Number` (exact capitalization doesn't matter)
   - Instamojo will convert to `buyer_phone` in webhook

2. **Required Field MUST Be Checked:**
   - If not required, users can skip it
   - Webhook won't receive phone if user skips
   - Subscription won't activate

3. **Wait 5-10 Minutes After Saving:**
   - Instamojo may cache link settings
   - Changes might not apply immediately
   - Try in incognito browser to see fresh version

4. **Test Before Production:**
   - Make a ₹9-49 test payment first
   - Verify webhook logs show phone number
   - Check subscription activates

---

## 🔗 Useful Instamojo Documentation:

- **Custom Fields Guide:** https://support.instamojo.com/hc/en-us/articles/212900189-Custom-Fields
- **Webhook Documentation:** https://support.instamojo.com/hc/en-us/sections/201961805-Webhook (you shared this)
- **Smart Links Help:** https://support.instamojo.com/hc/en-us/sections/360001051891-Smart-Links

---

## 🆘 If You Can't Find Custom Fields Option:

### **Option A: Contact Instamojo Support**

If your Instamojo account doesn't show custom fields option:
1. Go to: https://support.instamojo.com/hc/en-us
2. Click "Submit a request"
3. Ask: "How do I add phone number field to my smart link?"

### **Option B: Create New Smart Link**

Try creating a NEW smart link and check if it has more options:
1. Dashboard → Links → Create New Link
2. Choose "Smart Link" or "Payment Page"
3. Look for custom fields during setup
4. If found, recreate your 3 links with phone field

### **Option C: API Integration (Advanced)**

If smart links don't support custom fields:
1. Use Instamojo Payment Request API instead
2. We'll need to modify the app to call API directly
3. More complex but gives full control

---

## ✅ Checklist:

After configuring ALL 3 links, verify:

- [ ] Daily link (https://imjo.in/hbvW2s) has phone field
- [ ] Weekly link (https://imjo.in/xU7gCw) has phone field
- [ ] Monthly link (https://imjo.in/qQBgZ7) has phone field
- [ ] All 3 have phone marked as **Required**
- [ ] Tested each link in browser - phone field appears
- [ ] Webhook URL is still configured: `https://us-central1-dular5.cloudfunctions.net/instamojoWebhook`
- [ ] Made test payment - webhook shows `buyer_phone`
- [ ] Subscription activated successfully

---

## 💡 Quick Test Command:

After configuration, make a test payment and immediately run:

```bash
firebase functions:log --only instamojoWebhook | grep -A 5 "buyer_phone"
```

You should see:
```
  • buyer_phone: 7008105210 ✅
```

Instead of:
```
  • buyer_phone: ❌ MISSING
```

---

**NOW GO ADD THOSE PHONE FIELDS! 📱✨**

You're just ONE configuration step away from having a fully working payment system!
