# Firebase Phone Authentication Setup Guide

## Current Issue: Billing Not Enabled

Firebase Phone Authentication requires billing to be enabled on your Firebase project. You have two options:

## Option 1: Enable Billing (For Production)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dular5**
3. Go to **Project Settings** (gear icon)
4. Click on **Usage and billing**
5. Click **Modify plan** or **Upgrade**
6. Select the **Blaze (pay-as-you-go)** plan
7. Complete the billing setup

**Note:** Firebase Phone Authentication has a free tier:
- 10,000 verifications/month are free
- After that, it's $0.06 per verification

## Option 2: Use Test Phone Numbers (For Development)

You can test phone authentication without billing by using test phone numbers:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dular5**
3. Go to **Authentication** > **Sign-in method**
4. Click on **Phone** provider
5. Scroll down to **Phone numbers for testing**
6. Click **Add phone number**
7. Add test numbers in format: `+917008105210`
8. Add the verification code (e.g., `123456`)
9. Click **Save**

### Using Test Phone Numbers

When you use a test phone number:
- No actual SMS is sent
- The verification code is always the one you set (e.g., `123456`)
- No billing required
- Works immediately

### Example Test Setup:
- Phone Number: `+917008105210`
- Verification Code: `123456`

## Current Configuration

Your Firebase project details:
- Project ID: `dular5`
- Auth Domain: `dular5.firebaseapp.com`
- API Key: `AIzaSyC6StBKCQ3iTXEgKGHLwZgM_pa4OquxYSw`

## Next Steps

1. **For Development**: Set up test phone numbers (Option 2) - Recommended for now
2. **For Production**: Enable billing (Option 1) - Required before launch

## Troubleshooting

### Error: `auth/billing-not-enabled`
- Solution: Enable billing OR use test phone numbers

### Error: `auth/invalid-phone-number`
- Solution: Ensure phone number includes country code (e.g., +91 for India)

### Error: `auth/too-many-requests`
- Solution: Wait a few minutes before trying again

### Not Receiving OTP
- Check if phone number is added to test numbers
- Verify billing is enabled (if not using test numbers)
- Check Firebase Console logs for errors

## Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/phone-auth)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Test Phone Numbers Guide](https://firebase.google.com/docs/auth/phone-auth#test-with-verification-codes)

