import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ImpactStats, ThreatAlert, LogItem } from '../types';

interface RadarScreenProps {
  stats: ImpactStats | null;
  loadingStats: boolean;
  onRefreshStats: () => void;
  logs: LogItem[];
  onClearLogs: () => void;
  activeThreat: ThreatAlert | null;
  wsConnected: boolean;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({
  stats,
  logs,
  onClearLogs,
}) => {
  const formatMoney = (amt: number) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Activity</Text>

      {/* METRIC STRIP */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: THEME.colors.emerald }]}>
            {stats ? formatMoney(stats.money_saved_inr) : '₹3.0L'}
          </Text>
          <Text style={styles.metricLabel}>Protected</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: THEME.colors.violetLight }]}>
            {stats ? `${stats.time_wasted_min}m` : '47m'}
          </Text>
          <Text style={styles.metricLabel}>Scammer Wasted</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: THEME.colors.cyan }]}>
            {stats ? stats.scam_calls_blocked + stats.scam_messages_blocked : '45'}
          </Text>
          <Text style={styles.metricLabel}>Threats Stopped</Text>
        </View>
      </View>

      {/* RECENT ACTIVITY HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        {logs.length > 0 && (
          <TouchableOpacity onPress={onClearLogs}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LOG LIST */}
      <View style={styles.logContainer}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyText}>No threats detected</Text>
            <Text style={styles.emptySub}>Setu is quietly monitoring</Text>
          </View>
        ) : (
          logs.slice(0, 20).map((item) => {
            const isAlert = item.tag === 'INTERLOCK';
            const isDecoy = item.tag === 'SAROJ';

            let dotColor = THEME.colors.emerald;
            if (isAlert) dotColor = THEME.colors.crimson;
            else if (isDecoy) dotColor = THEME.colors.violet;

            return (
              <View key={item.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventMessage}>{item.message}</Text>
                  <Text style={styles.eventTime}>{item.time} • {item.tag}</Text>
                </View>
              </View>
            );
          })
        )}
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  clearText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  logContainer: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  eventMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    lineHeight: 19,
  },
  eventTime: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
});
