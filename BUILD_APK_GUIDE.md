# How to Generate APK for Dular Dating App

## Quick Start (Recommended Method)

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```
Enter your Expo credentials when prompted.

### 3. Build Preview APK
```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Give you a download link when complete (10-20 minutes)

### 4. Download Your APK
- Click the link in the terminal output
- Or visit: https://expo.dev/accounts/amdsubham/projects/dular/builds
- Download the APK and install it on your Android device

---

## Build Profiles

Your project has 3 build profiles configured in `eas.json`:

### 1. Development Profile
```bash
eas build --platform android --profile development
```
- Includes development tools
- Larger file size (~80-100 MB)
- Use for: Testing with dev tools

### 2. Preview Profile (Recommended for Testing)
```bash
eas build --platform android --profile preview
```
- Production-like build
- Creates APK file
- Medium file size (~30-50 MB)
- Use for: Beta testing, sharing with testers

### 3. Production Profile
```bash
eas build --platform android --profile production
```
- Final optimized build
- Creates APK file
- Smallest file size (~20-40 MB)
- Use for: Google Play Store submission or final release

---

## Local Build (Alternative Method)

If you prefer to build locally without using EAS:

### Prerequisites
1. Install Android Studio
2. Install Java Development Kit (JDK 17)
3. Set up Android SDK
4. Set environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Build Steps

1. **Prebuild (generates android folder)**
   ```bash
   npx expo prebuild --platform android --clean
   ```

2. **Navigate to android folder**
   ```bash
   cd android
   ```

3. **Build Release APK**
   ```bash
   ./gradlew assembleRelease
   ```

4. **Find your APK**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Troubleshooting

### Build Fails with "google-services.json not found"
Make sure `google-services.json` is in the root directory (same level as package.json).

### Build Fails with Gradle Error
Try cleaning:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### EAS Build Fails
1. Check your internet connection
2. Make sure all dependencies are installed: `npm install`
3. Check build logs in the Expo dashboard

### APK Won't Install on Device
1. Enable "Install from Unknown Sources" in Android settings
2. Make sure you downloaded the correct APK (not AAB)
3. Try uninstalling previous version first

---

## Installing APK on Device

### Method 1: Direct Download
1. Upload APK to Google Drive or Dropbox
2. Open link on Android device
3. Download and install

### Method 2: USB Transfer
1. Connect device to computer via USB
2. Copy APK to device storage
3. Use file manager on device to find and install APK

### Method 3: ADB Install
```bash
adb install path/to/your-app.apk
```

---

## App Signing

### For Testing (Preview/Development builds)
- Expo handles signing automatically
- No keystore needed

### For Production (Play Store)
- Expo generates and manages keystore automatically
- Stored securely in Expo's infrastructure
- You can download credentials if needed:
  ```bash
  eas credentials
  ```

---

## Build Configuration Summary

Your current configuration:
- **App Name**: Dular
- **Package Name**: com.santali.dating
- **Version**: 1.0.0
- **Expo Project ID**: 0ed3addc-68dc-40e6-946e-4643353b2227

---

## Next Steps After Building

1. **Test the APK thoroughly** on multiple devices
2. **Check all features work**:
   - Login/Signup
   - Swiping
   - Matching
   - Chat
   - Notifications
   - Image upload
   - Profile editing

3. **For Play Store Release**:
   - Use production build profile
   - Prepare app listing (screenshots, description, etc.)
   - Submit via Google Play Console

---

## Quick Reference Commands

```bash
# Build preview APK (recommended for testing)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view <BUILD_ID>

# Cancel running build
eas build:cancel

# Install APK via ADB
adb install app.apk
```

---

## Support

- Expo Documentation: https://docs.expo.dev/
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Your Project Dashboard: https://expo.dev/accounts/amdsubham/projects/dular
