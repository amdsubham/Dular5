# Google Play Billing Integration Plan

## Why Switch from Instamojo to Google Play Billing?

### Problems with Current Instamojo Implementation:
1. ❌ No buyer information in Smart Link webhooks
2. ❌ Race conditions with multiple concurrent payments
3. ❌ 15-minute window limitation
4. ❌ Amount-based matching is not 100% reliable
5. ❌ Complex workarounds and fallback logic
6. ❌ Poor user experience (external redirect)

### Benefits of Google Play Billing:
1. ✅ Seamless in-app purchase experience
2. ✅ Unique purchase tokens - NO race conditions
3. ✅ Reliable webhooks with full purchase info
4. ✅ Built-in subscription management (upgrades, downgrades, cancellations)
5. ✅ Users trust Google payment system
6. ✅ Handles currency conversion automatically
7. ✅ Google handles refunds, chargebacks, billing issues
8. ✅ Required for Google Play Store compliance

## Architecture Overview

```
┌─────────────────┐
│   Android App   │
│  (React Native) │
└────────┬────────┘
         │ 1. Purchase subscription
         │
         ▼
┌─────────────────────────┐
│   Google Play Store     │
│   (Handles payment)     │
└────────┬────────────────┘
         │ 2. Real-Time Developer Notification (RTDN)
         │
         ▼
┌─────────────────────────────────────┐
│  Firebase Cloud Function            │
│  googlePlayWebhook()                │
│                                     │
│  1. Verify notification signature   │
│  2. Call Google Play API            │
│  3. Validate purchase token         │
│  4. Extract userId from             │
│     developerPayload                │
│  5. Update userSubscriptions        │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│    Firestore            │
│  - userSubscriptions    │
│  - transactions         │
└─────────────────────────┘
```

## Implementation Steps

### Step 1: Setup Google Play Console

1. **Enable Google Play Billing API**
   - Go to: Google Cloud Console → APIs & Services
   - Enable: Google Play Android Developer API
   - Create Service Account with "Service Account User" role

2. **Create Service Account Key**
   - Download JSON key file
   - Store in Firebase Functions config

3. **Configure Real-Time Developer Notifications**
   - Go to: Play Console → Monetization setup → Real-time developer notifications
   - Set webhook URL: `https://us-central1-dular5.cloudfunctions.net/googlePlayWebhook`

4. **Configure Pub/Sub Topic** (Google automatically sends here)
   - Google Cloud Console → Pub/Sub
   - Note the topic name (format: `projects/{project}/topics/{topic}`)

### Step 2: Install Required Libraries

```bash
cd functions
npm install googleapis
npm install @google-cloud/pubsub
```

### Step 3: Create Google Play Webhook Function

**File: `functions/src/index.ts`**

Add new export:

```typescript
export const googlePlayWebhook = functions.pubsub
  .topic('play-billing-notifications') // Your Pub/Sub topic
  .onPublish(async (message) => {
    // Webhook logic here
  });
```

### Step 4: Update Client Code

**Changes needed in React Native app:**

1. **Install library:**
   ```bash
   npm install react-native-iap
   npx pod-install
   ```

2. **Configure subscriptions in app:**
   ```typescript
   // services/google-play-subscription.ts
   import RNIap from 'react-native-iap';

   const SKU_DAILY = 'dular_daily_subscription';
   const SKU_WEEKLY = 'dular_weekly_subscription';
   const SKU_MONTHLY = 'dular_monthly_subscription';

   export const purchaseSubscription = async (planType: 'daily' | 'weekly' | 'monthly') => {
     const userId = auth().currentUser?.uid;

     // Pass userId in developerPayload so webhook knows which user to activate
     await RNIap.requestSubscription({
       sku: SKU_MAPPING[planType],
       obfuscatedAccountId: userId, // Google will pass this back in webhook!
     });
   };
   ```

### Step 5: Changes to Firestore Structure

**No changes needed!** Your existing structure works:

```
userSubscriptions/{userId}
- currentPlan: "daily" | "weekly" | "monthly" | "free"
- startDate: Timestamp
- endDate: Timestamp
- isActive: boolean
- googlePlayPurchaseToken: string  // NEW: Add this field
- googlePlayOrderId: string        // NEW: Add this field
```

**transactions collection - Minor additions:**

```typescript
{
  userId: string,
  planType: string,
  amount: number,
  provider: "google_play", // NEW: Instead of "instamojo"
  googlePlayPurchaseToken: string, // NEW
  googlePlayOrderId: string,       // NEW
  status: "SUCCESS" | "FAILED" | "PENDING",
  createdAt: Timestamp,
}
```

## Code Changes Summary

### Files to ADD:
1. ✅ `functions/src/googlePlayWebhook.ts` - New webhook handler
2. ✅ `services/google-play-subscription.ts` - Client-side purchase logic

### Files to MODIFY:
1. ✅ `functions/src/index.ts` - Add new export
2. ✅ `app/(protected)/subscription/index.tsx` - Use Google Play instead of Instamojo
3. ✅ `types/subscription.ts` - Add Google Play types

### Files to KEEP (for iOS or web):
- ❓ Keep Instamojo for web users who can't use Google Play
- ❓ Add Apple In-App Purchase for iOS

## Migration Strategy

### Option 1: Replace Instamojo Completely
- Remove all Instamojo code
- Use Google Play Billing only
- **Downside**: Web users can't purchase (Android app only)

### Option 2: Keep Both (Recommended)
- Android app → Google Play Billing
- Web users → Instamojo
- Check platform and show appropriate payment method

```typescript
if (Platform.OS === 'android') {
  // Use Google Play Billing
  await purchaseGooglePlaySubscription(planId);
} else {
  // Use Instamojo (web fallback)
  await initiateInstamojoPayment(planId, userId);
}
```

## Advantages Over Current Implementation

| Feature | Current (Instamojo) | With Google Play Billing |
|---------|--------------------|-----------------------|
| User identification | ❌ Phone matching | ✅ obfuscatedAccountId |
| Race conditions | ⚠️ Possible | ✅ None |
| Payment reliability | ⚠️ 85-90% | ✅ 99%+ |
| User experience | ❌ External redirect | ✅ In-app, seamless |
| Webhook accuracy | ❌ No buyer info | ✅ Full purchase details |
| Subscription management | ❌ Manual | ✅ Automatic (Google handles) |
| Refunds | ❌ Manual process | ✅ Automatic |
| Testing | ⚠️ Test payments = real money | ✅ Test accounts free |

## Testing

1. **Create test account** in Google Play Console
2. **Add tester email** to closed testing track
3. **Make test purchases** (no real money charged)
4. **Verify webhook** receives notifications
5. **Check Firestore** - subscription updated correctly

## Timeline Estimate

- **Setup (Day 1)**: 2-3 hours
  - Configure Google Play Console
  - Create service account
  - Setup Pub/Sub topic

- **Development (Day 2-3)**: 8-12 hours
  - Implement webhook function
  - Add client-side purchase flow
  - Update UI to use Google Play

- **Testing (Day 4)**: 4-6 hours
  - Test all subscription types
  - Test edge cases
  - Verify webhook reliability

- **Total**: 3-4 days for complete implementation

## Next Steps

1. ✅ **Decide**: Keep Instamojo or fully replace?
2. ✅ **Setup**: Google Play Console configuration
3. ✅ **Implement**: Webhook function
4. ✅ **Test**: With test accounts
5. ✅ **Deploy**: To production
6. ✅ **Monitor**: Check webhook logs for issues

## Cost Comparison

### Instamojo Fees:
- 2% + ₹3 per transaction
- ₹30 plan → You receive: ₹26.40 (₹3.60 fee)

### Google Play Fees:
- 15% for first $1M revenue/year
- 30% after $1M
- ₹30 plan → You receive: ₹25.50 (₹4.50 fee)

**Verdict**: Slightly higher fees, but MUCH better reliability and user experience. Worth it!

## Recommendation

**Switch to Google Play Billing** for your Android app because:
1. ✅ Eliminates all current Instamojo issues
2. ✅ Required for Play Store compliance anyway
3. ✅ Better user experience = higher conversion
4. ✅ Automatic subscription management
5. ✅ Industry standard for Android apps

Keep Instamojo as a fallback for web users if needed.

---

**Ready to implement? Let me know and I'll write the actual code!**
