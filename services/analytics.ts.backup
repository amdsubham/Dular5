// import Vexo from 'vexo-analytics';
import { auth } from "@/config/firebase";

// Initialize Vexo Analytics
// IMPORTANT: Configure your Vexo API key in the .env file
// See VEXO_QUICK_START.md for setup instructions
// Get your API key from https://vexo.co dashboard
// const VEXO_API_KEY =
//   process.env.EXPO_PUBLIC_VEXO_API_KEY || "YOUR_VEXO_API_KEY";

// if (!process.env.EXPO_PUBLIC_VEXO_API_KEY && __DEV__) {
//   console.warn(
//     "⚠️ Vexo API key not configured! Add EXPO_PUBLIC_VEXO_API_KEY to .env file"
//   );
//   console.warn("📖 See VEXO_QUICK_START.md for setup instructions");
// }

class AnalyticsService {
  private initialized: boolean = false;
  private vexo: any = null;

  /**
   * Initialize Vexo Analytics
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // VEXO COMMENTED OUT - Uncomment to re-enable
    // try {
    //   this.vexo = new Vexo({
    //     apiKey: VEXO_API_KEY,
    //     debug: __DEV__, // Enable debug mode in development
    //     autoTrack: true, // Automatically track screen views
    //   });

    //   this.initialized = true;
    //   console.log("Vexo Analytics initialized successfully");

    //   // Try to identify user if already authenticated
    //   const currentUser = auth.currentUser;
    //   if (currentUser) {
    //     await this.identifyUser(currentUser.uid, {
    //       phone: currentUser.phoneNumber,
    //     });
    //   }
    // } catch (error) {
    //   console.error("Failed to initialize Analytics:", error);
    // }

    this.initialized = true;
    console.log("Analytics service initialized (Vexo disabled)");
  }

  /**
   * Identify a user with their unique ID and properties
   */
  async identifyUser(userId: string, properties?: Record<string, any>) {
    // VEXO COMMENTED OUT
    // if (!this.vexo) {
    //   console.warn("Vexo not initialized");
    //   return;
    // }

    // try {
    //   await this.vexo.identify(userId, {
    //     ...properties,
    //     platform: "mobile",
    //     app: "Dular",
    //   });

    //   console.log("User identified:", userId);
    // } catch (error) {
    //   console.error("Failed to identify user:", error);
    // }

    console.log("Analytics: User identified (Vexo disabled):", userId);
  }

  /**
   * Track a custom event
   */
  async track(eventName: string, properties?: Record<string, any>) {
    // VEXO COMMENTED OUT
    // if (!this.vexo) {
    //   console.warn("Vexo not initialized, queuing event");
    //   return;
    // }

    // try {
    //   await this.vexo.track(eventName, {
    //     ...properties,
    //     timestamp: new Date().toISOString(),
    //   });

    //   console.log("Event tracked:", eventName, properties);
    // } catch (error) {
    //   console.error("Failed to track event:", error);
    // }

    console.log("Analytics: Event tracked (Vexo disabled):", eventName, properties);
  }

  /**
   * Track a screen view
   */
  async trackScreen(screenName: string, properties?: Record<string, any>) {
    // VEXO COMMENTED OUT
    // if (!this.vexo) {
    //   console.warn("Vexo not initialized");
    //   return;
    // }

    // try {
    //   await this.vexo.screen(screenName, {
    //     ...properties,
    //     timestamp: new Date().toISOString(),
    //   });

    //   console.log("Screen tracked:", screenName);
    // } catch (error) {
    //   console.error("Failed to track screen:", error);
    // }

    console.log("Analytics: Screen tracked (Vexo disabled):", screenName);
  }

  /**
   * Update user properties
   */
  async updateUserProperties(properties: Record<string, any>) {
    // VEXO COMMENTED OUT
    // if (!this.vexo) {
    //   console.warn("Vexo not initialized");
    //   return;
    // }

    // try {
    //   await this.vexo.updateUserProperties(properties);
    //   console.log("User properties updated:", properties);
    // } catch (error) {
    //   console.error("Failed to update user properties:", error);
    // }

    console.log("Analytics: User properties updated (Vexo disabled):", properties);
  }

  /**
   * Track user signup
   */
  async trackSignup(
    method: string,
    userId: string,
    properties?: Record<string, any>
  ) {
    await this.track("user_signed_up", {
      method,
      userId,
      ...properties,
    });
  }

  /**
   * Track user login
   */
  async trackLogin(
    method: string,
    userId: string,
    properties?: Record<string, any>
  ) {
    await this.track("user_logged_in", {
      method,
      userId,
      ...properties,
    });
  }

  /**
   * Track user logout
   */
  async trackLogout(userId: string) {
    await this.track("user_logged_out", {
      userId,
    });

    // Clear user identification
    if (this.vexo) {
      await this.vexo.reset();
    }
  }

  /**
   * Track profile update
   */
  async trackProfileUpdate(updates: Record<string, any>) {
    await this.track("profile_updated", {
      fields: Object.keys(updates),
      ...updates,
    });
  }

  /**
   * Track match action (like, pass, super like)
   */
  async trackMatchAction(
    action: "like" | "pass" | "superlike",
    targetUserId: string
  ) {
    await this.track("match_action", {
      action,
      targetUserId,
    });
  }

  /**
   * Track message sent
   */
  async trackMessageSent(
    chatId: string,
    recipientId: string,
    messageLength: number
  ) {
    await this.track("message_sent", {
      chatId,
      recipientId,
      messageLength,
    });
  }

  /**
   * Track subscription event
   */
  async trackSubscription(
    action: "viewed" | "started" | "completed" | "cancelled",
    plan?: string
  ) {
    await this.track("subscription_" + action, {
      plan,
    });
  }

  /**
   * Track payment event
   */
  async trackPayment(
    status: "initiated" | "success" | "failed",
    amount: number,
    plan: string
  ) {
    await this.track("payment_" + status, {
      amount,
      plan,
      currency: "INR",
    });
  }

  /**
   * Track filter usage
   */
  async trackFilterUsage(filters: Record<string, any>) {
    await this.track("filters_applied", {
      filterCount: Object.keys(filters).length,
      ...filters,
    });
  }

  /**
   * Track search
   */
  async trackSearch(query: string, resultsCount: number) {
    await this.track("search_performed", {
      query,
      resultsCount,
    });
  }

  /**
   * Track app error
   */
  async trackError(error: Error, context?: Record<string, any>) {
    await this.track("app_error", {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  }

  /**
   * Track session start
   */
  async trackSessionStart() {
    await this.track("session_started", {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track session end
   */
  async trackSessionEnd(duration: number) {
    await this.track("session_ended", {
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track onboarding step completion
   */
  async trackOnboardingStep(
    step: string,
    completed: boolean,
    data?: Record<string, any>
  ) {
    await this.track("onboarding_step", {
      step,
      completed,
      ...data,
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    featureName: string,
    properties?: Record<string, any>
  ) {
    await this.track("feature_used", {
      featureName,
      ...properties,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export default
export default analytics;
