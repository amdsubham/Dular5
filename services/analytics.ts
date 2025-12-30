import { auth } from "@/config/firebase";
import { Platform } from "react-native";

// Try to import Firebase Analytics, but handle gracefully if it's not available
let firebaseAnalytics: any = null;
try {
  firebaseAnalytics = require("@react-native-firebase/analytics").default;
} catch (error) {
  console.warn("⚠️  Firebase Analytics module not available - analytics will be disabled");
  console.warn("   This is normal in development mode with 'yarn start'");
  console.warn("   To enable analytics, build the app with 'npx expo run:android' or 'npx expo run:ios'");
}

class AnalyticsService {
  private initialized: boolean = false;
  private screenTrackingCache: Map<string, number> = new Map();
  private analyticsAvailable: boolean = firebaseAnalytics !== null;

  // Throttle screen views to once per 30 seconds per screen
  private SCREEN_THROTTLE_MS = 30 * 1000;

  /**
   * Initialize Analytics
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    if (!this.analyticsAvailable) {
      console.log("ℹ️  Analytics not available - running in mock mode");
      this.initialized = true;
      return;
    }

    try {
      // React Native Firebase Analytics works on both iOS and Android
      // Analytics collection is automatically enabled
      await firebaseAnalytics().setAnalyticsCollectionEnabled(true);

      this.initialized = true;
      console.log("✅ Firebase Analytics initialized successfully (React Native)");
      console.log(`   Platform: ${Platform.OS}`);

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
    if (!this.initialized || !this.analyticsAvailable) {
      return;
    }

    try {
      // Set user ID
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
    if (!this.initialized || !this.analyticsAvailable) {
      return;
    }

    try {
      // Firebase Analytics requires snake_case event names
      const formattedEventName = eventName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

      // Log event with properties
      await firebaseAnalytics().logEvent(formattedEventName, properties || {});

      console.log("✅ Event tracked:", formattedEventName, properties);
    } catch (error) {
      console.error("❌ Failed to track event:", error);
    }
  }

  /**
   * Track a screen view with throttling to reduce excessive events
   */
  async trackScreen(screenName: string, properties?: Record<string, any>) {
    if (!this.initialized || !this.analyticsAvailable) {
      return;
    }

    try {
      // Throttle screen views to once per 30 seconds per screen
      const now = Date.now();
      const lastTracked = this.screenTrackingCache.get(screenName) || 0;
      const timeSinceLastTrack = now - lastTracked;

      if (timeSinceLastTrack < this.SCREEN_THROTTLE_MS && lastTracked > 0) {
        console.log(`⏭️  Screen view skipped - throttled: ${screenName} (${Math.floor(timeSinceLastTrack / 1000)}s since last track)`);
        return;
      }

      // Update cache
      this.screenTrackingCache.set(screenName, now);

      // Firebase Analytics special screen_view event
      await firebaseAnalytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
        ...properties,
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
    if (!this.initialized || !this.analyticsAvailable) {
      return;
    }

    try {
      // Set each property individually
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

  // ============================================================================
  // SWIPE EVENTS - Core engagement tracking
  // ============================================================================

  /**
   * Track card swipe right (like)
   */
  async trackSwipeRight(
    profileId: string,
    position: number,
    properties?: Record<string, any>
  ) {
    await this.track("swipe_card_right", {
      profile_id: profileId,
      card_position: position,
      ...properties,
    });
  }

  /**
   * Track card swipe left (pass)
   */
  async trackSwipeLeft(
    profileId: string,
    position: number,
    properties?: Record<string, any>
  ) {
    await this.track("swipe_card_left", {
      profile_id: profileId,
      card_position: position,
      ...properties,
    });
  }

  /**
   * Track card view
   */
  async trackCardViewed(
    profileId: string,
    position: number,
    viewDuration: number,
    properties?: Record<string, any>
  ) {
    await this.track("card_viewed", {
      profile_id: profileId,
      card_position: position,
      view_duration: viewDuration,
      ...properties,
    });
  }

  /**
   * Track profile expand
   */
  async trackProfileExpanded(
    profileId: string,
    properties?: Record<string, any>
  ) {
    await this.track("profile_expanded", {
      profile_id: profileId,
      ...properties,
    });
  }

  /**
   * Track swipe limit reached
   */
  async trackSwipeLimitReached(
    swipesUsed: number,
    plan: string,
    properties?: Record<string, any>
  ) {
    await this.track("swipe_limit_reached", {
      swipes_used: swipesUsed,
      current_plan: plan,
      ...properties,
    });
  }

  /**
   * Track swipe session completed
   */
  async trackSwipeSessionCompleted(
    swipeCount: number,
    likeCount: number,
    passCount: number,
    duration: number
  ) {
    await this.track("swipe_session_completed", {
      swipe_count: swipeCount,
      like_count: likeCount,
      pass_count: passCount,
      session_duration: duration,
    });
  }

  // ============================================================================
  // MATCH EVENTS - Connection tracking
  // ============================================================================

  /**
   * Track match created
   */
  async trackMatchCreated(
    matchId: string,
    matchedUserId: string,
    properties?: Record<string, any>
  ) {
    await this.track("match_created", {
      match_id: matchId,
      matched_user_id: matchedUserId,
      ...properties,
    });
  }

  /**
   * Track match profile viewed
   */
  async trackMatchProfileViewed(
    matchId: string,
    matchedUserId: string,
    properties?: Record<string, any>
  ) {
    await this.track("match_profile_viewed", {
      match_id: matchId,
      matched_user_id: matchedUserId,
      ...properties,
    });
  }

  /**
   * Track match unmatched
   */
  async trackMatchUnmatched(
    matchId: string,
    matchedUserId: string,
    reason?: string,
    properties?: Record<string, any>
  ) {
    await this.track("match_unmatched", {
      match_id: matchId,
      matched_user_id: matchedUserId,
      reason,
      ...properties,
    });
  }

  /**
   * Track match list viewed
   */
  async trackMatchListViewed(
    matchCount: number,
    properties?: Record<string, any>
  ) {
    await this.track("match_list_viewed", {
      match_count: matchCount,
      ...properties,
    });
  }

  // ============================================================================
  // MESSAGING EVENTS - Communication tracking
  // ============================================================================

  /**
   * Track chat opened
   */
  async trackChatOpened(
    chatId: string,
    matchedUserId: string,
    isFirstMessage: boolean,
    properties?: Record<string, any>
  ) {
    await this.track("chat_opened", {
      chat_id: chatId,
      matched_user_id: matchedUserId,
      is_first_message: isFirstMessage,
      ...properties,
    });
  }

  /**
   * Track message sent (override previous implementation)
   */
  async trackMessageSent(
    chatId: string,
    recipientId: string,
    messageLength: number,
    messageType?: string,
    properties?: Record<string, any>
  ) {
    await this.track("message_sent", {
      chat_id: chatId,
      recipient_id: recipientId,
      message_length: messageLength,
      message_type: messageType || "text",
      ...properties,
    });
  }

  /**
   * Track message received
   */
  async trackMessageReceived(
    chatId: string,
    senderId: string,
    messageLength: number,
    properties?: Record<string, any>
  ) {
    await this.track("message_received", {
      chat_id: chatId,
      sender_id: senderId,
      message_length: messageLength,
      ...properties,
    });
  }

  /**
   * Track chat list viewed
   */
  async trackChatListViewed(
    chatCount: number,
    unreadCount: number,
    properties?: Record<string, any>
  ) {
    await this.track("chat_list_viewed", {
      chat_count: chatCount,
      unread_count: unreadCount,
      ...properties,
    });
  }

  // ============================================================================
  // ONBOARDING EVENTS - User journey tracking
  // ============================================================================

  /**
   * Track onboarding started
   */
  async trackOnboardingStarted(properties?: Record<string, any>) {
    await this.track("onboarding_started", properties || {});
  }

  /**
   * Track onboarding completed
   */
  async trackOnboardingCompleted(
    duration: number,
    properties?: Record<string, any>
  ) {
    await this.track("onboarding_completed", {
      completion_duration: duration,
      ...properties,
    });
  }

  /**
   * Track phone number entered
   */
  async trackPhoneNumberEntered(
    countryCode: string,
    properties?: Record<string, any>
  ) {
    await this.track("phone_number_entered", {
      country_code: countryCode,
      ...properties,
    });
  }

  /**
   * Track OTP verified
   */
  async trackOtpVerified(properties?: Record<string, any>) {
    await this.track("otp_verified", properties || {});
  }

  /**
   * Track basic info entered
   */
  async trackBasicInfoEntered(
    firstName: string,
    lastName: string,
    dob: string,
    gender: string,
    properties?: Record<string, any>
  ) {
    await this.track("basic_info_entered", {
      first_name_length: firstName.length,
      last_name_length: lastName.length,
      age: new Date().getFullYear() - new Date(dob).getFullYear(),
      gender,
      ...properties,
    });
  }

  /**
   * Track interests selected
   */
  async trackInterestsSelected(
    interests: string[],
    properties?: Record<string, any>
  ) {
    await this.track("interests_selected", {
      interest_count: interests.length,
      interests: interests.join(","),
      ...properties,
    });
  }

  /**
   * Track photos uploaded
   */
  async trackPhotosUploaded(
    photoCount: number,
    properties?: Record<string, any>
  ) {
    await this.track("photos_uploaded", {
      photo_count: photoCount,
      ...properties,
    });
  }

  /**
   * Track looking for selected
   */
  async trackLookingForSelected(
    lookingFor: string[],
    properties?: Record<string, any>
  ) {
    await this.track("looking_for_selected", {
      looking_for_count: lookingFor.length,
      looking_for: lookingFor.join(","),
      ...properties,
    });
  }

  /**
   * Track interested in selected
   */
  async trackInterestedInSelected(
    interestedIn: string[],
    properties?: Record<string, any>
  ) {
    await this.track("interested_in_selected", {
      interested_in_count: interestedIn.length,
      interested_in: interestedIn.join(","),
      ...properties,
    });
  }

  // ============================================================================
  // SUBSCRIPTION EVENTS - Enhanced monetization tracking
  // ============================================================================

  /**
   * Track subscription plan viewed
   */
  async trackSubscriptionPlanViewed(
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, any>
  ) {
    await this.track("subscription_plan_viewed", {
      plan_id: planId,
      plan_name: planName,
      price,
      currency: "INR",
      ...properties,
    });
  }

  /**
   * Track subscription plan selected
   */
  async trackSubscriptionPlanSelected(
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, any>
  ) {
    await this.track("subscription_plan_selected", {
      plan_id: planId,
      plan_name: planName,
      price,
      currency: "INR",
      ...properties,
    });
  }

  /**
   * Track subscription purchase initiated
   */
  async trackSubscriptionPurchaseInitiated(
    planId: string,
    price: number,
    properties?: Record<string, any>
  ) {
    await this.track("subscription_purchase_initiated", {
      plan_id: planId,
      price,
      currency: "INR",
      ...properties,
    });
  }

  /**
   * Track subscription purchase completed
   */
  async trackSubscriptionPurchaseCompleted(
    planId: string,
    price: number,
    transactionId: string,
    properties?: Record<string, any>
  ) {
    await this.track("subscription_purchase_completed", {
      plan_id: planId,
      price,
      transaction_id: transactionId,
      currency: "INR",
      ...properties,
    });
  }

  /**
   * Track subscription cancelled
   */
  async trackSubscriptionCancelled(
    planId: string,
    reason?: string,
    properties?: Record<string, any>
  ) {
    await this.track("subscription_cancelled", {
      plan_id: planId,
      cancellation_reason: reason,
      ...properties,
    });
  }

  // ============================================================================
  // FILTER EVENTS - Discovery customization tracking
  // ============================================================================

  /**
   * Track filters opened
   */
  async trackFiltersOpened(
    currentFilters: Record<string, any>,
    properties?: Record<string, any>
  ) {
    await this.track("filters_opened", {
      active_filter_count: Object.keys(currentFilters).length,
      ...properties,
    });
  }

  /**
   * Track filter changed
   */
  async trackFilterChanged(
    filterType: string,
    filterValue: any,
    properties?: Record<string, any>
  ) {
    await this.track("filter_changed", {
      filter_type: filterType,
      filter_value: String(filterValue),
      ...properties,
    });
  }

  /**
   * Track filters applied (enhanced version)
   */
  async trackFiltersApplied(
    filters: Record<string, any>,
    resultCount?: number,
    properties?: Record<string, any>
  ) {
    await this.track("filters_applied", {
      filter_count: Object.keys(filters).length,
      result_count: resultCount,
      ...filters,
      ...properties,
    });
  }

  /**
   * Track filters reset
   */
  async trackFiltersReset(properties?: Record<string, any>) {
    await this.track("filters_reset", properties || {});
  }

  // ============================================================================
  // NOTIFICATION EVENTS - Engagement tracking
  // ============================================================================

  /**
   * Track notification received
   */
  async trackNotificationReceived(
    notificationType: string,
    properties?: Record<string, any>
  ) {
    await this.track("notification_received", {
      notification_type: notificationType,
      ...properties,
    });
  }

  /**
   * Track notification opened
   */
  async trackNotificationOpened(
    notificationType: string,
    properties?: Record<string, any>
  ) {
    await this.track("notification_opened", {
      notification_type: notificationType,
      ...properties,
    });
  }

  /**
   * Track notification permission requested
   */
  async trackNotificationPermissionRequested(properties?: Record<string, any>) {
    await this.track("notification_permission_requested", properties || {});
  }

  /**
   * Track notification permission granted
   */
  async trackNotificationPermissionGranted(properties?: Record<string, any>) {
    await this.track("notification_permission_granted", properties || {});
  }

  /**
   * Track notification permission denied
   */
  async trackNotificationPermissionDenied(properties?: Record<string, any>) {
    await this.track("notification_permission_denied", properties || {});
  }

  // ============================================================================
  // SAFETY EVENTS - Trust & safety tracking
  // ============================================================================

  /**
   * Track user reported
   */
  async trackUserReported(
    reportedUserId: string,
    reason: string,
    properties?: Record<string, any>
  ) {
    await this.track("user_reported", {
      reported_user_id: reportedUserId,
      report_reason: reason,
      ...properties,
    });
  }

  /**
   * Track user blocked
   */
  async trackUserBlocked(
    blockedUserId: string,
    properties?: Record<string, any>
  ) {
    await this.track("user_blocked", {
      blocked_user_id: blockedUserId,
      ...properties,
    });
  }

  /**
   * Track user unblocked
   */
  async trackUserUnblocked(
    unblockedUserId: string,
    properties?: Record<string, any>
  ) {
    await this.track("user_unblocked", {
      unblocked_user_id: unblockedUserId,
      ...properties,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export default
export default analytics;
