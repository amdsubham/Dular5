import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '@/services/auth';
import { subscribeToChats } from '@/services/messaging';
import { registerForPushNotifications, savePushTokenToFirestore } from '@/services/notifications';

interface NotificationContextType {
  unreadChatsCount: number;
  unreadMatchesCount: number;
  totalUnreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadChatsCount: 0,
  unreadMatchesCount: 0,
  totalUnreadCount: 0,
});

export const useNotificationBadges = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationBadges must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Register for push notifications when user is logged in
    const setupPushNotifications = async () => {
      console.log('🔔 Setting up push notifications...');
      try {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          console.log('📱 Push token obtained:', pushToken);
          await savePushTokenToFirestore(pushToken);
          console.log('✅ Push token saved to Firestore');
        } else {
          console.warn('⚠️ Could not get push token');
        }
      } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();

    // Subscribe to chats to get unread counts
    const unsubscribe = subscribeToChats((chats) => {
      let totalUnread = 0;
      let newMatches = 0;

      chats.forEach((chat) => {
        const unreadCount = chat.unreadCount[currentUser.uid] || 0;
        totalUnread += unreadCount;

        // Count as new match if there are no messages yet
        if (!chat.lastMessage) {
          newMatches++;
        }
      });

      setUnreadChatsCount(totalUnread);
      setUnreadMatchesCount(newMatches);
    });

    return () => unsubscribe();
  }, []);

  const totalUnreadCount = unreadChatsCount + unreadMatchesCount;

  return (
    <NotificationContext.Provider
      value={{
        unreadChatsCount,
        unreadMatchesCount,
        totalUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
