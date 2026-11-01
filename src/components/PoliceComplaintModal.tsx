import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';

interface PoliceComplaintModalProps {
  visible: boolean;
  onClose: () => void;
  verdictId: string;
}

export const PoliceComplaintModal: React.FC<PoliceComplaintModalProps> = ({
  visible,
  onClose,
  verdictId,
}) => {
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string>('1930_COMPLAINT_255320F6');

  const handleGenerate = async () => {
    setLoading(true);
    const resp = await api.get1930PoliceReport(verdictId);
    setLoading(false);
    if (resp?.report_url) {
      setReportUrl(resp.report_url);
      setReportId(resp.report_id);
    }
  };

  const handleOpenPdf = () => {
    if (reportUrl) {
      Linking.openURL(reportUrl);
    }
  };

  const handleShare = async () => {
    if (reportUrl) {
      await Share.share({
        message: `🚨 Setu Guardian Official Cybercrime 1930 Police Complaint Dossier (${reportId}): ${reportUrl}`,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📑 National 1930 Police Dossier</Text>
              <Text style={styles.subtitle}>Indian Cybercrime Coordination Centre (I4C)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.infoTitle}>Official Legal Evidence Package</Text>
            <Text style={styles.infoDesc}>
              Automatically generates a formal police complaint dossier containing:
            </Text>
            <Text style={styles.bullet}>• Extracted Scammer Phone Number & Call Timestamps</Text>
            <Text style={styles.bullet}>• Disguised Phishing URLs & SMS Raw Headers</Text>
            <Text style={styles.bullet}>• Extracted Money Mule Bank Accounts & UPI IDs</Text>
            <Text style={styles.bullet}>• Full AI Decoy Audio Dialogue Transcript</Text>

            {reportUrl ? (
              <View style={styles.successBox}>
                <Text style={styles.successLabel}>Dossier Ready:</Text>
                <Text style={styles.reportIdText}>{reportId}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.openBtn} onPress={handleOpenPdf}>
                    <Text style={styles.openBtnText}>📄 Open PDF Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Text style={styles.shareBtnText}>📤 Share Dossier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.generateBtnText}>Generate 1-Click 1930 Complaint PDF</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.cardDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textWhite,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: THEME.colors.textMuted,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: THEME.colors.bgDark,
    borderRadius: THEME.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textWhite,
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginBottom: 8,
    lineHeight: 18,
  },
  bullet: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  generateBtn: {
    backgroundColor: THEME.colors.dangerRed,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBox: {
    backgroundColor: '#064e3b33',
    borderColor: THEME.colors.safeGreen,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  successLabel: {
    fontSize: 11,
    color: THEME.colors.safeGreen,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reportIdText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  openBtn: {
    flex: 1,
    backgroundColor: THEME.colors.primaryDark,
    paddingVertical: 10,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  openBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: THEME.colors.cardBorder,
    paddingVertical: 10,
    borderRadius: THEME.radius.button,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
