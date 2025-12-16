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

/**
 * Google Play Billing Real-Time Developer Notification Handler
 * Processes subscription purchases, renewals, and cancellations from Google Play
 */
export const googlePlayWebhook = functions.pubsub
  .topic("play-billing-notifications")
  .onPublish(async (message) => {
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("🔔 GOOGLE PLAY BILLING NOTIFICATION RECEIVED");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("⏰ Timestamp:", new Date().toISOString());

    try {
      // Parse Pub/Sub message
      const messageData = message.json;
      console.log("📦 Message data:", JSON.stringify(messageData, null, 2));

      if (!messageData || !messageData.subscriptionNotification) {
        console.error("❌ Invalid message format - missing subscriptionNotification");
        return null;
      }

      const notification = messageData.subscriptionNotification;
      const {
        version,
        notificationType,
        purchaseToken,
        subscriptionId,
      } = notification;

      console.log("\n📋 NOTIFICATION DETAILS:");
      console.log("  • Version:", version);
      console.log("  • Notification Type:", notificationType);
      console.log("  • Subscription ID:", subscriptionId);
      console.log("  • Purchase Token:", purchaseToken?.substring(0, 20) + "...");

      // Map notification types
      const notificationTypes: Record<number, string> = {
        1: "SUBSCRIPTION_RECOVERED",
        2: "SUBSCRIPTION_RENEWED",
        3: "SUBSCRIPTION_CANCELED",
        4: "SUBSCRIPTION_PURCHASED",
        5: "SUBSCRIPTION_ON_HOLD",
        6: "SUBSCRIPTION_IN_GRACE_PERIOD",
        7: "SUBSCRIPTION_RESTARTED",
        8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
        9: "SUBSCRIPTION_DEFERRED",
        10: "SUBSCRIPTION_PAUSED",
        11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
        12: "SUBSCRIPTION_REVOKED",
        13: "SUBSCRIPTION_EXPIRED",
      };

      const notificationTypeStr = notificationTypes[notificationType] || `UNKNOWN (${notificationType})`;
      console.log("  • Type Description:", notificationTypeStr);

      // Get Google Play API configuration from Firestore
      const configDoc = await admin.firestore()
        .collection("subscriptionConfig")
        .doc("default")
        .get();

      if (!configDoc.exists) {
        console.error("❌ Google Play configuration not found in Firestore");
        return null;
      }

      const config = configDoc.data();
      const googlePlayConfig = config?.googlePlay;

      if (!googlePlayConfig || !googlePlayConfig.serviceAccountKey) {
        console.error("❌ Google Play service account key not configured");
        return null;
      }

      console.log("✅ Configuration loaded successfully");

      // Initialize Google Play Developer API client
      const { google } = require("googleapis");
      const androidPublisher = google.androidpublisher("v3");

      // Authenticate with service account
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(googlePlayConfig.serviceAccountKey),
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });

      const authClient = await auth.getClient();

      // Fetch subscription details from Google Play API
      console.log("\n🔍 FETCHING SUBSCRIPTION DETAILS FROM GOOGLE PLAY API...");
      const packageName = googlePlayConfig.packageName || "com.dular.app"; // Your app's package name

      const subscriptionResponse = await androidPublisher.purchases.subscriptions.get({
        auth: authClient,
        packageName,
        subscriptionId,
        token: purchaseToken,
      });

      const subscription = subscriptionResponse.data;
      console.log("✅ Subscription details fetched:", JSON.stringify(subscription, null, 2));

      // Extract important fields
      const {
        startTimeMillis,
        expiryTimeMillis,
        autoRenewing,
        priceCurrencyCode,
        priceAmountMicros,
        countryCode,
        paymentState,
        orderId,
        obfuscatedExternalAccountId, // This is the userId we passed during purchase!
      } = subscription;

      const userId = obfuscatedExternalAccountId;

      if (!userId) {
        console.error("❌ No user ID found in subscription (obfuscatedExternalAccountId missing)");
        console.error("💡 Make sure to pass userId when calling requestSubscription()");
        return null;
      }

      console.log("\n👤 USER IDENTIFICATION:");
      console.log("  • User ID:", userId);

      // Verify user exists
      const userDoc = await admin.firestore().collection("users").doc(userId).get();

      if (!userDoc.exists) {
        console.error("❌ User not found:", userId);
        return null;
      }

      console.log("✅ User found:", userDoc.data()?.firstName);

      // Determine plan type from subscription ID
      let planType = "daily";
      if (subscriptionId.includes("monthly")) {
        planType = "monthly";
      } else if (subscriptionId.includes("weekly")) {
        planType = "weekly";
      }

      console.log("\n📋 SUBSCRIPTION DETAILS:");
      console.log("  • Plan Type:", planType);
      console.log("  • Start Time:", new Date(parseInt(startTimeMillis)).toISOString());
      console.log("  • Expiry Time:", new Date(parseInt(expiryTimeMillis)).toISOString());
      console.log("  • Auto Renewing:", autoRenewing);
      console.log("  • Price:", priceAmountMicros / 1000000, priceCurrencyCode);
      console.log("  • Country:", countryCode);
      console.log("  • Payment State:", paymentState === 1 ? "Paid" : "Pending/Failed");
      console.log("  • Order ID:", orderId);

      // Handle different notification types
      const shouldActivate = [
        1, // SUBSCRIPTION_RECOVERED
        2, // SUBSCRIPTION_RENEWED
        4, // SUBSCRIPTION_PURCHASED
        7, // SUBSCRIPTION_RESTARTED
      ].includes(notificationType);

      const shouldDeactivate = [
        3, // SUBSCRIPTION_CANCELED
        5, // SUBSCRIPTION_ON_HOLD
        12, // SUBSCRIPTION_REVOKED
        13, // SUBSCRIPTION_EXPIRED
      ].includes(notificationType);

      // Create/Update transaction record
      console.log("\n💾 SAVING TRANSACTION RECORD...");
      const transactionRef = await admin.firestore().collection("transactions").add({
        userId,
        userEmail: userDoc.data()?.email || "",
        userName: userDoc.data()?.firstName || "User",
        userPhone: userDoc.data()?.phoneNumber || "",
        planId: planType,
        planName: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        planType,
        amount: priceAmountMicros / 1000000,
        currency: priceCurrencyCode,
        provider: "google_play",
        orderId,
        googlePlayPurchaseToken: purchaseToken,
        googlePlayOrderId: orderId,
        googlePlaySubscriptionId: subscriptionId,
        googlePlayNotificationType: notificationTypeStr,
        status: paymentState === 1 ? "SUCCESS" : "PENDING",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: paymentState === 1 ? admin.firestore.FieldValue.serverTimestamp() : null,
        webhookData: messageData,
      });

      console.log("✅ Transaction created:", transactionRef.id);

      // Update user subscription
      if (shouldActivate && paymentState === 1) {
        console.log("\n✅ ACTIVATING SUBSCRIPTION...");

        const startDate = new Date(parseInt(startTimeMillis));
        const endDate = new Date(parseInt(expiryTimeMillis));

        const subscriptionRef = admin.firestore()
          .collection("userSubscriptions")
          .doc(userId);

        const subscriptionDoc = await subscriptionRef.get();

        const subscriptionData = {
          currentPlan: planType,
          startDate: admin.firestore.Timestamp.fromDate(startDate),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          isActive: true,
          autoRenew: autoRenewing || false,
          googlePlayPurchaseToken: purchaseToken,
          googlePlayOrderId: orderId,
          googlePlaySubscriptionId: subscriptionId,
          swipesUsedToday: 0,
          lastSwipeResetDate: admin.firestore.Timestamp.now(),
        };

        if (subscriptionDoc.exists) {
          await subscriptionRef.update({
            ...subscriptionData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ Subscription UPDATED");
        } else {
          await subscriptionRef.set({
            userId,
            ...subscriptionData,
            swipesLimit: planType === "daily" ? 100 : planType === "weekly" ? 500 : 999999,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ Subscription CREATED");
        }

        console.log("  • Plan:", planType);
        console.log("  • Active:", true);
        console.log("  • Start:", startDate.toISOString());
        console.log("  • End:", endDate.toISOString());
      } else if (shouldDeactivate) {
        console.log("\n⚠️ DEACTIVATING SUBSCRIPTION...");

        const subscriptionRef = admin.firestore()
          .collection("userSubscriptions")
          .doc(userId);

        await subscriptionRef.update({
          currentPlan: "free",
          isActive: false,
          swipesLimit: 5,
          swipesUsedToday: 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("✅ Subscription downgraded to free tier");
      } else {
        console.log("\n⏸️ No subscription action needed for notification type:", notificationTypeStr);
      }

      console.log("\n═══════════════════════════════════════════════════════════");
      console.log("✅ GOOGLE PLAY NOTIFICATION PROCESSED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("📊 SUMMARY:");
      console.log("  • User ID:", userId);
      console.log("  • Plan:", planType);
      console.log("  • Order ID:", orderId);
      console.log("  • Notification Type:", notificationTypeStr);
      console.log("  • Action:", shouldActivate ? "Activated" : shouldDeactivate ? "Deactivated" : "None");
      console.log("═══════════════════════════════════════════════════════════\n");

      return null;
    } catch (error: any) {
      console.error("\n═══════════════════════════════════════════════════════════");
      console.error("❌ ERROR PROCESSING GOOGLE PLAY NOTIFICATION");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("═══════════════════════════════════════════════════════════\n");
      return null;
    }
  });

/**
 * Scheduled function to check and expire subscriptions (runs every hour)
 */
export const checkExpiredSubscriptions = functions.pubsub
  .schedule("0 * * * *") // Run every hour
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("🔍 Checking for expired subscriptions...");

    const now = admin.firestore.Timestamp.now();

    const expiredSubscriptions = await admin.firestore()
      .collection("userSubscriptions")
      .where("isActive", "==", true)
      .where("endDate", "<", now)
      .get();

    console.log(`Found ${expiredSubscriptions.size} expired subscriptions`);

    const batch = admin.firestore().batch();

    expiredSubscriptions.docs.forEach((doc) => {
      batch.update(doc.ref, {
        currentPlan: "free",
        isActive: false,
        swipesLimit: 5,
        swipesUsedToday: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log("✅ Expired subscriptions downgraded to free tier");

    return null;
  });
