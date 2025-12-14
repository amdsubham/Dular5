# Vexo Analytics - Quick Start Guide

## Get Your API Key in 3 Steps

### Step 1: Sign Up for Vexo

1. Visit [https://vexo.co](https://vexo.co)
2. Click "Sign Up" or "Get Started"
3. Create your account

### Step 2: Get Your API Key

1. Log in to your Vexo dashboard
2. Create a new project (or select an existing one)
3. Go to **Settings** > **API Keys**
4. Copy your API key

### Step 3: Configure the App

1. Open the `.env` file in the root directory of your project
2. Replace `YOUR_VEXO_API_KEY_HERE` with your actual API key:

```env
EXPO_PUBLIC_VEXO_API_KEY=vx_live_abc123xyz456...
```

3. Save the file

### Step 4: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## Verify It's Working

1. Run your app:
   ```bash
   npm start
   ```

2. Check the console logs for:
   ```
   ✓ Vexo Analytics initialized successfully
   ```

3. Perform an action in the app (like logging in)

4. Go to your Vexo dashboard and check the **Live Events** or **Events** tab

5. You should see events appearing in real-time!

## Common Issues

### "Vexo not initialized" warnings

**Cause:** API key not configured or invalid

**Solution:**
- Check that your API key is correct in `.env`
- Ensure there are no extra spaces or quotes around the key
- Restart the development server

### Events not appearing in dashboard

**Cause:** Network connectivity or API key issues

**Solution:**
- Verify your API key is valid in Vexo dashboard
- Check your internet connection
- Events may take 5-10 seconds to appear
- Check console for error messages

### "Module not found: vexo-analytics"

**Cause:** Package not installed

**Solution:**
```bash
npm install vexo-analytics
```

## What Happens Next?

Once configured, your app will automatically track:

- ✅ User signups and logins
- ✅ Onboarding progress
- ✅ Screen views
- ✅ User actions (likes, messages, etc.)
- ✅ Subscription events
- ✅ App sessions
- ✅ Errors and issues

All events are tied to individual users for detailed analytics!

## Need Help?

- **Full Documentation**: See [VEXO_ANALYTICS_SETUP.md](VEXO_ANALYTICS_SETUP.md)
- **Vexo Docs**: [https://docs.vexo.co](https://docs.vexo.co)
- **Vexo Support**: support@vexo.co

## Test Your Integration

Run these commands to test:

```bash
# 1. Start the app
npm start

# 2. In another terminal, check logs
# Look for "Vexo Analytics initialized successfully"

# 3. Perform these actions in your app:
#    - Log in with a phone number
#    - Complete onboarding steps
#    - Navigate between screens

# 4. Check your Vexo dashboard
# You should see events for each action!
```

## Pro Tips

1. **Development vs Production**: Use different API keys for dev and production
2. **User Privacy**: Vexo automatically anonymizes sensitive data
3. **Event Limits**: Free tier has event limits, check your plan
4. **Custom Events**: Add custom tracking using the analytics service

Happy tracking! 🎉
