# URGENT FIX - No Cards Showing

## The Problem
Your database query returns **0 users** because:
1. You are the ONLY user in the database
2. Your user has `onboarding.completed = false` (should be `true`)
3. The query filters out users where `onboarding.completed != true`

## Solution - Two Steps Required

### Step 1: Fix YOUR User Account (REQUIRED)

Open Firebase Console and manually update your user:

1. Go to: https://console.firebase.google.com/
2. Select your project: **Dular5**
3. Click **Firestore Database** in left menu
4. Navigate to: `users` → `1kfRtkbEdzLIrUUtCfCmltmiXPu1` → `onboarding`
5. Find the field: `completed`
6. Click on the value `false`
7. Change it to: `true`
8. Click **Update**

**Screenshot of what to change:**
```
onboarding (map)
  ├─ completed: false  ← CHANGE THIS TO true
  ├─ completedSteps: [array]
  ├─ currentStep: "name"  ← ALSO CHANGE THIS TO "done"
  ├─ data: {map}
  └─ lastUpdated: {timestamp}
```

### Step 2: Create Test Users (REQUIRED)

You need at least 2-3 other users in the database to see matches. Here are your options:

#### Option A: Add Test Users via Firebase Console

For each test user, create a new document in the `users` collection:

**Test User 1 - Woman:**
```
Document ID: testuser1
Fields:
  - phoneNumber: "+910000000001"
  - createdAt: [current timestamp]
  - rating: 5
  - location (map):
      - latitude: 20.3492198
      - longitude: 85.8219017
      - lastUpdated: [current timestamp]
  - onboarding (map):
      - completed: true  ← IMPORTANT!
      - currentStep: "done"
      - completedSteps: ["name","dob","gender","interest","looking-for","pictures","interests","location"]
      - lastUpdated: [current timestamp]
      - data (map):
          - firstName: "Sarah"
          - lastName: "Smith"
          - dob: "1998-05-15T18:30:00.000Z"
          - gender: "Woman"  ← IMPORTANT! Must match exactly
          - interestedIn: ["Man"]
          - lookingFor: ["long-term-relationship", "marriage"]
          - interests: ["Travel", "Music", "Food"]
          - pictures: ["https://picsum.photos/400/600?random=1"]
          - latitude: 20.3492198
          - longitude: 85.8219017
```

**Test User 2 - Woman:**
```
Document ID: testuser2
Fields:
  - phoneNumber: "+910000000002"
  - createdAt: [current timestamp]
  - rating: 4
  - location (map):
      - latitude: 20.3492198
      - longitude: 85.8219017
      - lastUpdated: [current timestamp]
  - onboarding (map):
      - completed: true  ← IMPORTANT!
      - currentStep: "done"
      - completedSteps: ["name","dob","gender","interest","looking-for","pictures","interests","location"]
      - lastUpdated: [current timestamp]
      - data (map):
          - firstName: "Emma"
          - lastName: "Johnson"
          - dob: "2000-08-20T18:30:00.000Z"
          - gender: "Woman"  ← IMPORTANT! Must match exactly
          - interestedIn: ["Man"]
          - lookingFor: ["casual-dates", "lets-see"]
          - interests: ["Fitness", "Movies", "Art"]
          - pictures: ["https://picsum.photos/400/600?random=2"]
          - latitude: 20.3492198
          - longitude: 85.8219017
```

**Test User 3 - Woman:**
```
Document ID: testuser3
Fields:
  - phoneNumber: "+910000000003"
  - createdAt: [current timestamp]
  - rating: 3
  - location (map):
      - latitude: 20.3492198
      - longitude: 85.8219017
      - lastUpdated: [current timestamp]
  - onboarding (map):
      - completed: true  ← IMPORTANT!
      - currentStep: "done"
      - completedSteps: ["name","dob","gender","interest","looking-for","pictures","interests","location"]
      - lastUpdated: [current timestamp]
      - data (map):
          - firstName: "Olivia"
          - lastName: "Brown"
          - dob: "1997-12-10T18:30:00.000Z"
          - gender: "Woman"  ← IMPORTANT! Must match exactly
          - interestedIn: ["Man"]
          - lookingFor: ["long-term-relationship"]
          - interests: ["Reading", "Yoga", "Photography"]
          - pictures: ["https://picsum.photos/400/600?random=3"]
          - latitude: 20.3492198
          - longitude: 85.8219017
```

#### Option B: Use Admin Panel (If Available)

If you have an admin panel set up, use it to create test users through the UI.

#### Option C: Run Seed Script (If Available)

If you have a seed users script:
```bash
node scripts/seed-users.js
```

### Step 3: Verify the Fix

After completing Steps 1 and 2:

1. **Reload the app** (press `r` in Metro or shake device → Reload)
2. **Navigate to home/swipe screen**
3. **Check console logs** - You should now see:
   ```
   Total users fetched with gender filter: 3
   ✓ Added match: testuser1 (Sarah, age: 27, rating: 5)
   ✓ Added match: testuser2 (Emma, age: 25, rating: 4)
   ✓ Added match: testuser3 (Olivia, age: 28, rating: 3)
   Total matches after filtering: 3
   Returning matches: Sarah (rating: 5), Emma (rating: 4), Olivia (rating: 3)
   ```
4. **Profiles should appear on screen!**

## Quick Verification Checklist

Before reloading the app, verify in Firebase Console:

- [ ] Your user (`1kfRtkbEdzLIrUUtCfCmltmiXPu1`): `onboarding.completed = true`
- [ ] At least 2-3 test users created
- [ ] Each test user has: `onboarding.completed = true`
- [ ] Each test user has: `onboarding.data.gender = "Woman"` (matching your preference)
- [ ] Each test user has: `rating` field (0-5)

## Why This Happened

The query:
```javascript
where('onboarding.completed', '==', true)
where('onboarding.data.gender', 'in', ['Woman'])
```

Returns 0 results because:
1. Your account has `completed = false` → filtered out by first condition
2. No other users exist in database → query returns empty set

Both conditions must be met for the app to show profiles!

## Alternative Quick Test (Skip Test Users)

If you want to test immediately without creating users:

1. Fix YOUR user's `onboarding.completed` to `true`
2. Change YOUR user's `onboarding.data.gender` to `"Woman"` temporarily
3. Reload app
4. You should see YOUR OWN profile as a match
5. This confirms the query works
6. Then add proper test users

---

**Once you complete these steps, profiles will appear sorted by rating as designed!**
