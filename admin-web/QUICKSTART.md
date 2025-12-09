# Quick Start Guide

## Step 1: Install Dependencies (Already Done!)

Dependencies have been installed. If you need to reinstall:
```bash
npm install
```

## Step 2: Create Admin User in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dular5**
3. Navigate to **Authentication** > **Users**
4. Click **"Add user"**
5. Enter:
   - Email: `admin@dular.com` (or your preferred email)
   - Password: Create a strong password
6. Click **"Add user"**

## Step 3: Start the Admin Panel

From the `admin-web` directory:
```bash
npm run dev
```

The admin panel will be available at: **http://localhost:3001**

## Step 4: Login

1. Open your browser to http://localhost:3001
2. Enter the email and password you created in Step 2
3. You'll be redirected to the dashboard

## What You Can Do

### Dashboard (Home)
- View statistics (total users, new today, delete requests)
- Quick action buttons
- System information

### Users Management
- **View all users** - See all registered users in a table
- **Search users** - Search by name, email, or phone
- **Filter users** by:
  - Gender (Male, Female, Other)
  - Registration date (Today, Yesterday, This Week, This Month)
  - Delete requests
- **Create users** - Add new users manually
- **Edit users** - Update user information
- **Delete users** - Remove users from the system
- **Bulk select** - Select multiple users at once

### Push Notifications
- **Single user** - Send notification to one user
- **Multiple users** - Select and send to specific users
- **All users** - Broadcast to everyone
- **Preview** - See how your notification will look
- **User selection** - Search and select recipients

## Important Notes

### Push Notifications Setup Required

To actually send push notifications, you need to:

1. **Deploy Firebase Cloud Functions** (see SETUP_INSTRUCTIONS.md)
2. **Enable Cloud Messaging** in Firebase Console
3. **Update mobile app** to store FCM tokens

Without these steps, notification requests will be created in Firestore but won't be sent.

### Firestore Security Rules

Update your Firestore rules to allow admin access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /notification_requests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Common Issues

### Can't login?
- Make sure you created the admin user in Firebase Authentication
- Check the email and password
- Open browser console (F12) to see error messages

### No users showing?
- Make sure you have users in your Firestore database
- Check Firestore security rules
- Verify Firebase configuration in `src/lib/firebase.ts`

### Build errors?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

## Next Steps

1. **Create an admin user** in Firebase (if not done)
2. **Start the dev server**: `npm run dev`
3. **Login** at http://localhost:3001
4. **Explore** the dashboard and features
5. **Set up Cloud Functions** for push notifications (see SETUP_INSTRUCTIONS.md)
6. **Deploy** to production (Vercel, Netlify, etc.)

## Production Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### Option 3: Manual
```bash
npm run build
npm start  # Runs on port 3001
```

## Support

For detailed setup instructions, see:
- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Complete setup guide
- [README.md](./README.md) - Full documentation
