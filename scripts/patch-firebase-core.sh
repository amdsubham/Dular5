#!/bin/bash

# Path to expo-firebase-core package
FIREBASE_CORE_PATH="node_modules/expo-firebase-core"

if [ -d "$FIREBASE_CORE_PATH" ]; then
  echo "Removing expo-firebase-core Java source files to prevent compilation..."
  rm -rf "$FIREBASE_CORE_PATH/android/src"
  
  # Create empty src directory to satisfy build
  mkdir -p "$FIREBASE_CORE_PATH/android/src/main/java"
  
  echo "expo-firebase-core Java sources removed successfully!"
else
  echo "expo-firebase-core not found, skipping..."
fi
