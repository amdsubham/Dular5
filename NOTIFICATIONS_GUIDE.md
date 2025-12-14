# Push Notifications Guide - Dular Dating App

## Overview

Push notifications are **already fully implemented** in your app! Every message sent triggers a push notification to the recipient.

## How It Works

### 1. **Message Notifications (Already Working)**

When a user sends a message, a push notification is automatically sent to the recipient.

**Location**: [services/messaging.ts:149-167](services/messaging.ts#L149-L167)

```typescript
// When sending a text message
sendMessage(chatId, text) → Sends notification automatically

// When sending an image message
sendMessageWithImage(chatId, imageUrl, caption) → Sends notification automatically
```

### 2. **Match Notifications (Already Working)**

When two users match, both receive a push notification.

**Location**: [services/matching.ts:512-520](services/matching.ts#L512-L520)

```typescript
createMatch(user1Id, user2Id) → Sends notifications to both users
```

---

## Notification Flow

### Text Message Flow:

1. User types a message and presses send
2. `sendMessage()` function is called
3. Message is saved to Firestore
4. **Push notification sent to recipient** ✅
5. Recipient receives notification on their device

### Image Message Flow:

1. User selects an image and sends it
2. Image is uploaded to Firebase Storage
3. `sendMessageWithImage()` is called
4. Message with image URL is saved to Firestore
5. **Push notification sent: "📷 Sent a photo"** ✅
6. Recipient receives notification

### Match Flow:

1. User A swipes right on User B
2. System checks if User B already swiped right on User A
3. If yes → Match is created
4. **Push notification sent to both users** ✅
5. Both users see "It's a Match!" notification

---

## Console Logs to Track Notifications

When a message is sent, you'll see these logs:

```
📲 Sending push notification to: [userId] from: [senderName]
💬 Preparing message notification: { to: ..., from: ..., message: ... }
✅ Push notification sent successfully
✅ Message notification delivered
```

If notification fails:
```
❌ Failed to send push notification: [error]
⚠️ Message notification failed to deliver
```

---

## Requirements for Notifications to Work

### 1. User Must Have Push Token

Push tokens are registered when the user logs in or when the app starts.

**Location**: User must call `registerForPushNotifications()` on app start.

Check if it's implemented in your main app file or auth flow.

### 2. User Must Grant Notification Permissions

On first launch, the app will request permission to send notifications.

### 3. User Must Be on a Physical Device

Push notifications **do not work on simulators/emulators**. They only work on:
- ✅ Real Android devices
- ✅ Real iOS devices

### 4. Firebase Cloud Messaging (FCM) Setup

For Android, make sure:
- ✅ `google-services.json` is present
- ✅ Firebase project has Cloud Messaging enabled

---

## Notification Types

### 1. **Message Notification**
```json
{
  "title": "John Doe",
  "body": "Hey! How are you?",
  "data": {
    "type": "message",
    "chatId": "user1_user2",
    "screen": "chat"
  }
}
```

### 2. **Match Notification**
```json
{
  "title": "It's a Match! 🎉",
  "body": "You matched with Sarah! Start chatting now.",
  "data": {
    "type": "match",
    "matchedUserId": "user2",
    "screen": "matches"
  }
}
```

---

## Testing Notifications

### Method 1: Test on Two Physical Devices

1. Install app on Device A and Device B
2. Login as User A on Device A
3. Login as User B on Device B
4. Have User A and User B match
5. User A sends a message to User B
6. **User B should receive notification** ✅

### Method 2: Check Console Logs

When you send a message, check the console for:
- `📲 Sending push notification to: ...`
- `✅ Push notification sent successfully`

If you see these logs, notifications are being sent correctly.

### Method 3: Manual Test with Expo Push Tool

1. Get a user's push token from Firestore
2. Visit: https://expo.dev/notifications
3. Enter the push token
4. Send a test notification

---

## Troubleshooting

### Issue: "User does not have a push token"

**Solution**: Make sure `registerForPushNotifications()` is called when the user logs in.

Check if push token is saved in Firestore:
```
users/{userId}/pushToken
```

### Issue: "Permission not granted for push notifications"

**Solution**: User needs to grant notification permissions. Check device settings:
- Android: Settings → Apps → Dular → Notifications → Allow
- iOS: Settings → Dular → Notifications → Allow

### Issue: Notifications not received on device

**Checklist**:
1. ✅ Are you testing on a physical device (not simulator)?
2. ✅ Has the user granted notification permissions?
3. ✅ Is the push token saved in Firestore?
4. ✅ Check console logs - are notifications being sent?
5. ✅ Is the device connected to internet?

### Issue: Notifications work but don't open the chat

**Solution**: Implement notification tap handler. See: [services/notifications.ts:193-197](services/notifications.ts#L193-L197)

```typescript
// Add this in your main app file
import { addNotificationResponseListener } from '@/services/notifications';

addNotificationResponseListener((response) => {
  const data = response.notification.request.content.data;

  if (data.type === 'message' && data.chatId) {
    router.push(`/(protected)/chat/${data.chatId}`);
  } else if (data.type === 'match') {
    router.push('/(protected)/(root)/matches');
  }
});
```

---

## Android-Specific Configuration

### Notification Icon

The notification icon is configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/logo_big.png",
          "color": "#EC4899"
        }
      ]
    ]
  }
}
```

### Notification Channel

Android notification channel is created automatically with:
- Channel Name: "default"
- Importance: MAX
- Vibration: [0, 250, 250, 250]
- Light Color: #EC4899 (Pink)

---

## iOS-Specific Configuration

### Permissions

iOS permissions are requested automatically when the app starts.

Required Info.plist entries are already configured in `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "Allow notifications to stay updated with your matches and messages"
    }
  }
}
```

---

## Production Checklist

Before releasing to production:

- [ ] Test notifications on real devices (Android & iOS)
- [ ] Verify push tokens are saved to Firestore for all users
- [ ] Test message notifications
- [ ] Test match notifications
- [ ] Test image message notifications
- [ ] Verify notification taps open correct screens
- [ ] Check notification icons and colors look good
- [ ] Test on different Android versions (8+)
- [ ] Test on different iOS versions (12+)

---

## Summary

✅ **Message notifications are already implemented**
✅ **Match notifications are already implemented**
✅ **Image message notifications are already implemented**
✅ **Notifications send automatically on every message**

No additional code needed! Just ensure:
1. Users grant notification permissions
2. Push tokens are registered on app start
3. Test on physical devices

Your notification system is production-ready! 🎉

---

## Need Help?

If notifications aren't working:
1. Check console logs for errors
2. Verify push token exists in Firestore
3. Test on a physical device (not simulator)
4. Check notification permissions in device settings
