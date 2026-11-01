# Setu Guardian — Android Elder Anti-Scam Shield

An Android mobile application built with React Native + Expo SDK 58 and Kotlin native modules. It silently protects elderly users from phone and WhatsApp scams by reading scam notifications, automatically engaging scammers with the "Saroj Aunty" AI decoy persona, screening incoming calls via threat intel, and deploying a full-screen Interlock Overlay over payment apps during active threats.

---

## 🌐 Cloudflare Tunnel & Backend Infrastructure

To provide a permanent, resilient HTTPS backend endpoint for mobile devices and GitHub Actions release builds without exposing public IP addresses or managing static port forwards, the FastAPI backend is proxied through a persistent Cloudflare Tunnel mapped to the domain **`kintree.space`**.

### 1. Architecture Overview

```
[ Android App / Phone ]
          │
          ▼  HTTPS
https://setu-backend.kintree.space
          │
          ▼  Cloudflare Edge Network
    [ Cloudflare Tunnel: setu-prod-tunnel ]
          │  Encrypted QUIC/HTTP2 stream
          ▼
   [ cloudflared daemon ]
          │  HTTP
          ▼
   FastAPI Backend (http://localhost:8000)
```

### 2. Tunnel Configuration (`~/.cloudflared/config.yml`)

The tunnel is configured to route traffic destined for `setu-backend.kintree.space` directly to the local FastAPI server:

```yaml
tunnel: 73bb8f4f-510e-4e7a-b9f7-0e75be71f60b
credentials-file: /home/kaelprime/.cloudflared/73bb8f4f-510e-4e7a-b9f7-0e75be71f60b.json

ingress:
  - hostname: setu-backend.kintree.space
    service: http://localhost:8000
  - hostname: kintree.space
    service: http://localhost:8000
  - service: http_status:404
```

### 3. Step-by-Step Tunnel Setup Commands

#### A. Initial Tunnel Creation & DNS Routing (One-Time Setup)
```bash
# 1. Authenticate cloudflared with Cloudflare (if not already logged in)
cloudflared tunnel login

# 2. Create the named tunnel
cloudflared tunnel create setu-prod-tunnel

# 3. Route the DNS CNAME record on kintree.space
cloudflared tunnel route dns setu-prod-tunnel setu-backend.kintree.space
```

#### B. Starting the Tunnel Daemon
Run the tunnel daemon whenever the FastAPI backend is active:
```bash
# Run in foreground:
cloudflared tunnel run setu-prod-tunnel

# Or run as a systemd service / background process:
nohup cloudflared tunnel run setu-prod-tunnel > /tmp/cloudflared.log 2>&1 &
```

#### C. Zero-Config Ephemeral Fallback Tunnel
If working on a temporary machine without Cloudflare account credentials:
```bash
cloudflared tunnel --url http://localhost:8000
# Outputs a temporary URL like https://xyz.trycloudflare.com
```

### 4. Verification & Health Checks
Verify that the tunnel is correctly forwarding requests to FastAPI:

```bash
# Check scam economy stats
curl -s https://setu-backend.kintree.space/scam-economy/stats

# Check telecom threat intelligence
curl -s https://setu-backend.kintree.space/threat-intel/%2B919876543210

# Test scam detection engine
curl -X POST https://setu-backend.kintree.space/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer setu-dev-token" \
  -d '{"message":"Electricity disconnected in 1 hr. Call 9876543210"}'
```

---

## 📱 Environment Variables Configuration

The app reads environment variables via Expo's `EXPO_PUBLIC_` prefix, automatically inlined at bundle time:

Create or edit `.env` in the project root:
```env
EXPO_PUBLIC_API_URL=https://setu-backend.kintree.space
EXPO_PUBLIC_TEAM_TOKEN=setu-dev-token
EXPO_PUBLIC_FAMILY_ID=fam_pune_9823
EXPO_PUBLIC_DEVICE_ID=elder_pixel_6a_01
EXPO_PUBLIC_FALLBACK_URL=https://remix-boston-took-considering.trycloudflare.com
```

> **Note**: An `.env.example` file is included in the repository. The GitHub Actions release workflow (`.github/workflows/release.yml`) also generates this configuration automatically during automated APK builds.

---

## 🚀 Quick Start (Starting the Dev Server)

Since the native APK is installed on the device (`com.setuguardian`), you do **not** need to rebuild the native app. Just start Metro for live hot reloading.

### Step 1: Ensure phone is connected via ADB
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
Launch **Setu Guardian** from the app drawer, or directly via ADB:
```bash
adb shell monkey -p com.setuguardian -c android.intent.category.LAUNCHER 1
```

---

## 🎨 User Interface Architecture

The app is built with a pitch-black OLED aesthetic (`#000000`) and high-contrast typography designed specifically for elders. Navigation is divided into four dedicated tabs:

1. **🛡️ Shield**:
   - Live status indicator (Active / Threat Detected).
   - Emergency unlock card (revealed only during active interlock).
   - Quiet toggles for Real-time Protection and Saroj AI Auto-Reply.
2. **📡 Activity (Radar)**:
   - High-level metric counters (Rupees Protected, Scammer Time Wasted, Threats Blocked).
   - Real-time audit timeline of incoming alerts and defense actions.
3. **👵 Decoy (Saroj Aunty)**:
   - Persona profile and threat scenario picker (Electricity bill, Digital arrest, Bank KYC, Courier scam).
   - Interactive live dialogue transcript showing Saroj wasting scammer time.
4. **🚨 Helpline (1930 Dossier)**:
   - One-tap Indian Cybercrime Helpline **Call 1930** button.
   - 1-Click police incident evidence dossier generation and export.
5. **⚙️ Settings (Top-Right Gear)**:
   - Live backend URL and authorization token editor.
   - Android system permissions audit checklist.
   - Collapsible developer lab (simulate message, test overlay).

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

From the **Settings Modal** (gear icon in the top right navbar):

### 1. Simulate Scam Message
Tap **"Simulate Scam Message"**:
* Injects a real-world Digital Arrest Hinglish transcript into the `/detect` intake pipeline.
* If flagged, it automatically demonstrates Saroj's AI decoy reply and arms the Interlock.
* Watch the **Activity** tab update in real time.

### 2. Test Interlock Overlay
Tap **"Test Interlock"**:
* Instantly launches the full-screen `TYPE_APPLICATION_OVERLAY` over your screen and payment apps (GPay, PhonePe, Paytm).
* Displays bold English & Hindi warnings and threat intel.
* Tap **"Dismiss / Son Release"** to release.

### 3. WhatsApp Live Decoy Test
* Ensure the **Saroj Auto-Reply Decoy** toggle is **ON** in the Shield tab.
* Send a scam message to the device on WhatsApp.
* Setu Guardian captures the notification, queries `/detect` and `/chat/decoy-reply`, and uses `RemoteInput` on the notification to reply directly into WhatsApp as Saroj Aunty.

### 4. Telecom Call Screening
* When receiving a call, `SetuCallScreeningService` queries `GET /threat-intel/{phone}` (1500ms timeout).
* Verified scam numbers are automatically rejected and silenced; unknown/safe calls ring normally.

---

## 🔨 Full Native Rebuild (Only Needed if Changing Kotlin Code)

If you modify files inside `modules/setu-native/android/`:
```bash
npx expo run:android --device
```
