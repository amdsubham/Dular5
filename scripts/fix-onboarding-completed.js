/**
 * Script to fix onboarding.completed flag for users who finished onboarding
 * This is a one-time fix for the issue where completed=false despite all steps done
 */

const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json'); // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixOnboardingCompleted() {
  console.log('Starting to fix onboarding.completed flags...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let fixed = 0;
  let alreadyCorrect = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const onboarding = data.onboarding;

    if (!onboarding) {
      console.log(`⚠️  User ${doc.id}: No onboarding data`);
      continue;
    }

    const completedSteps = onboarding.completedSteps || [];
    const requiredSteps = ['name', 'dob', 'gender', 'interest', 'looking-for', 'pictures', 'interests', 'location'];
    const hasAllSteps = requiredSteps.every(step => completedSteps.includes(step));

    if (hasAllSteps && !onboarding.completed) {
      // Fix this user
      await doc.ref.update({
        'onboarding.completed': true,
        'onboarding.currentStep': 'done'
      });
      console.log(`✅ Fixed user ${doc.id} (${onboarding.data?.firstName || 'Unknown'})`);
      fixed++;
    } else if (hasAllSteps && onboarding.completed) {
      console.log(`✓  User ${doc.id}: Already correct`);
      alreadyCorrect++;
    } else {
      console.log(`⏭  User ${doc.id}: Onboarding incomplete (${completedSteps.length}/8 steps)`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixed} users`);
  console.log(`Already correct: ${alreadyCorrect} users`);
  console.log(`Total checked: ${snapshot.size} users`);
}

fixOnboardingCompleted()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
