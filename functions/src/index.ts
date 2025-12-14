import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

interface NotificationRequestData {
  userIds: string[];
  sendToAll: boolean;
  notification: {
    title: string;
    body: string;
    image?: string;
    data?: Record<string, any>;
  };
  status: string;
  createdAt: admin.firestore.Timestamp;
}

/**
 * Cloud Function to send push notifications
 * Triggered when a new document is created in notification_requests collection
 */
export const sendPushNotifications = functions.firestore
  .document("notification_requests/{requestId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() as NotificationRequestData;
    const { userIds, sendToAll, notification, status } = data;

    // Only process pending notifications
    if (status !== "pending") {
      console.log("Skipping non-pending notification:", context.params.requestId);
      return null;
    }

    console.log("Processing notification request:", context.params.requestId);
    console.log("Send to all:", sendToAll, "User IDs:", userIds?.length || 0);

    try {
      let tokens: string[] = [];

      if (sendToAll) {
        // Get all users' push tokens
        console.log("Fetching all users for broadcast notification...");
        const usersSnapshot = await admin.firestore().collection("users").get();

        tokens = usersSnapshot.docs
          .map((doc) => doc.data().pushToken)
          .filter((token): token is string => Boolean(token));

        console.log(`Found ${tokens.length} valid tokens out of ${usersSnapshot.docs.length} users`);
      } else if (userIds && userIds.length > 0) {
        // Get specific users' push tokens
        console.log(`Fetching tokens for ${userIds.length} specific users...`);
        const userPromises = userIds.map((userId: string) =>
          admin.firestore().collection("users").doc(userId).get()
        );
        const userDocs = await Promise.all(userPromises);

        tokens = userDocs
          .map((doc) => doc.data()?.pushToken)
          .filter((token): token is string => Boolean(token));

        console.log(`Found ${tokens.length} valid tokens out of ${userIds.length} requested users`);
      }

      if (tokens.length === 0) {
        console.warn("No valid push tokens found");
        await snap.ref.update({
          status: "failed",
          error: "No valid push tokens found",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // Send notifications using Expo Push Notification API
      console.log(`Sending notifications to ${tokens.length} devices...`);

      const messages = tokens.map((token) => {
        const message: any = {
          to: token,
          sound: "default",
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          priority: "high" as const,
        };

        // Add image if provided
        if (notification.image) {
          message.image = notification.image;
        }

        return message;
      });

      // Send in batches of 100 (Expo's limit)
      const batchSize = 100;
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Accept-Encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(batch),
          });

          const result = await response.json();

          if (result.data) {
            result.data.forEach((item: any) => {
              if (item.status === "ok") {
                successCount++;
              } else {
                failureCount++;
                if (item.message) {
                  errors.push(item.message);
                }
              }
            });
          }
        } catch (error: any) {
          console.error(`Error sending batch ${i / batchSize + 1}:`, error);
          failureCount += batch.length;
          errors.push(error.message);
        }
      }

      console.log(`Notification sending complete: ${successCount} succeeded, ${failureCount} failed`);

      // Update the notification request document
      await snap.ref.update({
        status: successCount > 0 ? "sent" : "failed",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount,
        failureCount,
        error: errors.length > 0 ? errors.join("; ") : null,
      });

      return null;
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      await snap.ref.update({
        status: "failed",
        error: error.message,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });

/**
 * Scheduled function to clean up old notification requests (runs daily)
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule("0 2 * * *") // Run at 2 AM daily
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Starting cleanup of old notification requests...");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await admin.firestore()
      .collection("notification_requests")
      .where("createdAt", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    console.log(`Found ${snapshot.size} old notification requests to delete`);

    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Cleanup complete");

    return null;
  });
