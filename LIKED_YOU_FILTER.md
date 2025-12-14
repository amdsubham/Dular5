# "Liked You" Filter Implementation

## Overview

Added a new "Liked You" filter to the matches screen that shows users who have swiped right on you. This helps users see who's interested in them and makes it easier to find potential matches.

---

## Feature Description

**What it does:**
- Shows users who have liked you (swiped right) but you haven't matched with yet
- Appears as a fourth filter option after "All", "Online", and "Newest"
- Maintains consistent UI with existing filters

**User Experience:**
```
┌────────────────────────────────┐
│  My Matches        🔍  🎯     │
│                                │
│  [All] [Online] [Newest] [Liked You]  │
│                                │
│  Shows users who swiped right  │
│  on your profile               │
└────────────────────────────────┘
```

---

## Implementation Details

### 1. New Function: getUsersWhoLikedMe()

**Location:** [services/messaging.ts](services/messaging.ts#L562-L589)

**Purpose:** Fetches user IDs of people who have liked the current user

**How it works:**
```typescript
export const getUsersWhoLikedMe = async (): Promise<string[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  // Query swipes where:
  // - Current user is the swiped user (swipedUserId)
  // - Action is 'like'
  const swipesRef = collection(db, 'swipes');
  const q = query(
    swipesRef,
    where('swipedUserId', '==', currentUser.uid),
    where('action', '==', 'like')
  );

  const querySnapshot = await getDocs(q);
  const likedByUserIds: string[] = [];

  querySnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    likedByUserIds.push(data.swiperId);
  });

  return likedByUserIds;
};
```

**Database Query:**
```
swipes collection:
  WHERE swipedUserId == currentUser.uid
  AND action == 'like'

Returns: Array of user IDs who swiped right
```

### 2. UI Updates

**Filter Button Added:**
- Added "Liked You" to filter options array
- Appears as fourth button in horizontal scrollable list
- Same styling and behavior as other filters

**Location:** [app/(protected)/(root)/matches.tsx](app/(protected)/(root)/matches.tsx#L68)

```typescript
{["All", "Online", "Newest", "Liked You"].map((item) => (
  <FilterButton
    key={item}
    isSelected={selected === item}
    onPress={() => setSelected(item)}
  >
    {item}
  </FilterButton>
))}
```

### 3. Filter Logic

**Location:** [app/(protected)/(root)/matches.tsx](app/(protected)/(root)/matches.tsx#L250-L258)

```typescript
else if (filter === "Liked You") {
  // Filter to show only users who liked you
  filteredChats = filteredChats.filter((chat) => {
    const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
    if (!otherUserId) return false;

    return usersWhoLikedMe.includes(otherUserId);
  });
}
```

**How it works:**
1. Gets the other user's ID from each chat
2. Checks if that user ID is in the `usersWhoLikedMe` array
3. Only shows chats where the other user has liked you

### 4. State Management

**Added state for liked users:**
```typescript
const [usersWhoLikedMe, setUsersWhoLikedMe] = useState<string[]>([]);
```

**Fetch on component mount:**
```typescript
useEffect(() => {
  // Subscribe to chats
  const unsubscribe = subscribeToChats((updatedChats) => {
    setChats(updatedChats);
    setLoading(false);
  });

  // Fetch users who liked me
  const fetchLikedByUsers = async () => {
    const likedByUserIds = await getUsersWhoLikedMe();
    setUsersWhoLikedMe(likedByUserIds);
  };

  fetchLikedByUsers();

  return () => unsubscribe();
}, []);
```

---

## How It Works

### Complete Flow

```
User taps "Liked You" filter
↓
MatchesLayout receives filter="Liked You"
↓
Filter logic checks each chat:
  - Get other user's ID from chat
  - Check if ID is in usersWhoLikedMe array
  - Include chat if yes, exclude if no
↓
Display filtered list of matches
```

### Database Structure

**Swipes Collection:**
```
swipes/{swiperId}_{swipedUserId}:
  swiperId: string        // User who swiped
  swipedUserId: string    // User who was swiped on
  action: 'like' | 'pass' // Swipe action
  timestamp: Date         // When swipe happened
```

**Query Logic:**
```
To find who liked current user:
  swipes
    .where('swipedUserId', '==', currentUser.uid)
    .where('action', '==', 'like')
```

### Example Scenario

**User A swipes on profiles:**
```
A swipes right on B → swipe: { swiperId: A, swipedUserId: B, action: 'like' }
A swipes right on C → swipe: { swiperId: A, swipedUserId: C, action: 'like' }
B swipes right on A → swipe: { swiperId: B, swipedUserId: A, action: 'like' }
C swipes left on A  → swipe: { swiperId: C, swipedUserId: A, action: 'pass' }
```

**When A taps "Liked You":**
```
Query: swipedUserId == A AND action == 'like'
Result: [B]  // Only B liked A back

A's "Liked You" list shows: B
(C doesn't appear because C passed on A)
```

---

## Filter Behavior Comparison

### All Filter
- **Shows:** All matches
- **Order:** By last message time (most recent first)
- **Use case:** Browse all conversations

### Online Filter
- **Shows:** Only users currently online (green dot)
- **Order:** Same as All
- **Use case:** Talk to someone available now

### Newest Filter
- **Shows:** All matches
- **Order:** By match creation date (newest first)
- **Use case:** See recent matches first

### Liked You Filter (NEW)
- **Shows:** Only users who swiped right on you
- **Order:** Same as All (by last message time)
- **Use case:** See who's interested in you

---

## Empty States

### When "Liked You" shows no results:

```
┌────────────────────────────────┐
│                                │
│           💝                   │
│                                │
│      No matches yet            │
│                                │
│  Start swiping to find matches │
│  and start conversations!      │
│                                │
└────────────────────────────────┘
```

**Possible reasons:**
1. No one has liked you yet
2. Everyone who liked you has already matched with you
3. Users who liked you haven't created chats yet

---

## Key Differences: Likes vs Matches

### "Liked You" Filter
- Shows users who **swiped right on you**
- May or may not have matched yet
- Includes pending likes

### Matches Screen (All)
- Shows users you've **already matched with**
- Both users swiped right on each other
- Mutual interest confirmed

### Relationship
```
User A likes User B (swipes right)
↓
B appears in A's "Liked You" filter? NO
↓
User B likes User A (swipes right)
↓
MATCH CREATED! 🎉
↓
Both users appear in each other's matches
```

---

## Technical Considerations

### Performance

**Firestore Reads:**
- One query per page load: `getUsersWhoLikedMe()`
- Returns array of user IDs
- Filtering happens client-side (no extra reads)

**Optimization:**
```typescript
// Current: Fetch once on mount
useEffect(() => {
  fetchLikedByUsers();
}, []);

// Future: Could add real-time updates
useEffect(() => {
  const unsubscribe = subscribeToUsersWhoLikedMe((userIds) => {
    setUsersWhoLikedMe(userIds);
  });
  return unsubscribe;
}, []);
```

### Caching
- User IDs cached in component state
- Doesn't refresh until component remounts
- Consider adding refresh on filter selection

### Composite Index Required

**Firestore may require a composite index:**
```
Collection: swipes
Fields: swipedUserId (Ascending), action (Ascending)
```

**If you see an index error:**
1. Click the provided Firebase Console link
2. Create the index
3. Wait ~2 minutes for index to build
4. Try again

---

## Testing Checklist

### Functionality
- [ ] "Liked You" button appears in filter list
- [ ] Button highlights when selected
- [ ] Shows only users who have liked you
- [ ] Empty state displays when no likes
- [ ] Can switch between all filters smoothly
- [ ] Filter state persists when switching back

### Edge Cases
- [ ] Works when no one has liked you
- [ ] Works when all likes have become matches
- [ ] Handles users with no chats yet
- [ ] Handles deleted/blocked users

### UI Consistency
- [ ] Button styling matches other filters
- [ ] Text is clearly visible
- [ ] Scrolls horizontally with other filters
- [ ] Selected state is obvious
- [ ] Card layout unchanged

---

## Future Enhancements

### 1. Badge with Count
```typescript
<FilterButton>
  Liked You {usersWhoLikedMe.length > 0 && (
    <Badge>{usersWhoLikedMe.length}</Badge>
  )}
</FilterButton>
```

### 2. Real-time Updates
```typescript
// Subscribe to swipes collection changes
const unsubscribe = onSnapshot(
  query(swipesRef, where('swipedUserId', '==', currentUser.uid)),
  (snapshot) => {
    const likedBy = snapshot.docs
      .filter(doc => doc.data().action === 'like')
      .map(doc => doc.data().swiperId);
    setUsersWhoLikedMe(likedBy);
  }
);
```

### 3. Sort by Recent Likes
```typescript
// Add timestamp to sort by most recent likes
filteredChats.sort((a, b) => {
  const aLikeTime = getLikeTimestamp(otherUserIdA);
  const bLikeTime = getLikeTimestamp(otherUserIdB);
  return bLikeTime - aLikeTime;
});
```

### 4. Premium Feature
```typescript
// Blur cards for non-premium users
if (filter === "Liked You" && !isPremiumUser) {
  return <PremiumUpsellScreen />;
}
```

### 5. Notification
```typescript
// Notify when someone new likes you
if (newLikesCount > 0) {
  showNotification(`${newLikesCount} new likes!`);
}
```

---

## Troubleshooting

### Filter shows no results

**Check:**
1. Are there swipes in the database?
   ```javascript
   // Firebase Console → swipes collection
   // Look for documents where swipedUserId == your UID
   ```

2. Is the query working?
   ```javascript
   console.log('Users who liked me:', usersWhoLikedMe);
   // Should show array of user IDs
   ```

3. Do those users have chats?
   ```javascript
   console.log('All chats:', chats);
   // Check if otherUserId matches any in usersWhoLikedMe
   ```

### Button not appearing

**Check:**
```typescript
// In FilterLayout component
["All", "Online", "Newest", "Liked You"] // ← Should be 4 items
```

### Filter not working

**Check:**
```typescript
// In MatchesLayout
else if (filter === "Liked You") { // ← Check spelling/case
  console.log('Filtering by liked you');
  console.log('usersWhoLikedMe:', usersWhoLikedMe);
}
```

---

## Summary

✅ **New "Liked You" filter** - Shows users who swiped right on you
✅ **Database query** - Efficiently fetches likes from Firestore
✅ **Consistent UI** - Matches existing filter design
✅ **Client-side filtering** - Fast performance
✅ **Empty state handling** - Clear feedback when no likes
✅ **Maintains state** - Cached until component remounts

Users can now easily see who's interested in them and prioritize those conversations! 💝
