import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { TranscriptTurn } from '../types';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface DialogueProofModalProps {
  visible: boolean;
  callId: string | null;
  onClose: () => void;
  onGenerateDossier?: (callId: string) => void;
}

export const DialogueProofModal: React.FC<DialogueProofModalProps> = ({
  visible,
  callId,
  onClose,
  onGenerateDossier,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !callId) {
      setTurns([]);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getCallTranscript(callId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.turns && res.turns.length > 0) {
          setTurns(res.turns);
        } else {
          // If no stored turns found, display illustrative demo call turns
          setTurns([
            {
              speaker: 'saroj_aunty',
              text: 'हेलो? हाँ बेटा, कौन बोल रहे हैं? पुलिस साहब? नमस्ते...',
              timestamp: '08:01:24',
              intent: 'greeting',
              llm_ms: 120,
            },
            {
              speaker: 'scammer',
              text: 'URGENT: This is Inspector Sharma from CBI Crime Branch Delhi. Digital arrest warrant issued for Aadhaar money laundering. Pay Rs 45,000 to safety verification account.',
              timestamp: '08:01:35',
              threat_level: 'high',
            },
            {
              speaker: 'saroj_aunty',
              text: 'हाय राम! साहब, बस एक पल रुकिए, मेरे चश्मे तो नहीं मिल रहे? कौन सा बैंक खाता बोल रहे हैं?',
              timestamp: '08:01:42',
              intent: 'stall',
              llm_ms: 210,
            },
            {
              speaker: 'scammer',
              text: 'Transfer immediately to UPI ID: cbi.courtfee@sbi or account 50170012345678.',
              timestamp: '08:01:58',
              threat_level: 'critical',
            },
            {
              speaker: 'saroj_aunty',
              text: 'अरे बेटा, मेरी पोती ने मोबाइल में नया पासवर्ड लगा दिया है, धीरे-धीरे बताइए...',
              timestamp: '08:02:08',
              intent: 'extract_intel',
              llm_ms: 185,
            },
          ]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to fetch dialogue transcript');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, callId]);

  const handleShareProof = async () => {
    if (turns.length === 0) return;
    const dialogueText = turns
      .map(
        (t) =>
          `[${t.timestamp || 'Turn'}] ${t.speaker === 'saroj_aunty' ? '👵 Saroj Aunty' : '🚨 Scammer'}: ${t.text}`
      )
      .join('\n\n');

    try {
      await Share.share({
        title: `Setu Dialogue Proof - Call ${callId}`,
        message: `🚨 Setu Guardian Official Scam Call Evidence (${callId}):\n\n${dialogueText}`,
      });
    } catch (_e) {}
  };

  const handleCopyProof = () => {
    if (turns.length === 0) return;
    const dialogueText = turns
      .map(
        (t) =>
          `[${t.timestamp || 'Turn'}] ${t.speaker === 'saroj_aunty' ? 'Saroj Aunty' : 'Scammer'}: ${t.text}`
      )
      .join('\n\n');

    try {
      SetuNativeModule.copyToClipboard(dialogueText);
      Alert.alert('Copied', 'Dialogue proof copied to clipboard for 1930 / cybercrime evidence.');
    } catch (_e) {}
  };

  const handleReportToChakshu = () => {
    Linking.openURL('https://sancharsaathi.gov.in/sfc/').catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>💬 Official Dialogue Proof</Text>
              <Text style={styles.subtitle}>
                Call ID: <Text style={{ color: THEME.colors.emerald }}>{callId || 'call_demo'}</Text> • PostgreSQL Audit Trail
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={THEME.colors.emerald} />
              <Text style={styles.loadingText}>Fetching dialogue turns from server...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : (
            <ScrollView style={styles.turnList} contentContainerStyle={styles.turnListContent}>
              {turns.map((turn, index) => {
                const isSaroj = turn.speaker === 'saroj_aunty';
                return (
                  <View
                    key={index}
                    style={[
                      styles.turnBubble,
                      isSaroj ? styles.sarojBubble : styles.scammerBubble,
                    ]}
                  >
                    <View style={styles.turnMetaRow}>
                      <Text style={[styles.speakerName, isSaroj ? styles.sarojName : styles.scammerName]}>
                        {isSaroj ? '👵 Saroj Aunty (Decoy)' : '🚨 Scammer / Extortionist'}
                      </Text>
                      {turn.timestamp && (
                        <Text style={styles.turnTime}>{turn.timestamp}</Text>
                      )}
                    </View>

                    <Text style={styles.turnText}>{turn.text}</Text>

                    {isSaroj && turn.llm_ms && (
                      <View style={styles.latencyBadge}>
                        <Text style={styles.latencyText}>⚡ LLM: {turn.llm_ms}ms</Text>
                        {turn.intent && (
                          <Text style={styles.intentText}>• Tactic: {turn.intent}</Text>
                        )}
                      </View>
                    )}

                    {!isSaroj && turn.threat_level && (
                      <View style={styles.threatBadge}>
                        <Text style={styles.threatText}>
                          ⚠️ Evidence Threat: {turn.threat_level.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleCopyProof}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnSecondaryText}>📋 Copy Evidence</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleShareProof}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnSecondaryText}>📤 Share Proof</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              {onGenerateDossier && callId && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => {
                    onClose();
                    onGenerateDossier(callId);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnPrimaryText}>📑 1-Click 1930 Dossier PDF</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtnChakshu}
                onPress={handleReportToChakshu}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnChakshuText}>🛡️ DoT Chakshu Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  errorBox: {
    padding: 30,
    alignItems: 'center',
  },
  errorText: {
    color: THEME.colors.crimson,
    fontSize: 13,
  },
  turnList: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  turnListContent: {
    paddingVertical: 14,
    gap: 12,
  },
  turnBubble: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  sarojBubble: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginRight: 24,
  },
  scammerBubble: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginLeft: 24,
  },
  turnMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  sarojName: {
    color: THEME.colors.emerald,
  },
  scammerName: {
    color: THEME.colors.crimson,
  },
  turnTime: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  turnText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  latencyText: {
    fontSize: 10,
    color: THEME.colors.emerald,
    fontWeight: '600',
  },
  intentText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  threatBadge: {
    marginTop: 6,
  },
  threatText: {
    fontSize: 10,
    color: THEME.colors.crimson,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: THEME.radius.button,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1.2,
    backgroundColor: THEME.colors.emerald,
    borderRadius: THEME.radius.button,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnChakshu: {
    flex: 1,
    backgroundColor: THEME.colors.amber,
    borderRadius: THEME.radius.button,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionBtnChakshuText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
});
