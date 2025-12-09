# Admin Panel - Complete Project Structure

## Directory Overview

```
admin-web/
├── src/                           # Source code directory
│   ├── app/                       # Next.js App Router pages
│   │   ├── dashboard/            # Protected dashboard area
│   │   │   ├── layout.tsx        # Dashboard layout (auth check, sidebar)
│   │   │   ├── page.tsx          # Dashboard home (statistics)
│   │   │   ├── users/
│   │   │   │   └── page.tsx      # User management page
│   │   │   └── notifications/
│   │   │       └── page.tsx      # Push notifications page
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Login page (public)
│   │   └── globals.css           # Global Tailwind styles
│   │
│   ├── components/               # Reusable React components
│   │   └── Sidebar.tsx          # Navigation sidebar component
│   │
│   ├── lib/                      # Library code and configurations
│   │   └── firebase.ts          # Firebase initialization & exports
│   │
│   ├── services/                 # Business logic & API calls
│   │   ├── auth.ts              # Authentication functions
│   │   ├── users.ts             # User CRUD operations
│   │   └── notifications.ts     # Push notification functions
│   │
│   └── types/                    # TypeScript type definitions
│       └── user.ts              # User-related types & interfaces
│
├── public/                        # Static assets (none yet)
│
├── Configuration Files
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── next.config.js                # Next.js configuration
├── .gitignore                    # Git ignore rules
│
└── Documentation Files
    ├── README.md                  # Full project documentation
    ├── QUICKSTART.md             # Quick start guide
    ├── SETUP_INSTRUCTIONS.md     # Detailed setup instructions
    └── PROJECT_STRUCTURE.md      # This file
```

## File Descriptions

### Pages (app/)

**app/page.tsx** - Login Page
- Public page (no auth required)
- Email/password login form
- Redirects to dashboard on success
- Uses Firebase Authentication

**app/layout.tsx** - Root Layout
- Wraps entire application
- Imports global CSS
- Sets metadata (title, description)

**app/dashboard/layout.tsx** - Dashboard Layout
- Protected layout (requires authentication)
- Includes Sidebar component
- Redirects to login if not authenticated
- Wraps all dashboard pages

**app/dashboard/page.tsx** - Dashboard Home
- Shows statistics cards (total users, new today, delete requests)
- Quick action buttons
- System information panel
- Uses getUserStats() service

**app/dashboard/users/page.tsx** - User Management
- Complete user list table
- Search functionality
- Filter by gender, date, delete requests
- Create/Edit/Delete user modals
- Bulk user selection
- Pagination ready

**app/dashboard/notifications/page.tsx** - Push Notifications
- Notification composer form
- User selection (single, multiple, all)
- Live preview
- Search users
- Bulk selection
- Send notifications

### Components (components/)

**Sidebar.tsx** - Navigation Sidebar
- Dashboard link
- Users link
- Notifications link
- Sign out button
- Active page highlighting

### Services (services/)

**auth.ts** - Authentication Service
```typescript
- signInAdmin(email, password)
- signOutAdmin()
- createAdminUser(email, password)
- getCurrentUser()
- onAuthChange(callback)
```

**users.ts** - User Management Service
```typescript
- getAllUsers()
- getUserById(userId)
- updateUser(userId, data)
- deleteUser(userId)
- createUser(userData)
- filterUsers(filters)
- getUserStats()
```

**notifications.ts** - Notification Service
```typescript
- sendPushNotification(options)
- sendNotificationToUser(userId, notification)
- sendNotificationToMultipleUsers(userIds, notification)
- sendNotificationToAllUsers(notification)
```

### Library (lib/)

**firebase.ts** - Firebase Configuration
- Initializes Firebase app
- Exports auth, db, storage
- Messaging instance for web
- Uses same config as mobile app

### Types (types/)

**user.ts** - Type Definitions
```typescript
- UserProfile interface
- UserFilters interface
- All user-related types
```

## Data Flow

### Authentication Flow
```
1. User enters email/password → app/page.tsx
2. Calls signInAdmin() → services/auth.ts
3. Firebase authenticates → lib/firebase.ts
4. onAuthChange() triggers → services/auth.ts
5. Redirect to dashboard → app/dashboard/page.tsx
```

### User Management Flow
```
1. Load users → app/dashboard/users/page.tsx
2. Call getAllUsers() → services/users.ts
3. Fetch from Firestore → lib/firebase.ts
4. Display in table → app/dashboard/users/page.tsx
5. User actions (CRUD) → services/users.ts
```

### Notification Flow
```
1. Compose notification → app/dashboard/notifications/page.tsx
2. Select users → User selection UI
3. Send notification → services/notifications.ts
4. Create Firestore doc → lib/firebase.ts
5. Cloud Function processes → (External: Firebase Functions)
6. FCM sends to devices → (External: Firebase Cloud Messaging)
```

## Routes

### Public Routes
- `/` - Login page

### Protected Routes (require authentication)
- `/dashboard` - Dashboard home (statistics)
- `/dashboard/users` - User management
- `/dashboard/notifications` - Push notifications

## State Management

- **Local state**: useState for component state
- **Auth state**: Firebase onAuthStateChanged
- **No global state**: Each page fetches its own data

## Styling

- **Framework**: Tailwind CSS
- **Responsive**: Mobile-first approach
- **Theme**: Primary color (red/pink)
- **Components**: Custom-built (no UI library)

## API Calls

All API calls go through Firebase SDK:
- **Auth**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (not used yet)
- **Messaging**: Firebase Cloud Messaging (for notifications)

## Environment

- **Development**: `npm run dev` (port 3001)
- **Production**: `npm run build` then `npm start`
- **Framework**: Next.js 15
- **Node**: 18+

## Dependencies

### Main Dependencies
- `next` - Next.js framework
- `react` - React library
- `firebase` - Firebase SDK
- `lucide-react` - Icons
- `date-fns` - Date formatting

### Dev Dependencies
- `typescript` - TypeScript compiler
- `tailwindcss` - Tailwind CSS
- `@types/*` - TypeScript type definitions

## Build Output

```bash
npm run build
```

Generates:
- `.next/` - Next.js build output
- Ready for deployment to Vercel, Netlify, etc.

## Key Conventions

1. **File naming**: lowercase with hyphens (kebab-case)
2. **Component naming**: PascalCase
3. **Function naming**: camelCase
4. **Type naming**: PascalCase with 'Interface' suffix
5. **Service functions**: Async/await, try-catch
6. **Error handling**: Console.error + user alerts

## Security

- Auth required for all `/dashboard/*` routes
- Firebase security rules control data access
- No sensitive data in client code
- Environment variables for production

## Future Enhancements

Potential additions:
- [ ] Admin role management
- [ ] Activity logs
- [ ] Analytics dashboard
- [ ] User export (CSV/Excel)
- [ ] Advanced search
- [ ] User groups/segments
- [ ] Scheduled notifications
- [ ] Notification templates
- [ ] File upload for user avatars
- [ ] Bulk user import

## Maintenance

### Adding a new page
1. Create file in `app/dashboard/[name]/page.tsx`
2. Add link in `Sidebar.tsx`
3. Create service functions if needed
4. Update types if needed

### Adding a new feature
1. Define types in `types/`
2. Create service functions in `services/`
3. Build UI in `app/dashboard/`
4. Update documentation

### Debugging
- Check browser console
- Check Firebase Console
- Check Network tab
- Add console.logs in services
