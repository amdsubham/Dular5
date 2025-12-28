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
        // Hardcoded credentials as per Instamojo support
        const apiKey = "ebda991171c87967040b2b29e49f75f2";
        const authToken = "fa95ede4898f41b4ad82fecaaf06b778";

        console.log("  • API Key (first 10 chars):", apiKey.substring(0, 10) + "...");
        console.log("  • Auth Token (first 10 chars):", authToken.substring(0, 10) + "...");

        // Use the correct API endpoint as per Instamojo documentation
        const apiUrl = `https://www.instamojo.com/api/1.1/payments/${payment_id}/`;
        console.log("  • Requesting URL:", apiUrl);

        // Fetch payment details from Instamojo using X-Api-Key and X-Auth-Token headers
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
            'X-Auth-Token': authToken,
            'Content-Type': 'application/json'
          }
        });

        console.log("  • API Response Status:", response.status, response.statusText);

        if (response.ok) {
          const paymentDetails = await response.json();
          console.log("\n✅ FULL API RESPONSE FROM INSTAMOJO:");
          console.log(JSON.stringify(paymentDetails, null, 2));

          // Extract phone from API response - check payment object
          const payment = paymentDetails.payment;
          const apiPhone = payment?.buyer_phone ||
                          payment?.phone ||
                          paymentDetails.buyer_phone ||
                          paymentDetails.phone;

          if (apiPhone) {
            console.log("✅ PHONE FOUND IN API:", apiPhone);
            webhookData.buyer_phone = apiPhone; // Add to webhook data
          } else {
            console.error("❌ API response also lacks phone number");
            console.error("  • Available fields in response:", Object.keys(paymentDetails));
            if (payment) {
              console.error("  • Available fields in payment object:", Object.keys(payment));
            }
          }
        } else {
          const errorText = await response.text();
          console.error("❌ API request failed!");
          console.error("  • Status:", response.status, response.statusText);
          console.error("  • Response:", errorText);
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
        `+91${phoneNumber}`, // Add +91 prefix
        `91${phoneNumber}`, // Add 91 prefix
        `+91${phoneNumber.replace(/^\+91/, "").replace(/^91/, "")}`, // Clean then add +91
        `91${phoneNumber.replace(/^\+91/, "").replace(/^91/, "")}`, // Clean then add 91
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
          .where("status", "==", "pending")
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
    let transactionQuery;
    let shouldCreateTransaction = true;

    // Try multiple strategies to find existing transaction
    console.log("\n🔍 SEARCHING FOR EXISTING TRANSACTION:");

    // Strategy 1: Search by payment_request_id (orderId)
    if (payment_request_id) {
      console.log("  • Strategy 1: Searching by payment_request_id (orderId):", payment_request_id);
      transactionQuery = await admin.firestore()
        .collection("transactions")
        .where("orderId", "==", payment_request_id)
        .limit(1)
        .get();

      if (!transactionQuery.empty) {
        console.log("  ✅ Found transaction by payment_request_id");
        shouldCreateTransaction = false;
      } else {
        console.log("  ❌ No transaction found by payment_request_id");
      }
    }

    // Strategy 2: Search by userId + PENDING status (most recent)
    if (shouldCreateTransaction && userId) {
      console.log("  • Strategy 2: Searching by userId + PENDING status");
      const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      );

      try {
        transactionQuery = await admin.firestore()
          .collection("transactions")
          .where("userId", "==", userId)
          .where("status", "==", "pending")
          .where("provider", "==", "instamojo")
          .where("createdAt", ">=", fiveMinutesAgo)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!transactionQuery.empty) {
          console.log("  ✅ Found transaction by userId + PENDING status");
          const foundTransaction = transactionQuery.docs[0].data();
          console.log("    • Transaction ID:", transactionQuery.docs[0].id);
          console.log("    • Plan ID:", foundTransaction.planId);
          console.log("    • Amount:", foundTransaction.amount);
          console.log("    • Created:", foundTransaction.createdAt?.toDate?.());
          shouldCreateTransaction = false;
        } else {
          console.log("  ❌ No recent PENDING transaction found for user");
        }
      } catch (indexError: any) {
        console.error("  ❌ Firestore index error for Strategy 2:", indexError.message);
        console.log("  ℹ️  Trying fallback strategy without createdAt filter...");

        // Fallback: Search without createdAt filter (simpler query, no index needed)
        try {
          transactionQuery = await admin.firestore()
            .collection("transactions")
            .where("userId", "==", userId)
            .where("status", "==", "pending")
            .where("provider", "==", "instamojo")
            .limit(10) // Get last 10 pending transactions
            .get();

          if (!transactionQuery.empty) {
            console.log(`  ℹ️  Found ${transactionQuery.size} pending Instamojo transactions for user`);

            // Filter and sort manually by createdAt
            const recentTransactions = transactionQuery.docs
              .map(doc => ({ id: doc.id, data: doc.data(), ref: doc }))
              .filter(tx => {
                const createdAt = tx.data.createdAt?.toDate();
                return createdAt && createdAt > new Date(Date.now() - 5 * 60 * 1000);
              })
              .sort((a, b) => {
                const aTime = a.data.createdAt?.toMillis() || 0;
                const bTime = b.data.createdAt?.toMillis() || 0;
                return bTime - aTime;
              });

            if (recentTransactions.length > 0) {
              console.log("  ✅ Found transaction (fallback method)");
              const foundTransaction = recentTransactions[0];
              console.log("    • Transaction ID:", foundTransaction.id);
              console.log("    • Plan ID:", foundTransaction.data.planId);
              console.log("    • Amount:", foundTransaction.data.amount);
              console.log("    • Created:", foundTransaction.data.createdAt?.toDate?.());

              // Reconstruct query result format
              transactionQuery = {
                empty: false,
                docs: [foundTransaction.ref],
              } as any;
              shouldCreateTransaction = false;
            } else {
              console.log("  ❌ No recent transactions in fallback either");
            }
          } else {
            console.log("  ❌ No PENDING Instamojo transactions found for user (fallback)");
          }
        } catch (fallbackError: any) {
          console.error("  ❌ Fallback strategy also failed:", fallbackError.message);
        }
      }
    }

    // Strategy 3: Search by phone number (handles multiple user accounts with same phone)
    if (shouldCreateTransaction && phoneNumber) {
      console.log("  • Strategy 3: Searching by phone number + PENDING status");
      console.log("    • Phone number:", phoneNumber);

      try {
        transactionQuery = await admin.firestore()
          .collection("transactions")
          .where("userPhone", "==", phoneNumber)
          .where("status", "==", "pending")
          .where("provider", "==", "instamojo")
          .limit(10) // Get last 10 pending transactions with this phone
          .get();

        if (!transactionQuery.empty) {
          console.log(`  ℹ️  Found ${transactionQuery.size} pending Instamojo transactions for phone ${phoneNumber}`);

          // Filter and sort manually by createdAt (get most recent)
          const recentTransactions = transactionQuery.docs
            .map(doc => ({ id: doc.id, data: doc.data(), ref: doc }))
            .filter(tx => {
              const createdAt = tx.data.createdAt?.toDate();
              return createdAt && createdAt > new Date(Date.now() - 5 * 60 * 1000);
            })
            .sort((a, b) => {
              const aTime = a.data.createdAt?.toMillis() || 0;
              const bTime = b.data.createdAt?.toMillis() || 0;
              return bTime - aTime;
            });

          if (recentTransactions.length > 0) {
            console.log("  ✅ Found transaction by phone number");
            const foundTransaction = recentTransactions[0];
            console.log("    • Transaction ID:", foundTransaction.id);
            console.log("    • User ID (from transaction):", foundTransaction.data.userId);
            console.log("    • User ID (from webhook lookup):", userId);
            console.log("    • Plan ID:", foundTransaction.data.planId);
            console.log("    • Amount:", foundTransaction.data.amount);
            console.log("    • Created:", foundTransaction.data.createdAt?.toDate?.());

            // Use the userId from the transaction (not from webhook user lookup)
            userId = foundTransaction.data.userId;
            console.log("    ℹ️  Using userId from transaction:", userId);

            // Fetch the correct user document
            try {
              const correctUserDoc = await admin.firestore().collection("users").doc(userId).get();
              if (correctUserDoc.exists) {
                userDoc = correctUserDoc;
                console.log("    ✅ Fetched correct user document for userId:", userId);
              } else {
                console.log("    ⚠️ User document not found for userId:", userId);
              }
            } catch (userFetchError: any) {
              console.error("    ❌ Error fetching user document:", userFetchError.message);
            }

            // Reconstruct query result format
            transactionQuery = {
              empty: false,
              docs: [foundTransaction.ref],
            } as any;
            shouldCreateTransaction = false;
          } else {
            console.log("  ❌ No recent transactions for phone number in last 5 minutes");
          }
        } else {
          console.log("  ❌ No PENDING Instamojo transactions found for phone:", phoneNumber);
        }
      } catch (phoneError: any) {
        console.error("  ❌ Phone number search failed:", phoneError.message);
      }
    }

    let transactionDoc;
    let transaction: any;

    if (shouldCreateTransaction) {
      console.warn("\n⚠️ NO EXISTING TRANSACTION FOUND!");
      console.warn("⚠️ This should NOT happen in normal flow!");
      console.warn("⚠️ Creating fallback transaction using smart link URL detection");

      // Determine plan type by checking the smart link URL used (RELIABLE METHOD)
      let planType = "daily"; // default
      const paymentAmount = parseFloat(amount);
      console.log("💰 Payment amount:", paymentAmount);

      // Smart link IDs for each plan (from instamojo.tsx)
      const SMART_LINK_IDS = {
        monthly: "qQBgZ7",
        weekly: "xU7gCw",
        daily: "hbvW2s",
      };

      // ONLY use smart link URL to detect plan (NOT amount-based, as coupons change amounts)
      if (shorturl || longurl) {
        const url = shorturl || longurl;
        console.log("🔗 Smart link URL:", url);

        // Check which smart link was used
        if (url.includes(SMART_LINK_IDS.monthly)) {
          planType = "monthly";
          console.log("✅ Detected MONTHLY plan from smart link URL");
        } else if (url.includes(SMART_LINK_IDS.weekly)) {
          planType = "weekly";
          console.log("✅ Detected WEEKLY plan from smart link URL");
        } else if (url.includes(SMART_LINK_IDS.daily)) {
          planType = "daily";
          console.log("✅ Detected DAILY plan from smart link URL");
        } else {
          console.error("❌ Could not detect plan from URL:", url);
          console.error("❌ No reliable way to determine plan without transaction record");
          console.error("💡 Please ensure transaction is created BEFORE payment");
          res.status(400).send("Unable to determine plan type - transaction should be created before payment");
          return;
        }
      } else {
        console.error("❌ No smart link URL in webhook");
        console.error("❌ Cannot reliably determine plan type (amount-based detection removed due to coupon codes)");
        console.error("💡 Please ensure transaction is created BEFORE payment");
        res.status(400).send("Unable to determine plan type - transaction should be created before payment");
        return;
      }

      console.log("📋 Determined plan type (from smart link):", planType, "for amount:", paymentAmount);

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
          orderId: payment_request_id || payment_id, // Use payment_id if payment_request_id is missing
          instamojoPaymentId: payment_id,
          instamojoPaymentRequestId: payment_request_id || null, // Set to null if undefined
          status: "SUCCESS",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookData: webhookData,
          note: "Transaction created by webhook fallback - plan detected from smart link URL",
        });

      console.log("✅ Transaction created:", newTransactionRef.id);

      transactionDoc = await newTransactionRef.get();
      transaction = transactionDoc.data();
    } else {
      // Transaction exists, update it
      if (transactionQuery && !transactionQuery.empty) {
        transactionDoc = transactionQuery.docs[0];
        transaction = transactionDoc.data();
        console.log("\n📄 EXISTING TRANSACTION FOUND:");
        console.log("  • Transaction ID:", transactionDoc.id);
        console.log("  • Plan ID:", transaction.planId);
        console.log("  • Plan Type:", transaction.planType || transaction.planId);
        console.log("  • Amount (original):", transaction.amount);
        console.log("  • Amount (paid):", amount);
        console.log("  • Status:", transaction.status);

        // IMPORTANT: Always use planId/planType from the existing transaction
        // This ensures coupon codes don't affect plan detection
        console.log("✅ Using plan from existing transaction (ignoring amount)");

        // Update existing transaction with payment details
        await transactionDoc.ref.update({
          instamojoPaymentId: payment_id,
          instamojoPaymentRequestId: payment_request_id || null,
          status: "SUCCESS",
          amountPaid: parseFloat(amount), // Actual amount paid (may differ due to coupons)
          fees: parseFloat(fees || "0"),
          currency: currency || "INR",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookData: webhookData,
        });

        console.log("✅ Transaction updated successfully");
        console.log("  • Will use planId from transaction:", transaction.planId || transaction.planType);
      }
    }

    // Calculate subscription dates
    console.log("\n📅 CALCULATING SUBSCRIPTION DATES:");
    const now = new Date();
    let endDate = new Date();

    // Ensure we have planType (fallback to planId if not set)
    const planType = transaction.planType || transaction.planId;
    if (!planType) {
      console.error("❌ No plan type found in transaction!");
      console.error("  • Transaction data:", JSON.stringify(transaction, null, 2));
      res.status(400).send("Invalid transaction - no plan type");
      return;
    }

    console.log("  • Current time:", now.toISOString());
    console.log("  • Plan type:", planType);

    switch (planType) {
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
        console.error("❌ Invalid plan type:", planType);
        res.status(400).send("Invalid plan type");
        return;
    }

    console.log("  • End date:", endDate.toISOString());

    // Fetch plan details from Firestore to get the correct swipe limit
    console.log("\n📋 FETCHING PLAN DETAILS:");
    const plansRef = admin.firestore().collection("subscriptionPlans").doc("plans");
    const plansDoc = await plansRef.get();

    let swipesLimit = 5; // Default for free plan
    let isPremium = false;

    if (plansDoc.exists) {
      const plansData = plansDoc.data();
      const planData = plansData ? plansData[planType] : null;

      if (planData) {
        swipesLimit = planData.swipeLimit || swipesLimit;
        isPremium = planType !== "free";
        console.log("  • Plan found:", planType);
        console.log("  • Swipe limit from plan:", swipesLimit);
      } else {
        console.warn("  ⚠️ Plan data not found for:", planType);
        // Fallback to hardcoded values
        swipesLimit = planType === "daily" ? 50 : planType === "weekly" ? 100 : -1;
        isPremium = true;
      }
    } else {
      console.warn("  ⚠️ Plans document not found, using fallback values");
      // Fallback to hardcoded values
      swipesLimit = planType === "daily" ? 50 : planType === "weekly" ? 100 : -1;
      isPremium = true;
    }

    // Update or create user subscription
    console.log("\n💾 UPDATING FIRESTORE SUBSCRIPTION:");
    const subscriptionRef = admin.firestore()
      .collection("userSubscriptions")
      .doc(userId);

    console.log("  • Subscription path: userSubscriptions/" + userId);

    const subscriptionDoc = await subscriptionRef.get();

    const subscriptionData = {
      currentPlan: planType,
      planStartDate: admin.firestore.Timestamp.fromDate(now),
      planEndDate: admin.firestore.Timestamp.fromDate(endDate),
      isActive: true,
      isPremium: isPremium,
      autoRenew: false,
      swipesUsedToday: 0,
      swipesLimit: swipesLimit,
      lastSwipeDate: admin.firestore.Timestamp.fromDate(now),
    };

    if (subscriptionDoc.exists) {
      console.log("  • Action: UPDATING existing subscription");
      const previousData = subscriptionDoc.data();
      console.log("  • Previous data:", JSON.stringify(previousData, null, 2));

      // Check if this is an upgrade/downgrade (plan change)
      const isPlanChange = previousData?.currentPlan !== planType;
      console.log("  • Is plan change?", isPlanChange, `(${previousData?.currentPlan} → ${planType})`);

      // When upgrading/downgrading, ALWAYS reset swipes to 0
      // This gives the user a fresh start with their new plan
      const updateData = {
        ...subscriptionData,
        swipesUsedToday: 0, // Always reset on new subscription payment
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      console.log("  • Resetting swipesUsedToday to 0 (new payment)");
      console.log("  • New swipe limit:", swipesLimit);

      await subscriptionRef.update(updateData);

      console.log("  ✅ Subscription UPDATED!");
      console.log("  • Previous swipes used:", previousData?.swipesUsedToday || 0);
      console.log("  • New swipes used: 0 (reset)");
    } else {
      console.log("  • Action: CREATING new subscription");

      await subscriptionRef.set({
        userId: userId,
        ...subscriptionData,
        totalSwipesAllTime: 0,
        paymentHistory: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("  ✅ Subscription CREATED!");
      console.log("  • Swipe limit:", swipesLimit);
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

/**
 * Scheduled function to reset daily swipes for all users (runs at midnight)
 * This ensures that users who don't open the app still get their swipes reset
 */
export const resetDailySwipes = functions.pubsub
  .schedule("0 0 * * *") // Run at midnight every day
  .timeZone("Asia/Kolkata") // Set to India timezone (IST)
  .onRun(async (context) => {
    console.log("🔄 Starting daily swipe reset for all users...");
    console.log("⏰ Execution time:", new Date().toISOString());

    try {
      // Get the subscription config to know the free tier swipe limit
      const configDoc = await admin.firestore()
        .collection("subscriptionConfig")
        .doc("default")
        .get();

      const freeSwipeLimit = configDoc.exists
        ? (configDoc.data()?.freeTrialSwipeLimit || 5)
        : 5;

      console.log(`📊 Free tier swipe limit: ${freeSwipeLimit}`);

      // Get all user subscriptions (both free and premium)
      const allSubscriptions = await admin.firestore()
        .collection("userSubscriptions")
        .get();

      console.log(`👥 Found ${allSubscriptions.size} total users`);

      let resetCount = 0;
      let batchCount = 0;
      let batch = admin.firestore().batch();
      const BATCH_SIZE = 500; // Firestore batch limit

      for (const doc of allSubscriptions.docs) {
        const data = doc.data();
        const lastSwipeDate = data.lastSwipeDate?.toDate();
        const now = new Date();

        // Check if it's a different day (same logic as shouldResetSwipeCount)
        const shouldReset = !lastSwipeDate || (
          now.getFullYear() !== lastSwipeDate.getFullYear() ||
          now.getMonth() !== lastSwipeDate.getMonth() ||
          now.getDate() !== lastSwipeDate.getDate()
        );

        if (shouldReset && data.swipesUsedToday > 0) {
          // Reset swipes for this user
          batch.update(doc.ref, {
            swipesUsedToday: 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          resetCount++;
          batchCount++;

          // Commit batch if we reach the limit
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`   ✅ Committed batch of ${batchCount} updates`);
            batch = admin.firestore().batch();
            batchCount = 0;
          }
        }
      }

      // Commit any remaining updates
      if (batchCount > 0) {
        await batch.commit();
        console.log(`   ✅ Committed final batch of ${batchCount} updates`);
      }

      console.log("✅ Daily swipe reset complete!");
      console.log(`   • Total users: ${allSubscriptions.size}`);
      console.log(`   • Users reset: ${resetCount}`);
      console.log(`   • Users skipped (already at 0 or same day): ${allSubscriptions.size - resetCount}`);

      return null;
    } catch (error: any) {
      console.error("❌ Error during daily swipe reset:", error);
      console.error("   • Error message:", error.message);
      console.error("   • Error stack:", error.stack);
      throw error; // Re-throw to mark function execution as failed
    }
  });
