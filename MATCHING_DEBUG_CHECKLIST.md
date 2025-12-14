# Matching Debug Checklist

## Steps to Debug "No Profiles Showing" Issue

### 1. Reload the App
- **Action**: Force reload the app in your emulator/device
  - Android: Press `r` in Metro bundler or shake device → "Reload"
  - iOS: Press `Cmd+R` or shake device → "Reload"

### 2. Check Console Logs
Navigate to the swipe screen and look for these console messages:

```
=== MATCHING DEBUG ===
Current User ID: [your-user-id]
User Preferences: {...}
Filters: {...}
Gender Preference for query: [...]
```

### 3. Diagnose Based on Console Output

#### Case A: "Total users fetched with gender filter: 0"
This means the Firestore query returned no users.

**Next Step**: Look for the warning message:
```
⚠️ No users found with gender filter. Trying without filter...
Total users without gender filter: X
⚠️ Users exist but gender filter returns nothing!
First user gender value: [actual value from DB]
Expected one of: [what the query was looking for]
```

**Action Required**:
- If the values don't match, you need to update the database
- The database should have: `"Man"`, `"Woman"`, or `"Nonbinary"` (capital first letter)
- NOT: `"man"`, `"male"`, `"female"`, `"men"`, `"women"`, etc.

#### Case B: "Total users fetched: X" but "Total matches after filtering: 0"
This means users were found but filtered out.

**Next Step**: Check the "Skipping" messages:
```
Skipping current user: [id]
Skipping swiped user: [id]
Skipping user with no DOB: [id]
Skipping user [id]: age X < minAge Y
Skipping user [id]: distance Xkm > maxDistance Ykm
```

**Action Required**:
- If all users are being skipped for "age" → Adjust age filters
- If all users are being skipped for "distance" → Adjust distance filter or add location data
- If all users are being skipped for "swiped" → Need more test users or reset swipes collection

#### Case C: "Total matches after filtering: X" (X > 0)
This means matches were found!

**Next Step**: Check if they're being displayed:
```
=== MATCHES SORTED ===
Returning matches: Name1 (rating: 5), Name2 (rating: 4), ...
```

**If matches exist but UI shows "No profiles"**:
- Check the SwipeScreen component is receiving the matches
- Check for React rendering issues

### 4. Manual Firebase Check

Open Firebase Console → Firestore Database:

1. **Check a user document structure**:
   ```
   users/[someUserId]/
     ├─ onboarding
     │  ├─ completed: true
     │  └─ data
     │     ├─ gender: "Man" or "Woman" or "Nonbinary"
     │     ├─ firstName: "..."
     │     ├─ dob: "..."
     │     └─ ...
     └─ rating: 5 (or any number 0-5)
   ```

2. **Verify gender values**:
   - Click on a few user documents
   - Check `onboarding.data.gender` field
   - Should be: `"Man"`, `"Woman"`, or `"Nonbinary"`
   - NOT: lowercase or other variations

3. **Test the query manually** (if Firebase Console supports it):
   ```
   Collection: users
   Where: onboarding.completed == true
   Where: onboarding.data.gender in ["Man"]
   Limit: 10
   ```

### 5. Common Issues and Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Gender mismatch | Query returns 0 users with filter | Update database gender values to "Man"/"Woman"/"Nonbinary" |
| No users with onboarding complete | Query returns 0 users | Complete onboarding for test users |
| All users already swiped | All skipped as "swiped" | Clear swipes collection or add more users |
| Age filter too restrictive | All skipped for age | Increase age range in filters |
| Distance too restrictive | All skipped for distance | Increase max distance or add location data |
| No DOB on users | All skipped "no DOB" | Add dob field to user onboarding data |

### 6. Quick Fixes

#### Fix 1: Update Gender Values in Database
If your database has incorrect gender values, update them:
```javascript
// In Firebase Console → Firestore → users → [userId] → onboarding → data
gender: "Man"     // NOT "man", "male", "men"
gender: "Woman"   // NOT "woman", "female", "women"
gender: "Nonbinary" // NOT "non-binary", "nonbinary", "other"
```

#### Fix 2: Ensure onboarding.completed is true
```javascript
// In Firebase Console → Firestore → users → [userId] → onboarding
completed: true
```

#### Fix 3: Clear Swipes (if testing)
If you've swiped on all users during testing:
```javascript
// In Firebase Console → Firestore
Delete all documents in the "swipes" collection
```

### 7. Expected Working Console Output

When everything works correctly, you should see:
```
=== MATCHING DEBUG ===
Current User ID: abc123
User Preferences: {"interestedIn": ["Man"], "lookingFor": ["long-term"], ...}
Filters: {"minAge": 18, "maxAge": 99, "maxDistance": 100, "interestedIn": ["Man"], ...}
Gender Preference for query: ["Man"]
Querying with gender filter: ["Man"]
Total users fetched with gender filter: 5
✓ Added match: xyz789 (John, age: 25, rating: 5)
✓ Added match: def456 (Mike, age: 28, rating: 4)
✓ Added match: ghi789 (David, age: 30, rating: 3)
Total matches after filtering: 3
=== MATCHES SORTED ===
Returning matches: John (rating: 5), Mike (rating: 4), David (rating: 3)
```

Then profiles should appear on your screen sorted by rating!

---

## Need More Help?

If you're still seeing no profiles after following this checklist, share:
1. The complete console output starting from "=== MATCHING DEBUG ==="
2. A screenshot of a user document from Firebase Console
3. The current filter settings (age range, distance, etc.)
