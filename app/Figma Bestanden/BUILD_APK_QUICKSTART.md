# EcoLux Android APK Quick Start

## Status Check

Your system has:
- ✅ Node.js v24.13.1
- ✅ npm 11.8.0  
- ✅ Java 21 LTS (OpenJDK)
- ❌ Android SDK (requires manual installation)

## Required: Install Android Studio First

**Before proceeding with APK building, you MUST install Android Studio:**

1. Download from: https://developer.android.com/studio
2. Run the installer and complete the setup wizard
3. Let it install the default Android SDK components
4. After installation completes, open Android Studio

### Configure Android SDK in Android Studio

1. In Android Studio, go to: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
2. Under **SDK Platforms tab**, check these versions:
   - ✓ Android 14 (API 34) [REQUIRED]
   - ✓ Android 13 (API 33)
   - ✓ Android 12 (API 31)

3. Under **SDK Tools tab**, ensure these are installed:
   - ✓ Android SDK Build-Tools
   - ✓ Android Emulator
   - ✓ Platform-Tools

4. Click **Apply** and wait for all downloads to complete
5. Close Android Studio

### Set Environment Variable

After Android Studio installs the SDK, you need to set `ANDROID_HOME`:

**Windows (PowerShell or Command Prompt):**

```powershell
# Open System Properties
# Press Windows Key + Pause
# OR: Right-click "This PC" → Properties → Advanced system settings

# Click "Environment Variables"
# Click "New..." under User variables
# Variable name: ANDROID_HOME
# Variable value: C:\Users\{YourUsername}\AppData\Local\Android\Sdk

# Then restart your Terminal/PowerShell/VS Code
```

**Verify the variable is set:**
```powershell
echo $env:ANDROID_HOME
# Should output: C:\Users\YourUsername\AppData\Local\Android\Sdk
```

---

## Building the APK (After Android SDK is Set Up)

### Step 1: Install Dependencies

```powershell
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

# Install npm packages
npm install

# Install Capacitor CLI globally (one time)
npm install -g @capacitor/cli
```

### Step 2: Initialize Capacitor (First Time Only)

```powershell
# If android/ folder doesn't exist yet:
npx cap init
# Accept defaults or use:
# - App Name: EcoLux
# - App ID: com.ecolux.app
# - Web directory: dist
```

### Step 3: Add Android Platform (First Time Only)

```powershell
npx cap add android
```

This creates the `android/` folder with the native Android project.

### Step 4: Build the Web App

```powershell
npm run build
```

This creates the `dist/` folder with optimized web assets.

### Step 5: Sync and Build APK

```powershell
# Copy web assets to Android project
npx cap copy

# Sync any changes
npx cap sync

# Build the APK
cd android
./gradlew assembleDebug

# First build takes 5-10 minutes (downloading dependencies)
# Subsequent builds are faster
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## One-Line Build Command

After initial setup, you can build everything with:

```powershell
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"
npm run android:build
```

---

## Testing the APK

### Option A: Android Emulator

```powershell
# Start emulator (from Android Studio or)
$env:ANDROID_HOME\emulator\emulator.exe -avd Pixel_6_API_34 &

# Install app
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat
```

### Option B: Physical Android Device

1. Enable USB Debugging on your device:
   - Settings → About phone → Build number (tap 7 times)
   - Back → Developer options → enable USB Debugging
   
2. Connect device via USB

3. Install app:
   ```powershell
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Release APK for Google Play

For production builds:

```powershell
# Generate keystore (one-time, keeps safe!)
keytool -genkey -v -keystore ecolux.keystore -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload the `.aab` file to Google Play Console.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "ANDROID_HOME not set" | Restart terminal after setting environment variable |
| "SDK Platform not found" | Install SDK 33-34 in Android Studio |
| "gradle command not found" | Capacitor downloads Gradle automatically on first run |
| "Build fails" | Run `./gradlew clean` then try again |
| "Port already in use" | Close emulator or: `lsof -ti:8000 \| xargs kill` |

---

## File Locations

All APK build files are in the app directory:
```
app/Figma Bestanden/
├── dist/                          # Web build (generated)
├── android/                       # Native Android project
│   ├── app/build/outputs/apk/     # ← YOUR APK IS HERE
│   ├── build.gradle
│   └── gradle/
├── package.json                   # npm config (updated)
├── capacitor.config.ts            # Capacitor config (created)
└── vite.config.ts                 # Vite config
```

---

## Next Steps

1. ✅ Install Android Studio
2. ✅ Set ANDROID_HOME environment variable
3. ⏭️ Run the build steps above
4. ⏭️ Test the APK on emulator or device
5. ⏭️ Share/distribute the APK

---

**Need Help?**
- See [APK_BUILD_GUIDE.md](../APK_BUILD_GUIDE.md) for detailed reference
- Android documentation: https://developer.android.com/
- Capacitor docs: https://capacitorjs.com/docs

**Created for:** EcoLux Project  
**Date:** 2026-03-18
