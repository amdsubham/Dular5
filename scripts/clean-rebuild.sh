#!/bin/bash

# Clean Rebuild Script for Dular App
# Fixes: OTP verification issues by clearing all caches

set -e  # Exit on error

echo "🧹 Starting complete clean rebuild..."
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."
echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Clean Metro and npm cache
echo "🗑️  Step 1: Cleaning Metro bundler cache..."
pkill -f "expo start" || true
sleep 2
npx expo start --clear &
METRO_PID=$!
sleep 5
kill $METRO_PID || true

echo "🗑️  Cleaning npm cache..."
npm cache clean --force

echo "🗑️  Cleaning watchman..."
watchman watch-del-all || true

echo ""

# Step 2: Clean node_modules
echo "🗑️  Step 2: Removing node_modules..."
rm -rf node_modules
echo "📦 Reinstalling dependencies..."
npm install

echo ""

# Step 3: Clean Android build
echo "🗑️  Step 3: Cleaning Android build..."
cd android

echo "   Cleaning Gradle..."
./gradlew clean
./gradlew cleanBuildCache

echo "   Removing build directories..."
rm -rf app/build
rm -rf build
rm -rf .gradle

cd ..

echo ""

# Step 4: Clean Expo prebuild
echo "🗑️  Step 4: Cleaning Expo prebuild..."
rm -rf android ios

echo ""

# Step 5: Rebuild
echo "🔨 Step 5: Rebuilding Android project..."
npx expo prebuild --clean --platform android

echo ""

# Step 6: Build APK
echo "📦 Step 6: Building release APK..."
cd android
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo ""
echo "📱 APK Location:"
echo "   $(pwd)/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "🎯 Next Steps:"
echo "   1. Uninstall old app from device"
echo "   2. Install new APK"
echo "   3. Test with phone: 7008105210"
echo "   4. Enter OTP: 121212"
echo ""
