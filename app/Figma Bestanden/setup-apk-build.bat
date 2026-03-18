@echo off
REM EcoLux APK Setup Script for Windows
REM This script automates the Capacitor and Android setup process

echo.
echo ============================================
echo EcoLux APK Build Setup Script
echo ============================================
echo.

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js is installed
echo [✓] npm is installed

REM Check if Java is installed
java -version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java from: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)

echo [✓] Java is installed

REM Check if Android SDK is configured
if "%ANDROID_HOME%"=="" (
    echo.
    echo WARNING: ANDROID_HOME environment variable is not set
    echo.
    echo You must complete these steps BEFORE running the build:
    echo.
    echo 1. Download Android Studio from: https://developer.android.com/studio
    echo 2. Install Android Studio
    echo 3. Open Android Studio and install SDK platforms:
    echo    - Android 14 ^(API 34^)
    echo    - Android 13 ^(API 33^)
    echo 4. Set ANDROID_HOME environment variable:
    echo    - Press Windows Key + X ^-> System
    echo    - Click "Advanced system settings"
    echo    - Click "Environment Variables"
    echo    - Add: ANDROID_HOME = C:\Users\^%USERNAME^%\AppData\Local\Android\Sdk
    echo 5. Restart your terminal/VS Code
    echo.
    pause
) else (
    echo [✓] ANDROID_HOME is set: %ANDROID_HOME%
)

REM Navigate to app directory
cd /d "d:\school\project_gebruiksgericht\ECOLUX\EcoLux\app\Figma Bestanden"

echo.
echo [*] Installing Capacitor CLI globally...
call npm install -g @capacitor/cli
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Capacitor CLI
    pause
    exit /b 1
)

echo [✓] Capacitor CLI installed

echo.
echo [*] Installing Capacitor dependencies...
call npm install @capacitor/core @capacitor/android
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Capacitor packages
    pause
    exit /b 1
)

echo [✓] Capacitor dependencies installed

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Make sure ANDROID_HOME is set (see instructions above if not)
echo 2. Run: npm run build
echo 3. Run: npx cap init
echo 4. Run: npx cap add android
echo 5. Run: npx cap sync
echo 6. Run: cd android ^& gradlew assembleDebug
echo.
echo For more information, see: APK_BUILD_GUIDE.md
echo.

pause
