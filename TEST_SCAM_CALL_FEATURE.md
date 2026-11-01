# WebRTC Scam Call Simulation - Test Plan

## ✅ Implementation Complete

### Backend Enhancements (Python FastAPI)
**File**: `../hack-setu/app/api/v1/endpoints/chat.py`

1. **Hyper-Intelligent Context-Aware Saroj AI**
   - Replaced basic pattern matching with advanced intelligence gap analysis
   - LLM tracks what's missing: name, badge, location, payment account, case reference
   - Uses Groq Llama 3.3 70B (primary) and Gemini 2.0 Flash (fallback)
   - AI now asks **specific targeted questions** based on conversation context
   - No more generic "I noted your details" responses

2. **Comprehensive Database Persistence**
   - Stores officer name, badge number, case number, location
   - Extracts and saves mule accounts, UPI IDs, phone numbers
   - Updates Supabase `device_events` and `threat_intel` tables
   - Full audit trail with intelligence gap tracking

3. **New API Endpoint**: `POST /chat/trigger-scam-call`
   - Simulates incoming scam calls with specified scenario
   - Publishes FCM/WebSocket alerts for mobile UI
   - Stores call metadata in database
   - Returns call ID and routing instructions

### Mobile App Features (React Native + Expo)

1. **New CallSimulatorScreen** (`src/screens/CallSimulatorScreen.tsx`)
   - Scenario selector matching existing decoy tab design
   - 5 scam scenarios: Digital Arrest, Electricity Cutoff, Bank KYC, Customs, Lottery
   - Displays scammer phone number and scenario details
   - "Trigger Scam Call" button with 2-second delay

2. **New IncomingCallScreen** (`src/screens/IncomingCallScreen.tsx`)
   - Full-screen incoming call UI with realistic ringtone simulation
   - Vibration pattern: [0ms, 400ms, 200ms, 400ms] repeating
   - Ripple animations around caller number
   - Warning banner: "Suspected Scam Call"
   - Decoy mode indicator with auto-answer countdown (3, 2, 1...)
   - Accept/Reject buttons with visual pulse animation

3. **Conditional Routing Logic**
   - **Decoy Toggle ON** → Auto-answers after 3s countdown, routes to Saroj AI
   - **Decoy Toggle OFF** → User manually accepts, speaks directly via WebRTC
   - Integrated with existing `useVoiceDecoy` hook for STT/TTS

4. **Bottom Navigation Bar Update** (`src/components/navigation/BottomTabBar.tsx`)
   - Added new "Call" tab (📞 icon) to navigation
   - Updated `AppTab` type to include `'call'`

5. **API Service Extension** (`src/services/api.ts`)
   - Added generic `post<T>()` and `get<T>()` methods
   - Support for custom timeout and body payload

---

## 🧪 Testing Instructions

### Prerequisites
1. **Backend Running**:
   ```bash
   cd ../hack-setu
   source .venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Mobile App Connected**:
   ```bash
   cd hack-setu-app
   npx expo start --dev-client
   # Ensure device/emulator is connected via ADB
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:8000 tcp:8000
   ```

3. **Environment Variables** (`.env`):
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000
   EXPO_PUBLIC_TEAM_TOKEN=setu-dev-token
   EXPO_PUBLIC_DEVICE_ID=elder_test_device
   EXPO_PUBLIC_FAMILY_ID=fam_test_family
   ```

---

### Test Case 1: AI Decoy Mode (Auto-Answer ON)

**Setup**:
- Navigate to **Shield** tab
- Toggle **"Saroj AI Decoy"** to **ON** (purple toggle should be active)

**Steps**:
1. Navigate to **Call** tab (📞 icon in bottom bar)
2. Select **"Digital Arrest"** scenario
3. Verify selected scenario details display (CBI officer, +919876543210)
4. Tap **"📞 Trigger Scam Call"**
5. Wait 2 seconds → Phone should **ring with vibration**
6. Incoming call screen should show:
   - Scammer number: +919876543210
   - Warning: "Suspected Scam Call"
   - **Decoy banner**: "Auto-answering in 3s... 2s... 1s..."
7. After countdown → Call **auto-accepts** and navigates to **Decoy (Saroj)** tab
8. Saroj should greet: *"नमस्ते जी, मैं सरोज बोल रही हूँ। आप कौन बोल रहे हैं?"*

**Test Conversation Flow**:
```
You (scammer): "CBI se bol raha hoon, arrest warrant hai aapke naam pe!"
Saroj AI: "साहब आप कौन हैं? आपका पूरा नाम और बैज नंबर बताइए..."

You: "Officer Sharma badge 12345"
Saroj AI: "आप कौन से पुलिस स्टेशन से बोल रहे हैं? पूरा पता दीजिए."

You: "Mumbai CBI office se"
Saroj AI: "जुर्माना कहाँ भेजूँ? आपका UPI आईडी बताइए."

You: "Pay to sharma.cbi@paytm"
Saroj AI: "ठीक है जी, मैंने सब लिख लिया है। मैं अपने बेटे से बात करके बताती हूँ। नमस्ते." [CALL ENDS]
```

**Expected Backend Behavior**:
- Each turn should be logged to database with:
  - Officer name: "Officer Sharma"
  - Badge number: "12345"
  - Location: "Mumbai CBI office"
  - UPI ID: "sharma.cbi@paytm"
- Intelligence gap tracking updates after each response
- LLM generates context-aware questions (not generic responses)

**Verification**:
```bash
# Check database logs
curl http://localhost:8000/dashboard/events?limit=10
# Verify extracted intel in response payload
```

---

### Test Case 2: Manual Mode (Auto-Answer OFF)

**Setup**:
- Navigate to **Shield** tab
- Toggle **"Saroj AI Decoy"** to **OFF**

**Steps**:
1. Navigate to **Call** tab
2. Select **"Electricity Cutoff"** scenario
3. Tap **"Trigger Scam Call"**
4. Incoming call screen should show:
   - **NO auto-answer countdown**
   - Accept button label: "Accept Call" (not "Accept (AI Decoy)")
5. **Manually tap Accept button**
6. Should navigate to **Decoy (Saroj)** tab
7. User can now **speak directly** via microphone (no AI auto-reply)

**Expected Behavior**:
- Saroj greets but waits for manual mic button press
- User taps **"🎙️ Mic"** button to record scammer message
- User types or speaks threat manually
- Saroj AI responds intelligently based on manual input
- No auto-answer, full manual control

---

### Test Case 3: Reject Incoming Call

**Steps**:
1. Trigger any scam call scenario
2. When incoming call screen appears → Tap **"✕ Reject"** button
3. Call should be **immediately dismissed**
4. Alert: "Call Rejected - Scam call was blocked and reported."
5. Should return to **Call** tab

---

### Test Case 4: Intelligence Extraction Verification

**Setup**:
- Start call with "Digital Arrest" scenario
- Feed Saroj AI with rich scammer data

**Scammer Input Sequence**:
```
Turn 1: "CBI Officer Rajesh Kumar bol raha hoon, badge number IPS-9876"
Turn 2: "Connaught Place police station, New Delhi se"
Turn 3: "Case number FIR-2024/12345"
Turn 4: "Payment kariye 50000 rupaye kumar.cbi@okaxis pe"
```

**Expected Saroj Responses** (context-aware):
```
Turn 1: "ठीक है Rajesh Kumar जी, आपका बैज नंबर क्या है? मुझे लिखना है."
Turn 2: "आप कौन से पुलिस स्टेशन से बोल रहे हैं?"
Turn 3: [Gets location] "ये जो केस या FIR है उसका नंबर क्या है?"
Turn 4: [Gets case ref] "जुर्माना कहाँ भेजूँ? UPI आईडी बताइए."
Turn 5: [Gets UPI] "ठीक है, सब लिख लिया। मेरे बेटे से बात करती हूँ। नमस्ते."
```

**Database Verification**:
```bash
# Query Supabase or backend logs
curl http://localhost:8000/dashboard/events?event_type=decoy_chat_turn

# Expected payload structure:
{
  "officer_name": "Rajesh Kumar",
  "badge_number": "IPS-9876",
  "location": "Connaught Place police station New Delhi",
  "case_number": "FIR-2024/12345",
  "extracted_intel": {
    "upi_ids": ["kumar.cbi@okaxis"],
    "phones": [],
    "accounts": [],
    "urls": []
  },
  "has_name": true,
  "has_badge": true,
  "has_location": true,
  "has_payment": true,
  "has_case_ref": true
}
```

---

### Test Case 5: LLM Intelligence Comparison

**Scenario**: Test with intentionally vague scammer responses

**Old AI Response** (Pre-Update):
```
Scammer: "Officer bol raha hoon"
Old Saroj: "I noted your details. Thank you." ❌ (Generic, useless)
```

**New AI Response** (Post-Update):
```
Scammer: "Officer bol raha hoon"
New Saroj: "साहब आप कौन हैं? आपका पूरा नाम और बैज नंबर बताइए." ✅ (Specific, targeted)
```

**Scammer Evasion Test**:
```
You: "Payment details baad mein dunga"
New Saroj: "नहीं बेटा, अभी बताइए। आपका UPI आईडी या बैंक अकाउंट नंबर क्या है?"
```

---

## 🐛 Known Issues & Future Improvements

1. **Ringtone Audio**: Currently using vibration only. Add actual `.mp3` ringtone file to `assets/`
2. **WebRTC Audio Routing**: Test with Bluetooth headsets and external speakers
3. **Background Call Handling**: Test when app is backgrounded or screen is locked
4. **Multiple Scenarios**: Test rapid scenario switching and back-to-back calls

---

## 📊 Success Metrics

✅ **AI Intelligence Upgrade**:
- No more "I noted your details" generic responses
- Context-aware questions based on intelligence gaps
- Successful extraction of name, badge, location, payment, case ref

✅ **WebRTC Call Simulation**:
- Phone rings with vibration on trigger
- Incoming call UI displays correctly
- Accept/Reject buttons functional

✅ **Conditional Routing**:
- Decoy ON → Auto-answers and routes to AI
- Decoy OFF → User manually picks up call
- Auto-answer countdown (3s) works correctly

✅ **Database Persistence**:
- All conversation turns stored in `device_events`
- Threat intel updated with scammer profile
- Intelligence gap tracking persisted

---

## 🚀 Deployment Checklist

- [ ] Test on physical Android device (not just emulator)
- [ ] Verify FCM push notifications for incoming calls
- [ ] Test with production backend URL (Cloudflare tunnel)
- [ ] Add actual ringtone audio file to assets
- [ ] Test with multiple concurrent calls
- [ ] Verify database queries and indexes for performance
- [ ] Add analytics tracking for call acceptance rate
- [ ] Test call rejection and blocking flows

---

## 🎯 Next Steps

1. **Add Ringtone**: Place `ringtone.mp3` in `assets/` and uncomment audio playback code
2. **WebRTC Audio**: Test STT/TTS with real scammer voice samples
3. **UI Polish**: Add more visual feedback during call (waveform, timer)
4. **Backend Scaling**: Optimize LLM response time (target <2s per turn)
5. **Analytics Dashboard**: Display extracted intel stats in admin panel
