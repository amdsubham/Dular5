import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushTokenToFirestore,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '@/services/notifications';

export const useNotifications = () => {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushTokenToFirestore(token);
          console.log('Push notifications registered successfully');
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Listen to notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      // You can show a custom in-app notification here if desired
    });

    // Listen to notification responses (when user taps notification)
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);

      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data.type === 'match') {
        // Navigate to matches screen
        router.push('/(protected)/(root)/matches');
      } else if (data.type === 'message' && data.chatId) {
        // Navigate to specific chat
        router.push({
          pathname: '/(protected)/chat/[id]' as any,
          params: {
            id: data.chatId,
          },
        });
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
};
