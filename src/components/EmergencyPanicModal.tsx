import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface EmergencyPanicModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateHelpline?: () => void;
  onArmInterlock?: () => void;
}

const BANK_HELPLINES = [
  { name: 'SBI (State Bank of India)', number: '1800112211', label: 'Toll-Free Fraud Helpline' },
  { name: 'HDFC Bank', number: '18001600', label: 'Emergency Card/Netbanking Freeze' },
  { name: 'ICICI Bank', number: '18001080', label: '24x7 Cyber Fraud Cell' },
  { name: 'Axis Bank', number: '18604195555', label: 'Immediate Payment Block' },
  { name: 'Bank of Baroda', number: '18002584455', label: 'Fraud Interception Desk' },
  { name: 'Punjab National Bank', number: '18001802222', label: 'Unauthorized Txn Freeze' },
];

export const EmergencyPanicModal: React.FC<EmergencyPanicModalProps> = ({
  visible,
  onClose,
  onNavigateHelpline,
  onArmInterlock,
}) => {
  const [showBankList, setShowBankList] = useState<boolean>(false);
  const [moneyTakenArmed, setMoneyTakenArmed] = useState<boolean>(false);

  const dialNumber = async (number: string) => {
    const url = `tel:${number.replace(/\s+/g, '')}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Helpline Number', `Please dial: ${number}`);
      }
    } catch (_e) {
      Alert.alert('Helpline Number', `Please dial: ${number}`);
    }
  };

  const handleContactSon = async () => {
    Alert.alert(
      'Contact Son (Rohit)',
      'Choose how you want to reach Rohit immediately:',
      [
        {
          text: '📞 Phone Call',
          onPress: () => dialNumber('+919876543210'),
        },
        {
          text: '💬 WhatsApp SOS Alert',
          onPress: () => {
            const msg = encodeURIComponent(
              '🚨 EMERGENCY SOS: Papa pressed the Panic Button on Setu Guardian. Suspicious activity or financial threat detected on phone. Please call me immediately!'
            );
            Linking.openURL(`https://wa.me/919876543210?text=${msg}`).catch(() => {
              dialNumber('+919876543210');
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMoneyTakenOut = () => {
    // 1. Instantly arm interlock
    try {
      SetuNativeModule.armInterlock('Emergency Fraud Reported: Money Debited', 99);
    } catch (_e) {}
    onArmInterlock?.();
    setMoneyTakenArmed(true);

    Alert.alert(
      '🚨 EMERGENCY LOCK ACTIVATED',
      '1. Financial and UPI apps on your phone have been locked immediately.\n2. Call 1930 Cybercrime Helpline within golden hour to freeze the scammer bank account.\n3. Call your bank immediately.',
      [
        {
          text: '📞 Call 1930 Now',
          style: 'destructive',
          onPress: () => dialNumber('1930'),
        },
        {
          text: '🏦 Select Bank to Call',
          onPress: () => setShowBankList(true),
        },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* DRAG HANDLE */}
          <View style={styles.handleBar} />

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.sosPulseBadge}>
                <Text style={styles.sosEmoji}>🚨</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>EMERGENCY PANIC DESK</Text>
                <Text style={styles.headerSubtitle}>आपत्कालीन सहायता • 1-Tap Urgent Protection</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* NOTICE BANNER */}
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>⚡ Golden Hour Action Required</Text>
              <Text style={styles.bannerDesc}>
                If money was deducted or an extortion call is in progress, act immediately below. National cyber police can freeze fraudulent transactions within minutes.
              </Text>
            </View>

            {/* PRIORITY ACTION 1: "MY MONEY WAS TAKEN OUT" */}
            <TouchableOpacity
              style={styles.moneyLostCard}
              onPress={handleMoneyTakenOut}
              activeOpacity={0.85}
            >
              <View style={styles.moneyLostIconBox}>
                <Text style={styles.actionEmoji}>💸</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moneyLostTitle}>"My Money Was Taken Out"</Text>
                <Text style={styles.moneyLostHindi}>मेरे पैसे कट गए — तुरंत मदद</Text>
                <Text style={styles.moneyLostDesc}>
                  Emergency Killswitch: Lock payment apps instantly & block unauthorized transfers.
                </Text>
              </View>
              <View style={styles.actionArrowBox}>
                <Text style={styles.actionArrowText}>➔</Text>
              </View>
            </TouchableOpacity>

            {/* PRIORITY ACTION 2: 1930 CYBER HELPLINE */}
            <TouchableOpacity
              style={styles.cardHelpline}
              onPress={() => dialNumber('1930')}
              activeOpacity={0.85}
            >
              <View style={styles.helplineIconBox}>
                <Text style={styles.actionEmoji}>📞</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardBadgeRow}>
                  <Text style={styles.cardBadge}>NATIONAL HOTLINE</Text>
                </View>
                <Text style={styles.cardTitle}>Call 1930 Cyber Helpline</Text>
                <Text style={styles.cardSubtitle}>साइबर हेल्पलाइन 1930 पर कॉल करें</Text>
                <Text style={styles.cardMeta}>Free Govt Call • 24x7 Citizen Cyber Protection</Text>
              </View>
              <View style={styles.callNowBtn}>
                <Text style={styles.callNowBtnText}>DIAL 1930</Text>
              </View>
            </TouchableOpacity>

            {/* PRIORITY ACTION 3: CONTACT SON (ROHIT) */}
            <TouchableOpacity
              style={styles.cardFamily}
              onPress={handleContactSon}
              activeOpacity={0.85}
            >
              <View style={styles.familyIconBox}>
                <Text style={styles.actionEmoji}>👨‍👦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardBadgeRow}>
                  <Text style={[styles.cardBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }]}>
                    PRIMARY GUARDIAN
                  </Text>
                </View>
                <Text style={styles.cardTitle}>Contact Son (Rohit)</Text>
                <Text style={styles.cardSubtitle}>बेटे रोहित से तुरंत संपर्क करें</Text>
                <Text style={styles.cardMeta}>Instant Phone Call or WhatsApp SOS Alert</Text>
              </View>
              <View style={styles.actionArrowBox}>
                <Text style={styles.actionArrowText}>➔</Text>
              </View>
            </TouchableOpacity>

            {/* PRIORITY ACTION 4: CONTACT BANK & FREEZE ACCOUNT */}
            <TouchableOpacity
              style={styles.cardBank}
              onPress={() => setShowBankList(!showBankList)}
              activeOpacity={0.85}
            >
              <View style={styles.bankIconBox}>
                <Text style={styles.actionEmoji}>🏦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Contact Bank / Freeze Account</Text>
                <Text style={styles.cardSubtitle}>बैंक को कॉल करके खाता व कार्ड फ्रीज करें</Text>
                <Text style={styles.cardMeta}>
                  {showBankList ? 'Hide Bank Directory ▲' : 'Show 24x7 Bank Helplines (SBI, HDFC, ICICI...) ▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* EXPANDABLE BANK LIST */}
            {showBankList && (
              <View style={styles.bankListCard}>
                <Text style={styles.bankListHeader}>Select Your Bank to Call Immediately:</Text>
                {BANK_HELPLINES.map((bank, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.bankItem}
                    onPress={() => dialNumber(bank.number)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName}>{bank.name}</Text>
                      <Text style={styles.bankLabel}>{bank.label}</Text>
                    </View>
                    <View style={styles.bankDialBox}>
                      <Text style={styles.bankDialText}>📞 {bank.number}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* PRIORITY ACTION 5: CYBERCRIME DOSSIER */}
            <TouchableOpacity
              style={styles.cardDossier}
              onPress={() => {
                onClose();
                onNavigateHelpline?.();
              }}
              activeOpacity={0.85}
            >
              <View style={styles.dossierIconBox}>
                <Text style={styles.actionEmoji}>⚖️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>1-Click 1930 Police Dossier</Text>
                <Text style={styles.cardSubtitle}>पुलिस रिपोर्ट व साक्ष्य दस्तावेज़ डाउनलोड करें</Text>
                <Text style={styles.cardMeta}>Court-admissible PDF with call audio transcripts</Text>
              </View>
              <View style={styles.actionArrowBox}>
                <Text style={styles.actionArrowText}>➔</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* BOTTOM DISMISS */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Close Emergency Desk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0A0D14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderTopColor: '#EF4444',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '90%',
  },
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#27272A',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosPulseBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F87171',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  scrollArea: {
    marginBottom: 12,
  },
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  moneyLostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  moneyLostIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 22,
  },
  moneyLostTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  moneyLostHindi: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCA5A5',
    marginTop: 1,
  },
  moneyLostDesc: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 15,
  },
  cardHelpline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  helplineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNowBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  cardFamily: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  familyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBank: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  bankIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDossier: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  dossierIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeRow: {
    marginBottom: 4,
  },
  cardBadge: {
    fontSize: 9,
    fontWeight: '900',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  actionArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrowText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '900',
  },
  bankListCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginBottom: 12,
  },
  bankListHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  bankLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  bankDialBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  bankDialText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
