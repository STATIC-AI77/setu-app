# Setu Guardian — Android Elder Anti-Scam Shield

An Android mobile application built with React Native + Expo (dev-client) and hand-written Kotlin native modules. It silently protects elderly users from phone and WhatsApp scams by reading scam notifications, automatically engaging scammers with the "Saroj Aunty" AI decoy persona, screening incoming calls via threat intel, and deploying a full-screen Interlock Overlay over payment apps during active threats.

---

## 🚀 Quick Start (Starting the Dev Server)

Since the native APK is already built and installed on your device (`com.setuguardian`), you do **not** need to rebuild the native app. Just start the Metro dev server for live hot reloading.

### Step 1: Ensure your phone is connected via ADB
```bash
adb devices
```
*(Verify your device is listed and authorized)*

### Step 2: Route Metro port to device via ADB
```bash
adb reverse tcp:8081 tcp:8081
```

### Step 3: Start the Expo Metro dev server
```bash
npx expo start --dev-client
```

### Step 4: Open the app on your phone
Launch **Setu Guardian** from your app drawer, or launch it directly via ADB:
```bash
adb shell monkey -p com.setuguardian -c android.intent.category.LAUNCHER 1
```

*(Any TypeScript/React Native code changes in `App.tsx` will now hot reload instantly on your phone!)*

---

## ⚙️ In-App Configuration

Tap the **Backend Config** section at the bottom of the screen to edit runtime settings without rebuilding:
* **Backend Base URL**: Enter your Cloudflare tunnel (e.g. `https://xxx.trycloudflare.com`) or local backend URL (default: `http://10.0.2.2:8000`).
* **Team Token**: Default `setu-dev-token`.
* **Family ID**: Default `fam_demo_001`.
* **Device ID**: Stable auto-generated UUID.
* Tap **Save & Ping Backend** to verify connectivity (the status dot will turn green).

---

## 🛡️ Permissions Setup via ADB (One-Liner Fixes)

If permissions ever reset, you can grant them instantly via ADB:

```bash
# 1. Allow Notification Listener (WhatsApp & SMS intake + quick reply)
adb shell cmd notification allow_listener com.setuguardian/expo.modules.setunative.SetuNotificationListener

# 2. Allow Display Over Other Apps (Interlock Overlay)
adb shell appops set com.setuguardian SYSTEM_ALERT_WINDOW allow

# 3. Exempt from Battery Optimization (Background silent operation)
adb shell dumpsys deviceidle whitelist +com.setuguardian
```

---

## 🎬 Live Demo Controls

### 1. Simulate Scam Message
Tap the orange **"Simulate Scam Message"** button:
* Injects a real-world Digital Arrest Hinglish transcript into the `/detect` intake pipeline.
* If flagged, it automatically demonstrates Saroj's AI decoy reply and arms the Interlock.
* Watch the **Activity Log** update in real time.

### 2. Test Interlock Overlay
Tap the red **"Test Interlock"** button:
* Instantly launches the full-screen `TYPE_APPLICATION_OVERLAY` over your screen and payment apps (GPay, PhonePe, Paytm).
* Displays bold English & Hindi warnings and threat intel.
* Tap **"Emergency Unlock (Demo)"** to dismiss.

### 3. WhatsApp Live Decoy Test
* Ensure the **Saroj Auto-Reply Decoy** toggle is **ON**.
* Send a scam message to the device on WhatsApp.
* Setu Guardian captures the notification, queries `/detect` and `/chat/decoy-reply`, and uses `RemoteInput` on the notification to reply directly into WhatsApp as Saroj Aunty.

### 4. Call Screening
* When receiving a call, `SetuCallScreeningService` looks up `/threat-intel/{phone}` (1500ms timeout).
* Verified scam numbers are automatically rejected and silenced; unknown/safe calls ring normally.

---

## 🔨 Full Native Rebuild (Only Needed if Changing Kotlin Code)

If you modify files inside `modules/setu-native/android/`:
```bash
npx expo run:android --device
```
