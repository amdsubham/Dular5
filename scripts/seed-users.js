// This script seeds the Firestore database with test users
// Run with: node scripts/seed-users.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase configuration - you'll need to add your config
const firebaseConfig = {
  apiKey: "AIzaSyDnc8gLXuZ9qdPFrvbWCGjvw1ILQOYdUhU",
  authDomain: "dular5.firebaseapp.com",
  projectId: "dular5",
  storageBucket: "dular5.firebasestorage.app",
  messagingSenderId: "778928303056",
  appId: "1:778928303056:web:c10b8c3f7e55ae5f49af91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to generate random location near base coordinates
function getRandomNearbyLocation(baseLat, baseLng, radiusInKm = 50) {
  // Convert radius from kilometers to degrees (approximate)
  const radiusInDegrees = radiusInKm / 111.32;

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  const newLat = baseLat + x;
  const newLng = baseLng + y;

  return {
    latitude: parseFloat(newLat.toFixed(7)),
    longitude: parseFloat(newLng.toFixed(7))
  };
}

// Helper function to generate random date of birth (18-40 years old)
function getRandomDOB() {
  const today = new Date();
  const minAge = 18;
  const maxAge = 40;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const year = today.getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Sample data
const firstNames = {
  male: ['Rahul', 'Arjun', 'Vikram', 'Aditya', 'Rohan', 'Karan', 'Aarav', 'Siddharth', 'Ishaan', 'Vivek'],
  female: ['Priya', 'Anjali', 'Sneha', 'Riya', 'Kavya', 'Ananya', 'Shreya', 'Neha', 'Pooja', 'Divya']
};

const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Das', 'Mishra', 'Nair', 'Reddy', 'Gupta', 'Joshi'];

const interests = [
  'Travelling', 'Cooking', 'Movies', 'Music', 'Reading', 'Photography',
  'Fitness', 'Gaming', 'Art', 'Dancing', 'Sports', 'Yoga', 'Fashion',
  'Foodie', 'Technology', 'Nature', 'Pets', 'Writing', 'Adventure', 'Coffee'
];

const profileImages = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/men/67.jpg',
  'https://randomuser.me/api/portraits/men/89.jpg',
  'https://randomuser.me/api/portraits/men/12.jpg',
  'https://randomuser.me/api/portraits/women/32.jpg',
  'https://randomuser.me/api/portraits/women/45.jpg',
  'https://randomuser.me/api/portraits/women/67.jpg',
  'https://randomuser.me/api/portraits/women/89.jpg',
  'https://randomuser.me/api/portraits/women/12.jpg',
];

// Base location (Bhubaneswar area)
const BASE_LAT = 20.3492073;
const BASE_LNG = 85.8218683;

async function seedUsers() {
  console.log('Starting to seed users...\n');

  for (let i = 0; i < 10; i++) {
    const gender = i % 2 === 0 ? 'Man' : 'Woman';
    const firstName = gender === 'Man'
      ? firstNames.male[Math.floor(Math.random() * firstNames.male.length)]
      : firstNames.female[Math.floor(Math.random() * firstNames.female.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    // Generate random interests (3-5 interests per user)
    const numInterests = Math.floor(Math.random() * 3) + 3;
    const userInterests = [...interests]
      .sort(() => Math.random() - 0.5)
      .slice(0, numInterests);

    // Generate random location near base coordinates
    const location = getRandomNearbyLocation(BASE_LAT, BASE_LNG, 50);

    // Random height between 150-190 cm
    const height = Math.floor(Math.random() * 41) + 150;

    // Random looking for
    const lookingForOptions = ['casual-dates', 'long-term-relationship', 'friendship'];
    const numLookingFor = Math.floor(Math.random() * 2) + 1; // 1 or 2 options
    const lookingFor = [...lookingForOptions]
      .sort(() => Math.random() - 0.5)
      .slice(0, numLookingFor);

    // Interested in (opposite gender mostly, but some both)
    const interestedIn = Math.random() > 0.8
      ? ['Man', 'Woman']
      : [gender === 'Man' ? 'Woman' : 'Man'];

    // Generate 2-4 profile pictures with different image numbers
    const numPictures = Math.floor(Math.random() * 3) + 2;
    const genderType = gender === 'Man' ? 'men' : 'women';
    const pictures = Array.from({ length: numPictures }, (_, idx) => {
      const imageNum = Math.floor(Math.random() * 50) + 20;
      return `https://randomuser.me/api/portraits/${genderType}/${imageNum}.jpg`;
    });

    const dob = getRandomDOB();

    // Create user document
    const userId = `test-user-${Date.now()}-${i}`;
    const userData = {
      phoneNumber: `+91${9100000000 + Math.floor(Math.random() * 1000000)}`,
      createdAt: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date(),
      },
      onboarding: {
        currentStep: 'done',
        completedSteps: ['name', 'dob', 'gender', 'interest', 'looking-for', 'pictures', 'interests', 'location'],
        completed: true,
        lastUpdated: new Date(),
        data: {
          firstName,
          lastName,
          dob,
          gender,
          interestedIn,
          lookingFor,
          pictures,
          interests: userInterests,
          latitude: location.latitude,
          longitude: location.longitude,
          height: `${height} cm`,
        },
      },
    };

    try {
      await setDoc(doc(db, 'users', userId), userData);
      console.log(`✓ User ${i + 1}/10: ${firstName} ${lastName}`);
      console.log(`  Gender: ${gender}, Age: ${new Date().getFullYear() - parseInt(dob.split('-')[0])}`);
      console.log(`  Location: ${location.latitude}, ${location.longitude}`);
      console.log(`  Height: ${height} cm`);
      console.log(`  Interests: ${userInterests.join(', ')}`);
      console.log(`  Looking for: ${lookingFor.join(', ')}\n`);
    } catch (error) {
      console.error(`✗ Error creating user ${i + 1}:`, error);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('✓ Finished seeding 10 users!');
  process.exit(0);
}

// Run the seed function
seedUsers().catch(error => {
  console.error('Error seeding users:', error);
  process.exit(1);
});
