import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

interface HeaderProps {
  wsConnected: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ wsConnected, onOpenSettings }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.logoIcon}>🛡️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>SETU GUARDIAN</Text>
        <Text style={styles.subtitle}>सेतु सुरक्षा कवच • Elder Anti-Scam Shield</Text>
      </View>
      <View style={styles.badge}>
        <View style={[styles.dot, wsConnected ? styles.dotLive : styles.dotOffline]} />
        <Text style={styles.badgeText}>{wsConnected ? 'LIVE STREAM' : 'OFFLINE'}</Text>
      </View>
      <TouchableOpacity style={styles.gearBtn} onPress={onOpenSettings}>
        <Text style={styles.gearIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 36,
    marginRight: 10,
  },
  title: {
    fontSize: THEME.typography.elderTitle,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardDark,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  dotLive: {
    backgroundColor: THEME.colors.safeGreen,
  },
  dotOffline: {
    backgroundColor: THEME.colors.textSubtle,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  gearBtn: {
    padding: 6,
  },
  gearIcon: {
    fontSize: 22,
  },
});
