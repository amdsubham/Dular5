# Quick Reference Card

## Essential Commands

```bash
# Navigate to admin panel
cd admin-web

# Install dependencies (already done!)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Access the app
open http://localhost:3001
```

## File Locations

| What | Where |
|------|-------|
| Login page | `src/app/page.tsx` |
| Dashboard | `src/app/dashboard/page.tsx` |
| Users page | `src/app/dashboard/users/page.tsx` |
| Notifications | `src/app/dashboard/notifications/page.tsx` |
| Firebase config | `src/lib/firebase.ts` |
| User service | `src/services/users.ts` |
| Auth service | `src/services/auth.ts` |

## Quick Setup

1. **Create admin user** in Firebase Console
   - Email: `admin@dular.com`
   - Password: (your choice)

2. **Start server**
   ```bash
   cd admin-web
   npm run dev
   ```

3. **Login** at http://localhost:3001

## Features at a Glance

### Dashboard (`/dashboard`)
- Total users count
- New users today
- Delete requests count

### Users (`/dashboard/users`)
- View all users
- Search: name, email, phone
- Filter: gender, date, delete requests
- Create new user
- Edit user
- Delete user
- Bulk select

### Notifications (`/dashboard/notifications`)
- Send to single user
- Send to multiple users
- Send to all users
- User search
- Preview notification

## Common Tasks

### View all users
1. Login → Users (sidebar)
2. See table of all users

### Create a user
1. Users → "Create User" button
2. Fill form → Save

### Edit a user
1. Find user in table
2. Click edit icon
3. Update → Save

### Delete a user
1. Find user in table
2. Click delete icon
3. Confirm

### Send notification
1. Login → Notifications
2. Write title & message
3. Select users (or "All Users")
4. Send

### Filter users
1. Users page
2. Use dropdowns: Gender, Date
3. Or search box

## URLs

- **Login**: http://localhost:3001
- **Dashboard**: http://localhost:3001/dashboard
- **Users**: http://localhost:3001/dashboard/users
- **Notifications**: http://localhost:3001/dashboard/notifications

## Firebase Console

- **Project**: https://console.firebase.google.com/project/dular5
- **Auth**: .../authentication/users
- **Firestore**: .../firestore/data
- **Cloud Messaging**: .../settings/cloudmessaging

## Tech Stack Quick Ref

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth
- **Port**: 3001

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Create admin user in Firebase Console |
| No users showing | Check Firestore has users collection |
| Build error | `rm -rf node_modules .next && npm install` |
| Port in use | Change port in package.json or kill process |

## Project Structure

```
admin-web/
├── src/
│   ├── app/          # Pages
│   ├── components/   # UI components
│   ├── services/     # Business logic
│   ├── lib/          # Config (Firebase)
│   └── types/        # TypeScript types
├── Documentation files
└── Config files
```

## Key Files Count

- 12 TypeScript files
- 4 config files
- 5 documentation files
- 452 lines (users page)
- 257 lines (notifications page)

## Production Deployment

**Vercel (fastest)**
```bash
vercel
```

**Netlify**
```bash
npm run build
netlify deploy --prod
```

## Environment

- ✅ Dependencies installed
- ✅ Firebase configured
- ✅ All pages created
- ⏳ Need: Create admin user
- ⏳ Optional: Cloud Functions for push

## Next Steps

1. Create admin user in Firebase
2. Run `npm run dev`
3. Login and test
4. Set up Cloud Functions (optional)
5. Deploy to production

## Documentation

- **QUICKSTART.md** - Start here
- **README.md** - Full docs
- **SETUP_INSTRUCTIONS.md** - Detailed setup
- **PROJECT_STRUCTURE.md** - Architecture
- **QUICK_REFERENCE.md** - This file

---

**Status**: ✅ Ready to use
**Version**: 1.0.0
**Last Updated**: December 8, 2024
