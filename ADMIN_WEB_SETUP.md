# Admin Web Panel - Quick Setup Guide

Get your subscription management admin panel running in 5 minutes!

---

## 🚀 Quick Start

### 1. Navigate to Admin Directory

```bash
cd admin-web
```

### 2. Install Dependencies (if not already installed)

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The admin panel will start on **http://localhost:3001**

---

## 📍 Key URLs

Once running, access these pages:

| Page | URL | Purpose |
|------|-----|---------|
| **Main Dashboard** | http://localhost:3001/dashboard | Overview & stats |
| **Subscriptions** | http://localhost:3001/dashboard/subscriptions | Subscription overview |
| **Plans Manager** | http://localhost:3001/dashboard/subscriptions/plans | Add/edit/delete plans |
| **Settings** | http://localhost:3001/dashboard/subscriptions/settings | Razorpay keys & config |
| **User Subscriptions** | http://localhost:3001/dashboard/subscriptions/users | View all users |
| **Transactions** | http://localhost:3001/dashboard/subscriptions/transactions | Revenue & payments |

---

## 🔑 First Time Setup

### Step 1: Login to Admin Panel

1. Go to http://localhost:3001
2. Use your admin credentials
3. Navigate to Dashboard

### Step 2: Initialize Subscription Data

The subscription data will auto-initialize when you first open the subscription page in the mobile app. Alternatively, you can manually create it through the admin panel:

1. Go to **Settings** (http://localhost:3001/dashboard/subscriptions/settings)
2. Set up configuration:
   - Free Trial Limit: 5
   - Razorpay Test Key ID: `rzp_test_RppoO9N9nmGALz`
   - Razorpay Test Secret: `FJm3HQKomPlfTHt1xknBUCDW`
   - Enable Subscriptions: ✅

3. Click **Save Settings**

### Step 3: Create Your First Plan

1. Go to **Plans** → **Add New Plan**
2. Fill in details:
   ```
   Plan ID: weekly
   Name: Weekly Plan
   Display Name: Weekly Plan
   Description: Most popular choice
   Price: 100
   Currency: INR
   Duration: 7
   Swipe Limit: 100
   ```
3. Add features:
   - 100 daily swipes
   - See who likes you
   - Priority matching
   - Profile boost
4. Enable: ✅ Active
5. Enable: ✅ Popular
6. Click **Create Plan**

### Step 4: Test in Mobile App

1. Ensure mobile app is running
2. Login to app
3. Swipe 5 times (reach free limit)
4. Click "Upgrade Now"
5. You should see your created plan!
6. Test payment with card: `4111 1111 1111 1111`

---

## 📂 File Structure

```
admin-web/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── subscriptions/         # Main subscription management
│   │   │   │   ├── page.tsx           # Overview dashboard
│   │   │   │   ├── plans/             # Plan management
│   │   │   │   │   ├── page.tsx       # Plans list
│   │   │   │   │   └── [id]/          # Edit plan
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── settings/          # Configuration
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── users/             # User subscriptions
│   │   │   │   │   └── page.tsx
│   │   │   │   └── transactions/      # Revenue & transactions
│   │   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── Sidebar.tsx                # Navigation sidebar
│   ├── services/
│   │   ├── subscriptions.ts           # Subscription API
│   │   └── auth.ts                    # Authentication
│   └── lib/
│       └── firebase.ts                # Firebase config
├── package.json
└── next.config.js
```

---

## 🎯 Common Tasks

### Start Admin Panel
```bash
cd admin-web
npm run dev
```

### Build for Production
```bash
cd admin-web
npm run build
npm start
```

### Lint Code
```bash
cd admin-web
npm run lint
```

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env.local` in `admin-web/` directory:

```env
# Firebase (already in code, but can override)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

---

## 🛠️ Troubleshooting

### Port Already in Use

If port 3001 is busy:

```bash
# Use different port
PORT=3002 npm run dev
```

### Firebase Connection Issues

Check `admin-web/src/lib/firebase.ts` has correct Firebase config.

### Can't See Subscription Menu

1. Check sidebar imports in `Sidebar.tsx`
2. Verify routes exist in `app/dashboard/subscriptions/`
3. Hard refresh browser (Cmd/Ctrl + Shift + R)

### Plans Not Loading

1. Check browser console for errors
2. Verify Firestore rules allow read access
3. Run initialization script in mobile app
4. Check `subscriptionPlans/plans` exists in Firestore

---

## 📚 Documentation

- **Admin Guide**: [ADMIN_SUBSCRIPTION_MANAGEMENT.md](ADMIN_SUBSCRIPTION_MANAGEMENT.md)
- **System Overview**: [SUBSCRIPTION_SYSTEM.md](SUBSCRIPTION_SYSTEM.md)
- **Razorpay Setup**: [RAZORPAY_SETUP.md](RAZORPAY_SETUP.md)
- **Complete Guide**: [PREMIUM_SUBSCRIPTION_COMPLETE.md](PREMIUM_SUBSCRIPTION_COMPLETE.md)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Admin panel loads at localhost:3001
- [ ] Can navigate to Subscriptions section
- [ ] Plans page loads without errors
- [ ] Settings page shows Razorpay config
- [ ] Can create a new plan
- [ ] Plan appears in mobile app
- [ ] Can process test payment
- [ ] Transaction shows in admin panel
- [ ] Revenue stats update

---

## 🎉 You're Ready!

Your admin panel is now fully set up to manage:
- ✅ Subscription plans
- ✅ Pricing & features
- ✅ Payment gateway
- ✅ User subscriptions
- ✅ Revenue analytics

Access it at: **http://localhost:3001/dashboard/subscriptions**

---

**Need Help?**
- Check [ADMIN_SUBSCRIPTION_MANAGEMENT.md](ADMIN_SUBSCRIPTION_MANAGEMENT.md) for detailed usage
- Review console logs for errors
- Verify Firestore data structure
- Test with Razorpay test cards

**Version:** 1.0.0
**Last Updated:** December 10, 2025
