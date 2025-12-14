/**
 * Initialize CCAvenue Configuration in Firestore
 *
 * This script sets up the CCAvenue payment gateway configuration
 * and creates default subscription plans.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration (from your config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBDIcEXi1okXQbnZWmVKiKW9Dz2faBREYI",
  authDomain: "dular-c0e66.firebaseapp.com",
  projectId: "dular-c0e66",
  storageBucket: "dular-c0e66.firebasestorage.app",
  messagingSenderId: "574653730672",
  appId: "1:574653730672:web:0afd5bc4d78c72ee3a8d81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeCCAvenue() {
  try {
    console.log('🚀 Starting CCAvenue configuration initialization...\n');

    // 1. Create CCAvenue configuration
    console.log('📝 Creating CCAvenue configuration...');
    const configRef = doc(db, 'subscriptionConfig', 'default');
    const configData = {
      freeTrialSwipeLimit: 5,
      ccavenueAccessCode: 'AVNF94KH56AC67FNCA',
      ccavenueMerchantId: '2718018',
      ccavenueWorkingKey: 'E6FF0434306EFA9066D8BFB4C55C8F81',
      subscriptionEnabled: true,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin',
    };

    await setDoc(configRef, configData);
    console.log('✅ CCAvenue configuration created successfully!');
    console.log('   - Merchant ID: 2718018');
    console.log('   - Access Code: AVNF94KH56AC67FNCA');
    console.log('   - Free trial swipes: 5\n');

    // 2. Create default subscription plans
    console.log('📝 Creating default subscription plans...');
    const plansRef = doc(db, 'subscriptionPlans', 'plans');
    const plansData = {
      daily: {
        id: 'daily',
        name: 'daily',
        displayName: 'Daily Premium',
        description: 'Perfect for trying out premium features',
        price: 49,
        currency: 'INR',
        duration: 1,
        swipeLimit: 100,
        features: [
          'See who likes you',
          'Unlimited swipes',
          'Priority matching',
          'No ads',
        ],
        active: true,
        popular: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      weekly: {
        id: 'weekly',
        name: 'weekly',
        displayName: 'Weekly Premium',
        description: 'Best value for exploring your matches',
        price: 199,
        currency: 'INR',
        duration: 7,
        swipeLimit: -1,
        features: [
          'See who likes you',
          'Unlimited swipes',
          'Priority matching',
          'Profile boost',
          'Advanced filters',
          'No ads',
        ],
        active: true,
        popular: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      monthly: {
        id: 'monthly',
        name: 'monthly',
        displayName: 'Monthly Premium',
        description: 'Ultimate experience with all features',
        price: 499,
        currency: 'INR',
        duration: 30,
        swipeLimit: -1,
        features: [
          'See who likes you',
          'Unlimited swipes',
          'Priority matching',
          'Daily profile boost',
          'Advanced filters',
          'Read receipts',
          'No ads',
        ],
        active: true,
        popular: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    };

    await setDoc(plansRef, plansData);
    console.log('✅ Subscription plans created successfully!');
    console.log('   - Daily Premium: ₹49/day');
    console.log('   - Weekly Premium: ₹199/week (Most Popular)');
    console.log('   - Monthly Premium: ₹499/month\n');

    console.log('🎉 All done! Your app is ready to accept payments with CCAvenue.');
    console.log('\n📱 Next steps:');
    console.log('   1. Restart your app to load the new configuration');
    console.log('   2. Navigate to subscription screen');
    console.log('   3. Select a plan and click Pay');
    console.log('   4. Test the CCAvenue payment flow\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing CCAvenue:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCCAvenue();
