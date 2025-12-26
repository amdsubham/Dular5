import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserFilters } from '@/types/user';

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserProfile));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        uid: userDoc.id,
        ...userDoc.data()
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const createUser = async (userData: Partial<UserProfile>): Promise<string> => {
  try {
    const usersRef = collection(db, 'users');
    const newUserRef = doc(usersRef);

    await setDoc(newUserRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      onboarding: {
        completed: false,
        currentStep: 0
      }
    });

    return newUserRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const filterUsers = async (filters: UserFilters): Promise<UserProfile[]> => {
  try {
    let users = await getAllUsers();
    console.log('Total users loaded:', users.length);
    console.log('Filters applied:', filters);

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user => {
        const firstName = user.onboarding?.data?.firstName || user.firstName || '';
        const lastName = user.onboarding?.data?.lastName || user.lastName || '';
        const email = user.email || '';
        const phone = user.phoneNumber || '';

        return firstName.toLowerCase().includes(searchLower) ||
               lastName.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               phone.includes(searchLower);
      });
    }

    // Apply date filters
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    if (filters.registeredToday) {
      users = users.filter(user => {
        const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
        return createdAt >= todayStart;
      });
    }

    if (filters.registeredYesterday) {
      users = users.filter(user => {
        const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
        return createdAt >= yesterdayStart && createdAt < todayStart;
      });
    }

    if (filters.registeredThisWeek) {
      users = users.filter(user => {
        const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
        return createdAt >= weekStart;
      });
    }

    if (filters.registeredThisMonth) {
      users = users.filter(user => {
        const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
        return createdAt >= monthStart;
      });
    }

    // Apply gender filter
    if (filters.gender) {
      const filterGender = filters.gender;
      console.log('Applying gender filter:', filterGender);
      users = users.filter(user => {
        // Check both locations for gender data
        const gender = user.onboarding?.data?.gender || user.gender;
        console.log('User gender:', gender, 'for user:', user.uid);

        // Skip users without gender data
        if (!gender) {
          console.log('User has no gender data, skipping');
          return false;
        }

        // Case-insensitive comparison
        const matches = gender.toLowerCase() === filterGender.toLowerCase();
        console.log('Gender matches:', matches, `(${gender.toLowerCase()} === ${filterGender.toLowerCase()})`);
        return matches;
      });
      console.log('Users after gender filter:', users.length);
    }

    // Apply looking for filter
    if (filters.lookingFor && filters.lookingFor.length > 0) {
      users = users.filter(user =>
        user.lookingFor?.some(lf => filters.lookingFor?.includes(lf))
      );
    }

    // Apply delete request filter
    if (filters.hasDeleteRequest) {
      users = users.filter(user => user.userAskedToDelete === 'yes');
    }

    return users;
  } catch (error) {
    console.error('Error filtering users:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const users = await getAllUsers();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayUsers = users.filter(user => {
      const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
      return createdAt >= todayStart;
    });

    const deleteRequests = users.filter(user => user.userAskedToDelete === 'yes');

    return {
      total: users.length,
      today: todayUsers.length,
      deleteRequests: deleteRequests.length
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

export interface SwipeStats {
  totalSwipes: number;
  todaySwipes: number;
  rightSwipes: number;
  leftSwipes: number;
  lastSwipeDate: Date | null;
}

/**
 * Get swipe statistics for a specific user
 * @param userId The user ID to get swipe stats for
 * @returns SwipeStats object with total swipes, today's swipes, and breakdown
 */
export const getUserSwipeStats = async (userId: string): Promise<SwipeStats> => {
  try {
    const swipesRef = collection(db, 'swipes');
    const q = query(swipesRef, where('swiperId', '==', userId));
    const snapshot = await getDocs(q);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let todaySwipes = 0;
    let rightSwipes = 0; // likes
    let leftSwipes = 0; // passes
    let lastSwipeDate: Date | null = null;

    snapshot.docs.forEach(doc => {
      const swipeData = doc.data();
      const swipeDate = swipeData.timestamp?.toDate ? swipeData.timestamp.toDate() : new Date(swipeData.timestamp);

      // Count today's swipes
      if (swipeDate >= todayStart) {
        todaySwipes++;
      }

      // Count by action ('like' or 'pass')
      if (swipeData.action === 'like') {
        rightSwipes++;
      } else if (swipeData.action === 'pass') {
        leftSwipes++;
      }

      // Track last swipe date
      if (!lastSwipeDate || swipeDate > lastSwipeDate) {
        lastSwipeDate = swipeDate;
      }
    });

    return {
      totalSwipes: snapshot.docs.length,
      todaySwipes,
      rightSwipes,
      leftSwipes,
      lastSwipeDate
    };
  } catch (error) {
    console.error('Error fetching user swipe stats:', error);
    return {
      totalSwipes: 0,
      todaySwipes: 0,
      rightSwipes: 0,
      leftSwipes: 0,
      lastSwipeDate: null
    };
  }
};
