# ✅ Vexo Analytics Setup Checklist

Use this checklist to ensure Vexo analytics is properly configured.

## Setup Steps

- [ ] **Get Vexo Account**
  - [ ] Visit https://vexo.co
  - [ ] Sign up or log in
  - [ ] Create a new project

- [ ] **Get API Key**
  - [ ] Navigate to project settings
  - [ ] Find API Keys section
  - [ ] Copy your API key

- [ ] **Configure App**
  - [ ] Open `.env` file in root directory
  - [ ] Add line: `EXPO_PUBLIC_VEXO_API_KEY=your_actual_key_here`
  - [ ] Save the file
  - [ ] Verify `.env` is in `.gitignore` (already done ✓)

- [ ] **Restart Server**
  - [ ] Stop current Expo server (Ctrl+C)
  - [ ] Run `npm start`
  - [ ] Wait for server to start

## Verification

- [ ] **Check Console**
  - [ ] Look for: "Vexo Analytics initialized successfully"
  - [ ] No error messages about Vexo

- [ ] **Test Authentication**
  - [ ] Log in with phone number
  - [ ] Check console for: "Event tracked: user_logged_in"
  - [ ] Check Vexo dashboard for login event

- [ ] **Test Onboarding**
  - [ ] Complete one onboarding step
  - [ ] Check console for: "Event tracked: onboarding_step"
  - [ ] Check Vexo dashboard for onboarding event

- [ ] **Test Screen Tracking**
  - [ ] Navigate between screens
  - [ ] Check console for: "Screen tracked: [Screen Name]"
  - [ ] Check Vexo dashboard for screen view events

- [ ] **Check User Properties**
  - [ ] Complete onboarding fully
  - [ ] Open Vexo dashboard
  - [ ] Go to Users section
  - [ ] Find your user
  - [ ] Verify properties (name, gender, etc.) are set

## Troubleshooting

If events aren't appearing:

- [ ] **API Key Issues**
  - [ ] Verify API key is correct
  - [ ] Check for extra spaces or quotes in `.env`
  - [ ] Confirm key is from correct Vexo project

- [ ] **App Issues**
  - [ ] Restart development server
  - [ ] Clear Metro cache: `npm start --clear`
  - [ ] Check for JavaScript errors in console

- [ ] **Network Issues**
  - [ ] Verify internet connection
  - [ ] Check firewall settings
  - [ ] Try on different network

- [ ] **Dashboard Issues**
  - [ ] Wait 10-15 seconds for events to appear
  - [ ] Refresh dashboard
  - [ ] Check correct project is selected

## Success Indicators

✅ **You're all set when you see:**

1. Console shows: "Vexo Analytics initialized successfully"
2. Events appear in console when actions are performed
3. Events appear in Vexo dashboard (may take 5-10 seconds)
4. User properties are updating in dashboard
5. No error messages about Vexo in console

## Next Steps

Once verified:

- [ ] Read [VEXO_ANALYTICS_SETUP.md](VEXO_ANALYTICS_SETUP.md) for full documentation
- [ ] Explore Vexo dashboard features
- [ ] Set up custom events if needed
- [ ] Configure alerts in Vexo dashboard
- [ ] Review analytics weekly

## Support

Need help?

- 📖 **Documentation**: [VEXO_ANALYTICS_SETUP.md](VEXO_ANALYTICS_SETUP.md)
- ⚡ **Quick Start**: [VEXO_QUICK_START.md](VEXO_QUICK_START.md)
- 🆘 **Vexo Support**: support@vexo.co
- 📚 **Vexo Docs**: https://docs.vexo.co

---

**Date Completed**: _______________

**API Key Added**: ☐ Yes ☐ No

**Events Verified**: ☐ Yes ☐ No

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
