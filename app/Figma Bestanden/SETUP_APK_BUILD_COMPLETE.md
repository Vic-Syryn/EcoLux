# Converting EcoLux App to APK - Setup Complete ✓

## What I've Done

I've prepared your React web app to be built as an Android APK using **Capacitor**. Here's what was set up:

✅ Updated `package.json` with:
- Capacitor dependencies (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`)
- Build scripts (`npm run android:build` for easy building)
- Development dependencies

✅ Created `capacitor.config.ts`:
- Configuration for the native Android app
- App ID: `com.ecolux.app`
- Points web output (`dist/`) to Android app

✅ Created build automation scripts:
- `BUILD_APK_QUICKSTART.md` - Quick reference guide
- `APK_BUILD_GUIDE.md` - Detailed setup documentation
- `setup-apk-build.ps1` - PowerShell automation script
- `setup-apk-build.bat` - Batch script for Command Prompt

✅ Created `.gitignore` - Excludes build artifacts from git

---

## What You Need to Do

### Phase 1: Install Required Tools (One-Time Setup)

**Download and Install Android Studio:**
1. Go to: https://developer.android.com/studio
2. Download the installer for Windows
3. Run installer and follow the setup wizard
4. During setup, select Android SDK components to install
5. Wait for all downloads to complete
6. Launch Android Studio when done

**Configure Android SDK:**
1. In Android Studio: `File → Settings → Appearance & Behavior → System Settings → Android SDK`
2. Check these SDK Platforms:
   - ✓ Android 14 (API 34) [REQUIRED]
   - ✓ Android 13 (API 33)
   - ✓ Android 12 (API 31)
3. Under SDK Tools, ensure:
   - ✓ Android SDK Build-Tools
   - ✓ Android Emulator
   - ✓ Platform-Tools
4. Click Apply and wait for downloads
5. Close Android Studio

**Set Environment Variable:**
1. Press `Windows Key + Pause` to open System Properties
2. Click "Environment Variables"
3. Click "New..." under "User variables"
4. Set:
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\{YourUsername}\AppData\Local\Android\Sdk`
5. Click OK
6. **Restart your Terminal/PowerShell/VS Code**

### Phase 2: Build the APK

**Option A: Automatic (Recommended)**

```powershell
# Open PowerShell and run:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"
powershell -ExecutionPolicy Bypass -File setup-apk-build.ps1
```

This script will:
- Check all requirements
- Install Capacitor
- Initialize Android project
- Build the web app
- Sync everything
- Generate your APK

**Option B: Manual Steps**

```powershell
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

# Install dependencies
npm install

# Build web app
npm run build

# Initialize Capacitor (first time only)
npx cap init

# Add Android platform (first time only)
npx cap add android

# Sync and build APK
npm run android:build
```

---

## After Build

Your APK will be at:
```
d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden\android\app\build\outputs\apk\debug\app-debug.apk
```

### Test the APK

**On Android Emulator:**
```powershell
# Start emulator (use Android Studio or command line)
$env:ANDROID_HOME\emulator\emulator.exe -avd Pixel_6_API_34 &

# Install the APK
adb install app-debug.apk
```

**On Physical Device:**
1. Enable USB Debugging:
   - Settings → About phone → Build number (tap 7 times)
   - Back → Developer options → USB Debugging ON
2. Connect via USB
3. Install:
   ```powershell
   adb install app-debug.apk
   ```

---

## Key Commands Reference

```powershell
# Change to app directory
cd "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

# Build web app only
npm run build

# Build APK (uses npm run build + Capacitor)
npm run android:build

# Build release APK (for Google Play)
npm run android:release

# Open Android project in Android Studio
npx cap open android

# Sync web app to Android
npx cap sync

# Clean build (if something goes wrong)
cd android && ./gradlew clean
```

---

## How It Works

1. **React → Vite** builds your app to a web bundle
2. **Capacitor** wraps this web bundle in a native Android container
3. **Gradle** compiles it into an APK
4. The APK contains both native Android code + your web app

This means:
- One codebase, multiple platforms
- Full access to native Android features if needed (camera, contacts, etc.)
- Can use Capacitor plugins for advanced features
- Updates are web-based (update code, rebuild APK)

---

## Troubleshooting

### "ANDROID_HOME not set"
- Set the environment variable (see Phase 1 above)
- **Restart** your terminal after setting
- Verify: `echo $env:ANDROID_HOME`

### "SDK Platform not found"
- Go back to Android Studio
- Install more API levels (33-34)

### Build takes forever on first run
- Normal! Gradle downloads dependencies (~2GB)
- Subsequent builds are much faster

### APK build fails
```powershell
cd android
./gradlew clean
./gradlew assembleDebug
```

### Port issues
```powershell
# Find process on port 8000 and kill
lsof -ti:8000 | xargs kill -9
```

---

## Files Created/Modified

```
app/Figma Bestanden/
├── package.json                   # ✓ Updated with Capacitor + scripts
├── capacitor.config.ts            # ✓ Created - Capacitor configuration
├── .gitignore                     # ✓ Created - Ignore build files
├── BUILD_APK_QUICKSTART.md        # ✓ Created - Quick reference
├── setup-apk-build.ps1            # ✓ Created - Automation script
├── setup-apk-build.bat            # ✓ Created - Batch script
└── (android/)                     # Will be created after first build
    └── app/build/outputs/apk/debug/app-debug.apk  # ← Your APK
```

---

## Security Note

For release APKs on Google Play, you'll need to:
1. Generate a keystore (see `APK_BUILD_GUIDE.md`)
2. Sign the APK
3. Upload to Google Play Console

The APK type from `android:build` is debug-only (for testing).

---

## Next Actions

1. **Install Android Studio** (Phase 1)
2. **Set ANDROID_HOME** (Phase 1)
3. **Run setup script** (Phase 2 Option A) OR **follow manual steps** (Phase 2 Option B)
4. **Test the APK** on emulator or device
5. **Share/distribute** your APK!

---

## Support Resources

- Quick Start: [BUILD_APK_QUICKSTART.md](BUILD_APK_QUICKSTART.md)
- Detailed Guide: [../APK_BUILD_GUIDE.md](../APK_BUILD_GUIDE.md)
- Capacitor Docs: https://capacitorjs.com/
- Android Developer: https://developer.android.com/
- React + Capacitor: https://capacitorjs.com/docs/guides/react

---

**Status: Ready for APK Building! 🚀**

**Current System:**
- ✅ Node.js v24.13.1
- ✅ npm 11.8.0
- ✅ Java 21 LTS
- ⏳ Android Studio (download required)
- ⏳ ANDROID_HOME (set after installation)

After completing Phase 1, you can build your APK whenever needed!

---

*Project: EcoLux*  
*Setup Date: 2026-03-18*  
*Framework: React + Vite + Capacitor*  
