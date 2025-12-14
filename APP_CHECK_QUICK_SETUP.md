# Firebase App Check - Quick Setup (10 mins)

## Your Fingerprints (Copy these!)

### Release SHA-256:
```
50:38:FC:DF:35:7C:01:49:FB:BF:9C:6C:EC:73:08:FC:45:39:0F:AF:23:5C:E9:54:8A:07:89:02:EB:34:1A:A5
```

### Debug SHA-256:
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

---

## Quick Steps

### 1. Firebase Console (5 min)
🔗 https://console.firebase.google.com/project/dular5/settings/general

1. Go to **Project Settings**
2. Find app: `com.santali.dating`
3. Click **Add fingerprint** (do this TWICE)
   - Add release fingerprint (copy from above)
   - Add debug fingerprint (copy from above)
4. Click **Save**

### 2. Enable Play Integrity API (2 min)
🔗 https://console.cloud.google.com/apis/library/playintegrity.googleapis.com?project=dular5

1. Click **Enable**
2. Wait 1-2 minutes

### 3. Configure App Check (3 min)
🔗 https://console.firebase.google.com/project/dular5/appcheck

1. Click **Get started** (if first time)
2. Find app: `com.santali.dating`
3. Click **⋮** → **Edit**
4. Select **Play Integrity**
5. Click **Save**

### 4. Download google-services.json
🔗 https://console.firebase.google.com/project/dular5/settings/general

1. Scroll to your Android app
2. Click **google-services.json**
3. Replace file in: `android/app/google-services.json`

---

## Test It!

```bash
# Install existing APK (already built with v12.0.0)
adb install /Users/subhamroutray/Downloads/Dular5.0/android/app/build/outputs/apk/release/app-release.apk

# Open app and try login
# ✅ Should work with NO reCAPTCHA popup!
```

---

## Expected Result

**Before:** reCAPTCHA popup appears → User solves puzzle → OTP sent

**After:** No popup → OTP sent immediately (2-3 seconds)

---

## If reCAPTCHA still shows:

1. Wait 10 minutes after setup (APIs need time to activate)
2. Clear app data: Settings → Apps → Dular → Clear data
3. Reinstall app
4. Try again

---

**Full Guide:** [FIREBASE_APP_CHECK_SETUP.md](FIREBASE_APP_CHECK_SETUP.md)
