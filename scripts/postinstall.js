#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const firebaseCoreDir = path.join(__dirname, '../node_modules/expo-firebase-core');

if (fs.existsSync(firebaseCoreDir)) {
  console.log('Creating stub for expo-firebase-core to prevent build issues...');

  // Remove Android native code to prevent build errors
  const androidDir = path.join(firebaseCoreDir, 'android');
  if (fs.existsSync(androidDir)) {
    fs.rmSync(androidDir, { recursive: true, force: true });
    console.log('Removed Android native code');
  }

  // Create stub JavaScript export
  const buildDir = path.join(firebaseCoreDir, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const stubContent = `// Stub for expo-firebase-core to prevent build errors
export const DEFAULT_WEB_APP_OPTIONS = {};
`;

  fs.writeFileSync(path.join(buildDir, 'index.js'), stubContent);
  console.log('Created stub module');

  console.log('Successfully patched expo-firebase-core!');
} else {
  console.log('expo-firebase-core not found, skipping...');
}
