/**
 * Initialize Subscription Data - App Version
 *
 * This function can be called from within the running app to initialize subscription data.
 * It runs with the authenticated user's permissions.
 *
 * Usage: Import this in your app and call initializeSubscriptionData() once
 */

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

// Default subscription plans
const defaultPlans = {
  daily: {
    id: "daily",
    name: "Daily Plan",
    displayName: "Daily Plan",
    description: "Perfect for casual dating",
    price: 30,
    currency: "INR",
    duration: 1,
    swipeLimit: 50,
    features: [
      "50 daily swipes",
      "See who likes you",
      "Priority matching",
      "No ads",
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  weekly: {
    id: "weekly",
    name: "Weekly Plan",
    displayName: "Weekly Plan",
    description: "Most popular choice for serious daters",
    price: 100,
    currency: "INR",
    duration: 7,
    swipeLimit: 100,
    features: [
      "100 daily swipes",
      "See who likes you",
      "Priority matching",
      "Profile boost",
      "Advanced filters",
      "No ads",
    ],
    active: true,
    popular: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  monthly: {
    id: "monthly",
    name: "Monthly Plan",
    displayName: "Monthly Plan",
    description: "Best value for unlimited dating",
    price: 300,
    currency: "INR",
    duration: 30,
    swipeLimit: -1, // Unlimited
    features: [
      "Unlimited daily swipes",
      "See who likes you",
      "Priority matching",
      "Daily profile boost",
      "Advanced filters",
      "Read receipts",
      "No ads",
    ],
    active: true,
    popular: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Default subscription configuration
const defaultConfig = {
  freeTrialSwipeLimit: 5,
  razorpayKeyId: "rzp_test_RppoO9N9nmGALz", // Test key
  razorpayKeySecret: "FJm3HQKomPlfTHt1xknBUCDW", // Test secret
  subscriptionEnabled: true,
  updatedAt: new Date(),
  updatedBy: "system",
};

export async function initializeSubscriptionData(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("🚀 Starting subscription data initialization...");

    // 1. Check if data already exists
    const plansRef = doc(db, "subscriptionPlans", "plans");
    const plansSnap = await getDoc(plansRef);

    if (plansSnap.exists()) {
      console.log("ℹ️ Subscription plans already exist, skipping initialization");
      return { success: true };
    }

    // 2. Create subscription plans document
    console.log("📝 Creating subscription plans...");
    await setDoc(plansRef, defaultPlans);
    console.log("✅ Subscription plans created successfully");

    // 3. Create subscription config document
    console.log("⚙️ Creating subscription configuration...");
    const configRef = doc(db, "subscriptionConfig", "default");
    await setDoc(configRef, defaultConfig);
    console.log("✅ Subscription configuration created successfully");

    // 4. Verify the data was created
    console.log("🔍 Verifying data...");
    const verifyPlansSnap = await getDoc(plansRef);
    const configSnap = await getDoc(configRef);

    if (verifyPlansSnap.exists() && configSnap.exists()) {
      console.log("✅ Data verification successful!");
      console.log("\n📊 Created Plans:");
      console.log("  - Daily Plan: ₹30 (1 day, 50 swipes)");
      console.log("  - Weekly Plan: ₹100 (7 days, 100 swipes) [POPULAR]");
      console.log("  - Monthly Plan: ₹300 (30 days, unlimited swipes)");
      console.log("\n⚙️ Configuration:");
      console.log(`  - Free trial limit: ${defaultConfig.freeTrialSwipeLimit} swipes`);
      console.log(`  - Razorpay Key ID: ${defaultConfig.razorpayKeyId}`);
      console.log(`  - Subscription enabled: ${defaultConfig.subscriptionEnabled}`);

      return { success: true };
    } else {
      throw new Error("Data verification failed");
    }
  } catch (error: any) {
    console.error("❌ Error initializing subscription data:", error);
    return {
      success: false,
      error: error.message || "Failed to initialize subscription data",
    };
  }
}

/**
 * Check if subscription data exists
 */
export async function checkSubscriptionDataExists(): Promise<boolean> {
  try {
    const plansRef = doc(db, "subscriptionPlans", "plans");
    const plansSnap = await getDoc(plansRef);
    return plansSnap.exists();
  } catch (error) {
    console.error("Error checking subscription data:", error);
    return false;
  }
}
