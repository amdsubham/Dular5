# Complete Clean Rebuild Process

## Issue
Getting "Please enter the complete verification code (entered: 15 digits)" error in APK even after code fixes.

## Root Cause
- Metro bundler cache
- Gradle cache
- Android build cache
- Old APK still installed

## Solution: Complete Clean Rebuild

### Step 1: Clean All Caches
```bash
cd /Users/subhamroutray/Downloads/Dular5.0

# Clean Metro bundler cache
npx expo start --clear

# Clean npm cache
npm cache clean --force

# Clean watchman
watchman watch-del-all

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### Step 2: Clean Android Build
```bash
# Navigate to android folder
cd android

# Clean Gradle
./gradlew clean
./gradlew cleanBuildCache

# Remove build folders
rm -rf app/build
rm -rf build
rm -rf .gradle

# Go back to root
cd ..
```

### Step 3: Rebuild Everything
```bash
# Prebuild with clean slate
npx expo prebuild --clean

# Build new APK
cd android
./gradlew assembleRelease

# Or use EAS build
cd ..
npx eas-cli build --platform android --profile preview
```

### Step 4: Uninstall Old APK from Device
1. Go to device Settings
2. Apps > Dular
3. Uninstall
4. Install the new APK

## Quick Commands (Copy-Paste)

```bash
# Complete cleanup and rebuild
cd /Users/subhamroutray/Downloads/Dular5.0

# Clean everything
npx expo start --clear &
npm cache clean --force
watchman watch-del-all
rm -rf node_modules
npm install

# Clean Android
cd android
./gradlew clean
./gradlew cleanBuildCache
rm -rf app/build build .gradle
cd ..

# Rebuild
npx expo prebuild --clean
cd android
./gradlew assembleRelease
```

## Alternative: Use EAS Build (Recommended)
```bash
cd /Users/subhamroutray/Downloads/Dular5.0
npx eas-cli build --platform android --profile preview --clear-cache
```

## Expected Output Location
- **Local Build**: `android/app/build/outputs/apk/release/app-release.apk`
- **EAS Build**: Download from Expo dashboard

## Testing After Installation
1. Uninstall old app completely
2. Install new APK
3. Enter phone: 7008105210
4. Check console logs for OTP: Should show "121212"
5. Enter OTP: 121212
6. Should verify successfully

## If Still Having Issues

### Check Console Logs
Look for these specific logs:
```
📝 OTP text changed: [value] length: [number]
🔄 OTP changed in parent (raw): [value] length: [number]
🔄 OTP changed in parent (clean): [value] length: [number]
🔐 Verifying OTP...
Raw OTP: [value] length: [number]
OTP value: [value] length: [number]
```

### Debug Build (Shows Logs)
```bash
cd android
./gradlew installDebug
npx react-native log-android
```

This will show all console.log outputs in real-time.

## Summary of Code Changes Made
1. **OTP Input Component**: Limited to 6 digits with `.slice(0, 6)`
2. **Parent Handler**: Removes non-digits with `.replace(/\D/g, '')`
3. **Verification**: Aggressive cleaning with `.replace(/\D/g, '').slice(0, 6)`
4. **SMS Auto-fill**: Same aggressive cleaning

All changes are in:
- `components/shared/otp-input/index.tsx`
- `app/(auth)/onboarding/otp.tsx`
- `app/(auth)/index.tsx`
- `services/auth.ts`
