/**
 * Reset User Subscription to Free Tier
 *
 * This script resets a user's subscription back to free tier for testing.
 * Run with: node scripts/reset-subscription.js <userId>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function resetSubscription(userId) {
  try {
    console.log(`\n🔄 Resetting subscription for user: ${userId}\n`);

    const userRef = db.collection('users').doc(userId);
    const subscriptionRef = db.collection('subscriptions').doc(userId);

    // Get current subscription
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      console.log('❌ No subscription found for this user');
      return;
    }

    const currentSub = subscriptionDoc.data();
    console.log('Current subscription:', {
      plan: currentSub.currentPlan,
      isPremium: currentSub.isPremium,
      isActive: currentSub.isActive,
    });

    // Reset to free tier
    const resetData = {
      currentPlan: 'free',
      planName: 'Free',
      isPremium: false,
      isActive: false,
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      endDate: null,
      swipesLimit: 5, // Free tier limit
      swipesUsedToday: 0,
      lastSwipeReset: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subscriptionRef.update(resetData);

    console.log('\n✅ Subscription reset to FREE tier successfully!');
    console.log('New subscription:', {
      plan: 'free',
      isPremium: false,
      swipesLimit: 5,
    });
    console.log('\n💡 Reload your app to see the premium upgrade card again!\n');

  } catch (error) {
    console.error('❌ Error resetting subscription:', error);
  }
}

// Get userId from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a userId');
  console.log('Usage: node scripts/reset-subscription.js <userId>');
  process.exit(1);
}

resetSubscription(userId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
