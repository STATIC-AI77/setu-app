import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

interface DemoControlsProps {
  isArmed: boolean;
  onSimulateScam: () => void;
  onToggleInterlock: () => void;
  onOpenVoiceDecoy: () => void;
  onOpenPoliceModal: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  isArmed,
  onSimulateScam,
  onToggleInterlock,
  onOpenVoiceDecoy,
  onOpenPoliceModal,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Live Demo Controls (लाइव डेमो)</Text>

      <View style={styles.row}>
        {/* Simulate Scam */}
        <TouchableOpacity
          style={[styles.btn, styles.btnScam]}
          onPress={onSimulateScam}
        >
          <Text style={styles.icon}>🚨</Text>
          <Text style={styles.btnText}>Simulate Scam</Text>
          <Text style={styles.subText}>MPEB Phishing</Text>
        </TouchableOpacity>

        {/* Test Interlock */}
        <TouchableOpacity
          style={[styles.btn, isArmed ? styles.btnRelease : styles.btnArm]}
          onPress={onToggleInterlock}
        >
          <Text style={styles.icon}>{isArmed ? '🟢' : '🛑'}</Text>
          <Text style={styles.btnText}>{isArmed ? 'Release Lock' : 'Test Interlock'}</Text>
          <Text style={styles.subText}>{isArmed ? 'Dismiss View' : 'Lock Payments'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        {/* Voice Decoy Modal */}
        <TouchableOpacity
          style={[styles.btn, styles.btnVoice]}
          onPress={onOpenVoiceDecoy}
        >
          <Text style={styles.icon}>👵</Text>
          <Text style={styles.btnText}>Voice Decoy</Text>
          <Text style={styles.subText}>Saroj WebRTC Room</Text>
        </TouchableOpacity>

        {/* 1930 Police Dossier */}
        <TouchableOpacity
          style={[styles.btn, styles.btnPolice]}
          onPress={onOpenPoliceModal}
        >
          <Text style={styles.icon}>📑</Text>
          <Text style={styles.btnText}>1930 Helpline</Text>
          <Text style={styles.subText}>Police Dossier PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.cardDark,
    borderRadius: THEME.radius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnScam: {
    backgroundColor: THEME.colors.warningAmber,
  },
  btnArm: {
    backgroundColor: THEME.colors.dangerRed,
  },
  btnRelease: {
    backgroundColor: THEME.colors.safeGreen,
  },
  btnVoice: {
    backgroundColor: THEME.colors.primaryDark,
  },
  btnPolice: {
    backgroundColor: '#4338ca',
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  btnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textWhite,
    textAlign: 'center',
  },
  subText: {
    fontSize: 10,
    color: '#fef3c7',
    marginTop: 2,
    textAlign: 'center',
  },
});
