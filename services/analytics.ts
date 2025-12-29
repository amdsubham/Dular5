import { auth } from "@/config/firebase";
import firebaseAnalytics from "@react-native-firebase/analytics";

class AnalyticsService {
  private initialized: boolean = false;

  /**
   * Initialize Analytics with Firebase Analytics
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Enable analytics collection
      await firebaseAnalytics().setAnalyticsCollectionEnabled(true);

      this.initialized = true;
      console.log("✅ Firebase Analytics initialized successfully");

      // Try to identify user if already authenticated
      const currentUser = auth.currentUser;
      if (currentUser) {
        await this.identifyUser(currentUser.uid, {
          phone: currentUser.phoneNumber,
        });
      }
    } catch (error) {
      console.error("❌ Failed to initialize Analytics:", error);
    }
  }

  /**
   * Identify a user with their unique ID and properties
   */
  async identifyUser(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn("Analytics not initialized");
      return;
    }

    try {
      // Set user ID for Firebase Analytics
      await firebaseAnalytics().setUserId(userId);

      // Set user properties
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (value !== null && value !== undefined) {
            await firebaseAnalytics().setUserProperty(key, String(value));
          }
        }
      }

      console.log("✅ User identified:", userId, properties);
    } catch (error) {
      console.error("❌ Failed to identify user:", error);
    }
  }

  /**
   * Track a custom event
   */
  async track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn("Analytics not initialized");
      return;
    }

    try {
      // Firebase Analytics has a 40 character limit for event names
      const sanitizedEventName = eventName.substring(0, 40);

      // Sanitize properties to match Firebase Analytics requirements
      const sanitizedProperties = this.sanitizeProperties(properties);

      await firebaseAnalytics().logEvent(sanitizedEventName, sanitizedProperties);
      console.log("✅ Event tracked:", sanitizedEventName, sanitizedProperties);
    } catch (error) {
      console.error("❌ Failed to track event:", error);
    }
  }

  /**
   * Track a screen view
   */
  async trackScreen(screenName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn("Analytics not initialized");
      return;
    }

    try {
      await firebaseAnalytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
        ...this.sanitizeProperties(properties),
      });
      console.log("✅ Screen tracked:", screenName, properties);
    } catch (error) {
      console.error("❌ Failed to track screen:", error);
    }
  }

  /**
   * Update user properties
   */
  async updateUserProperties(properties: Record<string, any>) {
    if (!this.initialized) {
      console.warn("Analytics not initialized");
      return;
    }

    try {
      for (const [key, value] of Object.entries(properties)) {
        if (value !== null && value !== undefined) {
          await firebaseAnalytics().setUserProperty(key, String(value));
        }
      }
      console.log("✅ User properties updated:", properties);
    } catch (error) {
      console.error("❌ Failed to update user properties:", error);
    }
  }

  /**
   * Sanitize properties to match Firebase Analytics requirements
   */
  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Firebase Analytics parameter names must be 40 characters or fewer
      const sanitizedKey = key.substring(0, 40);

      // Convert value to appropriate type
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'string') {
        sanitized[sanitizedKey] = value.substring(0, 100); // Limit string length
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else {
        // Convert objects/arrays to JSON string
        sanitized[sanitizedKey] = JSON.stringify(value).substring(0, 100);
      }
    }

    return sanitized;
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
