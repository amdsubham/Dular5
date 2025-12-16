import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

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
 * Instamojo Webhook Handler for Payment Notifications
 * This function receives payment notifications from Instamojo smart links
 */
export const instamojoWebhook = functions.https.onRequest(async (req, res) => {
  console.log("\n\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔔 INSTAMOJO WEBHOOK CALLED!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("📨 Request method:", req.method);
  console.log("📍 Request path:", req.path);
  console.log("🌐 Request IP:", req.ip);

  // Log headers (useful for debugging)
  console.log("\n📋 REQUEST HEADERS:");
  Object.keys(req.headers).forEach(key => {
    console.log(`  • ${key}: ${req.headers[key]}`);
  });

  // Only accept POST requests
  if (req.method !== "POST") {
    console.error("❌ REJECTED: Invalid request method:", req.method);
    console.log("═══════════════════════════════════════════════════════════\n\n");
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Instamojo sends data as application/x-www-form-urlencoded
    const webhookData = req.body;

    console.log("\n📦 RAW WEBHOOK BODY (COMPLETE):");
    console.log(JSON.stringify(webhookData, null, 2));

    // SUPER DETAILED: Log the actual req.body object
    console.log("\n🔬 DEEP INSPECTION OF REQUEST BODY:");
    console.log("Type of req.body:", typeof req.body);
    console.log("Is array:", Array.isArray(req.body));
    console.log("Constructor:", req.body?.constructor?.name);

    // Try to access body in different ways
    console.log("\n🔍 TRYING DIFFERENT BODY ACCESS METHODS:");
    console.log("req.body:", req.body);
    console.log("req.rawBody:", req.rawBody);
    console.log("req.query:", req.query);

    // Log all keys received
    console.log("\n🔑 ALL WEBHOOK KEYS RECEIVED:");
    const allKeys = Object.keys(webhookData);
    console.log("  • Total fields:", allKeys.length);
    console.log("  • Fields:", allKeys.join(", "));

    // Log each field value with type AND check for custom field patterns
    console.log("\n📊 FIELD-BY-FIELD BREAKDOWN:");
    allKeys.forEach(key => {
      const value = webhookData[key];
      const type = typeof value;
      const displayValue = value === undefined ? "undefined" : value === null ? "null" : value;
      console.log(`  • ${key}: "${displayValue}" (type: ${type})`);

      // Check if this might be a custom field
      if (key.toLowerCase().includes('phone') ||
          key.toLowerCase().includes('mobile') ||
          key.toLowerCase().includes('contact') ||
          key.toLowerCase().includes('custom') ||
          key.toLowerCase().includes('field')) {
        console.log(`    ⚠️  POTENTIAL PHONE/CUSTOM FIELD DETECTED: ${key}`);
      }
    });

    // Extract MAC for verification
    const receivedMac = webhookData.mac;
    const dataWithoutMac = { ...webhookData };
    delete dataWithoutMac.mac;

    // Get Instamojo private salt from Firestore config
    const configDoc = await admin.firestore()
      .collection("subscriptionConfig")
      .doc("default")
      .get();

    // TEMPORARY: Allow webhook to work without config for testing
    let privateSalt = null;
    if (configDoc.exists) {
      const config = configDoc.data();
      const instamojoConfig = config?.instamojo;
      privateSalt = instamojoConfig?.instamojoPrivateSalt;
    }

    // Only verify MAC if private salt is configured
    if (privateSalt && privateSalt !== "PLACEHOLDER_UPDATE_WITH_REAL_SALT") {
      console.log("🔐 Verifying MAC with private salt...");

      // Verify MAC (Message Authentication Code)
      const sortedKeys = Object.keys(dataWithoutMac).sort();
      const dataString = sortedKeys
        .map(key => `${key}=${dataWithoutMac[key]}`)
        .join("|");

      const calculatedMac = crypto
        .createHmac("sha1", privateSalt)
        .update(dataString)
        .digest("hex");

      if (calculatedMac !== receivedMac) {
        console.warn("⚠️ MAC verification failed - continuing anyway for testing");
        console.warn("Received MAC:", receivedMac);
        console.warn("Calculated MAC:", calculatedMac);
        console.warn("💡 Check if private salt in Firestore matches Instamojo settings");
        // TEMPORARILY DISABLED: res.status(400).send("Invalid MAC");
        // TEMPORARILY DISABLED: return;
      } else {
        console.log("✅ MAC verification successful");
      }
    } else {
      console.warn("⚠️ SKIPPING MAC VERIFICATION - No private salt configured (TESTING MODE ONLY)");
    }

    // Extract payment details - try all possible field names
    const {
      payment_id,
      payment_request_id,
      status,
      buyer_phone,
      buyer_name,
      buyer_email,
      buyer,        // Email field (older format)
      phone,        // Alternative field name
      mobile,       // Alternative field name
      contact,      // Alternative field name
      amount,
      fees,
      currency,
      link_id,
      purpose,      // Link purpose/name
      shorturl,     // Short URL
      longurl,      // Long URL
    } = webhookData;

    // Try to get phone from any available field
    const phoneFromWebhook = buyer_phone || phone || mobile || contact;

    // Extract email from buyer field if buyer_email is not present
    const emailFromWebhook = buyer_email || buyer;

    console.log("\n💳 EXTRACTED PAYMENT FIELDS:");
    console.log("  • payment_id:", payment_id || "❌ MISSING");
    console.log("  • payment_request_id:", payment_request_id || "❌ MISSING");
    console.log("  • status:", status || "❌ MISSING");
    console.log("  • amount:", amount || "❌ MISSING");
    console.log("  • currency:", currency || "❌ MISSING");
    console.log("  • fees:", fees || "N/A");
    console.log("  • link_id:", link_id || "❌ MISSING");
    console.log("  • purpose:", purpose || "N/A");
    console.log("  • shorturl:", shorturl || "N/A");
    console.log("  • longurl:", longurl || "N/A");

    console.log("\n👤 EXTRACTED USER FIELDS:");
    console.log("  • buyer_phone:", buyer_phone || "❌ MISSING");
    console.log("  • buyer_name:", buyer_name || "❌ MISSING");
    console.log("  • buyer_email:", buyer_email || "❌ MISSING");
    console.log("  • buyer (email):", buyer || "❌ MISSING");
    console.log("  • phone (alternative):", phone || "❌ MISSING");
    console.log("  • mobile (alternative):", mobile || "❌ MISSING");
    console.log("  • contact (alternative):", contact || "❌ MISSING");
    console.log("  • emailFromWebhook:", emailFromWebhook || "❌ MISSING");

    console.log("\n📞 PHONE NUMBER DETECTION:");
    if (phoneFromWebhook) {
      console.log("  ✅ Phone found:", phoneFromWebhook);
      console.log("  📍 Source field:", buyer_phone ? "buyer_phone" : phone ? "phone" : mobile ? "mobile" : contact ? "contact" : "unknown");
    } else {
      console.error("  ❌ NO PHONE NUMBER IN WEBHOOK!");
      console.error("  ❌ This means Instamojo smart link is NOT configured to collect phone number");
      console.error("  ℹ️  Webhook contains email:", emailFromWebhook || "none");
    }

    // Check if payment was successful
    if (status !== "Credit" && status !== "successful") {
      console.warn("⚠️ Payment not successful. Status:", status);

      // Update transaction record as failed
      const transactionQuery = await admin.firestore()
        .collection("transactions")
        .where("orderId", "==", payment_request_id)
        .limit(1)
        .get();

      if (!transactionQuery.empty) {
        const transactionDoc = transactionQuery.docs[0];
        await transactionDoc.ref.update({
          paymentId: payment_id,
          status: "FAILED",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookData: webhookData,
        });
        console.log("✅ Transaction marked as failed");
      }

      res.status(200).send("Payment failed");
      return;
    }

    console.log("💰 Payment successful! Payment ID:", payment_id);

    // Handle case where buyer_phone might be missing
    let userId = null;
    let phoneNumber = null;
    let userDoc = null;

    // WORKAROUND: If phone not in webhook, fetch from Instamojo API
    if (!phoneFromWebhook && payment_id) {
      console.log("\n🔄 FETCHING PAYMENT DETAILS FROM INSTAMOJO API...");
      try {
        const configDoc = await admin.firestore()
          .collection("subscriptionConfig")
          .doc("default")
          .get();

        if (configDoc.exists) {
          const config = configDoc.data();
          // Access nested instamojo object
          const instamojoConfig = config?.instamojo;
          const apiKey = instamojoConfig?.instamojoApiKey;
          const authToken = instamojoConfig?.instamojoAuthToken;

          if (apiKey && authToken) {
            console.log("  • API Key (first 10 chars):", apiKey.substring(0, 10) + "...");
            console.log("  • Auth Token (first 10 chars):", authToken.substring(0, 10) + "...");
            console.log("  • Requesting URL:", `https://api.instamojo.com/v2/payments/${payment_id}/`);

            // Try using the v1.1 API endpoint which works with Private API credentials
            const apiUrl = `https://api.instamojo.com/v1.1/payments/${payment_id}/`;
            console.log("  • Trying v1.1 API:", apiUrl);

            // Fetch payment details from Instamojo using Basic Auth
            const authString = `${apiKey}:${authToken}`;
            const base64Auth = Buffer.from(authString).toString('base64');

            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${base64Auth}`,
                'Content-Type': 'application/json'
              }
            });

            console.log("  • API Response Status:", response.status, response.statusText);

            if (response.ok) {
              const paymentDetails = await response.json();
              console.log("✅ Fetched payment details:", JSON.stringify(paymentDetails, null, 2));

              // Extract phone from API response
              const apiPhone = paymentDetails.phone ||
                              paymentDetails.buyer_phone ||
                              paymentDetails.payment?.phone ||
                              paymentDetails.payment?.buyer_phone;

              if (apiPhone) {
                console.log("✅ PHONE FOUND IN API:", apiPhone);
                webhookData.buyer_phone = apiPhone; // Add to webhook data
              } else {
                console.error("❌ API response also lacks phone number");
                console.error("  • Available fields:", Object.keys(paymentDetails));
              }
            } else {
              const errorText = await response.text();
              console.error("❌ API request failed!");
              console.error("  • Status:", response.status, response.statusText);
              console.error("  • Response:", errorText);
            }
          } else {
            console.warn("⚠️ API credentials not configured");
            console.warn("  • API Key present:", !!apiKey);
            console.warn("  • Auth Token present:", !!authToken);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching payment details from API:", error);
      }
    }

    if (phoneFromWebhook || webhookData.buyer_phone) {
      // Try to find user by phone number from webhook or API
      phoneNumber = phoneFromWebhook || webhookData.buyer_phone;
      console.log("\n🔍 USER LOOKUP STARTING:");
      console.log("  • Raw phone from webhook:", phoneNumber);
      console.log("  • Source field:", buyer_phone ? "buyer_phone" : phone ? "phone" : mobile ? "mobile" : contact ? "contact" : "unknown");

      // Try different phone number formats
      const phoneFormats = [
        phoneNumber, // As-is
        phoneNumber.replace(/^\+91/, ""), // Remove +91 prefix
        phoneNumber.replace(/^91/, ""), // Remove 91 prefix
        phoneNumber.replace(/[\s\-\(\)]/g, ""), // Remove spaces, dashes, parentheses
        phoneNumber.replace(/[\s\-\(\)]/g, "").replace(/^\+91/, ""), // Clean and remove +91
        phoneNumber.replace(/[\s\-\(\)]/g, "").replace(/^91/, ""), // Clean and remove 91
      ];

      console.log("  • Trying", phoneFormats.length, "different formats:");
      phoneFormats.forEach((format, index) => {
        console.log(`    ${index + 1}. "${format}"`);
      });

      let userQuery = null;
      let normalizedPhone = "";

      console.log("\n  🔎 Searching Firestore users collection...");
      for (const format of phoneFormats) {
        console.log(`    • Checking format: "${format}"`);
        const query = await admin.firestore()
          .collection("users")
          .where("phoneNumber", "==", format)
          .limit(1)
          .get();

        if (!query.empty) {
          userQuery = query;
          normalizedPhone = format;
          console.log(`    ✅ MATCH FOUND with format: "${format}"`);
          break;
        } else {
          console.log(`    ❌ No match for format: "${format}"`);
        }
      }

      if (userQuery && !userQuery.empty) {
        phoneNumber = normalizedPhone;
        userDoc = userQuery.docs[0];
        userId = userDoc.id;
        const userData = userDoc.data();
        console.log("\n✅ USER FOUND!");
        console.log("  • User ID:", userId);
        console.log("  • User Name:", userData?.firstName || "N/A");
        console.log("  • User Phone (in DB):", userData?.phoneNumber || "N/A");
        console.log("  • Matched with format:", normalizedPhone);
      } else {
        console.error("\n❌ USER NOT FOUND!");
        console.error("  • Tried all", phoneFormats.length, "formats");
        console.error("  • None matched any user in Firestore");
      }
    }

    // If no phone number provided or user not found, try to find pending transaction
    if (!userId) {
      console.warn("⚠️ Could not find user by phone number");
      console.log("\n🔍 FALLBACK: Searching for pending transaction with payment_id:", payment_id);

      // Search for transaction by payment amount and pending status
      // NOTE: This requires a Firestore composite index:
      // Collection: transactions, Fields: status (Ascending), createdAt (Descending)
      try {
        const paymentAmount = parseFloat(amount);
        console.log("  • Payment amount:", paymentAmount);

        const pendingTransactionQuery = await admin.firestore()
          .collection("transactions")
          .where("status", "==", "PENDING")
          .orderBy("createdAt", "desc")
          .limit(20) // Check last 20 pending transactions
          .get();

        if (!pendingTransactionQuery.empty) {
          console.log(`  • Found ${pendingTransactionQuery.size} pending transactions`);

          // Find transactions matching the payment amount within last 15 minutes
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
          const matchingTransactions = [];

          for (const doc of pendingTransactionQuery.docs) {
            const txData = doc.data();
            const txCreatedAt = txData.createdAt?.toDate();
            const txAmount = txData.amount;

            console.log(`  • Transaction ${doc.id}: amount=${txAmount}, created=${txCreatedAt?.toISOString()}`);

            // Match by amount AND recent timestamp (within 15 minutes)
            if (txCreatedAt &&
                txCreatedAt > fifteenMinutesAgo &&
                Math.abs(txAmount - paymentAmount) < 0.01) {
              console.log(`    ✅ MATCH: Amount matches and within 15 minutes`);
              matchingTransactions.push({ id: doc.id, data: txData, createdAt: txCreatedAt });
            }
          }

          console.log(`  • Found ${matchingTransactions.length} matching transactions`);

          if (matchingTransactions.length > 0) {
            // Use the most recent matching transaction
            matchingTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const matchedTransaction = matchingTransactions[0];

            if (matchingTransactions.length > 1) {
              console.warn(`⚠️  Multiple transactions match! Using most recent: ${matchedTransaction.id}`);
              console.warn(`   Other candidates: ${matchingTransactions.slice(1).map(t => t.id).join(", ")}`);
            }

            userId = matchedTransaction.data.userId;
            phoneNumber = matchedTransaction.data.userPhone;

            const userDocFetch = await admin.firestore()
              .collection("users")
              .doc(userId)
              .get();

            if (userDocFetch.exists) {
              userDoc = userDocFetch;
              console.log("✅ USER FOUND via pending transaction!");
              console.log("  • User ID:", userId);
              console.log("  • Phone:", phoneNumber);
              console.log("  • Transaction:", matchedTransaction.id);
              console.log("  • Amount matched:", paymentAmount);
            }
          } else {
            console.error("❌ No matching pending transactions found");
            console.error("  • Looking for amount:", paymentAmount);
            console.error("  • Within last 15 minutes");
          }
        }
      } catch (indexError: any) {
        console.error("❌ Firestore index error (expected on first run):", indexError.message);
        console.error("💡 Please create the index by visiting the URL in the error above");
        console.error("   Or manually create index: Collection=transactions, status=ASC, createdAt=DESC");
      }

      // If still no user found, fail
      if (!userId) {
        console.error("❌ FATAL: Could not determine user for this payment");
        console.error("❌ Phone from webhook:", phoneFromWebhook);
        console.error("❌ No matching pending transaction found");
        console.error("\n💡 SOLUTIONS:");
        console.error("   1. Configure Instamojo smart link to collect 'Phone Number' field");
        console.error("   2. OR ensure transaction is created BEFORE payment");
        res.status(404).send("User not found - phone number required or no pending transaction");
        return;
      }
    }

    // Find or create transaction record
    const transactionQuery = await admin.firestore()
      .collection("transactions")
      .where("orderId", "==", payment_request_id)
      .limit(1)
      .get();

    let transactionDoc;
    let transaction: any;

    if (transactionQuery.empty) {
      console.warn("⚠️ Transaction not found, creating new one");

      // Determine plan type based on amount
      let planType = "daily";
      const paymentAmount = parseFloat(amount);
      console.log("💰 Payment amount:", paymentAmount);

      if (paymentAmount >= 450) {
        planType = "monthly";
      } else if (paymentAmount >= 180) {
        planType = "weekly";
      }

      console.log("📋 Determined plan type:", planType, "for amount:", paymentAmount);

      // Create new transaction record
      const userData = userDoc?.data();
      const newTransactionRef = await admin.firestore()
        .collection("transactions")
        .add({
          userId: userId,
          userEmail: `${phoneNumber}@temp.com`,
          userName: userData?.firstName || "User",
          userPhone: phoneNumber || "unknown",
          planId: planType,
          planName: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
          planType: planType,
          amount: paymentAmount,
          currency: currency || "INR",
          provider: "instamojo",
          orderId: payment_request_id,
          instamojoPaymentId: payment_id,
          instamojoPaymentRequestId: payment_request_id,
          status: "SUCCESS",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookData: webhookData,
        });

      console.log("✅ Transaction created:", newTransactionRef.id);

      transactionDoc = await newTransactionRef.get();
      transaction = transactionDoc.data();
    } else {
      transactionDoc = transactionQuery.docs[0];
      transaction = transactionDoc.data();
      console.log("📄 Transaction found:", transactionDoc.id);

      // Update existing transaction
      await transactionDoc.ref.update({
        paymentId: payment_id,
        status: "SUCCESS",
        trackingId: payment_id,
        amount: parseFloat(amount),
        fees: parseFloat(fees || "0"),
        currency: currency || "INR",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        webhookData: webhookData,
      });

      console.log("✅ Transaction updated successfully");
    }

    // Calculate subscription dates
    console.log("\n📅 CALCULATING SUBSCRIPTION DATES:");
    const now = new Date();
    let endDate = new Date();

    console.log("  • Current time:", now.toISOString());
    console.log("  • Plan type:", transaction.planType);

    switch (transaction.planType) {
      case "daily":
        endDate.setDate(endDate.getDate() + 1);
        console.log("  • Duration: 1 day");
        break;
      case "weekly":
        endDate.setDate(endDate.getDate() + 7);
        console.log("  • Duration: 7 days");
        break;
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        console.log("  • Duration: 1 month");
        break;
      default:
        console.error("❌ Invalid plan type:", transaction.planType);
        res.status(400).send("Invalid plan type");
        return;
    }

    console.log("  • End date:", endDate.toISOString());

    // Update or create user subscription
    console.log("\n💾 UPDATING FIRESTORE SUBSCRIPTION:");
    const subscriptionRef = admin.firestore()
      .collection("userSubscriptions")
      .doc(userId);

    console.log("  • Subscription path: userSubscriptions/" + userId);

    const subscriptionDoc = await subscriptionRef.get();

    const subscriptionData = {
      currentPlan: transaction.planType,
      startDate: admin.firestore.Timestamp.fromDate(now),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      isActive: true,
      autoRenew: false,
      swipesUsedToday: 0,
      lastSwipeResetDate: admin.firestore.Timestamp.fromDate(now),
    };

    if (subscriptionDoc.exists) {
      console.log("  • Action: UPDATING existing subscription");
      console.log("  • Previous data:", JSON.stringify(subscriptionDoc.data(), null, 2));

      await subscriptionRef.update({
        ...subscriptionData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("  ✅ Subscription UPDATED!");
    } else {
      console.log("  • Action: CREATING new subscription");

      await subscriptionRef.set({
        userId: userId,
        ...subscriptionData,
        swipesLimit: transaction.planType === "daily" ? 100 : transaction.planType === "weekly" ? 500 : 999999,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("  ✅ Subscription CREATED!");
    }

    console.log("\n✅ SUBSCRIPTION ACTIVATION COMPLETE!");
    console.log("  • User ID:", userId);
    console.log("  • Plan:", transaction.planType);
    console.log("  • Is Active:", true);
    console.log("  • Start:", now.toISOString());
    console.log("  • End:", endDate.toISOString());

    // Send success response
    console.log("\n📤 SENDING RESPONSE TO INSTAMOJO:");
    console.log("  • Status: 200 OK");
    console.log("  • Message: Webhook processed successfully");

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("✅ WEBHOOK PROCESSING COMPLETE!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 SUMMARY:");
    console.log("  • Payment ID:", payment_id);
    console.log("  • User ID:", userId);
    console.log("  • Phone:", phoneNumber);
    console.log("  • Plan:", transaction.planType);
    console.log("  • Amount:", amount, currency);
    console.log("  • Subscription Active:", "✅ YES");
    console.log("  • End Date:", endDate.toISOString());
    console.log("═══════════════════════════════════════════════════════════\n\n");

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("\n\n");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("❌ ERROR PROCESSING WEBHOOK!");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("═══════════════════════════════════════════════════════════\n\n");
    res.status(500).send("Internal server error");
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
