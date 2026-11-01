import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ImpactStats, ThreatAlert, LogItem } from '../types';
import { DialogueProofModal } from '../components/DialogueProofModal';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface RadarScreenProps {
  stats: ImpactStats | null;
  loadingStats: boolean;
  onRefreshStats: () => void;
  logs: LogItem[];
  onClearLogs: () => void;
  activeThreat: ThreatAlert | null;
  wsConnected: boolean;
  onGenerateDossier?: (verdictId?: string) => Promise<any>;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({
  stats,
  logs,
  onClearLogs,
  onGenerateDossier,
}) => {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const formatMoney = (amt: number) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)}L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const handleOpenDossier = async (item: LogItem) => {
    if (!onGenerateDossier) return;
    setLoadingItemId(item.id);
    try {
      const res = await onGenerateDossier(item.id);
      if (res?.localPath) {
        await SetuNativeModule.openPdf(res.localPath);
      } else if (res?.pdfUrl) {
        Linking.openURL(res.pdfUrl).catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open dossier PDF.');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleReportFraud = (item: LogItem) => {
    const reportText =
      `SETU FRAUD INCIDENT REPORT\n` +
      `Time: ${item.time}\n` +
      `Category: ${item.tag}\n` +
      `Evidence / Message: ${item.message}\n` +
      `Reported via Setu Guardian`;

    try {
      SetuNativeModule.copyToClipboard(reportText);
    } catch (_e) {}

    Alert.alert(
      'Report Fraud to Official Portal',
      `Evidence has been copied to your clipboard.\n\nChoose which official Indian Cybersec portal to submit this report:`,
      [
        {
          text: 'Chakshu (DoT Fraud Facility)',
          onPress: () => Linking.openURL('https://sancharsaathi.gov.in/sfc/'),
        },
        {
          text: 'National Cyber Crime (1930)',
          onPress: () => Linking.openURL('https://cybercrime.gov.in'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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
          <TouchableOpacity onPress={onClearLogs} activeOpacity={0.7}>
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
            const isCall = item.tag === 'CALL' || item.message.toLowerCase().includes('call');

            let dotColor = THEME.colors.emerald;
            if (isAlert) dotColor = THEME.colors.crimson;
            else if (isDecoy) dotColor = THEME.colors.violet;

            const isItemLoading = loadingItemId === item.id;

            return (
              <View key={item.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventMessage}>{item.message}</Text>
                  <Text style={styles.eventTime}>{item.time} • {item.tag}</Text>

                  {/* ACTION PILLS NEXT TO / BELOW LOG ENTRY */}
                  <View style={styles.logActionRow}>
                    {/* 1. Dossier PDF Generator & Opener */}
                    <TouchableOpacity
                      style={styles.dossierPill}
                      onPress={() => handleOpenDossier(item)}
                      disabled={isItemLoading}
                      activeOpacity={0.7}
                    >
                      {isItemLoading ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={styles.dossierPillText}>📄 1930 Dossier</Text>
                      )}
                    </TouchableOpacity>

                    {/* 2. Post to Official Cybersec Website */}
                    <TouchableOpacity
                      style={styles.reportPill}
                      onPress={() => handleReportFraud(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reportPillText}>🛡️ Report to Portal</Text>
                    </TouchableOpacity>

                    {/* 3. Dialogue Proof Breakdown (if Decoy or Call) */}
                    {(isDecoy || isCall) && (
                      <TouchableOpacity
                        style={styles.proofPill}
                        onPress={() => setActiveCallId(item.id || 'call_demo_01')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.proofPillText}>💬 Dialogue Proof</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* DIALOGUE PROOF AUDIT MODAL */}
      <DialogueProofModal
        visible={!!activeCallId}
        callId={activeCallId}
        onClose={() => setActiveCallId(null)}
        onGenerateDossier={onGenerateDossier}
      />
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
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  clearText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    padding: 14,
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
  logActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  dossierPill: {
    backgroundColor: THEME.colors.emerald,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dossierPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  reportPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportPillText: {
    color: THEME.colors.amber,
    fontSize: 11,
    fontWeight: '700',
  },
  proofPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofPillText: {
    color: THEME.colors.violetLight,
    fontSize: 11,
    fontWeight: '700',
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
