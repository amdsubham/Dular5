# Dular Admin Panel

A comprehensive web-based admin panel for managing the Dular mobile application. Built with Next.js, TypeScript, and Firebase.

## Features

### User Management
- View all registered users
- Search and filter users
- Create new users manually
- Edit user profiles
- Delete users
- Bulk user selection
- Filter by registration date (today, yesterday, this week, this month)
- Filter by gender and preferences
- View users with delete requests

### Push Notifications
- Send notifications to individual users
- Send notifications to multiple selected users
- Send notifications to all users at once
- Live notification preview
- User search and selection interface

### Dashboard
- Real-time statistics
- Total users count
- New users today
- Users with delete requests
- Quick action shortcuts

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password)
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project with Firestore and Authentication enabled
- Admin user created in Firebase Authentication

### Installation

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

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Creating an Admin User

Create an admin account in Firebase Console:

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email (e.g., admin@dular.com) and password
4. Use these credentials to login to the admin panel

## Project Structure

```
admin-web/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── users/          # User management
│   │   │   └── notifications/  # Push notifications
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Login page
│   ├── components/             # Reusable components
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── lib/                    # Utilities and configs
│   │   └── firebase.ts         # Firebase configuration
│   ├── services/               # Business logic
│   │   ├── auth.ts             # Authentication service
│   │   ├── users.ts            # User management service
│   │   └── notifications.ts    # Push notifications service
│   └── types/                  # TypeScript types
│       └── user.ts             # User-related types
├── public/                     # Static assets
└── package.json
```

## Configuration

### Firebase Configuration

The Firebase configuration is located in `src/lib/firebase.ts`. It uses the same Firebase project as your mobile app.

### Environment Variables (Optional)

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Push Notifications Setup

To enable push notifications, you need to:

1. Deploy Firebase Cloud Functions (see SETUP_INSTRUCTIONS.md)
2. Enable Cloud Messaging in Firebase Console
3. Update mobile app to store FCM tokens

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed setup instructions.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

## Security

- Admin authentication required for all dashboard pages
- Firebase security rules should be configured to protect user data
- Use HTTPS in production
- Set strong admin passwords

## Contributing

This is a private admin panel for the Dular application. Please follow the established code structure and patterns.

## License

Private - All rights reserved
