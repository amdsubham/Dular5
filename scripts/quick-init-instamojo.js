/**
 * Quick Initialize Instamojo Configuration
 *
 * This script initializes Instamojo config in Firestore with just the private salt
 */

const admin = require('firebase-admin');

// Initialize using the functions' service account
admin.initializeApp({
  projectId: 'dular5'
});

const db = admin.firestore();

async function quickInit() {
  console.log('\n🚀 Quick Instamojo Configuration Setup\n');

  // For now, let's use a placeholder and the user can update it later
  // The private salt should be obtained from Instamojo dashboard
  const privateSalt = process.argv[2] || 'PLACEHOLDER_SALT_UPDATE_ME';

  if (privateSalt === 'PLACEHOLDER_SALT_UPDATE_ME') {
    console.log('⚠️  WARNING: Using placeholder private salt!');
    console.log('You must update this with your actual Instamojo Private Salt');
    console.log('\nUsage: node scripts/quick-init-instamojo.js YOUR_PRIVATE_SALT\n');
  }

  try {
    await db.collection('subscriptionConfig').doc('instamojo').set({
      // Private salt for webhook verification
      instamojoPrivateSalt: privateSalt,

      // Smart links for each plan
      instamojoSmartLinks: {
        daily: 'https://imjo.in/hbvW2s',
        weekly: 'https://imjo.in/xU7gCw',
        monthly: 'https://imjo.in/qQBgZ7',
      },

      // Configuration
      paymentProvider: 'instamojo',
      subscriptionEnabled: true,
      freeTrialSwipeLimit: 5,

      // Metadata
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system',
    });

    console.log('✅ Instamojo configuration saved to Firestore!\n');
    console.log('📋 Configuration:');
    console.log('  Private Salt:', privateSalt);
    console.log('  Daily Link:   https://imjo.in/hbvW2s');
    console.log('  Weekly Link:  https://imjo.in/xU7gCw');
    console.log('  Monthly Link: https://imjo.in/qQBgZ7');
    console.log('\n🔗 Webhook URL: https://us-central1-dular5.cloudfunctions.net/instamojoWebhook\n');

    if (privateSalt === 'PLACEHOLDER_SALT_UPDATE_ME') {
      console.log('⚠️  IMPORTANT: Update the private salt in Firestore!');
      console.log('   Go to: Firebase Console → Firestore → subscriptionConfig → instamojo');
      console.log('   Update field: instamojoPrivateSalt\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

quickInit();
