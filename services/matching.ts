import { collection, query, where, getDocs, doc, getDoc, setDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { getUserProfile, calculateAge } from './profile';
import { calculateDistance } from './location';
import { sendMatchNotification } from './notifications';

export interface MatchUser {
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  pictures: string[];
  interests: string[];
  lookingFor: string[];
  distance: number;
  lovePercentage: number;
  isActive?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MatchFilters {
  maxDistance?: number; // in kilometers
  minAge?: number;
  maxAge?: number;
  interestedIn?: string[]; // gender preferences
  lookingFor?: string[];
}

/**
 * Get the current user's preferences for matching
 */
export const getUserPreferences = async (): Promise<{
  gender: string;
  interestedIn: string[];
  lookingFor: string[];
  location: { latitude: number; longitude: number } | null;
} | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    const onboardingData = data.onboarding?.data || {};

    return {
      gender: onboardingData.gender || '',
      interestedIn: onboardingData.interestedIn || [],
      lookingFor: onboardingData.lookingFor || [],
      location: data.location || null,
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

/**
 * Calculate love/compatibility percentage based on shared interests
 */
const calculateLovePercentage = (userInterests: string[], matchInterests: string[]): number => {
  if (!userInterests.length || !matchInterests.length) return 0;

  const sharedInterests = userInterests.filter(interest =>
    matchInterests.includes(interest)
  );

  const percentage = (sharedInterests.length / Math.max(userInterests.length, matchInterests.length)) * 100;
  return Math.round(percentage);
};

/**
 * Fetch potential matches from Firestore based on user preferences
 */
export const fetchPotentialMatches = async (filters?: MatchFilters): Promise<MatchUser[]> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get current user's profile and preferences
    const userProfile = await getUserProfile();
    const userPreferences = await getUserPreferences();

    if (!userProfile || !userPreferences) {
      throw new Error('User profile not found');
    }

    const currentUserInterests = userProfile.interests || [];
    const userLocation = userPreferences.location;

    // Get list of already swiped users to exclude them
    const swipedUserIds = await getSwipedUserIds();

    // Get current user's blocked users list
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const blockedUsers = currentUserDoc.data()?.blockedUsers || [];

    // Build query to fetch potential matches
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef,
      where('onboarding.completed', '==', true),
      limit(50) // Limit to 50 users for performance
    );

    // Filter by gender preference if available
    if (userPreferences.interestedIn && userPreferences.interestedIn.length > 0) {
      q = query(
        usersRef,
        where('onboarding.completed', '==', true),
        where('onboarding.data.gender', 'in', userPreferences.interestedIn),
        limit(50)
      );
    }

    const querySnapshot = await getDocs(q);
    const matches: MatchUser[] = [];

    querySnapshot.forEach((docSnapshot) => {
      // Skip current user
      if (docSnapshot.id === currentUser.uid) return;

      // Skip already swiped users
      if (swipedUserIds.includes(docSnapshot.id)) return;

      // Skip blocked users
      if (blockedUsers.includes(docSnapshot.id)) return;

      const data = docSnapshot.data();

      // Skip if this user has blocked the current user
      const otherUserBlockedUsers = data.blockedUsers || [];
      if (otherUserBlockedUsers.includes(currentUser.uid)) return;

      const onboardingData = data.onboarding?.data || {};

      // Check if user has completed onboarding
      if (!data.onboarding?.completed) return;

      // Calculate age
      const dob = onboardingData.dob;
      if (!dob) return;

      const age = calculateAge(dob);

      // Apply age filters
      if (filters?.minAge && age < filters.minAge) return;
      if (filters?.maxAge && age > filters.maxAge) return;

      // Calculate distance if both users have location
      let distance = 0;
      if (userLocation && data.location?.latitude && data.location?.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          data.location.latitude,
          data.location.longitude
        );

        // Apply distance filter
        if (filters?.maxDistance && distance > filters.maxDistance) return;
      }

      // Calculate love percentage based on shared interests
      const matchInterests = onboardingData.interests || [];
      const lovePercentage = calculateLovePercentage(currentUserInterests, matchInterests);

      // Build match user object
      const matchUser: MatchUser = {
        uid: docSnapshot.id,
        firstName: onboardingData.firstName || 'User',
        lastName: onboardingData.lastName || '',
        age,
        gender: onboardingData.gender || '',
        pictures: onboardingData.pictures || [],
        interests: matchInterests,
        lookingFor: onboardingData.lookingFor || [],
        distance,
        lovePercentage,
        isActive: false, // You can implement online status tracking
        location: data.location,
      };

      matches.push(matchUser);
    });

    // Sort by distance (closest first) and love percentage
    matches.sort((a, b) => {
      // Prioritize users with higher love percentage
      if (Math.abs(a.lovePercentage - b.lovePercentage) > 20) {
        return b.lovePercentage - a.lovePercentage;
      }
      // Then sort by distance
      return a.distance - b.distance;
    });

    return matches;
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    throw error;
  }
};

export interface MatchResult {
  isMatch: boolean;
  matchId?: string;
  matchData?: {
    matchedUser: {
      uid: string;
      firstName: string;
      lastName: string;
      profileImage: string | null;
    };
    currentUser: {
      uid: string;
      firstName: string;
      lastName: string;
      profileImage: string | null;
    };
  };
}

/**
 * Record a swipe action (like or pass)
 */
export const recordSwipeAction = async (
  targetUserId: string,
  action: 'like' | 'pass'
): Promise<MatchResult> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Store swipe in Firestore
    const swipeRef = doc(db, 'swipes', `${currentUser.uid}_${targetUserId}`);
    await setDoc(swipeRef, {
      swiperId: currentUser.uid,
      swipedUserId: targetUserId,
      action, // 'like' or 'pass'
      timestamp: new Date(),
    });

    console.log(`User ${currentUser.uid} ${action}d user ${targetUserId}`);

    // Check for mutual match if action is 'like'
    if (action === 'like') {
      const isMatch = await checkForMatch(targetUserId);
      if (isMatch) {
        console.log(`Match detected between ${currentUser.uid} and ${targetUserId}`);
        const matchId = await createMatch(currentUser.uid, targetUserId);

        if (matchId) {
          // Get match data to return
          const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));

          const currentUserData = currentUserDoc.data()?.onboarding?.data || {};
          const targetUserData = targetUserDoc.data()?.onboarding?.data || {};

          return {
            isMatch: true,
            matchId,
            matchData: {
              currentUser: {
                uid: currentUser.uid,
                firstName: currentUserData.firstName || 'User',
                lastName: currentUserData.lastName || '',
                profileImage: currentUserData.pictures?.[0] || null,
              },
              matchedUser: {
                uid: targetUserId,
                firstName: targetUserData.firstName || 'User',
                lastName: targetUserData.lastName || '',
                profileImage: targetUserData.pictures?.[0] || null,
              },
            },
          };
        }
      }
    }

    return { isMatch: false };
  } catch (error) {
    console.error('Error recording swipe action:', error);
    throw error;
  }
};

/**
 * Get list of user IDs that the current user has already swiped
 */
export const getSwipedUserIds = async (): Promise<string[]> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const swipesRef = collection(db, 'swipes');
    const q = query(swipesRef, where('swiperId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    const swipedUserIds: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      swipedUserIds.push(data.swipedUserId);
    });

    return swipedUserIds;
  } catch (error) {
    console.error('Error getting swiped user IDs:', error);
    return [];
  }
};

/**
 * Check if two users have matched (mutual like)
 */
export const checkForMatch = async (targetUserId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    // Check if the target user also liked the current user
    const reverseSwipeRef = doc(db, 'swipes', `${targetUserId}_${currentUser.uid}`);
    const reverseSwipeDoc = await getDoc(reverseSwipeRef);

    if (reverseSwipeDoc.exists()) {
      const data = reverseSwipeDoc.data();
      return data.action === 'like';
    }

    return false;
  } catch (error) {
    console.error('Error checking for match:', error);
    return false;
  }
};

/**
 * Create a match document when two users mutually like each other
 */
export const createMatch = async (user1Id: string, user2Id: string): Promise<string | null> => {
  try {
    // Check if match already exists
    const matchesRef = collection(db, 'matches');
    const q1 = query(
      matchesRef,
      where('participants', 'array-contains', user1Id)
    );
    const existingMatches = await getDocs(q1);

    let matchExists = false;
    existingMatches.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(user2Id)) {
        matchExists = true;
      }
    });

    if (matchExists) {
      console.log('Match already exists');
      return null;
    }

    // Get both users' data
    const user1Doc = await getDoc(doc(db, 'users', user1Id));
    const user2Doc = await getDoc(doc(db, 'users', user2Id));

    if (!user1Doc.exists() || !user2Doc.exists()) {
      throw new Error('User data not found');
    }

    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();

    const user1OnboardingData = user1Data.onboarding?.data || {};
    const user2OnboardingData = user2Data.onboarding?.data || {};

    // Create match document
    const matchId = `${user1Id}_${user2Id}`;
    const matchRef = doc(db, 'matches', matchId);

    await setDoc(matchRef, {
      participants: [user1Id, user2Id],
      participantsData: {
        [user1Id]: {
          firstName: user1OnboardingData.firstName || 'User',
          lastName: user1OnboardingData.lastName || '',
          profileImage: user1OnboardingData.pictures?.[0] || null,
        },
        [user2Id]: {
          firstName: user2OnboardingData.firstName || 'User',
          lastName: user2OnboardingData.lastName || '',
          profileImage: user2OnboardingData.pictures?.[0] || null,
        },
      },
      matchedAt: new Date(),
      lastMessageAt: null,
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
    });

    console.log(`Match created: ${matchId}`);

    // Send push notifications to both users
    const user1Name = `${user1OnboardingData.firstName} ${user1OnboardingData.lastName}`.trim();
    const user2Name = `${user2OnboardingData.firstName} ${user2OnboardingData.lastName}`.trim();

    // Send notification to user1 about matching with user2
    sendMatchNotification(user1Id, user2Name, user2Id).catch(console.error);

    // Send notification to user2 about matching with user1
    sendMatchNotification(user2Id, user1Name, user1Id).catch(console.error);

    return matchId;
  } catch (error) {
    console.error('Error creating match:', error);
    return null;
  }
};
