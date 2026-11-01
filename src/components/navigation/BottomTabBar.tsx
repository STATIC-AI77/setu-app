import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { THEME } from '../../constants/theme';

export type AppTab = 'shield' | 'radar' | 'saroj' | 'call' | 'dossier';

interface BottomTabBarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  interlockActive: boolean;
  threatCount?: number;
  onPressPanic?: () => void;
}

interface TabItem {
  key: AppTab;
  label: string;
  icon: string;
  activeColor: string;
}

const LEFT_TABS: TabItem[] = [
  {
    key: 'shield',
    label: 'Shield',
    icon: '🛡️',
    activeColor: THEME.colors.emerald,
  },
  {
    key: 'radar',
    label: 'Activity',
    icon: '📊',
    activeColor: THEME.colors.cyan,
  },
];

const RIGHT_TABS: TabItem[] = [
  {
    key: 'saroj',
    label: 'Decoy',
    icon: '👵',
    activeColor: THEME.colors.violet,
  },
  {
    key: 'call',
    label: 'Call',
    icon: '📞',
    activeColor: THEME.colors.crimson,
  },
  {
    key: 'dossier',
    label: 'Helpline',
    icon: '⚖️',
    activeColor: THEME.colors.amber,
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  interlockActive,
  threatCount = 0,
  onPressPanic,
}) => {
  const renderTab = (tab: TabItem) => {
    const isActive = currentTab === tab.key;
    const showThreatBadge =
      (tab.key === 'shield' && interlockActive) ||
      (tab.key === 'radar' && threatCount > 0);

    return (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => onSelectTab(tab.key)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Text style={[styles.iconText, isActive && styles.iconActive]}>
            {tab.icon}
          </Text>
          {showThreatBadge && <View style={styles.badgeDot} />}
        </View>

        <Text
          style={[
            styles.label,
            isActive
              ? { color: tab.activeColor, fontWeight: '700' }
              : styles.labelInactive,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {/* LEFT TABS: Shield & Activity */}
        {LEFT_TABS.map(renderTab)}

        {/* CENTER PANIC / SOS BUTTON */}
        <TouchableOpacity
          style={styles.panicButtonWrapper}
          onPress={onPressPanic}
          activeOpacity={0.8}
        >
          <View style={styles.panicCircleGlow}>
            <View style={styles.panicCircle}>
              <Text style={styles.panicIcon}>🚨</Text>
            </View>
          </View>
          <Text style={styles.panicLabel}>PANIC</Text>
        </TouchableOpacity>

        {/* RIGHT TABS: Decoy & Helpline */}
        {RIGHT_TABS.map(renderTab)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.bgRoot,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: THEME.radius.cardSmall,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    position: 'relative',
    marginBottom: 2,
  },
  iconText: {
    fontSize: 19,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.crimson,
    borderWidth: 1.5,
    borderColor: THEME.colors.bgCard,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  panicButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    top: -10,
  },
  panicCircleGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  panicCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicIcon: {
    fontSize: 20,
  },
  panicLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.8,
    marginTop: 3,
  },
});
