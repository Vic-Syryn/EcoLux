# 🚀 One-Click APK Download (No Android SDK Needed!)

Your APK builds automatically on GitHub. No local setup required!

## How to Get Your APK

### Step 1: Push to GitHub
```powershell
git add .
git commit -m "Build APK"
git push origin main
```

### Step 2: Wait for Build (~5-10 minutes)
- Go to: https://github.com/basbaccarne/UCD
- Click **Actions** tab
- Watch the build progress in real-time

### Step 3: Download APK
When build completes:
1. Click the **Build Android APK** workflow run
2. Scroll to **Artifacts** section
3. Download `ecolux-debug-apk.zip` (for testing)
4. Or download `ecolux-release-apk.zip` (for production)

---

## What Gets Built

| APK Type | Use Case | Size | Notes |
|----------|----------|------|-------|
| **Debug APK** | Testing & Development | ~60-80 MB | Can be tested immediately |
| **Release APK** | Google Play Store | ~50-70 MB | Needs signing before distribution |

---

## Install on Device

### From ZIP file:
```powershell
# Extract the ZIP
Expand-Archive ecolux-debug-apk.zip -DestinationPath .

# Install via ADB
adb install app-debug.apk
```

---

## Automatic Builds Trigger On:
- ✅ Push to `main` branch
- ✅ Push to `develop` branch  
- ✅ Pull requests
- ✅ Manual trigger (Actions tab → Run workflow)

---

## Build Status Badge
Add this to your README for build status visibility:

```markdown
![Build Android APK](https://github.com/basbaccarne/UCD/actions/workflows/build-apk.yml/badge.svg)
```

---

## Troubleshooting

**Build failed?**
- Check the workflow logs (Actions tab)
- Common issues:
  - Missing `dist/` folder (run `npm run build` locally first)
  - Android SDK issues (rare, workflow handles this)

**APK won't install?**
- Ensure you have Android debug bridge (ADB) installed
- Enable Developer Mode on device
- Try: `adb install -r app-debug.apk`

---

## For Google Play Store (Release)

1. Download the **Release APK**
2. Sign it with your keystore:
   ```powershell
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 `
     -keystore your.keystore app-release-unsigned.apk alias_name
   ```
3. Zip-align it:
   ```powershell
   zipalign -v 4 app-release-unsigned.apk app-release.apk
   ```
4. Upload to Google Play Console

---

## Environment (GitHub Actions)
- Java 21 (Latest LTS)
- Android SDK (Latest)
- Node.js 20 (Latest LTS)
- Gradle (Auto-managed)

**No manual setup needed on your machine!** 🎉

---

## Next Steps

1. ✅ Push code to GitHub
2. ⏱️ Wait for workflow to complete
3. 📥 Download APK from Artifacts
4. 📱 Install on your Android device

That's it! No Android Studio, no local Android SDK, no environment variables to set.

---

*Workflow Location:* `.github/workflows/build-apk.yml`
