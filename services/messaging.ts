import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { sendMessageNotification } from './notifications';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  readAt?: Date;
  imageUrl?: string;
  reactions?: {
    [userId: string]: string; // userId -> emoji
  };
}

export interface Chat {
  id: string;
  participants: string[];
  participantsData: {
    [userId: string]: {
      firstName: string;
      lastName: string;
      profileImage: string | null;
    };
  };
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: {
    [userId: string]: number;
  };
  typing: {
    [userId: string]: boolean;
  };
}

/**
 * Get or create a chat between two users
 */
export const getOrCreateChat = async (matchId: string): Promise<string | null> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Check if chat already exists for this match
    const chatRef = doc(db, 'chats', matchId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      return matchId;
    }

    // Get match data
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) {
      throw new Error('Match not found');
    }

    const matchData = matchDoc.data();

    // Create new chat
    await setDoc(chatRef, {
      participants: matchData.participants,
      participantsData: matchData.participantsData,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: {
        [matchData.participants[0]]: 0,
        [matchData.participants[1]]: 0,
      },
      createdAt: new Date(),
    });

    return matchId;
  } catch (error) {
    console.error('Error getting/creating chat:', error);
    return null;
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (
  chatId: string,
  text: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    if (!text.trim()) return false;

    // Get chat to find the other participant
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }

    const chatData = chatDoc.data();
    const otherUserId = chatData.participants.find(
      (id: string) => id !== currentUser.uid
    );

    // Add message to messages subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      text: text.trim(),
      timestamp: new Date(),
      read: false,
    });

    // Update chat document with last message
    await updateDoc(chatRef, {
      lastMessage: text.trim(),
      lastMessageAt: new Date(),
      [`unreadCount.${otherUserId}`]: (chatData.unreadCount?.[otherUserId] || 0) + 1,
    });

    // Update match document
    const matchRef = doc(db, 'matches', chatId);
    await updateDoc(matchRef, {
      lastMessageAt: new Date(),
      [`unreadCount.${otherUserId}`]: (chatData.unreadCount?.[otherUserId] || 0) + 1,
    });

    // Send push notification to other user
    if (otherUserId) {
      const senderName = chatData.participantsData[currentUser.uid]?.firstName || 'Someone';
      sendMessageNotification(otherUserId, senderName, text.trim(), chatId).catch(console.error);
    }

    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

/**
 * Get messages for a chat with real-time updates
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp?.toDate() || new Date(),
        read: data.read || false,
      });
    });
    callback(messages);
  });

  return unsubscribe;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${currentUser.uid}`]: 0,
    });

    // Also update match document
    const matchRef = doc(db, 'matches', chatId);
    await updateDoc(matchRef, {
      [`unreadCount.${currentUser.uid}`]: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Get all chats for current user
 */
export const getUserChats = async (): Promise<Chat[]> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const chats: Chat[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        participants: data.participants,
        participantsData: data.participantsData,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt?.toDate() || null,
        unreadCount: data.unreadCount || {},
      });
    });

    // Sort by last message time
    chats.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

/**
 * Subscribe to chat updates for real-time chat list
 */
export const subscribeToChats = (
  callback: (chats: Chat[]) => void
): (() => void) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return () => {};

  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', currentUser.uid)
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    // Get blocked users list
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const blockedUsers = userDoc.data()?.blockedUsers || [];

    const chats: Chat[] = [];
    snapshot.forEach((chatDoc) => {
      const data = chatDoc.data();

      // Filter out chats with blocked users
      const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
      if (otherUserId && blockedUsers.includes(otherUserId)) {
        return; // Skip this chat
      }

      chats.push({
        id: chatDoc.id,
        participants: data.participants,
        participantsData: data.participantsData,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt?.toDate() || null,
        unreadCount: data.unreadCount || {},
        typing: data.typing || {},
      });
    });

    // Sort by last message time
    chats.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

    callback(chats);
  });

  return unsubscribe;
};

/**
 * Set typing indicator for current user in a chat
 */
export const setTypingIndicator = async (chatId: string, isTyping: boolean): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`typing.${currentUser.uid}`]: isTyping,
    });
  } catch (error) {
    console.error('Error setting typing indicator:', error);
  }
};

/**
 * Subscribe to typing indicator for a specific chat
 */
export const subscribeToTypingIndicator = (
  chatId: string,
  callback: (isTyping: boolean) => void
): (() => void) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return () => {};

  const chatRef = doc(db, 'chats', chatId);
  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(false);
      return;
    }

    const data = snapshot.data();
    const typing = data.typing || {};

    // Check if other user is typing
    const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
    const isTyping = otherUserId ? typing[otherUserId] === true : false;

    callback(isTyping);
  });

  return unsubscribe;
};

/**
 * Mark message as delivered
 */
export const markMessageAsDelivered = async (chatId: string, messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      delivered: true,
    });
  } catch (error) {
    console.error('Error marking message as delivered:', error);
  }
};

/**
 * Mark message as read with timestamp
 */
export const markMessageAsReadWithTimestamp = async (chatId: string, messageId: string): Promise<void> => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Add or update reaction to a message
 */
export const addReactionToMessage = async (
  chatId: string,
  messageId: string,
  emoji: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${currentUser.uid}`]: emoji,
    });

    return true;
  } catch (error) {
    console.error('Error adding reaction:', error);
    return false;
  }
};

/**
 * Remove reaction from a message
 */
export const removeReactionFromMessage = async (
  chatId: string,
  messageId: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);

    // Get current reactions
    const messageDoc = await getDoc(messageRef);
    if (!messageDoc.exists()) return false;

    const reactions = messageDoc.data().reactions || {};
    delete reactions[currentUser.uid];

    await updateDoc(messageRef, {
      reactions,
    });

    return true;
  } catch (error) {
    console.error('Error removing reaction:', error);
    return false;
  }
};

/**
 * Send a message with an image
 */
export const sendMessageWithImage = async (
  chatId: string,
  imageUrl: string,
  caption?: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Add message with image to subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      text: caption || '',
      imageUrl,
      timestamp: serverTimestamp(),
      read: false,
      delivered: true,
      reactions: {},
    });

    // Update chat document with last message info
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const participants = chatData.participants;
      const otherUserId = participants.find((id: string) => id !== currentUser.uid);

      await updateDoc(chatRef, {
        lastMessage: caption || '📷 Photo',
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: (chatData.unreadCount?.[otherUserId] || 0) + 1,
      });

      // Send push notification
      if (otherUserId) {
        const senderName = chatData.participantsData[currentUser.uid]?.firstName || 'Someone';
        const messageText = caption || '📷 Sent a photo';
        sendMessageNotification(otherUserId, senderName, messageText, chatId).catch(console.error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending message with image:', error);
    return false;
  }
};
