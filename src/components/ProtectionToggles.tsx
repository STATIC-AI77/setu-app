import React from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { THEME } from '../constants/theme';

interface ProtectionTogglesProps {
  protectionEnabled: boolean;
  autoReplyEnabled: boolean;
  onToggleProtection: (val: boolean) => void;
  onToggleAutoReply: (val: boolean) => void;
}

export const ProtectionToggles: React.FC<ProtectionTogglesProps> = ({
  protectionEnabled,
  autoReplyEnabled,
  onToggleProtection,
  onToggleAutoReply,
}) => {
  return (
    <>
      {/* Master Protection */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Shield Protection</Text>
            <Text style={styles.hindi}>समग्र धोखाधड़ी सुरक्षा (SMS, WhatsApp, Calls)</Text>
          </View>
          <Switch
            value={protectionEnabled}
            onValueChange={onToggleProtection}
            trackColor={{ false: THEME.colors.pausedGray, true: THEME.colors.safeGreen }}
            thumbColor={protectionEnabled ? '#ffffff' : '#cbd5e1'}
          />
        </View>
      </View>

      {/* Saroj Decoy */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Saroj Auto-Reply Decoy</Text>
            <Text style={styles.hindi}>सरोज आंटी एआई डेकॉय (स्कैमर का समय बर्बाद)</Text>
            {autoReplyEnabled && (
              <Text style={styles.personaTag}>
                💬 AI Grandmother active to engage scammers in chat
              </Text>
            )}
          </View>
          <Switch
            value={autoReplyEnabled}
            onValueChange={onToggleAutoReply}
            trackColor={{ false: THEME.colors.pausedGray, true: THEME.colors.primary }}
            thumbColor={autoReplyEnabled ? '#ffffff' : '#cbd5e1'}
          />
        </View>
      </View>
    </>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textWhite,
  },
  hindi: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  personaTag: {
    fontSize: 11,
    color: THEME.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});
