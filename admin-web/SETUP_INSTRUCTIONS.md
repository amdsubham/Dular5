# Dular Admin Panel - Setup Instructions

## Installation

1. Navigate to the admin-web directory:
```bash
cd admin-web
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3001
```

## Firebase Setup for Push Notifications

### Step 1: Create Admin User

To create an admin user, you can use the Firebase Console:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (dular5)
3. Go to Authentication > Users
4. Click "Add user"
5. Enter email and password (e.g., admin@dular.com)

Alternatively, you can use the Firebase CLI or create an admin user through the Firebase SDK.

### Step 2: Enable Firebase Cloud Messaging

1. In Firebase Console, go to Project Settings
2. Navigate to "Cloud Messaging" tab
3. If not already enabled, enable Cloud Messaging API
4. Note down your Server Key (for backend use)

### Step 3: Set Up Cloud Functions for Push Notifications

To actually send push notifications, you need to set up Firebase Cloud Functions. Create a new directory for functions:

```bash
cd /Users/subhamroutray/Downloads/Dular5.0
firebase init functions
```

Then create the following function in `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendPushNotifications = functions.firestore
  .document('notification_requests/{requestId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { userIds, sendToAll, notification, status } = data;

    if (status !== 'pending') {
      return null;
    }

    try {
      let tokens: string[] = [];

      if (sendToAll) {
        // Get all users' FCM tokens
        const usersSnapshot = await admin.firestore().collection('users').get();
        tokens = usersSnapshot.docs
          .map(doc => doc.data().fcmToken)
          .filter(token => token);
      } else {
        // Get specific users' FCM tokens
        const userPromises = userIds.map((userId: string) =>
          admin.firestore().collection('users').doc(userId).get()
        );
        const userDocs = await Promise.all(userPromises);
        tokens = userDocs
          .map(doc => doc.data()?.fcmToken)
          .filter(token => token);
      }

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          tokens: tokens,
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log('Successfully sent messages:', response.successCount);
        console.log('Failed to send:', response.failureCount);

        // Update the request status
        await snap.ref.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          successCount: response.successCount,
          failureCount: response.failureCount,
        });
      } else {
        await snap.ref.update({
          status: 'failed',
          error: 'No valid FCM tokens found',
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message,
      });
    }

    return null;
  });
```

Deploy the function:
```bash
firebase deploy --only functions
```

### Step 4: Update Mobile App to Store FCM Tokens

In your React Native app, make sure to store the FCM token when users log in:

```typescript
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Get FCM token and save to Firestore
const token = await Notifications.getExpoPushTokenAsync();
const user = getCurrentUser();
if (user) {
  await updateDoc(doc(db, 'users', user.uid), {
    fcmToken: token.data,
  });
}
```

## Features

### Dashboard
- View total users count
- View new users registered today
- View users with delete requests
- Quick action buttons

### User Management
- View all users in a table
- Search users by name, email, or phone
- Filter users by:
  - Gender
  - Registration date (today, yesterday, this week, this month)
  - Delete requests
- Create new users
- Edit existing users
- Delete users
- Bulk select users

### Push Notifications
- Send notifications to individual users
- Send notifications to multiple selected users
- Send notifications to all users
- Preview notifications before sending
- Search and select users
- Bulk user selection

## Default Login Credentials

Create an admin account in Firebase Authentication with:
- Email: admin@dular.com
- Password: (set your own secure password)

## Security Rules

Make sure to update your Firebase Firestore security rules to protect admin data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - read for authenticated users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Notification requests - only admins can create
    match /notification_requests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Production Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd admin-web
vercel
```

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod
```

## Environment Variables

If you want to use environment variables for Firebase config, create a `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Troubleshooting

### Cannot login
- Make sure you've created an admin user in Firebase Authentication
- Check that Firebase configuration is correct
- Check browser console for errors

### Users not loading
- Verify Firebase Firestore rules allow authenticated users to read the users collection
- Check browser console for errors
- Ensure you have users in your Firestore database

### Push notifications not sending
- Make sure Firebase Cloud Functions are deployed
- Verify Cloud Messaging is enabled in Firebase Console
- Check that users have FCM tokens stored in Firestore
- Review Cloud Functions logs for errors

## Support

For issues or questions, please refer to the Firebase documentation:
- https://firebase.google.com/docs
- https://firebase.google.com/docs/cloud-messaging
