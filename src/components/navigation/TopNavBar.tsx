import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { THEME } from '../../constants/theme';

interface TopNavBarProps {
  wsConnected: boolean;
  onOpenSettings: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  wsConnected,
  onOpenSettings,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../../assets/favicon.png')}
          style={styles.logoImg}
        />
        <Text style={styles.logoText}>Setu</Text>
        <View style={[styles.statusDot, wsConnected ? styles.dotLive : styles.dotOffline]} />
      </View>

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={onOpenSettings}
        activeOpacity={0.7}
        accessibilityLabel="Settings"
      >
        <Text style={styles.gearIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: THEME.colors.bgRoot,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 2,
  },
  dotLive: {
    backgroundColor: THEME.colors.emerald,
  },
  dotOffline: {
    backgroundColor: THEME.colors.textSubtle,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 16,
  },
});
