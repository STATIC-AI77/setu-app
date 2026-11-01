import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface PermissionsCardProps {
  hasNotifListener: boolean;
  hasOverlay: boolean;
  hasBatteryOpt: boolean;
}

export const PermissionsCard: React.FC<PermissionsCardProps> = ({
  hasNotifListener,
  hasOverlay,
  hasBatteryOpt,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Elder Shield Permissions (अनुमतियाँ)</Text>
      <View style={styles.list}>
        {/* Notification Listener */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => SetuNativeModule.openNotificationListenerSettings()}
        >
          <Text style={styles.icon}>{hasNotifListener ? '✅' : '❌'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>WhatsApp & SMS Intake</Text>
            <Text style={styles.desc}>
              {hasNotifListener ? 'Granted' : 'Tap to enable Notification Listener'}
            </Text>
          </View>
          {!hasNotifListener && <Text style={styles.fixBtn}>Fix</Text>}
        </TouchableOpacity>

        {/* Overlay Permission */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => SetuNativeModule.openOverlaySettings()}
        >
          <Text style={styles.icon}>{hasOverlay ? '✅' : '❌'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Payment App Interlock Overlay</Text>
            <Text style={styles.desc}>
              {hasOverlay ? 'Granted' : 'Tap to enable Display over other apps'}
            </Text>
          </View>
          {!hasOverlay && <Text style={styles.fixBtn}>Fix</Text>}
        </TouchableOpacity>

        {/* Call Screening */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => SetuNativeModule.requestCallScreeningRole()}
        >
          <Text style={styles.icon}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Call Screening Protection</Text>
            <Text style={styles.desc}>Auto-rejects known scammers in 1500ms</Text>
          </View>
          <Text style={styles.fixBtn}>Check</Text>
        </TouchableOpacity>

        {/* Battery Optimization */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => SetuNativeModule.requestIgnoreBatteryOptimization()}
        >
          <Text style={styles.icon}>{hasBatteryOpt ? '✅' : '⚡'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Background Silent Operation</Text>
            <Text style={styles.desc}>
              {hasBatteryOpt ? 'Optimized' : 'Tap to exempt from battery sleep'}
            </Text>
          </View>
          {!hasBatteryOpt && <Text style={styles.fixBtn}>Exempt</Text>}
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  icon: {
    fontSize: 18,
    width: 28,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textWhite,
  },
  desc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  fixBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.bgDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
