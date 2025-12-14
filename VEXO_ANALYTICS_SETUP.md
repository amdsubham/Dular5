# Vexo Analytics Integration Guide

This guide explains how Vexo analytics has been integrated into the Dular dating app for comprehensive user-level tracking.

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Architecture](#architecture)
4. [Events Being Tracked](#events-being-tracked)
5. [User Properties](#user-properties)
6. [How to Use Analytics](#how-to-use-analytics)
7. [Testing](#testing)

## Overview

Vexo analytics has been integrated to track every user action and provide detailed insights into user behavior. The integration includes:

- **User-level tracking** with automatic user identification
- **Session tracking** with foreground/background detection
- **Event tracking** for all major user actions
- **Error tracking** for debugging and monitoring
- **Screen view tracking** with automatic screen detection
- **User properties** that update as users complete their profile

## Setup Instructions

### 1. Install Dependencies

The `vexo-analytics` package has already been installed. If you need to reinstall:

```bash
npm install vexo-analytics
```

### 2. Get Your Vexo API Key

1. Sign up or log in to your Vexo dashboard at [https://vexo.co](https://vexo.co)
2. Create a new project or select an existing one
3. Copy your API key from the project settings

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Vexo API key to `.env`:
   ```
   EXPO_PUBLIC_VEXO_API_KEY=your_actual_vexo_api_key_here
   ```

3. **Important**: Make sure `.env` is in your `.gitignore` file (it already is by default)

### 4. Restart the Development Server

After adding the API key, restart your Expo development server:

```bash
npm start
```

## Architecture

### Core Files

1. **`services/analytics.ts`** - Main analytics service with all tracking methods
2. **`contexts/AnalyticsContext.tsx`** - React context for analytics with session management
3. **Integration in key services**:
   - `services/auth.ts` - Login/signup tracking
   - `services/onboarding.ts` - Onboarding progress tracking
   - `app/_layout.tsx` - App-wide analytics provider

### Key Features

- **Singleton Pattern**: Single analytics instance across the app
- **Auto-initialization**: Analytics initializes on app start
- **User Identification**: Automatic user identification when auth state changes
- **Session Management**: Tracks app foreground/background events
- **Error Handling**: Graceful error handling with fallbacks

## Events Being Tracked

### Authentication Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `user_signed_up` | User completes signup | `method`, `userId`, `phoneNumber` |
| `user_logged_in` | User logs in | `method`, `userId`, `phoneNumber` |
| `user_logged_out` | User logs out | `userId` |
| `otp_sent` | OTP sent to phone | `phoneNumber`, `method` |

### Onboarding Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `onboarding_step` | User completes onboarding step | `step`, `completed`, step-specific data |
| `onboarding_completed` | User finishes onboarding | `totalSteps`, `completionTime` |
| `profile_pictures_uploaded` | User uploads profile pictures | `count` |

### Matching Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `match_action` | User likes/passes/superlikes | `action`, `targetUserId` |
| `message_sent` | User sends a message | `chatId`, `recipientId`, `messageLength` |
| `filters_applied` | User applies filters | `filterCount`, filter details |
| `search_performed` | User performs search | `query`, `resultsCount` |

### Subscription Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `subscription_viewed` | User views subscription page | `plan` |
| `subscription_started` | User starts subscription flow | `plan` |
| `subscription_completed` | Subscription successful | `plan` |
| `subscription_cancelled` | Subscription cancelled | `plan` |
| `payment_initiated` | Payment flow started | `amount`, `plan`, `currency` |
| `payment_success` | Payment successful | `amount`, `plan`, `currency` |
| `payment_failed` | Payment failed | `amount`, `plan`, `currency` |

### App Events

| Event Name | Description | Properties |
|------------|-------------|------------|
| `session_started` | App opened/brought to foreground | `timestamp` |
| `session_ended` | App closed/sent to background | `duration` (seconds) |
| `feature_used` | User uses a specific feature | `featureName`, custom properties |
| `app_error` | App encounters an error | `errorMessage`, `errorStack`, `context` |

## User Properties

User properties are automatically updated throughout the user journey:

### Profile Properties
- `firstName` / `lastName`
- `dateOfBirth`
- `gender`
- `interestedIn` (array)
- `lookingFor` (array)
- `interests` (array)
- `hasLocation` (boolean)
- `phoneNumber`

### Platform Properties (auto-tracked)
- `platform` - Always "mobile"
- `app` - Always "Dular"

## How to Use Analytics

### 1. Using the Analytics Service Directly

```typescript
import { analytics } from '@/services/analytics';

// Track a custom event
await analytics.track('button_clicked', {
  buttonName: 'Like Button',
  screen: 'Home',
});

// Update user properties
await analytics.updateUserProperties({
  premiumUser: true,
  subscriptionTier: 'Gold',
});

// Track a specific action
await analytics.trackMatchAction('like', targetUserId);
await analytics.trackMessageSent(chatId, recipientId, messageLength);
await analytics.trackPayment('success', 999, 'Premium Monthly');
```

### 2. Using the Analytics Context

```typescript
import { useAnalytics, useScreenTracking } from '@/contexts/AnalyticsContext';

function MyComponent() {
  const { trackEvent, isInitialized } = useAnalytics();

  // Automatically track screen view
  useScreenTracking('Profile Screen', {
    userId: currentUserId,
  });

  // Track button click
  const handleButtonClick = async () => {
    await trackEvent('button_clicked', {
      buttonName: 'Save Profile',
    });
  };

  return <Button onPress={handleButtonClick}>Save</Button>;
}
```

### 3. Pre-built Tracking Methods

The analytics service includes many pre-built methods for common actions:

```typescript
// Match actions
analytics.trackMatchAction('like', userId);
analytics.trackMatchAction('pass', userId);
analytics.trackMatchAction('superlike', userId);

// Messaging
analytics.trackMessageSent(chatId, recipientId, messageLength);

// Subscriptions
analytics.trackSubscription('viewed', 'Premium');
analytics.trackPayment('success', 999, 'Premium Monthly');

// Filters
analytics.trackFilterUsage({
  ageMin: 21,
  ageMax: 30,
  distance: 50,
});

// Search
analytics.trackSearch('coffee lover', 25);

// Errors
analytics.trackError(error, {
  screen: 'Home',
  action: 'load_matches',
});

// Features
analytics.trackFeatureUsage('Video Chat', {
  duration: 180,
});
```

## Testing

### 1. Enable Debug Mode

Debug mode is automatically enabled in development (`__DEV__`). Check your console logs for analytics events:

```
✓ Vexo Analytics initialized successfully
✓ User identified: xyz123
✓ Event tracked: user_logged_in { method: 'phone', ... }
✓ Screen tracked: Home Screen
```

### 2. Verify Events in Vexo Dashboard

1. Log in to your Vexo dashboard
2. Go to the "Events" or "Live" tab
3. Perform actions in your app
4. Verify events appear in real-time (may take a few seconds)

### 3. Test User Properties

1. Complete onboarding in your app
2. Check the "Users" tab in Vexo dashboard
3. Find your user and verify all properties are set correctly

### 4. Test Session Tracking

1. Open the app
2. Check for `session_started` event
3. Background the app
4. Check for `session_ended` event with duration

### 5. Common Issues

**Analytics not initializing:**
- Check that your API key is correct in `.env`
- Ensure the `.env` file is in the root directory
- Restart the Expo development server

**Events not appearing:**
- Check console for error messages
- Verify Vexo API key is valid
- Check network connectivity
- Events may take 5-10 seconds to appear in dashboard

**User not identified:**
- Ensure user is logged in
- Check that `auth.currentUser` exists
- Verify Firebase authentication is working

## Adding New Events

To track new events in your app:

### Option 1: Add to Analytics Service

Add a new method to `services/analytics.ts`:

```typescript
async trackCustomAction(actionName: string, details: Record<string, any>) {
  await this.track('custom_action', {
    actionName,
    ...details,
  });
}
```

### Option 2: Use Generic Track Method

Use the generic `track` method anywhere:

```typescript
import { analytics } from '@/services/analytics';

await analytics.track('custom_event_name', {
  property1: 'value1',
  property2: 'value2',
});
```

## Best Practices

1. **Be Descriptive**: Use clear, descriptive event names
2. **Include Context**: Add relevant properties to events
3. **Avoid PII**: Don't track sensitive personal information
4. **Test Locally**: Always test new events in development first
5. **Monitor Usage**: Regularly check your Vexo dashboard
6. **Error Tracking**: Always track errors with context
7. **User Properties**: Keep user properties up-to-date

## Support

For issues or questions:
- **Vexo Documentation**: [https://docs.vexo.co](https://docs.vexo.co)
- **Vexo Support**: support@vexo.co
- **App Issues**: Check `services/analytics.ts` code

## Summary

With this integration, you now have comprehensive user-level tracking across your entire app. Every significant user action is tracked, from signup to matches to payments. Use the Vexo dashboard to gain insights into user behavior and improve your app!
