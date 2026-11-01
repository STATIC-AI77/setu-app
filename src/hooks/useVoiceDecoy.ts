import { useState, useCallback } from 'react';
import { LiveKitTokenResponse, TranscriptTurn } from '../types';
import { api } from '../services/api';

const SAMPLE_TRANSCRIPT: TranscriptTurn[] = [
  {
    speaker: 'scammer',
    text: 'CBI Officer Sharma bol raha hoon. Rs 50,000 transfer karo verify karne ke liye.',
    timestamp: '04:32:00',
  },
  {
    speaker: 'saroj_aunty',
    text: 'Arre baap re! CBI officer sahab? Thoda rukiye na, mera chashma dhoondhti hoon...',
    timestamp: '04:32:02',
    stt_ms: 110.2,
    llm_ms: 480.5,
    tts_ms: 610.1,
  },
  {
    speaker: 'scammer',
    text: 'Amma ji jaldi karo, supreme court order hai digital arrest ka!',
    timestamp: '04:32:05',
  },
  {
    speaker: 'saroj_aunty',
    text: 'Haan haan beta, bank ka passcode meri purani dairy mein likha hai, page palat rahi hoon...',
    timestamp: '04:32:08',
    stt_ms: 95.4,
    llm_ms: 412.0,
    tts_ms: 540.3,
  },
];

export function useVoiceDecoy() {
  const [roomData, setRoomData] = useState<LiveKitTokenResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>(SAMPLE_TRANSCRIPT);
  const [connecting, setConnecting] = useState(false);

  const requestDecoyRoom = useCallback(async (callId: string = 'call_pune_9012', phone: string = '+919876543210') => {
    setConnecting(true);
    const resp = await api.getLiveKitToken({
      call_id: callId,
      scammer_number: phone,
      participant_name: 'elder_guardian',
    });
    setConnecting(false);
    if (resp) {
      setRoomData(resp);
    }
    return resp;
  }, []);

  const refreshTranscript = useCallback(async (callId: string = 'call_pune_9012') => {
    const data = await api.getCallTranscript(callId);
    if (data?.turns && data.turns.length > 0) {
      setTranscript(data.turns);
    }
  }, []);

  const addLiveChunk = useCallback((turn: TranscriptTurn) => {
    setTranscript((prev) => [...prev, turn]);
  }, []);

  return {
    roomData,
    transcript,
    connecting,
    requestDecoyRoom,
    refreshTranscript,
    addLiveChunk,
  };
}
