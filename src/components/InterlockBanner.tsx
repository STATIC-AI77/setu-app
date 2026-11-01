import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

interface InterlockBannerProps {
  status: 'idle' | 'armed' | 'released';
  protectionEnabled: boolean;
  onSonApprove: () => void;
}

export const InterlockBanner: React.FC<InterlockBannerProps> = ({
  status,
  protectionEnabled,
  onSonApprove,
}) => {
  const isArmed = status === 'armed';

  return (
    <View
      style={[
        styles.container,
        isArmed
          ? styles.bannerArmed
          : !protectionEnabled
          ? styles.bannerPaused
          : styles.bannerSafe,
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>{isArmed ? '🛑' : !protectionEnabled ? '⚠️' : '🟢'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isArmed
              ? 'INTERLOCK ARMED (भुगतान ऐप्स बंद)'
              : !protectionEnabled
              ? 'SHIELD PAUSED (सुरक्षा रुकी है)'
              : 'GUARDIAN ACTIVE (सक्रिय सुरक्षा)'}
          </Text>
          <Text style={styles.desc}>
            {isArmed
              ? 'Payment apps locked: Suspected scam detected. Son must approve from dashboard to release.'
              : !protectionEnabled
              ? 'Elder phone shield is temporarily paused.'
              : 'Silently scanning incoming WhatsApp, SMS, and telephone calls.'}
          </Text>
        </View>
      </View>

      {isArmed && (
        <TouchableOpacity style={styles.sonBtn} onPress={onSonApprove}>
          <Text style={styles.sonBtnText}>👨‍👦 Son Approve & Unlock Elder Phone</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: THEME.radius.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  bannerSafe: {
    backgroundColor: THEME.colors.safeGreenBg,
    borderColor: THEME.colors.safeGreen,
  },
  bannerArmed: {
    backgroundColor: THEME.colors.dangerRedBg,
    borderColor: THEME.colors.dangerRed,
  },
  bannerPaused: {
    backgroundColor: THEME.colors.pausedGrayBg,
    borderColor: THEME.colors.pausedGray,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textWhite,
  },
  desc: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 3,
    lineHeight: 17,
  },
  sonBtn: {
    backgroundColor: THEME.colors.safeGreen,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  sonBtnText: {
    color: THEME.colors.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
