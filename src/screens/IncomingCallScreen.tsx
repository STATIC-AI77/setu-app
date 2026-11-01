import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { Audio } from 'expo-av';
import { THEME } from '../constants/theme';

interface IncomingCallScreenProps {
  scammerNumber: string;
  scamScenario: string;
  callId: string;
  decoyActive: boolean;
  onAccept: () => void;
  onReject: () => void;
  autoAnswer?: boolean;
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
  scammerNumber,
  scamScenario,
  callId,
  decoyActive,
  onAccept,
  onReject,
  autoAnswer = false,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [secondsRinging, setSecondsRinging] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  const rippleAnim3 = useRef(new Animated.Value(0)).current;

  // Auto-answer countdown for AI decoy mode
  const [autoAnswerCountdown, setAutoAnswerCountdown] = useState<number | null>(
    decoyActive && autoAnswer ? 3 : null
  );

  useEffect(() => {
    let timerInterval: any;
    
    if (autoAnswerCountdown !== null && autoAnswerCountdown > 0) {
      timerInterval = setInterval(() => {
        setAutoAnswerCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else if (autoAnswerCountdown === 0) {
      // Auto-answer when countdown reaches 0
      onAccept();
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [autoAnswerCountdown, onAccept]);

  // Ring timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRinging((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Play ringtone and vibrate
  useEffect(() => {
    const playRingtone = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        // TODO: Add actual ringtone audio file to assets/
        // For now, rely on vibration only
        // const { sound: newSound } = await Audio.Sound.createAsync(
        //   require('../../assets/ringtone.mp3'),
        //   { shouldPlay: true, isLooping: true, volume: 0.8 }
        // );
        // setSound(newSound);
      } catch (error) {
        console.warn('Could not set audio mode:', error);
      }

      // Vibration pattern: [wait, vibrate, wait, vibrate, ...]
      Vibration.vibrate([0, 400, 200, 400, 200, 400], true);
    };

    playRingtone();

    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
      Vibration.cancel();
    };
  }, []);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Ripple animations
  useEffect(() => {
    const createRipple = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const ripple1 = createRipple(rippleAnim1, 0);
    const ripple2 = createRipple(rippleAnim2, 600);
    const ripple3 = createRipple(rippleAnim3, 1200);

    ripple1.start();
    ripple2.start();
    ripple3.start();

    return () => {
      ripple1.stop();
      ripple2.stop();
      ripple3.stop();
    };
  }, [rippleAnim1, rippleAnim2, rippleAnim3]);

  const handleAccept = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    Vibration.cancel();
    onAccept();
  };

  const handleReject = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    Vibration.cancel();
    onReject();
  };

  const getScenarioDisplayName = () => {
    const map: Record<string, string> = {
      digital_arrest: 'CBI Digital Arrest',
      mpeb_bill: 'Electricity Board',
      bank_kyc: 'Bank KYC Update',
      customs_parcel: 'Customs Clearance',
      lottery: 'KBC Lottery Prize',
    };
    return map[scamScenario] || 'Unknown Caller';
  };

  return (
    <View style={styles.container}>
      {/* RIPPLE EFFECTS */}
      <View style={styles.rippleContainer}>
        {[rippleAnim1, rippleAnim2, rippleAnim3].map((anim, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.ripple,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* CALLER INFO */}
      <View style={styles.callerInfo}>
        <Text style={styles.callerLabel}>Incoming Call</Text>
        <Text style={styles.callerNumber}>{scammerNumber}</Text>
        <Text style={styles.callerName}>{getScenarioDisplayName()}</Text>
        <Text style={styles.ringingText}>Ringing... {secondsRinging}s</Text>
      </View>

      {/* DECOY MODE INDICATOR */}
      {decoyActive && (
        <View style={styles.decoyBanner}>
          <Text style={styles.decoyIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.decoyTitle}>Saroj AI Decoy Active</Text>
            <Text style={styles.decoyText}>
              {autoAnswerCountdown !== null && autoAnswerCountdown > 0
                ? `Auto-answering in ${autoAnswerCountdown}s...`
                : 'AI will interrogate scammer automatically'}
            </Text>
          </View>
        </View>
      )}

      {/* WARNING BANNER */}
      <View style={styles.warningBanner}>
        <Text style={styles.warningIcon}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.warningTitle}>Suspected Scam Call</Text>
          <Text style={styles.warningText}>
            This number matches known scam patterns. Do not share personal or financial info.
          </Text>
        </View>
      </View>

      {/* CALL ACTION BUTTONS */}
      <View style={styles.actionRow}>
        {/* REJECT BUTTON */}
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.actionIcon}>✕</Text>
          </Animated.View>
          <Text style={styles.actionLabel}>Reject</Text>
        </TouchableOpacity>

        {/* ACCEPT BUTTON */}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.actionIcon}>📞</Text>
          </Animated.View>
          <Text style={styles.actionLabel}>
            {decoyActive ? 'Accept (AI Decoy)' : 'Accept Call'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CALL ID INFO */}
      <Text style={styles.callIdText}>Call ID: {callId.slice(0, 16)}...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  rippleContainer: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: THEME.colors.crimson,
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 80,
  },
  callerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 8,
  },
  callerNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  callerName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 12,
  },
  ringingText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.crimson,
    letterSpacing: 0.5,
  },
  decoyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 10,
    gap: 12,
  },
  decoyIcon: {
    fontSize: 24,
  },
  decoyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.violet,
    marginBottom: 2,
  },
  decoyText: {
    fontSize: 12,
    color: 'rgba(196, 181, 253, 0.9)',
    lineHeight: 17,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 10,
    gap: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.crimson,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(252, 165, 165, 0.9)',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rejectButton: {
    alignItems: 'center',
    gap: 12,
  },
  acceptButton: {
    alignItems: 'center',
    gap: 12,
  },
  actionButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.emerald,
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  callIdText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
});
