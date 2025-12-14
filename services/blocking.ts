import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';

/**
 * Block a user
 */
export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Add to blocked users array
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Delete any existing match
    await deleteMatch(currentUser.uid, userId);

    // Delete any existing chat
    await deleteChat(currentUser.uid, userId);

    console.log(`User ${userId} blocked successfully`);
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    console.log(`User ${userId} unblocked successfully`);
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
};

/**
 * Check if a user is blocked
 */
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) return false;

    const blockedUsers = userDoc.data().blockedUsers || [];
    return blockedUsers.includes(userId);
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

/**
 * Check if current user is blocked by another user
 */
export const isBlockedBy = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;

    const blockedUsers = userDoc.data().blockedUsers || [];
    return blockedUsers.includes(currentUser.uid);
  } catch (error) {
    console.error('Error checking if blocked by user:', error);
    return false;
  }
};

/**
 * Get list of blocked users
 */
export const getBlockedUsers = async (): Promise<string[]> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) return [];

    return userDoc.data().blockedUsers || [];
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
};

/**
 * Delete a match between two users
 */
const deleteMatch = async (user1Id: string, user2Id: string): Promise<void> => {
  try {
    // Query for matches where both users are participants
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('participants', 'array-contains', user1Id)
    );

    const matchSnapshot = await getDocs(q);

    for (const matchDoc of matchSnapshot.docs) {
      const matchData = matchDoc.data();
      if (matchData.participants.includes(user2Id)) {
        await deleteDoc(doc(db, 'matches', matchDoc.id));
        console.log(`Match deleted: ${matchDoc.id}`);
      }
    }
  } catch (error) {
    console.error('Error deleting match:', error);
  }
};

/**
 * Delete a chat between two users
 */
const deleteChat = async (user1Id: string, user2Id: string): Promise<void> => {
  try {
    // Query for chats where both users are participants
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user1Id)
    );

    const chatSnapshot = await getDocs(q);

    for (const chatDoc of chatSnapshot.docs) {
      const chatData = chatDoc.data();
      if (chatData.participants.includes(user2Id)) {
        // Delete all messages in the chat
        const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);

        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(doc(db, 'chats', chatDoc.id, 'messages', messageDoc.id));
        }

        // Delete the chat document
        await deleteDoc(doc(db, 'chats', chatDoc.id));
        console.log(`Chat deleted: ${chatDoc.id}`);
      }
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
};

/**
 * Unmatch with a user (soft delete - doesn't block)
 */
export const unmatchUser = async (userId: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Delete the match
    await deleteMatch(currentUser.uid, userId);

    // Delete the chat
    await deleteChat(currentUser.uid, userId);

    console.log(`Unmatched with user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error unmatching user:', error);
    return false;
  }
};

/**
 * Report a user
 */
export const reportUser = async (
  reportedUserId: string,
  reason: string,
  description?: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create a report document
    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      reporterId: currentUser.uid,
      reportedUserId: reportedUserId,
      reason: reason,
      description: description || '',
      status: 'pending', // pending, reviewed, resolved
      createdAt: serverTimestamp(),
    });

    console.log(`✅ User ${reportedUserId} reported successfully`);
    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
};
