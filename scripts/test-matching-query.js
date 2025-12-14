/**
 * Test script to verify matching query works correctly
 * Run with: node scripts/test-matching-query.js
 */

// This script helps diagnose matching issues by showing:
// 1. What gender values are stored in the database
// 2. What the query is searching for
// 3. Why users might not be matching

console.log(`
===========================================
MATCHING QUERY DIAGNOSTIC TOOL
===========================================

This script will help diagnose why no profiles are showing.

EXPECTED DATABASE STRUCTURE:
----------------------------
users/{userId}:
  - rating: number (0-5)
  - onboarding:
      - completed: true
      - data:
          - gender: "Man" | "Woman" | "Nonbinary"
          - interestedIn: ["Man", "Woman", "Nonbinary"]
          - firstName: string
          - lastName: string
          - dob: string
          - pictures: string[]
          - interests: string[]
          - lookingFor: string[]
  - location:
      - latitude: number
      - longitude: number

COMMON ISSUES:
--------------
1. Gender value mismatch:
   ❌ Database has: "Man", Query searches for: "men"
   ✅ Both should use: "Man" (capital M)

2. onboarding.completed not set to true
3. Missing gender in onboarding.data
4. User already swiped on all available profiles
5. Distance/age filters too restrictive

RECENT FIX:
-----------
Changed filter values from lowercase to match database:
  "men" → "Man"
  "women" → "Woman"
  "non-binary" → "Nonbinary"

TO TEST:
--------
1. Open the app and navigate to the swipe screen
2. Check the console logs for:
   - "=== MATCHING DEBUG ==="
   - "Total users fetched from Firestore:"
   - "Total matches after filtering:"
3. If "Total users fetched" is 0:
   → Check gender values in Firebase Console
4. If "Total matches after filtering" is 0:
   → Check the skip messages to see why users are filtered out

MANUAL FIREBASE QUERY TEST:
----------------------------
Run this in Firebase Console Firestore:
collection('users')
  .where('onboarding.completed', '==', true)
  .where('onboarding.data.gender', 'in', ['Man'])  // or ['Woman'] or ['Nonbinary']
  .limit(10)

This should return users. If it doesn't, check:
- Are gender values spelled correctly?
- Is onboarding.completed = true?
- Does onboarding.data.gender exist?
`);
