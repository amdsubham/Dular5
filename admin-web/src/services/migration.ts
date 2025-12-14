/**
 * User Migration Service
 * Handles migration of users from MongoDB to Firestore
 */

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// MongoDB user structure
export interface MongoUser {
  _id: { $oid: string };
  id: string;
  name?: string;
  photoUrl?: string;
  rating?: number;
  lastUpdated?: string;
  createdAt?: string;
  job?: string;
  gender?: string;
  genderOfInterest?: string;
  age?: number | string; // Can be a number (25) or date string ("2003/1/1")
  bio?: string;
  interests?: string[];
  photos?: string[];
  phoneNumber?: string;
  email?: string;
}

// Default location for all migrated users
const DEFAULT_LOCATION = {
  latitude: 23.3516935,
  longitude: 85.2543815,
  city: 'Ranchi',
};

/**
 * Map MongoDB user to Firestore user structure
 */
const mapMongoUserToFirestore = (mongoUser: MongoUser) => {
  // Parse name into firstName and lastName
  const nameParts = (mongoUser.name || 'Unknown User').trim().split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Map gender - handle all case variations: "Male", "MALE", "male", "Man", "MAN", etc.
  // Convert to "Man" or "Woman" for consistency across the app
  let gender = 'other'; // default
  if (mongoUser.gender) {
    const genderLower = mongoUser.gender.trim().toLowerCase();
    if (genderLower === 'male' || genderLower === 'm' || genderLower === 'man') {
      gender = 'Man';
    } else if (genderLower === 'female' || genderLower === 'f' || genderLower === 'woman') {
      gender = 'Woman';
    }
  }

  // Map interested in (genderOfInterest) - handle all case variations
  // Examples: "Men", "MEN", "men", "Women", "WOMEN", "women", "Male", "MALE", "Female", etc.
  // Convert to "Man" or "Woman" for consistency across the app
  const interestedIn: string[] = [];
  if (mongoUser.genderOfInterest) {
    const interestLower = mongoUser.genderOfInterest.trim().toLowerCase();

    // Check for "both", "everyone", or explicit combinations first (case-insensitive)
    const hasBoth = interestLower.includes('both') ||
                    interestLower.includes('everyone') ||
                    interestLower.includes('all') ||
                    (interestLower.includes('men') && interestLower.includes('and') && interestLower.includes('women')) ||
                    (interestLower.includes('male') && interestLower.includes('and') && interestLower.includes('female'));

    if (hasBoth) {
      interestedIn.push('Man', 'Woman');
    } else {
      // Check for female/women first (to avoid "women" matching "men")
      if (interestLower === 'women' || interestLower === 'woman' ||
          interestLower === 'female' || interestLower === 'f') {
        interestedIn.push('Woman');
      }
      // Check for male/men (only if not female)
      else if (interestLower === 'men' || interestLower === 'man' ||
               interestLower === 'male' || interestLower === 'm') {
        interestedIn.push('Man');
      }
    }
  }

  // Default to opposite gender if nothing specified
  if (interestedIn.length === 0) {
    interestedIn.push(gender === 'Man' ? 'Woman' : 'Man');
  }

  // Calculate age or parse date of birth
  let age = 25; // default age
  // Default DOB: 25 years ago with random month/day to ensure accurate age
  const today = new Date();
  const defaultBirthYear = today.getFullYear() - 25;
  const defaultMonth = Math.floor(Math.random() * today.getMonth() + 1); // Random month before current month
  const defaultDay = Math.floor(Math.random() * 28) + 1;
  let dob = new Date(defaultBirthYear, defaultMonth, defaultDay);

  if (mongoUser.age) {
    // Check if age is a date string (like "2003/1/1")
    if (typeof mongoUser.age === 'string' && mongoUser.age.includes('/')) {
      try {
        const parsedDob = new Date(mongoUser.age);
        if (!isNaN(parsedDob.getTime())) {
          dob = parsedDob;
          // Calculate age from DOB
          const today = new Date();
          age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
        }
      } catch (e) {
        // Use defaults if parsing fails
      }
    } else {
      // Age is a number
      const ageNum = typeof mongoUser.age === 'number' ? mongoUser.age : parseInt(String(mongoUser.age), 10);
      if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
        age = ageNum;
        // Calculate date of birth from age with random month/day
        const today = new Date();
        const birthYear = today.getFullYear() - age;

        // Generate random month (0-11) and day (1-28) to avoid invalid dates
        const randomMonth = Math.floor(Math.random() * 12);
        const randomDay = Math.floor(Math.random() * 28) + 1;

        dob = new Date(birthYear, randomMonth, randomDay);

        // If the generated DOB makes them younger than their age, adjust year back by 1
        const checkAge = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          if (checkAge < age) {
            dob = new Date(birthYear - 1, randomMonth, randomDay);
          }
        }
      }
    }
  }

  // Collect pictures
  const pictures: string[] = [];
  if (mongoUser.photoUrl) {
    pictures.push(mongoUser.photoUrl);
  }
  if (mongoUser.photos && Array.isArray(mongoUser.photos)) {
    pictures.push(...mongoUser.photos);
  }

  // Extract phone number from email or use existing phoneNumber
  let phoneNumber = mongoUser.phoneNumber || null;

  // If no phone number but email exists and starts with a digit
  if (!phoneNumber && mongoUser.email) {
    const emailBeforeAt = mongoUser.email.split('@')[0];
    // Check if the part before @ starts with a digit
    if (emailBeforeAt && /^\d/.test(emailBeforeAt)) {
      // Extract all digits from the email prefix
      const digitsOnly = emailBeforeAt.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        // Add +91 prefix if not already present
        phoneNumber = digitsOnly.startsWith('91')
          ? `+${digitsOnly}`
          : `+91${digitsOnly}`;
      }
    }
  }

  // Generate random phone if still no phone number
  if (!phoneNumber) {
    phoneNumber = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  // Parse timestamps with better error handling
  let createdAt = new Date();
  if (mongoUser.createdAt) {
    try {
      const parsed = new Date(mongoUser.createdAt);
      if (!isNaN(parsed.getTime())) {
        createdAt = parsed;
      }
    } catch (e) {
      // Use default if parsing fails
    }
  }

  let updatedAt = new Date();
  if (mongoUser.lastUpdated) {
    try {
      const parsed = new Date(mongoUser.lastUpdated);
      if (!isNaN(parsed.getTime())) {
        updatedAt = parsed;
      }
    } catch (e) {
      // Use default if parsing fails
    }
  }

  // Build Firestore user document
  const firestoreUser = {
    // Basic Info
    uid: mongoUser.id,
    firstName,
    lastName,
    phoneNumber,
    email: mongoUser.email || null,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(updatedAt),

    // Profile Data
    age,
    dateOfBirth: Timestamp.fromDate(dob),
    gender,
    pictures,
    interests: mongoUser.interests || [],
    rating: mongoUser.rating || 0,

    // Location (root level for querying)
    location: {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      city: DEFAULT_LOCATION.city,
      lastUpdated: Timestamp.now(),
    },

    // Onboarding Data
    onboarding: {
      completed: true,
      completedAt: Timestamp.fromDate(createdAt),
      currentStep: 'done',
      completedSteps: ['name', 'dob', 'gender', 'interest', 'looking-for', 'pictures', 'interests', 'location'],
      lastUpdated: Timestamp.now(),
      data: {
        firstName,
        lastName,
        dob: dob.toISOString().split('T')[0], // YYYY-MM-DD format
        dateOfBirth: Timestamp.fromDate(dob),
        gender,
        interestedIn,
        lookingFor: ['Long-term relationship', 'Friendship'],
        interests: mongoUser.interests || [],
        pictures,
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
        location: {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          city: DEFAULT_LOCATION.city,
        },
      },
    },

    // Presence & Activity
    isActive: true,
    isOnline: false,
    lastSeen: Timestamp.now(),

    // Notifications
    pushToken: null,
    notificationSettings: {
      matches: true,
      messages: true,
      likes: true,
    },

    // Blocking & Privacy
    blockedUsers: [],
    userAskedToDelete: 'no',

    // Additional fields from MongoDB
    interestedIn,
    lookingFor: ['Long-term relationship', 'Friendship'],
  };

  return firestoreUser;
};

/**
 * Migrate a single user from MongoDB to Firestore
 */
export const migrateUser = async (mongoUser: MongoUser): Promise<{
  success: boolean;
  userId: string;
  error?: string;
}> => {
  try {
    const firestoreUser = mapMongoUserToFirestore(mongoUser);
    const userRef = doc(db, 'users', mongoUser.id);

    await setDoc(userRef, firestoreUser, { merge: true });

    return {
      success: true,
      userId: mongoUser.id,
    };
  } catch (error: any) {
    console.error('Error migrating user:', mongoUser.id, error);
    return {
      success: false,
      userId: mongoUser.id,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Migrate multiple users from MongoDB to Firestore
 */
export const migrateUsers = async (
  mongoUsers: MongoUser[],
  onProgress?: (current: number, total: number, result: any) => void,
  onError?: (error: { userId: string; error: string }, currentIndex: number, total: number) => Promise<boolean>
): Promise<{
  totalUsers: number;
  successCount: number;
  failedCount: number;
  results: Array<{ userId: string; success: boolean; error?: string }>;
  stoppedEarly: boolean;
}> => {
  const results: Array<{ userId: string; success: boolean; error?: string }> = [];
  let successCount = 0;
  let failedCount = 0;
  let stoppedEarly = false;

  for (let i = 0; i < mongoUsers.length; i++) {
    const mongoUser = mongoUsers[i];

    try {
      const result = await migrateUser(mongoUser);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;

        // If there's an error callback and migration failed, ask user
        if (onError && result.error) {
          const shouldContinue = await onError(
            { userId: result.userId, error: result.error },
            i + 1,
            mongoUsers.length
          );

          if (!shouldContinue) {
            stoppedEarly = true;
            break;
          }
        }
      }

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, mongoUsers.length, result);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      failedCount++;
      const errorResult = {
        userId: mongoUser.id || 'unknown',
        success: false,
        error: error.message,
      };
      results.push(errorResult);

      // If there's an error callback, ask user
      if (onError) {
        const shouldContinue = await onError(
          { userId: errorResult.userId, error: error.message },
          i + 1,
          mongoUsers.length
        );

        if (!shouldContinue) {
          stoppedEarly = true;
          break;
        }
      }
    }
  }

  return {
    totalUsers: mongoUsers.length,
    successCount,
    failedCount,
    results,
    stoppedEarly,
  };
};

/**
 * Validate MongoDB user JSON structure
 */
export const validateMongoUsers = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array of users');
    return { valid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Array is empty - no users to migrate');
    return { valid: false, errors };
  }

  // Check each user has required fields
  data.forEach((user, index) => {
    if (!user.id) {
      errors.push(`User at index ${index} is missing required field: id`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
