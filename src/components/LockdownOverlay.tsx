import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

interface LockdownOverlayProps {
  visible: boolean;
  reason?: string;
  onEmergencyUnlock: () => void;
}

export const LockdownOverlay: React.FC<LockdownOverlayProps> = ({
  visible,
  reason = 'Emergency remote lockdown initiated by Family Guardian.',
  onEmergencyUnlock,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.badgeContainer}>
          <Text style={styles.icon}>🛑</Text>
          <Text style={styles.badgeText}>ARMED INTERLOCK ACTIVE</Text>
        </View>

        <Text style={styles.title}>SETU DEVICE LOCKDOWN</Text>
        <Text style={styles.hindiTitle}>सेतु सुरक्षा लॉकडाउन</Text>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>🚨 CRITICAL SECURITY PROTOCOL</Text>
          <Text style={styles.cardDesc}>
            This phone is currently <Text style={styles.bold}>LOCKED</Text> by the Family Guardian Command Center to safeguard your bank accounts, UPI apps, and personal savings from ongoing fraud threats.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.reasonLabel}>Intervention Trigger:</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 All financial transactions and UPI apps are blocked until released by your family member.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.unlockButton}
          activeOpacity={0.85}
          onPress={onEmergencyUnlock}
        >
          <Text style={styles.unlockButtonText}>Guardian Emergency Release</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 24,
  },
  icon: {
    fontSize: 22,
    marginRight: 8,
  },
  badgeText: {
    color: '#FEF08A',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  hindiTitle: {
    color: '#FEE2E2',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#991B1B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginBottom: 20,
  },
  cardHeader: {
    color: '#FEF08A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardDesc: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '800',
    color: '#FCA5A5',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  reasonLabel: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reasonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 32,
  },
  infoText: {
    color: '#FEE2E2',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  unlockButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
