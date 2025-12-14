/**
 * Create Default Subscription Plans in Firestore
 *
 * This script creates the 3 default subscription plans directly in Firestore
 * Run this once to populate your database with default plans
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCf1QIjzNw_U_M_dBgNWH3Mu6Rb38JUsco",
  authDomain: "santali-1c04b.firebaseapp.com",
  projectId: "santali-1c04b",
  storageBucket: "santali-1c04b.firebasestorage.app",
  messagingSenderId: "449854028598",
  appId: "1:449854028598:web:a8bf49d5c71e42ec7ea92c",
  measurementId: "G-7W76B3Z9SV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default subscription plans
const defaultPlans = {
  daily: {
    id: "daily",
    name: "Daily Plan",
    displayName: "Daily Plan",
    description: "Perfect for casual dating",
    price: 30,
    currency: "INR",
    duration: 1,
    swipeLimit: 50,
    features: [
      "50 daily swipes",
      "See who likes you",
      "Priority matching",
      "No ads"
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  weekly: {
    id: "weekly",
    name: "Weekly Plan",
    displayName: "Weekly Plan",
    description: "Most popular choice for serious daters",
    price: 100,
    currency: "INR",
    duration: 7,
    swipeLimit: 100,
    features: [
      "100 daily swipes",
      "See who likes you",
      "Priority matching",
      "Profile boost",
      "Advanced filters",
      "No ads"
    ],
    active: true,
    popular: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  monthly: {
    id: "monthly",
    name: "Monthly Plan",
    displayName: "Monthly Plan",
    description: "Best value for unlimited dating",
    price: 300,
    currency: "INR",
    duration: 30,
    swipeLimit: -1, // Unlimited
    features: [
      "Unlimited daily swipes",
      "See who likes you",
      "Priority matching",
      "Daily profile boost",
      "Advanced filters",
      "Read receipts",
      "No ads"
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Default configuration
const defaultConfig = {
  freeTrialSwipeLimit: 5,
  razorpayKeyId: "rzp_test_RppoO9N9nmGALz",
  razorpayKeySecret: "FJm3HQKomPlfTHt1xknBUCDW",
  subscriptionEnabled: true,
  updatedAt: new Date(),
  updatedBy: "system"
};

async function createDefaultPlans() {
  try {
    console.log('🚀 Creating default subscription plans...\n');

    // Create plans document
    console.log('📦 Creating subscription plans...');
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    await setDoc(plansRef, defaultPlans);
    console.log('✅ Subscription plans created!\n');

    // Create config document
    console.log('⚙️  Creating subscription config...');
    const configRef = doc(db, 'subscriptionConfig', 'default');
    await setDoc(configRef, defaultConfig);
    console.log('✅ Subscription config created!\n');

    console.log('📊 Created Plans Summary:\n');
    console.log('  💰 Daily Plan    - ₹30  (1 day,  50 swipes/day)');
    console.log('  🔥 Weekly Plan   - ₹100 (7 days, 100 swipes/day) [POPULAR]');
    console.log('  ⭐ Monthly Plan  - ₹300 (30 days, unlimited swipes)\n');

    console.log('⚙️  Configuration:\n');
    console.log('  • Free Trial: 5 swipes/day');
    console.log('  • Razorpay: Test Mode');
    console.log('  • System: Enabled\n');

    console.log('✨ SUCCESS! Default plans are now available in:');
    console.log('  📱 Mobile App: /subscription');
    console.log('  🖥️  Admin Panel: http://localhost:3001/dashboard/subscriptions\n');

    console.log('🎯 Next Steps:');
    console.log('  1. Open your mobile app');
    console.log('  2. Swipe 5 times to reach limit');
    console.log('  3. Click "Upgrade Now"');
    console.log('  4. See your default plans!');
    console.log('  5. Test payment with: 4111 1111 1111 1111\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating plans:', error);
    console.error('\n💡 Possible solutions:');
    console.error('  1. Check your internet connection');
    console.error('  2. Verify Firebase config is correct');
    console.error('  3. Ensure Firestore is enabled in Firebase console');
    console.error('  4. Check Firestore security rules allow writes\n');
    process.exit(1);
  }
}

// Run the script
console.log('═══════════════════════════════════════════════════');
console.log('   Default Subscription Plans Creator');
console.log('═══════════════════════════════════════════════════\n');

createDefaultPlans();
