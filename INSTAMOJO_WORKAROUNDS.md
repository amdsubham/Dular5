# Instamojo Smart Link Webhook Workarounds

## Problem
Instamojo Smart Links **DO NOT** send buyer information (phone, email, name) in webhook payloads. Only payment metadata is sent:
- `payment_id`
- `amount`
- `status`
- `currency`
- `link_id`
- `mac`

This makes it impossible to identify which user made the payment.

## Solutions Implemented

### ✅ Solution 1: Fetch Payment Details from Instamojo API (Primary)

When webhook doesn't contain phone number, the system automatically calls Instamojo Payment Details API.

**How it works:**
1. Webhook receives `payment_id` without buyer info
2. Cloud function calls `GET https://api.instamojo.com/v2/payments/{payment_id}/`
3. API response includes full buyer details including phone number
4. System uses phone to identify user and update subscription

**Requirements:**
- Store `instamojoApiKey` and `instamojoAuthToken` in Firestore
- Path: `subscriptionConfig/instamojo`

**Code location:** [functions/src/index.ts:402-449](functions/src/index.ts#L402-L449)

### ✅ Solution 2: Match by Pending Transaction (Fallback)

If API call fails or doesn't return phone, system searches for recent pending transactions.

**How it works:**
1. App creates transaction in Firestore BEFORE opening payment link
2. Transaction contains userId and phoneNumber
3. When webhook arrives, system finds most recent PENDING transaction (within 1 hour)
4. Uses that transaction's userId to update subscription

**Requirements:**
- Firestore composite index required:
  - Collection: `transactions`
  - Fields: `status` (Ascending), `createdAt` (Descending)
- Create index: Firebase Console → Firestore → Indexes

**Code location:**
- Client: [services/instamojo-payment.ts:35-92](services/instamojo-payment.ts#L35-L92)
- Webhook: [functions/src/index.ts:513-570](functions/src/index.ts#L513-L570)

### ❌ Why Smart Links Don't Work

Instamojo Smart Links are simplified payment pages that:
- Don't require API integration
- Don't support custom fields in webhooks
- Only send basic payment metadata

**Smart Links webhook payload (actual):**
```json
{
  "link_id": "l77651e91f10a4cb19ffadce7b2bb0dcf",
  "payment_id": "MOJO5c15905D09684260",
  "status": "successful",
  "currency": "INR",
  "amount": "30.00",
  "mac": "..."
}
```

**Payment Request API webhook (comparison):**
```json
{
  "payment_id": "MOJO5c15905D09684260",
  "buyer_phone": "+919876543210",
  "buyer_name": "John Doe",
  "buyer_email": "john@example.com",
  "amount": "30.00",
  "status": "Credit",
  ...
}
```

## Alternative: Switch to Payment Request API

For guaranteed buyer information, use Payment Request API instead of Smart Links.

**Benefits:**
- Reliable buyer_phone, buyer_name, buyer_email in webhooks
- Programmatic payment link creation
- Better control over payment flow

**Implementation:** See [INSTAMOJO_INTEGRATION.md](INSTAMOJO_INTEGRATION.md) for Payment Request API setup.

## Current Status

✅ **Both workarounds implemented** - System will:
1. First try to fetch from Instamojo API
2. If that fails, match by pending transaction
3. If both fail, return 404 error with clear instructions

## Testing

1. Make a test payment through smart link
2. Check Firebase function logs:
   ```bash
   npx firebase-tools functions:log --only instamojoWebhook
   ```
3. Look for:
   - "🔄 FETCHING PAYMENT DETAILS FROM INSTAMOJO API..."
   - "✅ PHONE FOUND IN API: ..."
   - OR "✅ USER FOUND via pending transaction!"

## Configuration Required

### 1. Add Instamojo API Credentials to Firestore

```javascript
// Document: subscriptionConfig/instamojo
{
  "instamojoApiKey": "your_api_key",
  "instamojoAuthToken": "your_auth_token",
  "instamojoPrivateSalt": "your_private_salt",
  "instamojoSmartLinks": {
    "daily": "https://imjo.in/XXXXX",
    "weekly": "https://imjo.in/YYYYY",
    "monthly": "https://imjo.in/ZZZZZ"
  }
}
```

### 2. Create Firestore Index

First payment will fail with index error. Click the URL in error logs or create manually:

**Firestore Console → Indexes → Add Index:**
- Collection: `transactions`
- Field 1: `status` - Ascending
- Field 2: `createdAt` - Descending

## Troubleshooting

### "User not found - phone number required"
- API credentials missing/invalid
- No pending transaction found
- Solution: Check Firestore config and test transaction creation

### "Firestore index error"
- Create the composite index as shown above
- Wait 2-3 minutes for index to build

### Payment succeeds but subscription not activated
- Check function logs for errors
- Verify phone number format matches database
- Check transaction was created before payment

## Support Email Template

If Instamojo adds buyer fields to Smart Link webhooks, update this section:

---

**To: support@instamojo.com**

Subject: Smart Link Webhook Missing Buyer Information

Hello Instamojo Support Team,

I have configured my Smart Links to collect Phone Number under "COLLECT MORE INFORMATION", but the webhook is not receiving buyer fields.

Current webhook payload (only 6 fields):
- payment_id
- amount
- status
- currency
- link_id
- mac

Missing fields:
- buyer_phone
- buyer_name
- buyer_email

Question: Do Smart Links support sending buyer information in webhooks, or is this only available through Payment Request API?

If not supported, please consider adding this feature to Smart Links.

Link: https://imjo.in/P3xP7n

Thank you!

---
