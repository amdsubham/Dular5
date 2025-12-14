# Phone Number Extraction from Email - Update

## Feature Added
The migration service now intelligently extracts phone numbers from email addresses when:
1. No phone number field exists in MongoDB data
2. Email field exists and starts with a digit

## How It Works

### Logic Flow:
```
1. Check if user already has phoneNumber field
   ↓ YES → Use that phone number
   ↓ NO  → Go to step 2

2. Check if user has email field
   ↓ YES → Go to step 3
   ↓ NO  → Generate random phone number

3. Extract part before @ symbol
   Example: "8144966816@gmail.com" → "8144966816"

4. Check if it starts with a digit
   ↓ YES → Go to step 5
   ↓ NO  → Generate random phone number

5. Extract all digits from email prefix
   Example: "8144966816abc" → "8144966816"

6. Check if at least 10 digits
   ↓ YES → Go to step 7
   ↓ NO  → Generate random phone number

7. Format with country code
   - If starts with "91": +{digits}
   - Otherwise: +91{digits}
```

## Examples

### Example 1: Email with phone number
```json
{
  "email": "8144966816@gmail.com",
  "phoneNumber": null
}
```
**Result:**
- Extracted: `8144966816`
- Formatted: `+918144966816`
- Email: `8144966816@gmail.com` (preserved)

### Example 2: Email without phone number
```json
{
  "email": "subhajit.hembram.3@gmail.com",
  "phoneNumber": null
}
```
**Result:**
- Cannot extract (doesn't start with digit)
- Generated: `+919876543210` (random)
- Email: `subhajit.hembram.3@gmail.com` (preserved)

### Example 3: Phone number already exists
```json
{
  "email": "8144966816@gmail.com",
  "phoneNumber": "+919876543210"
}
```
**Result:**
- Uses existing: `+919876543210`
- Email: `8144966816@gmail.com` (preserved)

### Example 4: Email with mixed characters
```json
{
  "email": "91123456789abc@gmail.com",
  "phoneNumber": null
}
```
**Result:**
- Extracted digits: `91123456789`
- Formatted: `+91123456789`
- Email: `91123456789abc@gmail.com` (preserved)

## Code Implementation

### Phone Extraction Logic:
```typescript
// Extract phone number from email or use existing phoneNumber
let phoneNumber = mongoUser.phoneNumber || null;

// If no phone number but email exists and starts with a digit
if (!phoneNumber && mongoUser.email) {
  const emailBeforeAt = mongoUser.email.split('@')[0];
  // Check if the part before @ starts with a digit
  if (emailBeforeAt && /^\d/.test(emailBeforeAt)) {
    // Extract all digits from the email prefix
    const digitsOnly = emailBeforeAt.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      // Add +91 prefix if not already present
      phoneNumber = digitsOnly.startsWith('91')
        ? `+${digitsOnly}`
        : `+91${digitsOnly}`;
    }
  }
}

// Generate random phone if still no phone number
if (!phoneNumber) {
  phoneNumber = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}
```

## Benefits

✅ **Preserves real phone numbers** - Users who used their phone as email get their actual number
✅ **Keeps email intact** - Email is stored separately and unchanged
✅ **Fallback safety** - Still generates random number if extraction fails
✅ **Smart formatting** - Automatically adds +91 country code
✅ **Non-destructive** - Doesn't modify existing phone numbers

## Testing

To verify this works, check migrated users in Firestore:

### User with phone in email:
```
MongoDB Input:
{
  "id": "xyz",
  "email": "8144966816@gmail.com"
}

Firestore Output:
{
  "uid": "xyz",
  "phoneNumber": "+918144966816",
  "email": "8144966816@gmail.com"
}
```

### User without phone in email:
```
MongoDB Input:
{
  "id": "abc",
  "email": "john.doe@gmail.com"
}

Firestore Output:
{
  "uid": "abc",
  "phoneNumber": "+919123456789",  // Random generated
  "email": "john.doe@gmail.com"
}
```

## Real Data Example

From your MongoUsers.json:

**User: Mansing Hembram**
```json
{
  "name": "Mansing Hembram",
  "email": "8144966816@gmail.com",
  "phoneNumber": null
}
```

**After Migration:**
```json
{
  "firstName": "Mansing",
  "lastName": "Hembram",
  "phoneNumber": "+918144966816",  // ← Extracted from email!
  "email": "8144966816@gmail.com"
}
```

## Edge Cases Handled

| Input Email | Extracted Digits | Final Phone Number | Reason |
|-------------|------------------|-------------------|---------|
| `8144966816@gmail.com` | `8144966816` | `+918144966816` | Valid 10-digit number |
| `918144966816@gmail.com` | `918144966816` | `+918144966816` | Already has country code |
| `81449@gmail.com` | `81449` | `+919876543210` (random) | Less than 10 digits |
| `abc123@gmail.com` | - | `+919876543210` (random) | Doesn't start with digit |
| `123abc456@gmail.com` | `123456` | `+919876543210` (random) | Less than 10 digits |

## Status

✅ **IMPLEMENTED AND READY**

This feature is now active in the migration service. All users being migrated will:
1. Keep their existing phone numbers (if present)
2. Get phone extracted from email (if email starts with digit)
3. Get random phone generated (if neither above works)

Both phone number and email are stored, so no data is lost!
