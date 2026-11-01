import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { THEME } from '../../constants/theme';

export type AppTab = 'shield' | 'radar' | 'saroj' | 'dossier';

interface BottomTabBarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  interlockActive: boolean;
  threatCount?: number;
}

interface TabItem {
  key: AppTab;
  label: string;
  icon: string;
  activeColor: string;
}

const TABS: TabItem[] = [
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
  {
    key: 'saroj',
    label: 'Decoy',
    icon: '👵',
    activeColor: THEME.colors.violet,
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
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
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
        })}
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radius.cardSmall,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    position: 'relative',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 20,
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
    fontSize: 11,
    letterSpacing: -0.2,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
});
