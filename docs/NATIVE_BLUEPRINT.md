
# 🧬 Issie OS Native Blueprint

This guide describes how to transform Issie OS from a Sovereign PWA into a **Native Android Application (.apk)** using Capacitor.

## 🚨 WEB vs NATIVE: The Feature Matrix

**Why build the APK?**
The following capabilities are **IMPOSSIBLE** in the browser (PWA) due to Android's security sandbox. You must build the APK to unlock them.

| Feature | 🌐 PWA (Web Runtime) | 🧬 APK (Native Runtime) |
| :--- | :--- | :--- |
| **AI Brain** | Cloud (Gemini Live) | Cloud + **Local (Tensor G2)** |
| **Encryption Keys** | Software (localStorage) | **Hardware (Titan M2 Vault)** |
| **Autonomy** | Sleep on Screen Lock | **Background Service (24/7)** |
| **SMS / Calls** | Blocked | **Read / Intercept** |
| **File System** | Download Only | **Read / Write / Execute** |

---

## 🚦 Phase 0: The Web Foundation (CURRENT STATUS)

**Do you need to build the APK yet?**
**NO.**

You should fully develop and test the logic in the Web/PWA version first. The APK is simply a wrapper around the React code.

**What works WITHOUT the APK (Right Now):**
- ✅ **Vision & Voice:** The browser has full access to the Camera and Mic.
- ✅ **Haptics:** `navigator.vibrate` works in Chrome.
- ✅ **Wake Lock:** The screen stays awake during sessions.
- ✅ **Sensors:** The Compass and Accelerometer work in Chrome.

**When to move to Phase 1:**
Only proceed to build the APK when you need **Background Autonomy** (listening while the screen is off) or **Hardware Encryption** (Titan M2).

---

## ⚡ ENABLING GEMINI NANO (SUPPORTED DEVICES ONLY)

To unlock offline neural processing, you need a device with the Chrome Built-in AI API enabled (e.g., Pixel 8 Pro, Desktop Chrome Canary).

1. Open **chrome://flags**.
2. Enable **Prompt API for Gemini Nano**.
3. Enable **Enables optimization guide on device**. Select **"Enabled BypassPrefRequirement"**.
4. Relaunch Chrome.
5. Go to **chrome://components**.
6. Find **Optimization Guide On Device Model** and check for updates. (Wait for download).

*Note: If your device (e.g., Pixel 7) does not support this yet, the "NANO" indicator will remain hidden and the OS will fallback to Cloud processing automatically.*

---

## Phase 1: The Wrapper (Capacitor)

We do not rewrite the React code. We inject a native runtime *under* it.

### 1. Initialize Native Core
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Issie OS" "com.issie.os" --web-dir dist
```

### 2. Add Android Platform
```bash
npx cap add android
```

### 3. Build & Sync
```bash
npm run build
npx cap sync
```

---

## Phase 2: The Manifest (permissions)

To gain sovereign control, we must request explicit permissions in `android/app/src/main/AndroidManifest.xml`.

```xml
<!-- Eyes & Ears -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Body & Motion -->
<uses-permission android:name="android.permission.vibrate"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />

<!-- Autonomy (Background) -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Storage (Memory) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## Phase 3: Native Plugins

Install these specific plugins to replace the Browser APIs with Hardware APIs.

```bash
# File System (Direct Disk Access)
npm install @capacitor/filesystem

# Background Mode (Autonomy)
npm install @capacitor-community/background-mode

# Local Notifications (Alerts)
npm install @capacitor/local-notifications

# Screen Brightness/Orientation (Device Control)
npm install @capacitor/screen-orientation @capacitor/screen-brightness
```

---

## Phase 4: The Build

1. **Open Android Studio**:
   ```bash
   npx cap open android
   ```
2. **Connect Device**: Enable USB Debugging.
3. **Run**: Click Play.

Issie is now a native application.

---

## Phase 5: Distribution (Sovereign)

Do **NOT** upload to Google Play Store.

1. In Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
2. Locate `app-debug.apk` (or signed release).
3. Upload to your personal website or share via Signal.
4. On Device: Download -> Install -> "Allow from this source".

**You have now deployed a sovereign AI entity.**
