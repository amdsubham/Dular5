import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get Expo Push Token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.log('Project ID not found');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EC4899',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Save push token to user's Firestore document
 */
export const savePushTokenToFirestore = async (token: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date(),
    });

    console.log('Push token saved to Firestore');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

/**
 * Send a push notification to a specific user
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> => {
  try {
    // Get user's push token
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) {
      console.log('User does not have a push token');
      return false;
    }

    // Send notification via Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high' as const,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.[0]?.status === 'ok') {
      console.log('Push notification sent successfully');
      return true;
    } else {
      console.error('Failed to send push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Send match notification
 */
export const sendMatchNotification = async (
  userId: string,
  matchedUserName: string,
  matchedUserId: string
): Promise<void> => {
  await sendPushNotification(
    userId,
    "It's a Match! 🎉",
    `You matched with ${matchedUserName}! Start chatting now.`,
    {
      type: 'match',
      matchedUserId,
      screen: 'matches',
    }
  );
};

/**
 * Send new message notification
 */
export const sendMessageNotification = async (
  userId: string,
  senderName: string,
  messageText: string,
  chatId: string
): Promise<void> => {
  console.log('💬 Preparing message notification:', {
    to: userId,
    from: senderName,
    message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
    chatId,
  });

  const success = await sendPushNotification(
    userId,
    senderName,
    messageText,
    {
      type: 'message',
      chatId,
      screen: 'chat',
    }
  );

  if (success) {
    console.log('✅ Message notification delivered');
  } else {
    console.warn('⚠️ Message notification failed to deliver');
  }
};

/**
 * Listen to notification responses (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Listen to notifications received while app is foregrounded
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(callback);
};
