/**
 * Initialize Subscription Data in Firestore
 *
 * This script sets up the default subscription plans and configuration in Firestore.
 * Run this once to initialize the subscription system.
 *
 * Usage: node scripts/init-subscriptions.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration (from your existing app config)
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
      "No ads",
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      "No ads",
    ],
    active: true,
    popular: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      "No ads",
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Default subscription configuration
const defaultConfig = {
  freeTrialSwipeLimit: 5,
  razorpayKeyId: "rzp_test_RppoO9N9nmGALz", // Test key provided by user
  razorpayKeySecret: "FJm3HQKomPlfTHt1xknBUCDW", // Test secret provided by user
  subscriptionEnabled: true,
  updatedAt: new Date(),
  updatedBy: "system",
};

async function initializeSubscriptionData() {
  try {
    console.log('🚀 Starting subscription data initialization...');

    // 1. Create subscription plans document
    console.log('📝 Creating subscription plans...');
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    await setDoc(plansRef, defaultPlans);
    console.log('✅ Subscription plans created successfully');

    // 2. Create subscription config document
    console.log('⚙️ Creating subscription configuration...');
    const configRef = doc(db, 'subscriptionConfig', 'default');
    await setDoc(configRef, defaultConfig);
    console.log('✅ Subscription configuration created successfully');

    // 3. Verify the data was created
    console.log('🔍 Verifying data...');
    const plansSnap = await getDoc(plansRef);
    const configSnap = await getDoc(configRef);

    if (plansSnap.exists() && configSnap.exists()) {
      console.log('✅ Data verification successful!');
      console.log('\n📊 Created Plans:');
      console.log('  - Daily Plan: ₹30 (1 day, 50 swipes)');
      console.log('  - Weekly Plan: ₹100 (7 days, 100 swipes) [POPULAR]');
      console.log('  - Monthly Plan: ₹300 (30 days, unlimited swipes)');
      console.log('\n⚙️ Configuration:');
      console.log(`  - Free trial limit: ${defaultConfig.freeTrialSwipeLimit} swipes`);
      console.log(`  - Razorpay Key ID: ${defaultConfig.razorpayKeyId}`);
      console.log(`  - Subscription enabled: ${defaultConfig.subscriptionEnabled}`);
    } else {
      console.error('❌ Data verification failed!');
      process.exit(1);
    }

    console.log('\n✨ Subscription system initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test the subscription flow in the app');
    console.log('  2. Swipe 5 times to see the limit modal');
    console.log('  3. Try upgrading with Razorpay test card: 4111 1111 1111 1111');
    console.log('  4. Adjust swipe limits and pricing via Firestore console if needed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing subscription data:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeSubscriptionData();
