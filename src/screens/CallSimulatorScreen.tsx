import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { THEME } from '../constants/theme';

interface CallSimulatorScreenProps {
  onTriggerScamCall: (scenario: string, scammerNumber: string) => void;
}

interface ScenarioConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  scammerNumber: string;
}

const SCAM_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'digital_arrest',
    badge: '🚨 TOP THREAT',
    title: 'Digital Arrest',
    subtitle: 'CBI / Police Extortion',
    description: 'Fake CBI officer claims arrest warrant issued for Aadhaar money laundering. Demands immediate fine payment.',
    scammerNumber: '+919876543210',
  },
  {
    id: 'mpeb_bill',
    badge: '⚡ PHISHING',
    title: 'Electricity Cutoff',
    subtitle: 'MPEB / Discom Scam',
    description: 'Threatens to disconnect power in 1 hour unless unpaid bill is paid immediately via UPI link.',
    scammerNumber: '+919123456789',
  },
  {
    id: 'bank_kyc',
    badge: '🏦 BANK FRAUD',
    title: 'Bank KYC Freeze',
    subtitle: 'SBI / HDFC Block',
    description: 'Fake bank manager warns that savings account is frozen due to KYC expiry. Asks for OTP.',
    scammerNumber: '+919988776655',
  },
  {
    id: 'customs_parcel',
    badge: '📦 CUSTOMS',
    title: 'Customs Contraband',
    subtitle: 'FedEx / Narcotics',
    description: 'Fake customs agent claims package with drugs was addressed to elder. Demands clearance fee.',
    scammerNumber: '+919765432108',
  },
  {
    id: 'lottery',
    badge: '🎁 REWARD',
    title: 'KBC Lottery',
    subtitle: '25 Lakhs Prize',
    description: 'Scammer promises KBC lottery prize but demands upfront TDS tax clearance fee.',
    scammerNumber: '+919456789012',
  },
];

export const CallSimulatorScreen: React.FC<CallSimulatorScreenProps> = ({
  onTriggerScamCall,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('digital_arrest');

  const selectedScenario = SCAM_SCENARIOS.find((s) => s.id === selectedScenarioId) || SCAM_SCENARIOS[0];

  const handleTriggerCall = () => {
    onTriggerScamCall(selectedScenario.id, selectedScenario.scammerNumber);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Scam Call Simulator</Text>
      <Text style={styles.subtitle}>
        Test incoming scam call detection and Saroj AI decoy defense system
      </Text>

      {/* INFO CARD */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>📱</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            Tap "Trigger Scam Call" below to simulate an incoming call from a scammer.
            {'\n\n'}
            <Text style={{ fontWeight: '700', color: THEME.colors.emerald }}>
              • Decoy ON:
            </Text>{' '}
            Saroj AI auto-answers and interrogates the scammer
            {'\n'}
            <Text style={{ fontWeight: '700', color: THEME.colors.violet }}>
              • Decoy OFF:
            </Text>{' '}
            You answer manually via normal WebRTC call
          </Text>
        </View>
      </View>

      {/* SCENARIO SELECTOR */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Select Scam Scenario</Text>
        <Text style={styles.cardSub}>
          Choose the type of scam call to simulate:
        </Text>

        <View style={styles.scenarioList}>
          {SCAM_SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <TouchableOpacity
                key={sc.id}
                style={[
                  styles.scenarioItem,
                  isSelected && styles.scenarioItemActive,
                ]}
                onPress={() => setSelectedScenarioId(sc.id)}
                activeOpacity={0.8}
              >
                <View style={styles.scenarioItemTop}>
                  <Text style={styles.scenarioBadge}>{sc.badge}</Text>
                </View>
                <Text style={styles.scenarioTitle}>{sc.title}</Text>
                <Text style={styles.scenarioSubtitle}>{sc.subtitle}</Text>
                <Text style={styles.scenarioDescription}>{sc.description}</Text>
                <Text style={styles.scenarioNumber}>
                  📞 {sc.scammerNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SELECTED SCENARIO DETAILS */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>
          🎯 Selected: {selectedScenario.title}
        </Text>
        <Text style={styles.detailBody}>
          Your phone will ring with incoming call from:
        </Text>
        <Text style={styles.detailNumber}>
          {selectedScenario.scammerNumber}
        </Text>
        <Text style={styles.detailNote}>
          If Saroj AI Decoy is enabled, the call will auto-route to the AI agent who will interrogate the scammer and extract intel.
        </Text>
      </View>

      {/* TRIGGER BUTTON */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={handleTriggerCall}
        activeOpacity={0.8}
      >
        <Text style={styles.triggerButtonText}>
          📞 Trigger Scam Call
        </Text>
        <Text style={styles.triggerSubText}>
          Phone will ring in 2 seconds
        </Text>
      </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 140,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },

  // INFO CARD
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radius.card,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
  },

  // CARD & SCENARIO SELECTOR
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radius.card,
    padding: 18,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  scenarioList: {
    gap: 10,
  },
  scenarioItem: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 14,
    padding: 14,
  },
  scenarioItemActive: {
    borderColor: THEME.colors.emerald,
    backgroundColor: '#064E3B20',
  },
  scenarioItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scenarioBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.emerald,
    letterSpacing: 0.5,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  scenarioSubtitle: {
    fontSize: 12,
    color: THEME.colors.violet,
    fontWeight: '600',
    marginBottom: 6,
  },
  scenarioDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 6,
  },
  scenarioNumber: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },

  // DETAIL CARD
  detailCard: {
    backgroundColor: '#111827',
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.violet,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.violet,
    marginBottom: 6,
  },
  detailBody: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  detailNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  detailNote: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },

  // TRIGGER BUTTON
  triggerButton: {
    backgroundColor: THEME.colors.crimson,
    borderRadius: THEME.radius.button,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  triggerButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  triggerSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});
