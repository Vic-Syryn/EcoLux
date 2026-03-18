# EcoLux APK Build Setup Script (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File setup-apk-build.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "EcoLux APK Build Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "[✓] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js NOT found. Install from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version 2>&1
    Write-Host "[✓] npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] npm NOT found" -ForegroundColor Red
    exit 1
}

# Check Java
try {
    $javaVersion = & java -version 2>&1 | Select-Object -First 1
    Write-Host "[✓] Java installed: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Java NOT found. Install from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Red
    exit 1
}

# Check Android SDK
if ($env:ANDROID_HOME) {
    Write-Host "[✓] ANDROID_HOME is set: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "[✗] ANDROID_HOME NOT set" -ForegroundColor Red
    Write-Host "`nTo fix this:" -ForegroundColor Yellow
    Write-Host "1. Install Android Studio from: https://developer.android.com/studio" 
    Write-Host "2. Set ANDROID_HOME environment variable to: C:\Users\`$env:USERNAME\AppData\Local\Android\Sdk"
    Write-Host "3. Restart PowerShell/Terminal"
    Read-Host "Press Enter after setting ANDROID_HOME"
    
    if (-not $env:ANDROID_HOME) {
        Write-Host "[!] ANDROID_HOME still not set. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Navigate to app directory
$appDir = "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"
if (-not (Test-Path $appDir)) {
    Write-Host "[✗] App directory not found: $appDir" -ForegroundColor Red
    exit 1
}

Set-Location $appDir
Write-Host "[✓] Changed to app directory`n" -ForegroundColor Green

# Install global Capacitor CLI
Write-Host "Installing Capacitor CLI globally..." -ForegroundColor Yellow
npm install -g @capacitor/cli
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Failed to install Capacitor CLI" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] Capacitor CLI installed`n" -ForegroundColor Green

# Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Failed to install npm dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] npm dependencies installed`n" -ForegroundColor Green

# Check if Capacitor is already initialized
if (-not (Test-Path "android")) {
    Write-Host "Initializing Capacitor..." -ForegroundColor Yellow
    npx cap init --webDir dist 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Capacitor init issue, trying to continue..." -ForegroundColor Yellow
    }
    
    Write-Host "Adding Android platform..." -ForegroundColor Yellow
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Failed to add Android platform" -ForegroundColor Red
        exit 1
    }
    Write-Host "[✓] Android platform added`n" -ForegroundColor Green
} else {
    Write-Host "[✓] Capacitor already initialized`n" -ForegroundColor Green
}

# Build the web app
Write-Host "Building web app with Vite..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Web build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] Web app built to dist/`n" -ForegroundColor Green

# Sync Capacitor
Write-Host "Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] Capacitor synced`n" -ForegroundColor Green

# Build APK
Write-Host "Building Android APK..." -ForegroundColor Yellow
Write-Host "(This may take several minutes on first build)" -ForegroundColor Gray
Set-Location android

if ($PSVersionTable.OS -like "*Windows*") {
    # Use gradlew.bat on Windows
    & ".\gradlew.bat" assembleDebug
} else {
    & "./gradlew" assembleDebug
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] APK build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n[✓] APK build completed!`n" -ForegroundColor Green

# Find the APK
$apkPath = "app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "BUILD SUCCESSFUL! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nAPK Location: $apkPath" -ForegroundColor Green
    Write-Host "APK Size: $([Math]::Round($apkSize, 2)) MB" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Transfer APK to Android device or emulator"
    Write-Host "  2. Run: adb install $apkPath"
    Write-Host "  3. Or open Android Studio and run as: npx cap open android"
    Write-Host "`n========================================`n" -ForegroundColor Cyan
} else {
    Write-Host "[✗] APK file not found at: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "For more info, see: BUILD_APK_QUICKSTART.md" -ForegroundColor Gray
