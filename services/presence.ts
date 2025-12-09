import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Update user's online status
 */
export const setUserOnlineStatus = async (isOnline: boolean): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting online status:', error);
  }
};

/**
 * Subscribe to user's online status
 */
export const subscribeToUserStatus = (
  userId: string,
  callback: (isOnline: boolean, lastSeen: Date | null) => void
): (() => void) => {
  const userRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(false, null);
      return;
    }

    const data = snapshot.data();
    const isOnline = data.isOnline || false;
    const lastSeen = data.lastSeen?.toDate() || null;

    callback(isOnline, lastSeen);
  });

  return unsubscribe;
};

/**
 * Get user's current online status
 */
export const getUserOnlineStatus = async (userId: string): Promise<{
  isOnline: boolean;
  lastSeen: Date | null;
}> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { isOnline: false, lastSeen: null };
    }

    const data = userDoc.data();
    return {
      isOnline: data.isOnline || false,
      lastSeen: data.lastSeen?.toDate() || null,
    };
  } catch (error) {
    console.error('Error getting user online status:', error);
    return { isOnline: false, lastSeen: null };
  }
};

/**
 * Format last seen timestamp to human-readable string
 */
export const formatLastSeen = (lastSeen: Date | null): string => {
  if (!lastSeen) return 'Last seen recently';

  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Last seen just now';
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  if (hours < 24) return `Last seen ${hours}h ago`;
  if (days < 7) return `Last seen ${days}d ago`;

  return 'Last seen recently';
};

/**
 * Setup presence tracking for current user
 * Call this in app root to track user's online/offline status
 */
export const setupPresenceTracking = (): (() => void) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return () => {};

  // Set user online when app starts
  setUserOnlineStatus(true);

  // Track app state changes
  const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      setUserOnlineStatus(true);
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      setUserOnlineStatus(false);
    }
  });

  // Cleanup function
  return () => {
    setUserOnlineStatus(false);
    subscription.remove();
  };
};
