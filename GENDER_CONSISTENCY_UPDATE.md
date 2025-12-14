# Gender Consistency Update

## Problem
The app was using inconsistent gender values:
- MongoDB data had: `"Male"`, `"Female"`, `"Men"`, `"Women"`
- Migration was converting to: `"male"`, `"female"` (lowercase)
- App UI and matching logic expected: `"Man"`, `"Woman"` (capitalized)

This inconsistency caused the matching algorithm to fail finding users.

## Solution
Updated the migration service to consistently use **"Man"** and **"Woman"** throughout the entire application.

## Changes Made

### 1. Migration Service (`admin-web/src/services/migration.ts`)

**Gender Mapping (Line 45-55):**
- `"Male"` or `"male"` or `"m"` or `"man"` → `"Man"`
- `"Female"` or `"female"` or `"f"` or `"woman"` → `"Woman"`

**Interested In Mapping (Line 57-89):**
- `"Men"` or `"men"` or `"male"` or `"Man"` → `"Man"` in interestedIn array
- `"Women"` or `"women"` or `"female"` or `"Woman"` → `"Woman"` in interestedIn array
- `"Both"` or `"Everyone"` → `["Man", "Woman"]`

### 2. Diagnostic Script (`scripts/check-firestore-data.js`)
Updated to test queries with `"Man"` and `"Woman"` values instead of `"male"` and `"female"`.

## Data Structure After Migration

```json
{
  "gender": "Man",  // or "Woman"
  "interestedIn": ["Woman"],  // or ["Man"] or ["Man", "Woman"]
  "onboarding": {
    "data": {
      "gender": "Man",  // or "Woman"
      "interestedIn": ["Woman"]  // or ["Man"] or ["Man", "Woman"]
    }
  }
}
```

## Matching Query
The matching service queries:
```javascript
where('onboarding.data.gender', 'in', ['Man']) // or ['Woman'] or ['Man', 'Woman']
```

## Next Steps

1. **Run Migration:**
   - Start admin panel: `cd admin-web && npm run dev`
   - Navigate to: `http://localhost:3000/dashboard/migrate-users`
   - Upload `MongoUsers.json`
   - Click "Start Migration"

2. **Verify Migration:**
   - Run diagnostic: `node scripts/check-firestore-data.js`
   - Should show users with gender values "Man" and "Woman"

3. **Test App:**
   - Login to the app
   - Users should now appear in the swipe screen
   - Gender filtering should work correctly

## Migration Transforms

| MongoDB Value | Migrated Value |
|---------------|----------------|
| `"Male"` | `"Man"` |
| `"Female"` | `"Woman"` |
| `"Men"` | `["Man"]` |
| `"Women"` | `["Woman"]` |
| `"Both"` / `"Everyone"` | `["Man", "Woman"]` |
