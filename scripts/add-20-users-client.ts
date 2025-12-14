/**
 * Add 20 Complete Users with All Data (Client SDK Version)
 *
 * Run with: npx ts-node scripts/add-20-users-client.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration (from your config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDy3sS0EXEcDbfDNlS1WYDKb3IvRbTgbAk",
  authDomain: "dating-app-f0c57.firebaseapp.com",
  projectId: "dating-app-f0c57",
  storageBucket: "dating-app-f0c57.firebasestorage.app",
  messagingSenderId: "527508906610",
  appId: "1:527508906610:web:e82b7e5dcdb15a62fef31c",
  measurementId: "G-Q6K1TLGW3C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample profile pictures URLs
const MALE_PICTURES = [
  'https://randomuser.me/api/portraits/men/6.jpg',
  'https://randomuser.me/api/portraits/men/7.jpg',
  'https://randomuser.me/api/portraits/men/8.jpg',
  'https://randomuser.me/api/portraits/men/9.jpg',
  'https://randomuser.me/api/portraits/men/10.jpg',
];

const FEMALE_PICTURES = [
  'https://randomuser.me/api/portraits/women/6.jpg',
  'https://randomuser.me/api/portraits/women/7.jpg',
  'https://randomuser.me/api/portraits/women/8.jpg',
  'https://randomuser.me/api/portraits/women/9.jpg',
  'https://randomuser.me/api/portraits/women/10.jpg',
];

// Sample data
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

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAge(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDateOfBirth(age: number): Date {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, birthMonth, birthDay);
}

async function createUser(index: number, gender: 'male' | 'female') {
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

  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}${Date.now()}@testuser.com`;
  const password = 'Test@123456';

  try {
    // Create authentication user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    const userData = {
      uid: userId,
      firstName,
      lastName,
      email,
      phone: `+91${9000000000 + index}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),

      age,
      dateOfBirth: Timestamp.fromDate(getDateOfBirth(age)),
      interests,
      pictures,
      rating: Math.floor(Math.random() * 2) + 4,

      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        updatedAt: Timestamp.now(),
      },

      onboarding: {
        completed: true,
        completedAt: Timestamp.now(),
        data: {
          firstName,
          lastName,
          dateOfBirth: Timestamp.fromDate(getDateOfBirth(age)),
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

      isActive: true,
      isOnline: Math.random() > 0.5,
      lastSeen: Timestamp.now(),
      blockedUsers: [],

      notificationSettings: {
        matches: true,
        messages: true,
        likes: true,
      },

      pushToken: null,
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', userId), userData);

    console.log(`✅ Added: ${firstName} ${lastName} (${gender}, ${age} years, ${location.city})`);
    return userData;
  } catch (error: any) {
    console.error(`❌ Error creating user ${firstName} ${lastName}:`, error.message);
    throw error;
  }
}

async function addUsers() {
  try {
    console.log('🚀 Starting to create 20 complete users...\n');

    // Create 10 males and 10 females
    for (let i = 0; i < 10; i++) {
      await createUser(i * 2, 'male');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between users

      await createUser(i * 2 + 1, 'female');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between users
    }

    console.log('\n🎉 Successfully added 20 complete users!');
    console.log('\nSummary:');
    console.log('- 10 Male users');
    console.log('- 10 Female users');
    console.log('- All with complete profiles');
    console.log('- All with 5 pictures each');
    console.log('- All with interests and preferences');
    console.log('- All with location data');
    console.log('- All with onboarding completed');
    console.log('- All with authentication accounts');
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
