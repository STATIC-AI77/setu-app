import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { LogItem } from '../types';
import { THEME } from '../constants/theme';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface ActivityLogCardProps {
  logs: LogItem[];
  onLogsCleared: () => void;
}

export const ActivityLogCard: React.FC<ActivityLogCardProps> = ({ logs, onLogsCleared }) => {
  const handleClear = () => {
    try {
      SetuNativeModule.clearLogs();
      onLogsCleared();
    } catch (_e) {}
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'SAROJ':
        return styles.tagSaroj;
      case 'INTERLOCK':
        return styles.tagInterlock;
      case 'CALL':
        return styles.tagCall;
      case 'SIMULATE':
        return styles.tagSimulate;
      default:
        return styles.tagDefault;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Log (गतिविधि लॉग)</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.empty}>No security events recorded. Monitoring silently.</Text>
      ) : (
        logs.slice(0, 20).map((item) => (
          <View key={item.id} style={styles.entry}>
            <Text style={styles.time}>{item.time}</Text>
            <Text style={[styles.tag, getTagStyle(item.tag)]}>[{item.tag}]</Text>
            <Text style={styles.msg} numberOfLines={3}>
              {item.message}
            </Text>
          </View>
        ))
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    color: THEME.colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    fontSize: 12,
    color: THEME.colors.textSubtle,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: THEME.colors.cardBorder,
  },
  time: {
    fontSize: 11,
    color: THEME.colors.textSubtle,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    marginRight: 6,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  tagSaroj: {
    color: THEME.colors.primary,
  },
  tagInterlock: {
    color: THEME.colors.dangerRed,
  },
  tagCall: {
    color: THEME.colors.warningYellow,
  },
  tagSimulate: {
    color: '#e879f9',
  },
  tagDefault: {
    color: THEME.colors.safeGreen,
  },
  msg: {
    flex: 1,
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 16,
  },
});
