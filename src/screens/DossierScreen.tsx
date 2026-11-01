import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ThreatAlert } from '../types';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface DossierScreenProps {
  activeThreat: ThreatAlert | null;
  onGenerateReport: () => Promise<any>;
  isGenerating: boolean;
  generatedPdfUrl: string | null;
  localPdfPath?: string | null;
}

export const DossierScreen: React.FC<DossierScreenProps> = ({
  onGenerateReport,
  isGenerating,
  generatedPdfUrl,
  localPdfPath,
}) => {
  const handleCall1930 = () => {
    Linking.openURL('tel:1930').catch((err) =>
      console.warn('Cannot dial 1930:', err)
    );
  };

  const handleShare = async () => {
    const target = localPdfPath || generatedPdfUrl;
    if (!target) return;
    try {
      await Share.share({
        title: 'National 1930 Cybercrime Complaint Dossier',
        message: `🚨 Setu Guardian Official Cybercrime 1930 Police Dossier.\nDirect Evidence: ${generatedPdfUrl || target}`,
        url: target,
      });
    } catch (_e) {}
  };

  const handleOpenPdf = async () => {
    const target = localPdfPath || generatedPdfUrl;
    if (target) {
      try {
        await SetuNativeModule.openPdf(target);
      } catch (err) {
        if (generatedPdfUrl) {
          Linking.openURL(generatedPdfUrl).catch(() => {});
        }
      }
    }
  };

  const handleReportToCybercrimeGov = () => {
    const summary =
      `INCIDENT SUMMARY: Digital Arrest Extortion Attempt\n` +
      `Target: Saroj Sharma (+91 98220 12345)\n` +
      `Suspect Number: +91 98765 43210\n` +
      `Mule Accounts: cbi.courtfee@sbi, 50170012345678\n` +
      `Dossier ID: ${generatedPdfUrl ? generatedPdfUrl.split('/').pop() : '1930_COMPLAINT_VERIFIED'}\n` +
      `Platform: Setu Counter-Fraud Shield`;

    try {
      SetuNativeModule.copyToClipboard(summary);
    } catch (_e) {}

    Alert.alert(
      'Report to Official Cybersec Portal',
      'Incident evidence has been copied to your clipboard. Choose which official government portal to open:',
      [
        {
          text: 'Chakshu (DoT Fraud Facility)',
          onPress: () => Linking.openURL('https://sancharsaathi.gov.in/sfc/'),
        },
        {
          text: 'National Cyber Crime Portal (1930)',
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
      <Text style={styles.title}>Helpline & Reports</Text>

      {/* EMERGENCY CALL CARD */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <Text style={styles.emergencyIcon}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>National Cyber Helpline</Text>
            <Text style={styles.emergencySub}>
              Call 1930 within 2 hours of fraud to freeze stolen bank transfers.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCall1930}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnText}>Call 1930</Text>
        </TouchableOpacity>
      </View>

      {/* 1-CLICK POLICE REPORT CARD */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Official Police Dossier (1930)</Text>
        <Text style={styles.cardSub}>
          Generates a verified cybercrime complaint PDF with caller ID, phishing links, and decoy conversation logs, saved locally on your phone.
        </Text>

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={onGenerateReport}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.generateBtnText}>
              {generatedPdfUrl ? 'Regenerate 1930 Dossier' : 'Generate 1930 Dossier'}
            </Text>
          )}
        </TouchableOpacity>

        {generatedPdfUrl && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>✅ Dossier Generated & Saved</Text>
              {localPdfPath && (
                <Text style={styles.pathSub} numberOfLines={1}>
                  📁 {localPdfPath.split('/').pop()}
                </Text>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={handleOpenPdf}
                activeOpacity={0.8}
              >
                <Text style={styles.viewBtnText}>📂 Open PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareBtnText}>📤 Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.portalBtn}
              onPress={handleReportToCybercrimeGov}
              activeOpacity={0.8}
            >
              <Text style={styles.portalBtnText}>
                🛡️ Post Incident to Official Cybersec Portal
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* COMPLAINT GUIDANCE PROTOCOL */}
      <View style={styles.guidanceCard}>
        <Text style={styles.guidanceHeading}>Golden Hour Protocol (1930)</Text>
        <Text style={styles.guidanceItem}>
          1. <Text style={styles.bold}>Call 1930</Text> immediately after extortion to trigger bank interlocks.
        </Text>
        <Text style={styles.guidanceItem}>
          2. Open the <Text style={styles.bold}>1930 Dossier PDF</Text> above for exact transaction references.
        </Text>
        <Text style={styles.guidanceItem}>
          3. Upload the generated PDF at <Text style={styles.bold}>cybercrime.gov.in</Text> or Chakshu portal.
        </Text>
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
  emergencyCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.amberBorder,
    padding: 18,
    marginBottom: 20,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  emergencyIcon: {
    fontSize: 28,
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emergencySub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  callBtn: {
    backgroundColor: THEME.colors.amber,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  callBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 18,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 18,
  },
  generateBtn: {
    backgroundColor: THEME.colors.emerald,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  resultHeader: {
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.emerald,
  },
  pathSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: THEME.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    color: THEME.colors.emerald,
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: THEME.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  portalBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: THEME.radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  portalBtnText: {
    color: THEME.colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  guidanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 18,
    gap: 8,
  },
  guidanceHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  guidanceItem: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  bold: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
});
