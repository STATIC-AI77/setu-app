import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ThreatAlert } from '../types';

interface ShieldScreenProps {
  protectionEnabled: boolean;
  decoyActive: boolean;
  interlockActive: boolean;
  activeThreat: ThreatAlert | null;
  onToggleProtection: (val: boolean) => void;
  onToggleDecoy: (val: boolean) => void;
  onReleaseInterlock: () => void;
  onRequestGuardianUnlock: () => void;
  onOpen1930Dossier: () => void;
  onOpenDecoyRoom: () => void;
}

export const ShieldScreen: React.FC<ShieldScreenProps> = ({
  protectionEnabled,
  decoyActive,
  interlockActive,
  activeThreat,
  onToggleProtection,
  onToggleDecoy,
  onReleaseInterlock,
  onRequestGuardianUnlock,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const statusColor = interlockActive
    ? THEME.colors.crimson
    : protectionEnabled
    ? THEME.colors.emerald
    : THEME.colors.textMuted;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO SHIELD VISUAL */}
      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.shieldCircle,
            {
              borderColor: statusColor,
              backgroundColor: interlockActive
                ? THEME.colors.crimsonGlow
                : protectionEnabled
                ? THEME.colors.emeraldGlow
                : 'rgba(255, 255, 255, 0.02)',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {interlockActive ? (
            <Text style={styles.shieldEmoji}>🚨</Text>
          ) : (
            <Image
              source={require('../../assets/android-icon-foreground.png')}
              style={styles.heroLogoImg}
              resizeMode="contain"
            />
          )}
        </Animated.View>

        <Text style={[styles.heroTitle, { color: statusColor }]}>
          {interlockActive
            ? 'Payment Apps Locked'
            : protectionEnabled
            ? 'Protected'
            : 'Shield Paused'}
        </Text>

        <Text style={styles.heroSubtitle}>
          {interlockActive
            ? 'Suspicious activity detected. UPI apps are temporarily locked.'
            : protectionEnabled
            ? 'Silently screening calls, SMS & WhatsApp'
            : 'Turn protection ON to stay safe'}
        </Text>
      </View>

      {/* ARMED INTERLOCK ALERT (ONLY WHEN DANGER ACTIVE) */}
      {interlockActive && (
        <View style={styles.alertCard}>
          <Text style={styles.alertHeading}>Scam Intercepted</Text>
          <Text style={styles.alertBody}>
            {activeThreat?.scam_type || 'Critical Phishing Attempt'}
          </Text>
          {activeThreat?.scammer_number && (
            <Text style={styles.alertSender}>
              From: {activeThreat.scammer_number}
            </Text>
          )}

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onRequestGuardianUnlock}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Ask Son (Rohit) to Unlock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={onReleaseInterlock}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSecondaryText}>Emergency Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MINIMAL CONTROLS */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Protection</Text>
            <Text style={styles.toggleSub}>Blocks scams across calls & messages</Text>
          </View>
          <Switch
            value={protectionEnabled}
            onValueChange={onToggleProtection}
            trackColor={{ false: '#27272A', true: THEME.colors.emerald }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Saroj AI Decoy</Text>
            <Text style={styles.toggleSub}>Engages scammers to waste their time</Text>
          </View>
          <Switch
            value={decoyActive}
            onValueChange={onToggleDecoy}
            trackColor={{ false: '#27272A', true: THEME.colors.violet }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* GUARDIAN FOOTER */}
      <View style={styles.guardianBar}>
        <Text style={styles.guardianIcon}>👨‍👦</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.guardianTitle}>Guardian: Rohit (Son)</Text>
          <Text style={styles.guardianStatus}>Connected • Receives instant alerts</Text>
        </View>
      </View>
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
  hero: {
    alignItems: 'center',
    marginVertical: 24,
  },
  shieldCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shieldEmoji: {
    fontSize: 48,
  },
  heroLogoImg: {
    width: 90,
    height: 90,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.crimsonBorder,
    padding: 18,
    marginBottom: 20,
  },
  alertHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.crimsonLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  alertBody: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  alertSender: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  alertActions: {
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.emerald,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: THEME.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  toggleSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  guardianBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 14,
    gap: 12,
  },
  guardianIcon: {
    fontSize: 22,
  },
  guardianTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  guardianStatus: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
});
