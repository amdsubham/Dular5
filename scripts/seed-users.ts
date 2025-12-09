import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper function to generate random location near base coordinates
function getRandomNearbyLocation(baseLat: number, baseLng: number, radiusInKm: number = 50) {
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
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
  'https://randomuser.me/api/portraits/men/5.jpg',
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/women/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
];

// Base location (Bhubaneswar area)
const BASE_LAT = 20.3492073;
const BASE_LNG = 85.8218683;

async function seedUsers() {
  console.log('Starting to seed users...');

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

    // Generate 2-4 profile pictures
    const numPictures = Math.floor(Math.random() * 3) + 2;
    const startIndex = gender === 'Man' ? 0 : 5;
    const pictures = Array.from({ length: numPictures }, (_, idx) =>
      profileImages[startIndex + (idx % 5)]
    );

    const dob = getRandomDOB();

    // Create user document
    const userId = `test-user-${Date.now()}-${i}`;
    const userData = {
      phoneNumber: `+91${9000000000 + i}`,
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
      console.log(`✓ Created user ${i + 1}/10: ${firstName} ${lastName} (${gender}) at ${location.latitude}, ${location.longitude}`);
    } catch (error) {
      console.error(`✗ Error creating user ${i + 1}:`, error);
    }
  }

  console.log('Finished seeding users!');
}

// Run the seed function
seedUsers().catch(console.error);
