import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TranscriptTurn, LiveKitTokenResponse } from '../types';
import { THEME } from '../constants/theme';

interface VoiceDecoyModalProps {
  visible: boolean;
  onClose: () => void;
  roomData: LiveKitTokenResponse | null;
  transcript: TranscriptTurn[];
  connecting: boolean;
  onConnectRoom: () => void;
  onRefreshTranscript: () => void;
}

export const VoiceDecoyModal: React.FC<VoiceDecoyModalProps> = ({
  visible,
  onClose,
  roomData,
  transcript,
  connecting,
  onConnectRoom,
  onRefreshTranscript,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎙️ Saroj Live Voice Decoy</Text>
              <Text style={styles.subtitle}>WebRTC Audio Decoy Room (LiveKit + Groq + ElevenLabs)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Room Connection Card */}
          <View style={styles.roomCard}>
            <View style={styles.roomStatusRow}>
              <View
                style={[
                  styles.roomDot,
                  roomData ? styles.roomDotConnected : styles.roomDotIdle,
                ]}
              />
              <Text style={styles.roomStatusText}>
                {roomData ? `LiveKit Room: ${roomData.room}` : 'Voice Room: Not Connected'}
              </Text>
            </View>

            {roomData ? (
              <View style={styles.tokenBox}>
                <Text style={styles.tokenLabel}>LiveKit Server:</Text>
                <Text style={styles.tokenVal} numberOfLines={1}>{roomData.livekit_url}</Text>
                <Text style={styles.tokenLabel}>Participant:</Text>
                <Text style={styles.tokenVal}>elder_guardian (Listening/Interacting)</Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={onConnectRoom}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.connectBtnText}>
                    {roomData ? 'Reconnect LiveKit Room' : 'Join / Prime Decoy Room'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshBtn} onPress={onRefreshTranscript}>
                <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Dialogue Stream */}
          <Text style={styles.transcriptHeader}>
            Live Scam Call Dialogue ({transcript.length} turns)
          </Text>
          <ScrollView style={styles.transcriptScroll} contentContainerStyle={{ paddingBottom: 20 }}>
            {transcript.map((turn, idx) => {
              const isSaroj = turn.speaker === 'saroj_aunty';
              return (
                <View
                  key={idx}
                  style={[
                    styles.turnCard,
                    isSaroj ? styles.turnSaroj : styles.turnScammer,
                  ]}
                >
                  <View style={styles.turnMetaRow}>
                    <Text style={[styles.speakerName, isSaroj ? styles.sarojName : styles.scammerName]}>
                      {isSaroj ? '👵 Saroj Aunty (AI Decoy)' : '🦹 Scammer'}
                    </Text>
                    {turn.timestamp && <Text style={styles.turnTime}>{turn.timestamp}</Text>}
                  </View>

                  <Text style={styles.turnText}>{turn.text}</Text>

                  {isSaroj && turn.llm_ms && (
                    <View style={styles.latencyRow}>
                      <Text style={styles.latencyText}>
                        ⚡ STT: {turn.stt_ms}ms • LLM: {turn.llm_ms}ms • TTS: {turn.tts_ms}ms
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.cardDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textWhite,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: THEME.colors.textMuted,
    fontWeight: 'bold',
  },
  roomCard: {
    backgroundColor: THEME.colors.bgDark,
    borderRadius: THEME.radius.card,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  roomStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  roomDotConnected: {
    backgroundColor: THEME.colors.safeGreen,
  },
  roomDotIdle: {
    backgroundColor: THEME.colors.textSubtle,
  },
  roomStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  tokenBox: {
    marginVertical: 6,
  },
  tokenLabel: {
    fontSize: 11,
    color: THEME.colors.textSubtle,
    marginTop: 2,
  },
  tokenVal: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontFamily: 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  connectBtn: {
    flex: 2,
    backgroundColor: THEME.colors.primaryDark,
    paddingVertical: 10,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  refreshBtn: {
    flex: 1,
    backgroundColor: THEME.colors.cardBorder,
    paddingVertical: 10,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  transcriptScroll: {
    maxHeight: 300,
  },
  turnCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  turnSaroj: {
    backgroundColor: '#0c4a6e33',
    borderColor: '#0284c7',
  },
  turnScammer: {
    backgroundColor: '#7f1d1d33',
    borderColor: '#b91c1c',
  },
  turnMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sarojName: {
    color: THEME.colors.primary,
  },
  scammerName: {
    color: THEME.colors.dangerRed,
  },
  turnTime: {
    fontSize: 11,
    color: THEME.colors.textSubtle,
  },
  turnText: {
    fontSize: 13,
    color: THEME.colors.textWhite,
    lineHeight: 18,
  },
  latencyRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#38bdf833',
  },
  latencyText: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontFamily: 'monospace',
  },
});
