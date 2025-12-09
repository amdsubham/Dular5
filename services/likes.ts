import {
  collection,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';

export interface Like {
  id: string;
  userId: string;
  likedAt: Date;
  userData: {
    firstName: string;
    lastName: string;
    age: number;
    profileImage?: string;
    bio?: string;
    interests?: string[];
  };
}

/**
 * Get all users who liked the current user
 * @returns Array of likes with user data
 */
export const getUsersWhoLikedMe = async (): Promise<Like[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('User not authenticated');

  try {
    // Query all swipes where someone swiped right on current user
    const swipesRef = collection(db, 'swipes');
    const q = query(
      swipesRef,
      where('swipedOnUserId', '==', currentUser.uid),
      where('direction', '==', 'right')
    );

    const snapshot = await getDocs(q);
    const likes: Like[] = [];

    // Get user data for each liker
    for (const swipeDoc of snapshot.docs) {
      const swipeData = swipeDoc.data();
      const userId = swipeData.userId;

      // Check if we've already matched (if matched, don't show in likes)
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef,
        where('users', 'array-contains', currentUser.uid)
      );
      const matchSnapshot = await getDocs(matchQuery);
      const isMatched = matchSnapshot.docs.some((matchDoc) => {
        const matchData = matchDoc.data();
        return matchData.users.includes(userId);
      });

      if (isMatched) continue; // Skip if already matched

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        likes.push({
          id: userId,
          userId: userId,
          likedAt: swipeData.timestamp?.toDate() || new Date(),
          userData: {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            age: userData.age || 0,
            profileImage: userData.profileImage,
            bio: userData.bio,
            interests: userData.interests || [],
          },
        });
      }
    }

    // Sort by most recent first
    likes.sort((a, b) => b.likedAt.getTime() - a.likedAt.getTime());

    return likes;
  } catch (error) {
    console.error('Error fetching users who liked me:', error);
    return [];
  }
};

/**
 * Subscribe to real-time updates of users who liked current user
 * @param callback Function to call with updated likes array
 * @returns Unsubscribe function
 */
export const subscribeToUsersWhoLikedMe = (
  callback: (likes: Like[]) => void
): (() => void) => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('User not authenticated');

  const swipesRef = collection(db, 'swipes');
  const q = query(
    swipesRef,
    where('swipedOnUserId', '==', currentUser.uid),
    where('direction', '==', 'right')
  );

  return onSnapshot(q, async (snapshot) => {
    const likes: Like[] = [];

    // Get user data for each liker
    for (const swipeDoc of snapshot.docs) {
      const swipeData = swipeDoc.data();
      const userId = swipeData.userId;

      // Check if we've already matched
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef,
        where('users', 'array-contains', currentUser.uid)
      );
      const matchSnapshot = await getDocs(matchQuery);
      const isMatched = matchSnapshot.docs.some((matchDoc) => {
        const matchData = matchDoc.data();
        return matchData.users.includes(userId);
      });

      if (isMatched) continue;

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        likes.push({
          id: userId,
          userId: userId,
          likedAt: swipeData.timestamp?.toDate() || new Date(),
          userData: {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            age: userData.age || 0,
            profileImage: userData.profileImage,
            bio: userData.bio,
            interests: userData.interests || [],
          },
        });
      }
    }

    // Sort by most recent first
    likes.sort((a, b) => b.likedAt.getTime() - a.likedAt.getTime());

    callback(likes);
  });
};

/**
 * Get count of users who liked current user
 * @returns Number of likes
 */
export const getLikesCount = async (): Promise<number> => {
  const likes = await getUsersWhoLikedMe();
  return likes.length;
};
