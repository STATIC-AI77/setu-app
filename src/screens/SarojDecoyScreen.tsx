import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { THEME } from '../constants/theme';
import { TranscriptTurn } from '../types';

interface SarojDecoyScreenProps {
  decoyActive: boolean;
  onToggleDecoy: (val: boolean) => void;
  onStartSimulatedCall: (scenario: string) => void;
  liveTurns: TranscriptTurn[];
  isCallActive: boolean;
  onEndCall: () => void;
}

export const SarojDecoyScreen: React.FC<SarojDecoyScreenProps> = ({
  onStartSimulatedCall,
  liveTurns,
  isCallActive,
  onEndCall,
}) => {
  const [selectedScenario, setSelectedScenario] = useState('digital_arrest');
  const [callSeconds, setCallSeconds] = useState(0);

  const barAnim1 = useRef(new Animated.Value(10)).current;
  const barAnim2 = useRef(new Animated.Value(20)).current;
  const barAnim3 = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    let timer: any = null;
    if (isCallActive) {
      timer = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      return () => clearInterval(timer);
    } else {
      setCallSeconds(0);
    }
  }, [isCallActive]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const scenarios = [
    { id: 'digital_arrest', label: 'Fake Police Call' },
    { id: 'mpeb_bill', label: 'Power Cut Phishing' },
    { id: 'lottery', label: 'Lottery Prize Scam' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Saroj AI Decoy</Text>

      {/* PERSONA CARD */}
      <View style={styles.personaCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👵</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.personaName}>Saroj Aunty</Text>
          <Text style={styles.personaSub}>
            Trained to sound like a confused grandmother, wasting scammer time while keeping your money safe.
          </Text>
        </View>
      </View>

      {/* CALL SECTION */}
      {isCallActive ? (
        <View style={styles.activeCallCard}>
          <View style={styles.callTimerRow}>
            <View style={styles.liveDot} />
            <Text style={styles.callTimerText}>{formatTimer(callSeconds)}</Text>
          </View>

          {/* TRANSCRIPT */}
          <View style={styles.dialogueList}>
            {liveTurns.map((turn, idx) => {
              const isSaroj = turn.speaker === 'saroj_aunty';
              return (
                <View
                  key={idx}
                  style={[
                    styles.bubble,
                    isSaroj ? styles.bubbleSaroj : styles.bubbleScammer,
                  ]}
                >
                  <Text style={styles.bubbleAuthor}>
                    {isSaroj ? 'Saroj Aunty' : 'Scammer'}
                  </Text>
                  <Text style={styles.bubbleText}>{turn.text}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.hangupBtn}
            onPress={onEndCall}
            activeOpacity={0.8}
          >
            <Text style={styles.hangupBtnText}>End Call</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Test AI Voice Interaction</Text>
          <Text style={styles.cardSub}>
            Choose an attack scenario to see how Saroj Aunty ties up the scammer:
          </Text>

          <View style={styles.chipRow}>
            {scenarios.map((sc) => (
              <TouchableOpacity
                key={sc.id}
                style={[
                  styles.chip,
                  selectedScenario === sc.id && styles.chipActive,
                ]}
                onPress={() => setSelectedScenario(sc.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedScenario === sc.id && styles.chipTextActive,
                  ]}
                >
                  {sc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => onStartSimulatedCall(selectedScenario)}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>Start Test Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgRoot,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 18,
    marginBottom: 20,
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  personaName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  personaSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 18,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  chipActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: THEME.colors.violetBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: THEME.colors.violetLight,
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: THEME.colors.violet,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activeCallCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 18,
  },
  callTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.crimson,
  },
  callTimerText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: 'monospace',
  },
  dialogueList: {
    gap: 10,
    marginBottom: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '85%',
  },
  bubbleSaroj: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  bubbleScammer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  bubbleAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    lineHeight: 19,
  },
  hangupBtn: {
    backgroundColor: THEME.colors.crimson,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  hangupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
