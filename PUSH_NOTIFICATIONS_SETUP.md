# Push Notifications Setup Guide

## Problem Identified

Your push notification system was **incomplete**. The admin panel was creating notification requests in Firestore, but there were **no Cloud Functions deployed** to process them and actually send the notifications.

## What Has Been Fixed

### 1. Created Firebase Cloud Functions
- Created `/functions` directory with complete Cloud Function code
- Function automatically triggers when admin creates a notification request
- Processes both "Send to All" and "Send to Selected Users" scenarios
- Sends notifications using Expo Push Notification API
- Updates notification status (pending → sent/failed)
- Includes automatic cleanup of old notifications (runs daily at 2 AM UTC)

### 2. Fixed Token Field Consistency
- Cloud Function now looks for `pushToken` field (matches mobile app)
- Mobile app already saves tokens correctly

### 3. Added Firebase Configuration
- Created `firebase.json` for Firebase CLI
- Created `.firebaserc` with project ID

---

## Deployment Steps (REQUIRED)

Follow these steps exactly to get push notifications working:

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser. Login with the Google account that has access to your Firebase project.

### Step 3: Verify Project Connection

```bash
cd /Users/subhamroutray/Downloads/Dular5.0
firebase projects:list
```

Make sure you see "dular5" in the list.

### Step 4: Install Cloud Functions Dependencies

```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - For Firebase Admin SDK (server-side)
- `firebase-functions` - For Cloud Functions
- TypeScript and linting tools

### Step 5: Build the Functions

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `lib/` folder.

### Step 6: Deploy the Functions

```bash
cd ..  # Back to project root
firebase deploy --only functions
```

You should see output like:
```
✔  functions[sendPushNotifications(us-central1)] Successful create operation.
✔  functions[cleanupOldNotifications(us-central1)] Successful create operation.
```

**Important**: The first deployment may take 2-3 minutes.

### Step 7: Verify Deployment

```bash
firebase functions:list
```

You should see:
- `sendPushNotifications` - Firestore trigger function
- `cleanupOldNotifications` - Scheduled cleanup function

---

## Testing the Notification System

### Test 1: Send to a Single User

1. Go to admin panel: http://localhost:3000/dashboard/notifications
2. Fill in title: "Test Notification"
3. Fill in message: "This is a test"
4. Select "Send to Selected Users"
5. Check one user from the list
6. Click "Send Notification"
7. Check the mobile app - notification should appear!

### Test 2: Send to All Users

1. Fill in title and message
2. Select "Send to All Users"
3. Click "Send Notification"
4. All users with valid push tokens should receive it

### Check Cloud Function Logs

To see what's happening in the Cloud Function:

```bash
firebase functions:log --limit 50
```

You should see logs like:
```
Processing notification request: abc123...
Fetching tokens for 5 specific users...
Found 4 valid tokens out of 5 requested users
Sending notifications to 4 devices...
Notification sending complete: 4 succeeded, 0 failed
```

---

## How It Works Now

### Complete Flow:

```
1. Admin Panel
   ↓
   Admin fills notification form
   ↓
   Clicks "Send Notification"
   ↓
   Document created in Firestore collection: notification_requests
   Status: 'pending'

2. Cloud Function (NEW!)
   ↓
   Firestore trigger detects new document
   ↓
   sendPushNotifications() function runs
   ↓
   Reads userIds or sendToAll flag
   ↓
   Fetches push tokens from users collection
   ↓
   Sends to Expo Push API (https://exp.host/--/api/v2/push/send)
   ↓
   Updates document status: 'sent' or 'failed'
   ↓
   Records successCount and failureCount

3. Mobile Devices
   ↓
   Expo Push Service delivers notification
   ↓
   User sees notification!
```

---

## Database Structure

### Users Collection

Each user document should have:
```javascript
{
  uid: "user123",
  firstName: "John",
  lastName: "Doe",
  pushToken: "ExponentPushToken[xxxxxxxxxxxxxx]",  // Required for notifications
  pushTokenUpdatedAt: Timestamp,
  // ... other fields
}
```

### Notification Requests Collection

When admin sends notification:
```javascript
{
  notification: {
    title: "Welcome!",
    body: "Thanks for joining us",
    data: { /* optional custom data */ }
  },
  userIds: ["user1", "user2"],  // Empty if sendToAll is true
  sendToAll: false,
  status: "pending",  // Changes to "sent" or "failed"
  createdAt: Timestamp,
  sentAt: Timestamp,  // Added when processed
  successCount: 45,   // Added when processed
  failureCount: 2     // Added when processed
}
```

---

## Troubleshooting

### Issue: "No valid push tokens found"

**Cause**: Users don't have push tokens saved

**Fix**: Make sure users have opened the mobile app at least once. The app should call `registerForPushNotifications()` on startup.

**Check in Firestore Console**:
1. Go to Firebase Console → Firestore Database
2. Open `users` collection
3. Check if users have `pushToken` field
4. Token should look like: `ExponentPushToken[xxxxxxxxxxxxxx]`

### Issue: Notifications stuck in "pending" status

**Cause**: Cloud Function not deployed or not triggering

**Check**:
```bash
firebase functions:list
```

If you don't see `sendPushNotifications`, redeploy:
```bash
firebase deploy --only functions
```

### Issue: Function deployed but still not working

**Check Cloud Function logs**:
```bash
firebase functions:log --limit 100
```

Look for error messages.

### Issue: Token format error from Expo API

**Cause**: Invalid push token format

**Fix**: Make sure tokens start with `ExponentPushToken[` and are properly saved.

---

## Cost Considerations

### Firebase Cloud Functions Pricing

Free tier includes:
- 2 million invocations/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

**Estimated costs for your app**:
- Sending 1000 notifications = 1 function invocation
- Estimated cost: **FREE** for up to 2M notifications/month
- Beyond that: ~$0.40 per million invocations

### Expo Push Notifications

- **100% FREE** for all Expo apps
- No limits on notification volume
- Highly reliable infrastructure

---

## Monitoring

### Check Notification History

In Firestore Console:
1. Go to `notification_requests` collection
2. Sort by `createdAt` descending
3. Check `status`, `successCount`, `failureCount`

### View Real-Time Function Execution

```bash
firebase functions:log --follow
```

This shows logs in real-time as notifications are sent.

---

## Advanced: Schedule Notifications

Currently, notifications are sent immediately. To schedule notifications:

1. Add a `scheduledFor` field when creating the request
2. Modify the Cloud Function to check if it's time to send
3. Use a scheduled function to process pending scheduled notifications

---

## Security Best Practices

1. **Firestore Rules**: Make sure only admins can write to `notification_requests`
2. **Admin Authentication**: Verify admin users in your admin panel
3. **Rate Limiting**: Consider adding rate limits to prevent spam
4. **Token Validation**: Cloud Function validates tokens before sending

---

## Next Steps

After deployment works:

1. **Add notification history view** in admin panel
2. **Show delivery statistics** (success/failure rates)
3. **Add notification templates** for common messages
4. **Implement notification scheduling** for future delivery
5. **Add deep linking** to navigate users to specific screens

---

## Quick Reference Commands

```bash
# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log --limit 50

# View logs in real-time
firebase functions:log --follow

# List deployed functions
firebase functions:list

# Delete a function
firebase functions:delete functionName

# Test locally (optional)
cd functions
npm run serve
```

---

## Support

If you encounter issues:

1. Check Firebase Console → Functions → Logs
2. Run `firebase functions:log --limit 100`
3. Verify Firestore has `notification_requests` collection
4. Check mobile app has valid `pushToken` in user document
5. Test with a single user first before broadcasting

---

## Summary

**Before**: Admin panel created notification requests, but nothing happened.

**After**: Cloud Function automatically processes requests and sends notifications via Expo Push API.

**Action Required**: Run the deployment steps above to activate the system.

---

**Created**: December 2024
**Status**: Ready for deployment
**Estimated Setup Time**: 10-15 minutes
