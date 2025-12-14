# User Migration Guide

## Overview

This guide explains how to migrate users from MongoDB to Firestore using the admin panel's migration feature.

## Features

✅ Upload MongoDB JSON export
✅ Automatic field mapping from MongoDB to Firestore structure
✅ Validation before migration
✅ Preview of users to be migrated
✅ Real-time progress tracking
✅ Detailed success/failure reporting
✅ Sets default location for all migrated users

---

## How to Use

### Step 1: Prepare Your MongoDB Data

Export your MongoDB users collection to a JSON file. The file should be an array of user objects.

**Example format:**

```json
[
  {
    "_id": { "$oid": "6726326c5324b59703facd07" },
    "id": "08Y2j7hyESh7mF5IzORRgbHoxAB3",
    "name": "Baba Tudu",
    "job": "Farmer",
    "gender": "Male",
    "genderOfInterest": "Men",
    "photoUrl": "https://...",
    "rating": 4,
    "age": 25,
    "interests": ["Travel", "Music"],
    "createdAt": "2024-09-25T14:05:48.848582",
    "lastUpdated": "2024-09-25T14:05:48.848582"
  }
]
```

### Step 2: Access the Migration Page

1. Log in to the admin panel
2. Navigate to **"Migrate Users"** in the sidebar
3. The migration page will open

### Step 3: Upload JSON File

1. Click **"Choose JSON File"** button
2. Select your MongoDB export JSON file
3. The system will automatically:
   - Validate the file structure
   - Show any validation errors
   - Display a preview of the first 5 users

### Step 4: Review Preview

Before migrating, review the preview table to ensure:
- User IDs are correct
- Names are properly formatted
- Gender and preferences are accurate

### Step 5: Start Migration

1. Click **"Start Migration"** button
2. Watch the real-time progress bar
3. Wait for migration to complete (approx. 100ms per user)

### Step 6: Review Results

After migration completes, you'll see:
- **Total Users**: Number of users processed
- **Successful**: Users successfully migrated
- **Failed**: Users that failed (with error details)

If any users failed, you'll see a detailed table with:
- User ID
- Error message

---

## Field Mapping

### MongoDB → Firestore Mapping

| MongoDB Field | Firestore Field | Notes |
|--------------|----------------|-------|
| `id` | `uid` | Firebase user ID |
| `name` | `firstName` + `lastName` | Split by space |
| `gender` | `gender` | Lowercase: male/female/other |
| `genderOfInterest` | `interestedIn` | Array format |
| `photoUrl` | `pictures[0]` | First picture |
| `photos` | `pictures` | All pictures |
| `age` | `age` | Calculated age |
| `rating` | `rating` | Star rating (0-5) |
| `interests` | `interests` | Array of interests |
| `job` | - | Not migrated |
| `createdAt` | `createdAt` | Timestamp |
| `lastUpdated` | `updatedAt` | Timestamp |

### Auto-Generated Fields

These fields are automatically set for all migrated users:

| Field | Value |
|-------|-------|
| `location.latitude` | 23.3516935 |
| `location.longitude` | 85.2543815 |
| `location.city` | "Ranchi" |
| `onboarding.completed` | `true` |
| `isActive` | `true` |
| `isOnline` | `false` |
| `blockedUsers` | `[]` |
| `lookingFor` | ["Long-term relationship", "Friendship"] |
| `notificationSettings` | All enabled |

---

## Validation Rules

The migration tool validates:

1. ✅ File must be valid JSON
2. ✅ Data must be an array
3. ✅ Array must not be empty
4. ✅ Each user must have an `id` field
5. ✅ File size must be reasonable

---

## Gender Mapping

| MongoDB Value | Firestore Value |
|--------------|----------------|
| "Male", "male", "MEN" | "male" |
| "Female", "female", "WOMEN" | "female" |
| Other | "other" |

**Interested In Mapping:**

| MongoDB `genderOfInterest` | Firestore `interestedIn` |
|---------------------------|------------------------|
| "Men", "Male" | ["male"] |
| "Women", "Female" | ["female"] |
| "Men and Women" | ["male", "female"] |
| Not specified | Opposite of user's gender |

---

## Date of Birth Calculation

If `age` is provided:
```
DOB = Current Year - Age (January 1st)
```

If `age` is not provided:
```
Default age = 25
```

---

## Phone Number Generation

If `phoneNumber` is not provided:
```
Random 10-digit number with +91 prefix
```

---

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "Data must be an array" | Ensure JSON root is `[...]` not `{...}` |
| "Array is empty" | Add users to the JSON array |
| "User missing required field: id" | Every user needs an `id` field |
| "Failed to parse JSON" | Check JSON syntax with validator |
| "Permission denied" | Check Firebase rules for admin write access |

---

## Best Practices

1. **Test with small batch first**: Upload 5-10 users first to verify
2. **Backup MongoDB data**: Keep original data safe
3. **Verify in Firestore**: Check Firebase Console after migration
4. **Monitor failed users**: Review error logs for failed migrations
5. **Don't upload duplicates**: Check if users already exist

---

## Migration Performance

- **Speed**: ~100ms per user
- **10 users**: ~1 second
- **100 users**: ~10 seconds
- **1000 users**: ~100 seconds (~1.7 minutes)

---

## After Migration

### Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Check the `users` collection
5. Verify user documents have all required fields

### Check User Subscriptions

All migrated users automatically get:
- **Free plan** subscription
- Default swipe limits (5 swipes/day)
- No payment history

You can upgrade users from the **Subscriptions** page.

---

## Troubleshooting

### Migration is stuck

- Refresh the page
- Check internet connection
- Verify Firebase credentials

### Some users failed

- Check error messages in results table
- Verify user IDs are unique
- Ensure all required fields exist

### Users not appearing in app

- Check `onboarding.completed` is `true`
- Verify `isActive` is `true`
- Check location data is set

---

## Support

For issues or questions:
1. Check error messages in migration results
2. Review Firebase Console logs
3. Contact development team

---

## Example Migration Flow

```
1. Export MongoDB users → users.json
2. Open admin panel → Migrate Users
3. Upload users.json
4. Review preview (5 users shown)
5. Click "Start Migration"
6. Wait for completion
7. Review results:
   - Total: 100
   - Success: 98
   - Failed: 2
8. Check failed users table
9. Fix errors in JSON
10. Re-upload failed users
11. Verify in Firebase Console
```

---

## Security Notes

⚠️ **Important**:
- Only admins can access migration page
- Migration cannot be undone via UI
- Existing users with same ID will be merged (not replaced)
- Always backup data before migration

---

## Next Steps After Migration

1. ✅ Verify users in Firebase Console
2. ✅ Test login with migrated user credentials
3. ✅ Check user profiles appear correctly in app
4. ✅ Verify matching system finds migrated users
5. ✅ Set up user subscriptions if needed
6. ✅ Send welcome notifications (optional)

---

**Happy Migrating! 🚀**
