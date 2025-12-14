import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export interface PushNotificationPayload {
  title: string;
  body: string;
  image?: string;
  data?: Record<string, any>;
}

export interface SendNotificationOptions {
  userIds?: string[];
  sendToAll?: boolean;
  notification: PushNotificationPayload;
}

// This function stores notification requests in Firestore
// You'll need to set up Firebase Cloud Functions to actually send the notifications
export const sendPushNotification = async (options: SendNotificationOptions): Promise<void> => {
  try {
    const notificationRef = collection(db, 'notification_requests');

    await addDoc(notificationRef, {
      userIds: options.userIds || [],
      sendToAll: options.sendToAll || false,
      notification: options.notification,
      status: 'pending',
      createdAt: Timestamp.now()
    });

    console.log('Notification request created successfully');
  } catch (error) {
    console.error('Error creating notification request:', error);
    throw error;
  }
};

export const sendNotificationToUser = async (
  userId: string,
  notification: PushNotificationPayload
): Promise<void> => {
  return sendPushNotification({
    userIds: [userId],
    notification
  });
};

export const sendNotificationToMultipleUsers = async (
  userIds: string[],
  notification: PushNotificationPayload
): Promise<void> => {
  return sendPushNotification({
    userIds,
    notification
  });
};

export const sendNotificationToAllUsers = async (
  notification: PushNotificationPayload
): Promise<void> => {
  return sendPushNotification({
    sendToAll: true,
    notification
  });
};
