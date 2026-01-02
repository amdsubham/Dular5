const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserRatings() {
  try {
    console.log('🔍 Checking user ratings in database...\n');

    // Get all users with gender = "Woman"
    const usersSnapshot = await db.collection('users')
      .where('onboarding.data.gender', '==', 'Woman')
      .limit(20)
      .get();

    console.log(`Found ${usersSnapshot.size} women users\n`);

    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const onboardingData = data.onboarding?.data || {};
      users.push({
        id: doc.id,
        name: `${onboardingData.firstName || 'Unknown'} ${onboardingData.lastName || ''}`.trim(),
        gender: onboardingData.gender,
        rating: data.rating,
        ratingExists: data.rating !== undefined,
      });
    });

    // Sort by rating (highest first)
    users.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    console.log('Users sorted by rating (highest first):');
    console.log('═'.repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name.padEnd(25)} | Rating: ${user.rating || 0} | Exists: ${user.ratingExists}`);
    });
    console.log('═'.repeat(60));

    // Statistics
    const withRatings = users.filter(u => u.ratingExists).length;
    const withoutRatings = users.filter(u => !u.ratingExists).length;

    console.log(`\n📊 Statistics:`);
    console.log(`   • Users with ratings: ${withRatings}`);
    console.log(`   • Users without ratings: ${withoutRatings}`);

    if (withRatings > 0) {
      const avgRating = users.reduce((sum, u) => sum + (u.rating || 0), 0) / withRatings;
      console.log(`   • Average rating: ${avgRating.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserRatings();
