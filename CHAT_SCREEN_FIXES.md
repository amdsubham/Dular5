# Chat Screen Fixes and Block/Report Features

## Overview

Fixed the chat screen to properly display user names and profile images, and added block and report user functionality with a clean action sheet UI.

---

## Issues Fixed

### 1. ✅ Name and Photo Not Showing

**Problem:**
- When clicking on a chat from the chats list, the user's name and profile image weren't displaying in the chat screen header

**Root Cause:**
- The chat screen expects `userId` and `userName` as URL parameters
- The chats list was only passing the `chatId` without the required user information

**Solution:**
Updated navigation in [app/(protected)/(root)/chats.tsx](app/(protected)/(root)/chats.tsx) to pass all required parameters:

```typescript
// ChatProfiles component (Online Now section)
onPress={() => {
  const fullName = `${otherUser.firstName}${
    otherUser.lastName ? ` ${otherUser.lastName}` : ""
  }`;
  router.push(
    `/chat/${chat.id}?userId=${otherUserId}&userName=${encodeURIComponent(
      fullName
    )}`
  );
}}

// ChatsList component (Recent Chats section)
onPress={() => {
  const fullName = `${otherUser.firstName}${
    otherUser.lastName ? ` ${otherUser.lastName}` : ""
  }`;
  router.push(
    `/chat/${chat.id}?userId=${otherUserId}&userName=${encodeURIComponent(
      fullName
    )}`
  );
}}
```

**What this does:**
- Constructs full name from first and last name
- Encodes the name for URL safety
- Passes `userId` and `userName` as query parameters
- Chat screen now receives all required data

---

## Features Added

### 2. ✅ Block User Feature

**What it does:**
- Allows users to block other users they don't want to interact with
- Blocking removes the match and deletes the chat
- Blocked users won't appear in swipe cards or matches

**Implementation:**

Added to [services/blocking.ts](services/blocking.ts#L214-L245):

```typescript
export const reportUser = async (
  reportedUserId: string,
  reason: string,
  description?: string
): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create a report document
    const reportRef = doc(collection(db, 'reports'));
    await setDoc(reportRef, {
      reporterId: currentUser.uid,
      reportedUserId: reportedUserId,
      reason: reason,
      description: description || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    console.log(`✅ User ${reportedUserId} reported successfully`);
    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
};
```

**UI Flow:**
```
1. User taps three dots (⋮) in chat header
   ↓
2. Action sheet opens with options
   ↓
3. User taps "Block User"
   ↓
4. Confirmation alert appears
   ↓
5. User confirms
   ↓
6. User is blocked, chat deleted
   ↓
7. User redirected back to chats list
```

**Database Structure:**
```
users/{userId}:
  blockedUsers: [userId1, userId2, ...]  // Array of blocked user IDs
```

### 3. ✅ Report User Feature

**What it does:**
- Allows users to report inappropriate behavior
- Multiple report reasons to choose from
- Reports are stored for admin review

**Report Reasons:**
1. **Inappropriate Content** - Offensive or inappropriate messages/images
2. **Spam or Scam** - Spam messages or scam attempts
3. **Harassment** - Bullying or harassment

**Implementation:**

UI in [app/(protected)/chat/[id].tsx](app/(protected)/chat/[id].tsx#L374-L419):

```typescript
const handleReportUser = () => {
  setShowActionsheet(false);
  Alert.alert(
    "Report User",
    "Please select a reason for reporting this user:",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Inappropriate Content",
        onPress: async () => {
          const success = await reportUser(userId, "Inappropriate Content");
          if (success) {
            Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.");
          }
        },
      },
      {
        text: "Spam or Scam",
        onPress: async () => {
          const success = await reportUser(userId, "Spam or Scam");
          if (success) {
            Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.");
          }
        },
      },
      {
        text: "Harassment",
        onPress: async () => {
          const success = await reportUser(userId, "Harassment");
          if (success) {
            Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.");
          }
        },
      },
    ]
  );
};
```

**Database Structure:**
```
reports/{reportId}:
  reporterId: string          // User who made the report
  reportedUserId: string      // User being reported
  reason: string              // Report reason
  description: string         // Optional details
  status: "pending" | "reviewed" | "resolved"
  createdAt: Timestamp
```

---

## UI Components Added

### Action Sheet Menu

**Location:** Chat screen header (three dots button)

**Visual:**
```
┌────────────────────────────────┐
│  ← [Photo] John Doe       ⋮   │ ← Header
└────────────────────────────────┘
           ↓ (tap ⋮)
┌────────────────────────────────┐
│                                │
│  ─────                         │ ← Drag indicator
│                                │
│  🚫 Block User                 │ ← Red text
│                                │
│  ⚠️  Report User               │ ← Red text
│                                │
│  Cancel                        │
│                                │
└────────────────────────────────┘
```

**Implementation:**
```typescript
<Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
  <ActionsheetBackdrop />
  <ActionsheetContent className="bg-background-0">
    <ActionsheetDragIndicatorWrapper>
      <ActionsheetDragIndicator />
    </ActionsheetDragIndicatorWrapper>

    <ActionsheetItem onPress={handleBlockUser}>
      <ActionsheetItemText className="font-roboto text-red-500">
        Block User
      </ActionsheetItemText>
    </ActionsheetItem>

    <ActionsheetItem onPress={handleReportUser}>
      <ActionsheetItemText className="font-roboto text-red-500">
        Report User
      </ActionsheetItemText>
    </ActionsheetItem>

    <ActionsheetItem onPress={() => setShowActionsheet(false)}>
      <ActionsheetItemText className="font-roboto">
        Cancel
      </ActionsheetItemText>
    </ActionsheetItem>
  </ActionsheetContent>
</Actionsheet>
```

---

## User Experience Flows

### Block User Flow

```
1. User opens chat with another user
2. Taps three dots (⋮) in header
3. Action sheet appears
4. Taps "Block User" (red text)
5. Confirmation dialog:
   "Block User
   Are you sure you want to block John? You won't be able to message each other anymore.
   [Cancel] [Block]"
6. Taps "Block"
7. User is blocked
8. Success message: "User Blocked - John has been blocked successfully."
9. Navigates back to chats list
10. Chat with John is removed
```

### Report User Flow

```
1. User opens chat with another user
2. Taps three dots (⋮) in header
3. Action sheet appears
4. Taps "Report User" (red text)
5. Report reason dialog:
   "Report User
   Please select a reason for reporting this user:
   [Cancel] [Inappropriate Content] [Spam or Scam] [Harassment]"
6. Selects a reason (e.g., "Harassment")
7. Report is submitted
8. Success message: "Report Submitted - Thank you for your report. We'll review it shortly."
9. User stays in chat (can continue chatting or block)
```

---

## Files Modified

### 1. [app/(protected)/(root)/chats.tsx](app/(protected)/(root)/chats.tsx)

**Changes:**
- Updated navigation in ChatProfiles component
- Updated navigation in ChatsList component
- Now passes `userId` and `userName` as URL parameters

**Lines changed:** ~125-133, ~203-211

### 2. [app/(protected)/chat/[id].tsx](app/(protected)/chat/[id].tsx)

**Changes:**
- Added imports for Alert, Actionsheet components, and blocking services
- Updated Header component to include `onMenuPress` prop
- Added `showActionsheet` state
- Added `handleBlockUser()` function
- Added `handleReportUser()` function
- Added Actionsheet UI component in return statement

**Key additions:**
- Block user confirmation dialog
- Report user reason selection
- Action sheet menu UI

### 3. [services/blocking.ts](services/blocking.ts)

**Changes:**
- Added `reportUser()` function for creating user reports

**Lines added:** 214-245

---

## Testing Checklist

### Name & Photo Display
- [ ] Click on a chat from "Online Now" section
- [ ] Verify name appears in header
- [ ] Verify profile image appears in header
- [ ] Verify online status shows correctly
- [ ] Click on a chat from "Recent Chats" section
- [ ] Verify all above work correctly

### Block User
- [ ] Open a chat
- [ ] Tap three dots (⋮) button
- [ ] Verify action sheet appears
- [ ] Tap "Block User"
- [ ] Verify confirmation dialog appears
- [ ] Tap "Cancel" - sheet closes
- [ ] Tap "Block" - user is blocked
- [ ] Verify success message appears
- [ ] Verify navigates back to chats
- [ ] Verify chat is removed from list

### Report User
- [ ] Open a chat
- [ ] Tap three dots (⋮) button
- [ ] Tap "Report User"
- [ ] Verify reason selection dialog appears
- [ ] Tap "Cancel" - dialog closes
- [ ] Tap a reason (e.g., "Spam or Scam")
- [ ] Verify success message appears
- [ ] Verify stays in chat

### Action Sheet
- [ ] Verify drag indicator shows
- [ ] Verify can drag down to close
- [ ] Verify backdrop tap closes sheet
- [ ] Verify "Cancel" button closes sheet

---

## Security Considerations

### Block Feature

**Protection:**
- Users can't block themselves
- Requires authentication
- Deletes match and chat immediately
- Prevents blocked user from appearing in swipe deck

**Privacy:**
- Blocked user is NOT notified
- Blocked user won't see blocker in their matches
- Previous messages are deleted

### Report Feature

**Protection:**
- Reports are anonymous to the reported user
- Reports include reporter ID for admin review
- Multiple reports can be submitted
- Status tracking (pending, reviewed, resolved)

**Admin Review:**
```
reports collection can be queried by admins:
- View all pending reports
- See user's report history
- Take action (warn, suspend, ban)
```

---

## Database Schema Updates

### Reports Collection (NEW)

```typescript
reports/{reportId}: {
  reporterId: string          // User who reported
  reportedUserId: string      // User being reported
  reason: string              // Selected reason
  description: string         // Optional details
  status: "pending"           // Default status
  createdAt: Timestamp        // When reported
}
```

**Indexes Required:**
```
Collection: reports
Fields: reportedUserId (Ascending), status (Ascending)
Purpose: Query all reports for a specific user
```

---

## Future Enhancements

### 1. View Profile Option

```typescript
<ActionsheetItem onPress={() => router.push(`/user-profile/${userId}`)}>
  <ActionsheetItemText className="font-roboto">
    View Profile
  </ActionsheetItemText>
</ActionsheetItem>
```

### 2. Mute Notifications

```typescript
<ActionsheetItem onPress={handleMuteChat}>
  <ActionsheetItemText className="font-roboto">
    {isMuted ? "Unmute" : "Mute"} Notifications
  </ActionsheetItemText>
</ActionsheetItem>
```

### 3. Delete Chat (without blocking)

```typescript
<ActionsheetItem onPress={handleDeleteChat}>
  <ActionsheetItemText className="font-roboto text-red-500">
    Delete Chat
  </ActionsheetItemText>
</ActionsheetItem>
```

### 4. Report with Description

```typescript
const handleReportWithDetails = () => {
  // Show modal with text input for description
  setShowReportModal(true);
};
```

### 5. Admin Dashboard

- View all reports
- Filter by status (pending/reviewed/resolved)
- User report history
- Take action buttons (warn/suspend/ban)

---

## Troubleshooting

### Name/Photo not showing

**Check:**
1. Are userId and userName in URL?
   ```javascript
   console.log('URL params:', params);
   // Should show: { id: 'chat123', userId: 'user456', userName: 'John Doe' }
   ```

2. Is navigation passing params?
   ```javascript
   // In chats.tsx
   console.log('Navigating with:', userId, userName);
   ```

3. Is chat data enriched?
   ```javascript
   // In chat screen
   console.log('User image:', userImage);
   console.log('User name:', userName);
   ```

### Block not working

**Check:**
1. Is blockUser function called?
   ```javascript
   console.log('Blocking user:', userId);
   ```

2. Check Firestore rules:
   ```
   users/{userId}: allow update if request.auth.uid == userId
   ```

3. Check if user is authenticated:
   ```javascript
   console.log('Current user:', currentUser);
   ```

### Report not saving

**Check:**
1. Is reportUser function called?
   ```javascript
   console.log('Reporting user:', userId, reason);
   ```

2. Check Firestore rules:
   ```
   reports/{reportId}: allow create if request.auth != null
   ```

3. Check report document:
   ```javascript
   // In Firebase Console
   // Navigate to reports collection
   // Should see new documents
   ```

---

## Summary

✅ **Fixed name and photo not showing** - Now passes userId and userName in navigation
✅ **Added block user feature** - With confirmation dialog and chat deletion
✅ **Added report user feature** - With multiple report reasons
✅ **Added action sheet UI** - Clean bottom sheet with drag indicator
✅ **User-friendly alerts** - Clear feedback for all actions
✅ **Security measures** - Authenticated actions, proper data cleanup
✅ **Database schema** - New reports collection for admin review

Users can now see who they're chatting with AND have tools to block or report inappropriate users! 🛡️✨
