#!/bin/bash
set -e

# Create a temporary node wrapper
mkdir -p /tmp/dular-build-bin
cat > /tmp/dular-build-bin/node << 'EOF'
#!/bin/bash
exec /usr/local/bin/node "$@"
EOF
chmod +x /tmp/dular-build-bin/node

# Add to PATH and build
export PATH="/tmp/dular-build-bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk

cd "$(dirname "$0")/android"
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo "📱 APK Location: $(pwd)/app/build/outputs/apk/release/app-release.apk"
