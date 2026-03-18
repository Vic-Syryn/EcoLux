# EcoLux APK Build Guide

This guide will help you convert the React web app into an Android APK.

## Prerequisites

You have:
- ✅ Node.js v24.13.1
- ✅ npm 11.8.0
- ✅ Java 21 LTS (OpenJDK)
- ❌ Android SDK (needs to be installed)

## Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio (it includes the Android SDK)
3. During installation, select "Android Virtual Device" components
4. Complete the wizard - it will download the necessary SDK tools

## Step 2: Configure Android SDK

After installing Android Studio:

1. Open Android Studio
2. Go to: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Under "SDK Platforms", install:
   - Android 14 (API 34) - **Required**
   - Android 13 (API 33)
   - Android 12 (API 31)

4. Under "SDK Tools", ensure these are installed:
   - Android SDK Build-Tools (latest)
   - Android Emulator
   - Android SDK Platform-Tools
   - Google Play services
   - Gradle (will be handled by Capacitor)

5. Click "Apply" and wait for downloads to complete

## Step 3: Set Environment Variables

After Android Studio installation, you need to set the `ANDROID_HOME` environment variable:

### On Windows:
1. Press `Windows Key + X` → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Click "New" under User variables
5. Variable name: `ANDROID_HOME`
6. Variable value: `C:\Users\{YourUsername}\AppData\Local\Android\Sdk`
   (or wherever Android Studio installed the SDK)
7. Click OK and restart your terminal/VS Code

### Verify:
```powershell
$env:ANDROID_HOME
```

## Step 4: Install Capacitor

Run these commands in the app directory:

```powershell
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

# Install Capacitor CLI and core
& "C:\Program Files\nodejs\npm.cmd" install -g @capacitor/cli
& "C:\Program Files\nodejs\npm.cmd" install @capacitor/core @capacitor/android
```

## Step 5: Initialize Capacitor

```powershell
# Navigate to app directory
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

# Initialize Capacitor
npx cap init
```

When prompted:
- App name: `EcoLux`
- App Package ID: `com.ecolux.app`
- Directory: `dist` (web root - Vite outputs here)

## Step 6: Build the Web App

```powershell
# Build the Vite app
& "C:\Program Files\nodejs\npm.cmd" run build

# This creates the dist/ folder with optimized files
```

## Step 7: Add Android Platform

```powershell
# Add Android support
npx cap add android
```

This creates the `android/` folder with the Android project.

## Step 8: Build the APK

```powershell
# Copy web assets to Android project
npx cap copy

# Sync Capacitor changes
npx cap sync

# Build the APK using Gradle
cd android
./gradlew assembleDebug

# The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

For a release APK (for production/Google Play):
```powershell
# Generate a keystore (one time only)
keytool -genkey -v -keystore ecolux.keystore -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease

# Sign the APK (use when bundling)
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ecolux.keystore app/build/outputs/apk/release/app-release-unsigned.apk alias_name
```

## Quick Reference

After everything is set up, building an APK is just:

```powershell
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"
npm run build
npx cap copy
cd android
./gradlew assembleDebug
```

## Troubleshooting

### "ANDROID_HOME not set" error
- Set the environment variable (see Step 3)
- Restart terminal/VS Code after setting
- Verify with: `$env:ANDROID_HOME`

### "Gradle not found"
- Capacitor will download Gradle automatically
- First build may take longer
- Ensure internet connection

### "SDK Platform not found"
- Go back to Android Studio
- Install more SDK platforms (API levels 31-34)

### Port already in use
- Capacitor sometimes uses ports 5555+
- Close emulator or kill process: `lsof -ti:5555 | xargs kill -9`

## Testing the APK

1. **On Android Emulator:**
   ```powershell
   $env:ANDROID_HOME\emulator\emulator.exe -avd YourDeviceName &
   adb install app-debug.apk
   ```

2. **On Physical Device:**
   - Enable USB debugging on your device
   - Connect via USB
   - Run: `adb install app-debug.apk`

## Next Steps

Once you have the APK:
- Test on Android emulator or real device
- Sign release APK for Google Play Store submission
- Configure app permissions in `android/app/src/AndroidManifest.xml`
- Setup Firebase (optional) for analytics and push notifications

---

**Note:** API 33+ requires specific configurations. The guide covers API 33 (Android 13) as minimum recommended.
