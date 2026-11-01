import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TranscriptTurn, ExtractedIntel } from '../types';

interface VoiceDecoyState {
  transcript: TranscriptTurn[];
  isCallActive: boolean;
  isSpeaking: boolean;
  isMicListening: boolean;
  connecting: boolean;
  callId: string;
  callDuration: number;
  activeScenario: string;
  extractedIntel: ExtractedIntel;
  lastIntent: string | null;
  startCall: (scenario: string, phone?: string) => Promise<void>;
  sendScammerMessage: (text: string) => Promise<void>;
  startMicListening: () => Promise<string | null>;
  endCall: () => void;
}

interface SarojDecoyScreenProps {
  decoyActive: boolean;
  onToggleDecoy: (val: boolean) => void;
  voiceDecoy: VoiceDecoyState;
}

interface ScenarioConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  scammerPremise: string;
  sarojTactic: string;
  quickPrompts: string[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'digital_arrest',
    badge: '🚨 TOP THREAT',
    title: 'Digital Arrest',
    subtitle: 'CBI / Police Extortion',
    scammerPremise: 'Extortionist poses as CBI/Police claiming an arrest warrant was issued for Aadhaar money laundering.',
    sarojTactic: 'Acts terrified, feigns bad hearing, asks for badge numbers and writes fake account 5017...42 in diary.',
    quickPrompts: [
      'CBI Officer Sharma bol raha hoon. Supreme Court se arrest warrant hai!',
      'Aapka Aadhaar money laundering me use hua hai, 50,000 fine bhejo!',
      'Account 9876543210987 par UPI ya IMPS se turant transfer karo!',
      'Jaldi karo warna police bhej raha hoon ghar pe!',
      'Tum koi AI bot ya recording toh nahi ho na?',
    ],
  },
  {
    id: 'mpeb_bill',
    badge: '⚡ COMMON PHISHING',
    title: 'Electricity Bill Cutoff',
    subtitle: 'MPEB / Discom Phishing',
    scammerPremise: 'Scammer threatens to disconnect home power in 1 hour unless an unpaid bill is paid immediately.',
    sarojTactic: 'Complains about dark house, searches for misplaced spectacles, and asks if they accept cash in Pune.',
    quickPrompts: [
      'Electricity board se bol raha hoon, 1 ghante mein bijli kaat rahe hain!',
      '1,500 rupaye bill abhi pay karo link se warna connection gaya!',
      'Aapke phone par verification OTP aaya hai, jaldi bolo!',
      'Officer Sharma se baat karo turant line reconnect karne ke liye!',
    ],
  },
  {
    id: 'bank_kyc',
    badge: '🏦 BANK FRAUD',
    title: 'Bank KYC Freeze',
    subtitle: 'SBI / HDFC Account Block',
    scammerPremise: 'Fraudster warns elder that their savings account and debit card are permanently blocked.',
    sarojTactic: 'Offers to read out her red passbook page numbers and pretends phone screen is too blurry to click links.',
    quickPrompts: [
      'State Bank manager bol raha hoon, aapka khata freeze ho gaya hai!',
      'Aadhaar aur PAN link nahi hai, turant OTP batao!',
      'Google Pay ya PhonePe par 10 rupaye bhej kar account verify karo!',
      'Passbook ka 16-digit account number bolo jaldi!',
    ],
  },
  {
    id: 'customs_parcel',
    badge: '📦 NARCOTICS FRAUD',
    title: 'Customs Contraband',
    subtitle: 'FedEx / Narcotics Cell',
    scammerPremise: 'Fake customs agent alleges a package containing contraband was addressed to Taiwan in elder’s name.',
    sarojTactic: 'Wonders how a parcel went to Taiwan when she only visits the local Ganpati temple in Somwar Peth.',
    quickPrompts: [
      'Mumbai Customs se bol raha hoon, aapke parcel me 5 fake passport aur drugs mile hain!',
      'Case band karne ke liye 25,000 clearance fee turant transfer karo!',
      'Customs clearance verification ke liye apna bank account batao!',
    ],
  },
  {
    id: 'lottery',
    badge: '🎁 REWARD SCAM',
    title: 'KBC Lottery Reward',
    subtitle: 'Fake 25 Lakhs Cash',
    scammerPremise: 'Scammer promises a massive lottery prize but demands upfront processing fee.',
    sarojTactic: 'Acts excited, promises to buy temple sweets, and asks if Amitabh Bachchan will hand-deliver the cheque.',
    quickPrompts: [
      'KBC lottery head office se bol raha hoon, aapka 25 Lakh ka inaam nikla hai!',
      'TDS tax clearance ke liye pehle 12,500 rupaye jama karo!',
      'Inaam ka cheque lene ke liye registration charge bhejo!',
    ],
  },
];

export const SarojDecoyScreen: React.FC<SarojDecoyScreenProps> = ({
  voiceDecoy,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('digital_arrest');
  const [customInput, setCustomInput] = useState<string>('');
  const dialogueScrollRef = useRef<any>(null);

  const {
    transcript,
    isCallActive,
    isSpeaking,
    isMicListening,
    connecting,
    callDuration,
    extractedIntel,
    lastIntent,
    startCall,
    sendScammerMessage,
    startMicListening,
    endCall,
  } = voiceDecoy;

  // Audio wave pulse animation for active calls
  const waveAnim1 = useRef(new Animated.Value(6)).current;
  const waveAnim2 = useRef(new Animated.Value(18)).current;
  const waveAnim3 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isCallActive) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 24, duration: 350, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 8, duration: 450, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 20, duration: 400, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(waveAnim1, { toValue: 8, duration: 400, useNativeDriver: false }),
            Animated.timing(waveAnim2, { toValue: 22, duration: 380, useNativeDriver: false }),
            Animated.timing(waveAnim3, { toValue: 10, duration: 420, useNativeDriver: false }),
          ]),
        ])
      );
      anim.start();
    } else {
      waveAnim1.setValue(8);
      waveAnim2.setValue(18);
      waveAnim3.setValue(12);
    }
    return () => anim?.stop();
  }, [isCallActive]);

  // Auto-scroll dialogue on new turn
  useEffect(() => {
    if (isCallActive) {
      setTimeout(() => {
        dialogueScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [transcript, isSpeaking, isCallActive]);

  const selectedScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendPrompt = (text: string) => {
    if (!text.trim() || isSpeaking) return;
    sendScammerMessage(text.trim());
    setCustomInput('');
  };

  const handleMicPress = async () => {
    if (isSpeaking || isMicListening) return;
    try {
      const recognized = await voiceDecoy.startMicListening();
      if (recognized && recognized.trim()) {
        setCustomInput(recognized.trim());
      }
    } catch (err) {
      console.warn('Speech capture error:', err);
    }
  };

  const hasIntel =
    extractedIntel.upi_ids.length > 0 ||
    extractedIntel.phones.length > 0 ||
    extractedIntel.accounts.length > 0;

  // =========================================================================
  // RENDER: ACTIVE IN-CALL VIEW (Fixed Header + Scrollable Chat + Bottom Deck)
  // =========================================================================
  if (isCallActive) {
    return (
      <KeyboardAvoidingView
        style={styles.inCallContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* FIXED IN-CALL HEADER */}
        <View style={styles.fixedCallHeader}>
          <View style={styles.callHeaderLeft}>
            <View style={styles.liveIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveCallText}>CALL CONNECTED</Text>
            </View>
            <Text style={styles.targetName}>Saroj Aunty (+91 98220 12345)</Text>
            <Text style={styles.targetLocation}>Somwar Peth, Pune • Elder Decoy</Text>
          </View>

          <View style={styles.callHeaderRight}>
            <Text style={styles.timerText}>{formatTimer(callDuration)}</Text>
            <View style={styles.waveRow}>
              <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim3 }]} />
            </View>
          </View>
        </View>

        {/* FIXED TACTICS STRIP */}
        <View style={styles.tacticsStrip}>
          <View style={styles.tacticItem}>
            <Text style={styles.tacticLabel}>TACTIC:</Text>
            <Text style={styles.tacticValue} numberOfLines={1}>
              {lastIntent === 'bait_upi'
                ? '🎯 Asking for UPI ID / Passbook'
                : lastIntent === 'bait_account'
                ? '🎣 Feeding Fake Acct 5017...42'
                : lastIntent === 'confuse'
                ? '👵 Hurt Elder Confusion'
                : '⏳ Stalling / Misplaced Chashma'}
            </Text>
          </View>
          <View style={styles.tacticItem}>
            <Text style={styles.tacticLabel}>SCENARIO:</Text>
            <Text style={styles.tacticValue}>{selectedScenario.title}</Text>
          </View>
        </View>

        {/* HARVESTED INTEL BANNER */}
        {hasIntel && (
          <View style={styles.intelBox}>
            <Text style={styles.intelHeading}>🔍 LIVE HARVESTED INTEL (EVIDENCE FOR 1930):</Text>
            <View style={styles.intelChipsRow}>
              {extractedIntel.upi_ids.map((upi, i) => (
                <View key={`upi-${i}`} style={styles.intelChip}>
                  <Text style={styles.intelChipText}>UPI: {upi}</Text>
                </View>
              ))}
              {extractedIntel.accounts.map((acct, i) => (
                <View key={`acct-${i}`} style={styles.intelChip}>
                  <Text style={styles.intelChipText}>Mule Acct: {acct}</Text>
                </View>
              ))}
              {extractedIntel.phones.map((phone, i) => (
                <View key={`phone-${i}`} style={styles.intelChip}>
                  <Text style={styles.intelChipText}>Phone: {phone}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SCROLLABLE DIALOGUE TRANSCRIPT */}
        <ScrollView
          ref={dialogueScrollRef}
          style={styles.dialogueScroll}
          contentContainerStyle={styles.dialogueContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {transcript.map((turn, idx) => {
            const isSaroj = turn.speaker === 'saroj_aunty';
            return (
              <View
                key={idx}
                style={[
                  styles.turnRow,
                  isSaroj ? styles.turnRowSaroj : styles.turnRowScammer,
                ]}
              >
                {isSaroj && (
                  <View style={styles.sarojAvatar}>
                    <Text style={{ fontSize: 18 }}>👵</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isSaroj ? styles.bubbleSaroj : styles.bubbleScammer,
                  ]}
                >
                  <View style={styles.bubbleMeta}>
                    <Text
                      style={[
                        styles.bubbleAuthor,
                        isSaroj ? styles.authorSaroj : styles.authorScammer,
                      ]}
                    >
                      {isSaroj ? 'Saroj Aunty' : 'You (Scammer)'}
                    </Text>
                    {turn.timestamp && (
                      <Text style={styles.bubbleTime}>{turn.timestamp}</Text>
                    )}
                  </View>
                  <Text style={styles.bubbleContent}>{turn.text}</Text>
                  {isSaroj && turn.llm_ms && (
                    <Text style={styles.latencyTag}>⚡ LLM: {turn.llm_ms}ms</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* SAROJ THINKING INDICATOR */}
          {isSpeaking && (
            <View style={[styles.turnRow, styles.turnRowSaroj]}>
              <View style={styles.sarojAvatar}>
                <Text style={{ fontSize: 18 }}>👵</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleSaroj, styles.thinkingBubble]}>
                <Text style={styles.thinkingText}>
                  👵 Saroj Aunty is formulating reply...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* PINNED BOTTOM SCAMMER CONTROLS */}
        <View style={styles.pinnedScammerDeck}>
          {isMicListening ? (
            <View style={styles.micListeningBanner}>
              <View style={styles.pulseDotRed} />
              <Text style={styles.micListeningText}>
                🎙️ LIVE MIC ACTIVE — Speak your threat freely (Hands-Free WebRTC)...
              </Text>
            </View>
          ) : isSpeaking ? (
            <View style={styles.micListeningBanner}>
              <View style={[styles.pulseDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={[styles.micListeningText, { color: '#38BDF8' }]}>
                👵 Saroj Aunty is replying aloud...
              </Text>
            </View>
          ) : (
            <Text style={styles.scammerDeckTitle}>
              🗣️ LIVE CALL ACTIVE • Speak freely or tap a threat:
            </Text>
          )}

          {/* QUICK PROMPTS HORIZONTAL STRIP */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickPromptScroll}
            contentContainerStyle={styles.quickPromptContent}
            keyboardShouldPersistTaps="handled"
          >
            {selectedScenario.quickPrompts.map((prompt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickPromptChip}
                onPress={() => handleSendPrompt(prompt)}
                disabled={isSpeaking}
                activeOpacity={0.7}
              >
                <Text style={styles.quickPromptText} numberOfLines={2}>
                  💬 "{prompt}"
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* CUSTOM TEXT INPUT & MIC CONTROLS */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={isMicListening ? '🎙️ Mic listening... (or type threat here)' : 'Type custom threat or demand...'}
              placeholderTextColor="#666666"
              value={customInput}
              onChangeText={setCustomInput}
              editable={!isSpeaking}
              onSubmitEditing={() => handleSendPrompt(customInput)}
            />
            <TouchableOpacity
              style={[
                styles.micButton,
                isMicListening && styles.micButtonListening,
                isSpeaking && styles.buttonDisabled,
              ]}
              onPress={handleMicPress}
              disabled={isSpeaking}
              activeOpacity={0.8}
            >
              <Text style={styles.micButtonText}>{isMicListening ? '🔴 Live' : '🎙️ Mic'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!customInput.trim() || isSpeaking) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSendPrompt(customInput)}
              disabled={!customInput.trim() || isSpeaking}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* HANGUP BUTTON */}
          <TouchableOpacity
            style={styles.hangupButton}
            onPress={endCall}
            activeOpacity={0.8}
          >
            <Text style={styles.hangupButtonText}>🔴 End Call & Hang Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================================
  // RENDER: IDLE / PRE-CALL VIEW (Scenario Selection + Persona Profile)
  // =========================================================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Saroj Aunty Voice Decoy</Text>
      <Text style={styles.subtitle}>
        AI grandmother persona that traps scammers on the phone and harvests mule accounts.
      </Text>

      {/* PERSONA PROFILE CARD */}
      <View style={styles.personaCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>👵</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.personaName}>Saroj Aunty (Pune, Maharashtra)</Text>
          <Text style={styles.personaSub}>
            68-year-old retired Hindi teacher. Speaks gently with deep respect ("beta", "sahab"), feigns poor hearing and misplaced spectacles, and strings scammers along indefinitely.
          </Text>
        </View>
      </View>

      {/* SCENARIO SELECTION LIST */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Select Attack Scenario to Test</Text>
        <Text style={styles.cardSub}>
          Pick the extortion premise you want to simulate against Saroj:
        </Text>

        <View style={styles.scenarioList}>
          {SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <TouchableOpacity
                key={sc.id}
                style={[
                  styles.scenarioItem,
                  isSelected && styles.scenarioItemActive,
                ]}
                onPress={() => setSelectedScenarioId(sc.id)}
                activeOpacity={0.8}
              >
                <View style={styles.scenarioItemTop}>
                  <Text style={styles.scenarioBadge}>{sc.badge}</Text>
                  <Text style={styles.scenarioTitle}>{sc.title}</Text>
                </View>
                <Text style={styles.scenarioSubtitle}>{sc.subtitle}</Text>
                <Text style={styles.scenarioPremise}>{sc.scammerPremise}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SELECTED SCENARIO STRATEGY CARD */}
      <View style={styles.tacticCard}>
        <Text style={styles.tacticCardTitle}>
          🎯 Saroj Aunty's Defense Strategy for "{selectedScenario.title}":
        </Text>
        <Text style={styles.tacticCardBody}>
          {selectedScenario.sarojTactic}
        </Text>
      </View>

      {/* START TEST CALL BUTTON */}
      <TouchableOpacity
        style={styles.startCallButton}
        onPress={() => startCall(selectedScenarioId)}
        disabled={connecting}
        activeOpacity={0.8}
      >
        <Text style={styles.startCallButtonText}>
          {connecting ? 'Connecting Decoy Engine...' : '📞 Call Saroj Aunty as Scammer'}
        </Text>
        <Text style={styles.startCallSubText}>
          Live 2-way call with real-time AI intelligence extraction
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },

  // PERSONA CARD
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: '#1E2433',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10B98120',
    borderWidth: 1,
    borderColor: '#10B98150',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  personaName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  personaSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 17,
  },

  // CARD & SCENARIO SELECTOR
  card: {
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: '#1A202C',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    marginBottom: 14,
  },
  scenarioList: {
    gap: 10,
  },
  scenarioItem: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 14,
    padding: 14,
  },
  scenarioItemActive: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B20',
  },
  scenarioItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scenarioBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scenarioSubtitle: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginBottom: 4,
  },
  scenarioPremise: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // TACTIC CARD
  tacticCard: {
    backgroundColor: '#111827',
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  tacticCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  tacticCardBody: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },

  // START CALL BUTTON
  startCallButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startCallButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },
  startCallSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#064E3B',
    marginTop: 4,
  },

  // ===================== IN-CALL VIEW STYLES =====================
  inCallContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90, // Leave room for bottom navigation bar
  },
  fixedCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: '#1E2433',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  callHeaderLeft: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveCallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  targetLocation: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  callHeaderRight: {
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },

  // TACTICS STRIP
  tacticsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0E131E',
    borderWidth: 1,
    borderColor: '#1A2333',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tacticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tacticLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  tacticValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
  },

  // INTEL BOX
  intelBox: {
    backgroundColor: '#064E3B20',
    borderWidth: 1,
    borderColor: '#10B98150',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  intelHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  intelChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  intelChip: {
    backgroundColor: '#10B98125',
    borderWidth: 1,
    borderColor: '#10B98180',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  intelChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
  },

  // DIALOGUE SCROLL
  dialogueScroll: {
    flex: 1,
    marginBottom: 8,
  },
  dialogueContent: {
    gap: 10,
    paddingVertical: 6,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  turnRowSaroj: {
    justifyContent: 'flex-start',
  },
  turnRowScammer: {
    justifyContent: 'flex-end',
  },
  sarojAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleSaroj: {
    backgroundColor: '#161D2A',
    borderWidth: 1,
    borderColor: '#2D3748',
    borderTopLeftRadius: 4,
  },
  bubbleScammer: {
    backgroundColor: '#7F1D1D35',
    borderWidth: 1,
    borderColor: '#EF444460',
    borderTopRightRadius: 4,
  },
  bubbleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  bubbleAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorSaroj: {
    color: '#10B981',
  },
  authorScammer: {
    color: '#EF4444',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#64748B',
  },
  bubbleContent: {
    fontSize: 13,
    color: '#F1F5F9',
    lineHeight: 18,
  },
  latencyTag: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  thinkingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  thinkingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },

  // PINNED SCAMMER DECK
  pinnedScammerDeck: {
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: '#1E2433',
    borderRadius: 16,
    padding: 12,
  },
  scammerDeckTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  quickPromptScroll: {
    marginBottom: 8,
  },
  quickPromptContent: {
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  quickPromptText: {
    fontSize: 11,
    color: '#F9FAFB',
    fontWeight: '500',
    lineHeight: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sendButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  micListeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444460',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  pulseDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  micListeningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
    flex: 1,
  },
  micButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonListening: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  micButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  hangupButton: {
    backgroundColor: '#1E2433',
    borderWidth: 1,
    borderColor: '#EF444480',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
});
