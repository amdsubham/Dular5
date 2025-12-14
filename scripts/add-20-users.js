/**
 * Add 20 Complete Users with All Data
 *
 * This script creates 20 fully complete users with:
 * - Complete profile data
 * - Pictures (5 images each)
 * - Interests
 * - Looking for preferences
 * - Gender preferences
 * - Location data
 * - Onboarding completed
 * - All required fields
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

// Sample profile pictures URLs (using placeholder images)
const MALE_PICTURES = [
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg',
];

const FEMALE_PICTURES = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
];

// Sample data arrays
const MALE_FIRST_NAMES = [
  'Rahul', 'Amit', 'Rohan', 'Arjun', 'Vikram',
  'Aditya', 'Karan', 'Raj', 'Sanjay', 'Nikhil'
];

const FEMALE_FIRST_NAMES = [
  'Priya', 'Ananya', 'Sneha', 'Riya', 'Pooja',
  'Kavya', 'Neha', 'Divya', 'Shruti', 'Anjali'
];

const LAST_NAMES = [
  'Sharma', 'Kumar', 'Singh', 'Patel', 'Gupta',
  'Reddy', 'Shah', 'Mehta', 'Verma', 'Chopra'
];

const INTERESTS = [
  'Travel', 'Photography', 'Music', 'Dance', 'Cooking',
  'Reading', 'Sports', 'Yoga', 'Hiking', 'Movies',
  'Art', 'Gaming', 'Fitness', 'Writing', 'Swimming'
];

const LOOKING_FOR_OPTIONS = [
  'Long-term relationship',
  'Short-term relationship',
  'Friendship',
  'Something casual',
  'Not sure yet'
];

// Location data (various cities in India with coordinates)
const LOCATIONS = [
  { city: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { city: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  { city: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
  { city: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { city: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { city: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { city: 'Lucknow', latitude: 26.8467, longitude: 80.9462 }
];

// Helper function to get random items from array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random age between min and max
function getRandomAge(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random date of birth based on age
function getDateOfBirth(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, birthMonth, birthDay);
}

// Create a complete user
async function createUser(index, gender) {
  const age = getRandomAge(22, 35);
  const firstName = gender === 'male'
    ? getRandomItem(MALE_FIRST_NAMES)
    : getRandomItem(FEMALE_FIRST_NAMES);
  const lastName = getRandomItem(LAST_NAMES);
  const location = getRandomItem(LOCATIONS);
  const interests = getRandomItems(INTERESTS, 5);
  const lookingFor = getRandomItems(LOOKING_FOR_OPTIONS, 2);
  const interestedIn = gender === 'male' ? ['female'] : ['male'];
  const pictures = gender === 'male'
    ? getRandomItems(MALE_PICTURES, 5)
    : getRandomItems(FEMALE_PICTURES, 5);

  // Generate unique user ID
  const userId = `user_${Date.now()}_${index}`;

  const userData = {
    uid: userId,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    phone: `+91${9000000000 + index}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Profile data
    age,
    dateOfBirth: admin.firestore.Timestamp.fromDate(getDateOfBirth(age)),
    interests,
    pictures,
    rating: Math.floor(Math.random() * 2) + 4, // Rating between 4-5

    // Location
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },

    // Onboarding data
    onboarding: {
      completed: true,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      data: {
        firstName,
        lastName,
        dateOfBirth: admin.firestore.Timestamp.fromDate(getDateOfBirth(age)),
        gender,
        interestedIn,
        lookingFor,
        interests,
        pictures,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
        }
      }
    },

    // Activity status
    isActive: true,
    isOnline: Math.random() > 0.5, // 50% chance of being online
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),

    // Privacy
    blockedUsers: [],

    // Notifications
    notificationSettings: {
      matches: true,
      messages: true,
      likes: true,
    },

    // Push token (empty for now)
    pushToken: null,
  };

  return userData;
}

async function addUsers() {
  try {
    console.log('🚀 Starting to create 20 complete users...\n');

    const batch = db.batch();
    const users = [];

    // Create 10 males and 10 females
    for (let i = 0; i < 10; i++) {
      const maleUser = await createUser(i * 2, 'male');
      const femaleUser = await createUser(i * 2 + 1, 'female');

      users.push(maleUser, femaleUser);
    }

    // Add all users to batch
    for (const user of users) {
      const userRef = db.collection('users').doc(user.uid);
      batch.set(userRef, user);

      console.log(`✅ Added: ${user.firstName} ${user.lastName} (${user.onboarding.data.gender}, ${user.age} years, ${user.location.city})`);
    }

    // Commit the batch
    await batch.commit();

    console.log('\n🎉 Successfully added 20 complete users!');
    console.log('\nSummary:');
    console.log('- 10 Male users');
    console.log('- 10 Female users');
    console.log('- All with complete profiles');
    console.log('- All with 5 pictures each');
    console.log('- All with interests and preferences');
    console.log('- All with location data');
    console.log('- All with onboarding completed');
    console.log('\n✨ Users are ready for matching!\n');

  } catch (error) {
    console.error('❌ Error adding users:', error);
  }
}

// Run the script
addUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
