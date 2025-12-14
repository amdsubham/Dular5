# Analytics Configuration

This app uses Vexo Analytics for comprehensive user-level tracking.

## ⚡ Quick Setup (2 minutes)

1. **Get your Vexo API key** from [https://vexo.co](https://vexo.co)
   - Sign up/login
   - Create a project
   - Copy your API key

2. **Configure the app**:
   ```bash
   # Copy the environment template
   cp .env.example .env

   # Edit .env and add your API key
   # EXPO_PUBLIC_VEXO_API_KEY=your_key_here
   ```

3. **Restart the server**:
   ```bash
   npm start
   ```

That's it! Your app now tracks all user actions automatically. ✅

## 📚 Documentation

- **Quick Start**: [VEXO_QUICK_START.md](VEXO_QUICK_START.md) - 2-minute setup guide
- **Full Guide**: [VEXO_ANALYTICS_SETUP.md](VEXO_ANALYTICS_SETUP.md) - Complete documentation
- **Files**:
  - `services/analytics.ts` - Analytics service
  - `contexts/AnalyticsContext.tsx` - React context
  - `.env` - Configuration file (create from `.env.example`)

## 🎯 What's Being Tracked

The app automatically tracks:
- User authentication (signup, login, logout)
- Onboarding progress
- Screen views
- Match actions (like, pass, superlike)
- Messages sent
- Subscription events
- App sessions
- Errors

All events are tied to individual users for detailed analytics!

## 🔍 Verify It's Working

1. Start your app
2. Look for this in console: `✓ Vexo Analytics initialized successfully`
3. Perform actions (login, navigate screens)
4. Check your Vexo dashboard for real-time events

## 💡 Usage

Analytics is already integrated throughout the app. To add custom tracking:

```typescript
import { analytics } from '@/services/analytics';

// Track any event
await analytics.track('button_clicked', {
  buttonName: 'Save Profile',
  screen: 'Settings',
});

// Use pre-built methods
await analytics.trackMatchAction('like', userId);
await analytics.trackPayment('success', 999, 'Premium');
```

## ⚠️ Important

- Keep your API key secret (`.env` is in `.gitignore`)
- Use different keys for development and production
- Check Vexo dashboard regularly for insights

---

**Need help?** See [VEXO_QUICK_START.md](VEXO_QUICK_START.md) or contact Vexo support.
