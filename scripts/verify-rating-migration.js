const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyRatingMigration() {
  try {
    console.log('🔍 Verifying rating migration...\n');

    // Read MongoDB data
    const mongoData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../MongoUsers.json'), 'utf8')
    );

    console.log(`📊 MongoDB Data: ${mongoData.length} total users`);

    // Find users with non-zero ratings in MongoDB
    const usersWithRatings = mongoData.filter(u => u.rating && u.rating > 0);
    console.log(`   • Users with ratings > 0: ${usersWithRatings.length}`);
    console.log(`   • Users with rating = 0: ${mongoData.filter(u => !u.rating || u.rating === 0).length}\n`);

    // Check first 10 users with ratings
    console.log('🔎 Checking first 10 users with ratings in MongoDB:\n');
    console.log('═'.repeat(80));

    for (let i = 0; i < Math.min(10, usersWithRatings.length); i++) {
      const mongoUser = usersWithRatings[i];
      const userId = mongoUser.id;
      const mongoRating = mongoUser.rating;
      const mongoName = mongoUser.name;
      const mongoGender = mongoUser.gender;

      try {
        // Check if user exists in Firestore
        const userDoc = await db.collection('users').doc(userId).get();

        if (userDoc.exists) {
          const firestoreData = userDoc.data();
          const firestoreRating = firestoreData.rating;
          const firestoreName = `${firestoreData.onboarding?.data?.firstName || ''} ${firestoreData.onboarding?.data?.lastName || ''}`.trim();
          const firestoreGender = firestoreData.onboarding?.data?.gender;

          const match = mongoRating === firestoreRating ? '✅' : '❌';

          console.log(`${match} ${mongoName || 'Unknown'}`);
          console.log(`   MongoDB:   rating=${mongoRating}, gender=${mongoGender || 'N/A'}`);
          console.log(`   Firestore: rating=${firestoreRating}, gender=${firestoreGender || 'N/A'}, name=${firestoreName}`);
          console.log(`   User ID: ${userId.substring(0, 20)}...`);

          if (mongoRating !== firestoreRating) {
            console.log(`   ⚠️  MISMATCH! Expected ${mongoRating}, got ${firestoreRating}`);
          }
        } else {
          console.log(`❌ ${mongoName || 'Unknown'}`);
          console.log(`   MongoDB: rating=${mongoRating}, gender=${mongoGender || 'N/A'}`);
          console.log(`   Firestore: USER NOT FOUND`);
          console.log(`   User ID: ${userId.substring(0, 20)}...`);
        }
        console.log('─'.repeat(80));
      } catch (error) {
        console.log(`❌ Error checking user ${userId}:`, error.message);
        console.log('─'.repeat(80));
      }
    }

    // Check women users specifically
    console.log('\n🔍 Checking women users with ratings in Firestore:\n');
    console.log('═'.repeat(80));

    const womenQuery = await db.collection('users')
      .where('onboarding.data.gender', '==', 'Woman')
      .limit(20)
      .get();

    console.log(`Found ${womenQuery.size} women users in Firestore`);

    const womenWithRatings = [];
    womenQuery.forEach(doc => {
      const data = doc.data();
      const rating = data.rating || 0;
      const name = `${data.onboarding?.data?.firstName || ''} ${data.onboarding?.data?.lastName || ''}`.trim();
      womenWithRatings.push({ id: doc.id, name, rating });
    });

    // Sort by rating
    womenWithRatings.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    console.log('\nTop 20 women by rating:');
    womenWithRatings.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name.padEnd(30)} | Rating: ${user.rating}`);
    });

    console.log('\n📈 Summary:');
    const withRatings = womenWithRatings.filter(u => u.rating > 0).length;
    const withoutRatings = womenWithRatings.filter(u => u.rating === 0).length;
    console.log(`   • Women with ratings > 0: ${withRatings}`);
    console.log(`   • Women with rating = 0: ${withoutRatings}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyRatingMigration();
