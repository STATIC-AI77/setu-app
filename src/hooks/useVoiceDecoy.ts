import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import {
  LiveKitTokenResponse,
  TranscriptTurn,
  ChatHistoryItem,
  ExtractedIntel,
} from '../types';
import { api } from '../services/api';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

const DEFAULT_INTEL: ExtractedIntel = {
  urls: [],
  phones: [],
  upi_ids: [],
  accounts: [],
};

const stopAllSpeaking = () => {
  try {
    Speech.stop();
  } catch (_e) {}
  try {
    SetuNativeModule.stopSpeaking();
  } catch (_e) {}
  try {
    SetuNativeModule.stopAudio();
  } catch (_e) {}
};

const DEFAULT_GREETING = 'नमस्ते, हेलो! कौन बोल रहे हैं आप?';

const formatTimeNow = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}/g;
const urlRegex = /(?:https?:\/\/|www\.)[^\s]+/gi;
const accRegex = /\b\d{9,18}\b/g;

const playSarojVoice = async (text: string, audioBase64?: string | null, audioUrl?: string | null) => {
  stopAllSpeaking();

  if (audioBase64) {
    try {
      const src = audioBase64.startsWith('data:') ? audioBase64 : `data:audio/mp3;base64,${audioBase64}`;
      const played = await SetuNativeModule.playAudio(src);
      if (played) return;
    } catch (_e) {}
  }

  if (audioUrl) {
    try {
      const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${api.getBaseUrl()}${audioUrl}`;
      const played = await SetuNativeModule.playAudio(fullUrl);
      if (played) return;
    } catch (_e) {}
  }

  // Fallback to Native TTS / Expo Speech
  return new Promise<void>((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const safetyTimeout = Math.max(1800, text.length * 80);
    const timeoutHandle = setTimeout(finish, safetyTimeout);

    try {
      SetuNativeModule.speakAsSaroj(text)
        .then((success) => {
          if (success) {
            clearTimeout(timeoutHandle);
            finish();
          } else {
            // Fallback to Expo Speech only if native TTS failed
            const hasDevanagari = /[\u0900-\u097F]/.test(text);
            Speech.speak(text, {
              language: hasDevanagari ? 'hi-IN' : 'en-IN',
              pitch: 1.0,
              rate: 0.95,
              onDone: () => {
                clearTimeout(timeoutHandle);
                finish();
              },
              onError: () => {
                clearTimeout(timeoutHandle);
                finish();
              },
            });
          }
        })
        .catch(() => {
          const hasDevanagari = /[\u0900-\u097F]/.test(text);
          Speech.speak(text, {
            language: hasDevanagari ? 'hi-IN' : 'en-IN',
            pitch: 1.0,
            rate: 0.95,
            onDone: () => {
              clearTimeout(timeoutHandle);
              finish();
            },
            onError: () => {
              clearTimeout(timeoutHandle);
              finish();
            },
          });
        });
    } catch (_e) {
      clearTimeout(timeoutHandle);
      finish();
    }
  });
};

export function useVoiceDecoy() {
  const [roomData, setRoomData] = useState<LiveKitTokenResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>('digital_arrest');
  const [callId, setCallId] = useState<string>('call_demo_01');
  const [scammerNumber, setScammerNumber] = useState<string>('+919876543210');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [extractedIntel, setExtractedIntel] = useState<ExtractedIntel>(DEFAULT_INTEL);
  const [lastIntent, setLastIntent] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  transcriptRef.current = transcript;

  const isCallActiveRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);

  // Active call duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const extractIntelFromText = useCallback((text: string) => {
    const foundUpi = text.match(upiRegex) || [];
    const foundPhones = text.match(phoneRegex) || [];
    const foundUrls = text.match(urlRegex) || [];
    const foundAccs = text.match(accRegex) || [];

    if (foundUpi.length || foundPhones.length || foundUrls.length || foundAccs.length) {
      setExtractedIntel((prev) => ({
        urls: Array.from(new Set([...prev.urls, ...foundUrls])),
        phones: Array.from(new Set([...prev.phones, ...foundPhones])),
        upi_ids: Array.from(new Set([...prev.upi_ids, ...foundUpi])),
        accounts: Array.from(new Set([...prev.accounts, ...foundAccs])),
      }));
    }
  }, []);

  const addLiveChunk = useCallback(
    (turn: TranscriptTurn) => {
      const textTrimmed = turn.text ? turn.text.trim() : '';
      if (!textTrimmed) return;
      extractIntelFromText(textTrimmed);

      setTranscript((prev) => {
        const recent = prev.slice(-3);
        if (recent.some((t) => t.speaker === turn.speaker && t.text.trim() === textTrimmed)) {
          return prev;
        }
        return [...prev, turn];
      });
      if (turn.intent) setLastIntent(turn.intent);
    },
    [extractIntelFromText]
  );

  // Send a message as scammer -> query backend POST /chat/decoy-reply -> play audio
  const sendScammerMessage = useCallback(
    async (text: string) => {
      if (!text || !text.trim() || isSpeakingRef.current) return;

      const trimmedText = text.trim();
      const userTurn: TranscriptTurn = {
        speaker: 'scammer',
        text: trimmedText,
        timestamp: formatTimeNow(),
      };

      setTranscript((prev) => [...prev, userTurn]);
      extractIntelFromText(trimmedText);

      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setIsMicListening(false);

      const history: ChatHistoryItem[] = transcriptRef.current
        .filter((t) => t.speaker === 'scammer' || t.speaker === 'saroj_aunty')
        .map((t) => ({
          role: t.speaker === 'scammer' ? 'scammer' : 'saroj',
          text: t.text,
        }));

      const startTime = Date.now();
      try {
        const replyRes = await api.getDecoyReply({
          conversation_id: callId,
          scammer_number: scammerNumber,
          history,
          latest_message: trimmedText,
          scam_type: activeScenario,
          generate_audio: true,
        });

        const elapsedMs = Date.now() - startTime;

        if (replyRes && replyRes.reply) {
          const auntyTurn: TranscriptTurn = {
            speaker: 'saroj_aunty',
            text: replyRes.reply,
            timestamp: formatTimeNow(),
            intent: replyRes.intent,
            llm_ms: elapsedMs,
          };

          setTranscript((prev) => [...prev, auntyTurn]);
          if (replyRes.intent) setLastIntent(replyRes.intent);

          if (replyRes.extracted_intel) {
            setExtractedIntel((prev) => ({
              urls: Array.from(new Set([...prev.urls, ...(replyRes.extracted_intel.urls || [])])),
              phones: Array.from(new Set([...prev.phones, ...(replyRes.extracted_intel.phones || [])])),
              upi_ids: Array.from(new Set([...prev.upi_ids, ...(replyRes.extracted_intel.upi_ids || [])])),
              accounts: Array.from(new Set([...prev.accounts, ...(replyRes.extracted_intel.accounts || [])])),
            }));
          }

          await playSarojVoice(replyRes.reply, replyRes.audio_base64, replyRes.audio_url);

          if (replyRes.end_call) {
            endCall();
            return;
          }
        } else {
          // Local fallback response
          const fallbackText = 'हाँ बेटा, मैं सुन रही हूँ, आप क्या कह रहे थे? थोड़ा जोर से बोलिए...';
          const fallbackTurn: TranscriptTurn = {
            speaker: 'saroj_aunty',
            text: fallbackText,
            timestamp: formatTimeNow(),
            intent: 'stall',
          };
          setTranscript((prev) => [...prev, fallbackTurn]);
          await playSarojVoice(fallbackText);
        }
      } catch (_err) {
        const fallbackText = 'बेटा आपकी आवाज ठीक से नहीं आ रही है, दोबारा बोलिए?';
        const fallbackTurn: TranscriptTurn = {
          speaker: 'saroj_aunty',
          text: fallbackText,
          timestamp: formatTimeNow(),
          intent: 'stall',
        };
        setTranscript((prev) => [...prev, fallbackTurn]);
        await playSarojVoice(fallbackText);
      } finally {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    },
    [callId, scammerNumber, activeScenario, extractIntelFromText]
  );

  // Continuous speech recognition loop (mic listens while call is active and Saroj isn't speaking)
  const runListeningLoop = useCallback(async () => {
    while (isCallActiveRef.current) {
      if (isSpeakingRef.current) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      setIsMicListening(true);
      try {
        const text = await SetuNativeModule.startSpeechRecognition();
        if (!isCallActiveRef.current) break;

        if (text && text.trim().length > 1) {
          setIsMicListening(false);
          await sendScammerMessage(text.trim());
        }
      } catch (_e) {
        // Silence or timeout - continues listening automatically
      }

      await new Promise((r) => setTimeout(r, 150));
    }
    setIsMicListening(false);
  }, [sendScammerMessage]);

  // Start Call
  const startCall = useCallback(
    async (scenario: string = 'digital_arrest', phone: string = '+919876543210') => {
      const newCallId = `call_${Date.now().toString(36)}`;
      setCallId(newCallId);
      setActiveScenario(scenario);
      setScammerNumber(phone);
      setCallDuration(0);
      setExtractedIntel(DEFAULT_INTEL);
      setLastIntent(null);
      isCallActiveRef.current = true;
      setIsCallActive(true);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setIsMicListening(false);
      setConnecting(true);

      // Route audio to Bluetooth headset / headphones / speaker
      try {
        await SetuNativeModule.forceSpeakerphone();
      } catch (_e) {}

      // Register session with backend
      try {
        const resp = await api.getLiveKitToken({
          call_id: newCallId,
          scammer_number: phone,
          participant_name: 'scammer_tester',
        });
        if (resp) setRoomData(resp);
      } catch (err) {
        console.warn('Decoy session init notice:', err);
      }
      setConnecting(false);

      // Opening greeting: polite, normal hello without assuming caller identity
      const greetingText = DEFAULT_GREETING;

      const initialTurn: TranscriptTurn = {
        speaker: 'saroj_aunty',
        text: greetingText,
        timestamp: formatTimeNow(),
        intent: 'greeting',
        llm_ms: 120,
      };

      setTranscript([initialTurn]);

      // Play opening greeting
      const greetingStreamUrl = `${api.getBaseUrl()}/chat/decoy-voice/stream?text=${encodeURIComponent(greetingText)}`;
      await playSarojVoice(greetingText, null, greetingStreamUrl);

      isSpeakingRef.current = false;
      setIsSpeaking(false);

      // Start continuous speech listening
      runListeningLoop();
    },
    [runListeningLoop]
  );

  // Manual one-shot mic listen button
  const startMicListening = useCallback(async (): Promise<string | null> => {
    setIsMicListening(true);
    try {
      const text = await SetuNativeModule.startSpeechRecognition();
      setIsMicListening(false);
      if (text && text.trim().length > 1) {
        await sendScammerMessage(text.trim());
      }
      return text || null;
    } catch (_e) {
      setIsMicListening(false);
      return null;
    }
  }, [sendScammerMessage]);

  // End Call
  const endCall = useCallback(() => {
    isCallActiveRef.current = false;
    isSpeakingRef.current = false;
    setIsCallActive(false);
    setIsSpeaking(false);
    setIsMicListening(false);
    setConnecting(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopAllSpeaking();
    try {
      SetuNativeModule.stopSpeechRecognition();
    } catch (_e) {}
    try {
      SetuNativeModule.clearAudioRouting();
    } catch (_e) {}
  }, []);

  const refreshTranscript = useCallback(
    async (cId?: string) => {
      const targetCallId = cId || callId;
      const data = await api.getCallTranscript(targetCallId);
      if (data?.turns && data.turns.length > 0) {
        setTranscript(data.turns);
      }
    },
    [callId]
  );

  return {
    roomData,
    transcript,
    setTranscript,
    isCallActive,
    isSpeaking,
    isMicListening,
    connecting,
    activeScenario,
    callId,
    scammerNumber,
    callDuration,
    extractedIntel,
    lastIntent,
    startCall,
    endCall,
    sendScammerMessage,
    startMicListening,
    addLiveChunk,
    refreshTranscript,
  };
}
