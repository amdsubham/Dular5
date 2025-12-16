/**
 * Initialize Instamojo Configuration in Firestore
 *
 * This script sets up the Instamojo payment configuration and smart links in Firestore.
 * Run this once after deploying the webhook to configure payment integration.
 *
 * Usage:
 *   node scripts/init-instamojo-config.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function initializeInstamojoConfig() {
  console.log('\n🚀 Instamojo Configuration Setup\n');
  console.log('This script will configure Instamojo smart links for your subscription plans.\n');

  // Get Instamojo credentials
  console.log('📝 Step 1: Instamojo Credentials');
  console.log('Get these from your Instamojo dashboard: https://www.instamojo.com/\n');

  const apiKey = await question('Enter your Instamojo API Key (optional for smart links): ');
  const authToken = await question('Enter your Instamojo Auth Token (optional for smart links): ');
  const privateSalt = await question('Enter your Instamojo Private Salt (for webhook verification): ');

  console.log('\n📝 Step 2: Smart Links Configuration');
  console.log('Using pre-configured Instamojo smart links:\n');
  console.log('  Daily Plan:   https://imjo.in/hbvW2s (₹49)');
  console.log('  Weekly Plan:  https://imjo.in/xU7gCw (₹199)');
  console.log('  Monthly Plan: https://imjo.in/qQBgZ7 (₹499)\n');
  console.log('Make sure these links have:\n');
  console.log('  1. ✅ Name, email, and phone number collection enabled');
  console.log('  2. ✅ Webhook URL: https://us-central1-dular5.cloudfunctions.net/instamojoWebhook');
  console.log('  3. ✅ Correct amounts set for each plan\n');

  const dailySmartLink = 'https://imjo.in/hbvW2s';
  const weeklySmartLink = 'https://imjo.in/xU7gCw';
  const monthlySmartLink = 'https://imjo.in/qQBgZ7';

  console.log('\n✅ Configuration Summary:');
  console.log('─────────────────────────────────────');
  console.log('API Key:', apiKey ? '✓ Provided' : '✗ Not provided');
  console.log('Auth Token:', authToken ? '✓ Provided' : '✗ Not provided');
  console.log('Private Salt:', privateSalt ? '✓ Provided' : '✗ Not provided');
  console.log('Daily Smart Link:', dailySmartLink);
  console.log('Weekly Smart Link:', weeklySmartLink);
  console.log('Monthly Smart Link:', monthlySmartLink);
  console.log('─────────────────────────────────────\n');

  const confirm = await question('Do you want to save this configuration? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Configuration cancelled.');
    rl.close();
    return;
  }

  try {
    // Save Instamojo configuration
    await db.collection('subscriptionConfig').doc('instamojo').set({
      // API credentials (optional for smart links)
      instamojoApiKey: apiKey || null,
      instamojoAuthToken: authToken || null,
      instamojoPrivateSalt: privateSalt,

      // Smart links for each plan
      instamojoSmartLinks: {
        daily: dailySmartLink,
        weekly: weeklySmartLink,
        monthly: monthlySmartLink,
      },

      // Payment provider
      paymentProvider: 'instamojo',
      subscriptionEnabled: true,
      freeTrialSwipeLimit: 5,

      // Metadata
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system',
    });

    console.log('\n✅ Instamojo configuration saved successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Test the webhook URL using Instamojo\'s testing tool');
    console.log('  2. Make a test payment using one of the smart links');
    console.log('  3. Check Firebase Functions logs for webhook events');
    console.log('  4. Verify that subscription is activated after payment\n');

    console.log('🔗 Webhook URL for Instamojo:');
    console.log('   https://us-central1-dular5.cloudfunctions.net/instamojoWebhook\n');

  } catch (error) {
    console.error('\n❌ Error saving configuration:', error);
  }

  rl.close();
}

// Run the script
initializeInstamojoConfig()
  .then(() => {
    console.log('\n✨ Setup complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
