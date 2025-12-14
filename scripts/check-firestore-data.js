/**
 * Diagnostic script to check Firestore user data structure
 * This will help identify why users aren't showing up in the swipe screen
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit, where } = require('firebase/firestore');

// Firebase configuration - make sure this matches your config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirestoreData() {
  console.log('\n=== FIRESTORE DATA DIAGNOSTIC ===\n');

  try {
    // Get first 5 users to check their structure
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(5));
    const snapshot = await getDocs(q);

    console.log(`📊 Total users in database (first 5): ${snapshot.size}\n`);

    if (snapshot.size === 0) {
      console.log('❌ NO USERS FOUND IN DATABASE!');
      console.log('   This means the migration might not have run successfully.');
      return;
    }

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- User ${index + 1}: ${doc.id} ---`);
      console.log(`Name: ${data.firstName || 'N/A'} ${data.lastName || ''}`);
      console.log(`Gender (root): ${data.gender || 'N/A'}`);
      console.log(`Gender (onboarding): ${data.onboarding?.data?.gender || 'N/A'}`);
      console.log(`InterestedIn (root): ${JSON.stringify(data.interestedIn || [])}`);
      console.log(`InterestedIn (onboarding): ${JSON.stringify(data.onboarding?.data?.interestedIn || [])}`);
      console.log(`DOB: ${data.onboarding?.data?.dob || 'N/A'}`);
      console.log(`Pictures: ${data.onboarding?.data?.pictures?.length || 0} photos`);
      console.log(`Location: ${data.location ? 'YES' : 'NO'}`);
      console.log(`Onboarding completed: ${data.onboarding?.completed || false}`);
    });

    console.log('\n\n=== TESTING GENDER QUERIES ===\n');

    // Test query with 'Man' filter
    console.log('Testing query: onboarding.data.gender == "Man"');
    const manQuery = query(usersRef, where('onboarding.data.gender', '==', 'Man'), limit(5));
    const manSnapshot = await getDocs(manQuery);
    console.log(`  ✓ Found ${manSnapshot.size} Men\n`);

    // Test query with 'Woman' filter
    console.log('Testing query: onboarding.data.gender == "Woman"');
    const womanQuery = query(usersRef, where('onboarding.data.gender', '==', 'Woman'), limit(5));
    const womanSnapshot = await getDocs(womanQuery);
    console.log(`  ✓ Found ${womanSnapshot.size} Women\n`);

    // Test query with 'in' operator for multiple genders
    console.log('Testing query: onboarding.data.gender in ["Man", "Woman"]');
    const genderInQuery = query(usersRef, where('onboarding.data.gender', 'in', ['Man', 'Woman']), limit(10));
    const genderInSnapshot = await getDocs(genderInQuery);
    console.log(`  ✓ Found ${genderInSnapshot.size} users\n`);

    console.log('\n=== RECOMMENDATIONS ===\n');

    if (manSnapshot.size === 0 && womanSnapshot.size === 0) {
      console.log('❌ ISSUE: Gender queries return 0 results!');
      console.log('   This means either:');
      console.log('   1. The data was not migrated correctly');
      console.log('   2. The gender field is not at onboarding.data.gender');
      console.log('   3. The gender values are not "Man"/"Woman" (case-sensitive)');
      console.log('\n   Solution: Re-run the migration from admin panel');
    } else {
      console.log('✅ Gender queries working correctly!');
      console.log('   If users still don\'t show up, check:');
      console.log('   1. User preferences/filters in the app');
      console.log('   2. Already swiped users list');
      console.log('   3. Blocked users list');
      console.log('   4. Age/distance filters');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  }

  process.exit(0);
}

checkFirestoreData();
