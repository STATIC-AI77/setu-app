import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { AppSettings } from '../types';
import { THEME } from '../constants/theme';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  backendOnline: boolean | null;
  onSave: (updated: Partial<AppSettings>) => void;
  onPing: () => Promise<boolean>;
  onSimulateScam?: () => void;
  onSimulateCallThreat?: () => void;
  onToggleInterlockDirect?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  backendOnline,
  onSave,
  onPing,
  onSimulateScam,
  onSimulateCallThreat,
  onToggleInterlockDirect,
}) => {
  const [url, setUrl] = useState(settings?.baseUrl || '');
  const [token, setToken] = useState(settings?.token || '');
  const [showDevTools, setShowDevTools] = useState(false);

  const handleSave = () => {
    onSave({ baseUrl: url, token });
    Alert.alert('Saved', 'Backend parameters updated.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* BACKEND STATUS */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: backendOnline ? THEME.colors.emerald : THEME.colors.crimson },
                ]}
              />
              <Text style={styles.statusText}>
                {backendOnline ? 'Connected to Setu Cloud' : 'Offline / Checking URL'}
              </Text>
              <TouchableOpacity onPress={onPing} style={styles.pingBtn}>
                <Text style={styles.pingText}>Ping</Text>
              </TouchableOpacity>
            </View>

            {/* CONFIG */}
            <Text style={styles.label}>Backend Base URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://xxx.trycloudflare.com or http://10.0.2.2:8000"
              placeholderTextColor="#52525B"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Auth Token</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="setu-dev-token"
              placeholderTextColor="#52525B"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* PERMISSIONS */}
            <Text style={styles.sectionHeading}>Permissions</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.permRow}
                onPress={() => SetuNativeModule.openNotificationListenerSettings()}
              >
                <Text style={styles.permName}>Notification Access</Text>
                <Text style={styles.permAction}>Check</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.permRow}
                onPress={() => SetuNativeModule.openOverlaySettings()}
              >
                <Text style={styles.permName}>Display Over Apps</Text>
                <Text style={styles.permAction}>Check</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.permRow}
                onPress={() => SetuNativeModule.requestIgnoreBatteryOptimization()}
              >
                <Text style={styles.permName}>Battery Optimization</Text>
                <Text style={styles.permAction}>Exempt</Text>
              </TouchableOpacity>
            </View>

            {/* DEVELOPER TOOLS (DISCREET) */}
            <TouchableOpacity
              style={styles.devToggle}
              onPress={() => setShowDevTools(!showDevTools)}
            >
              <Text style={styles.devToggleText}>
                {showDevTools ? '▼ Hide Developer Tools' : '▶ Developer Simulation Tools'}
              </Text>
            </TouchableOpacity>

            {showDevTools && (
              <View style={styles.devBox}>
                <TouchableOpacity
                  style={styles.devBtn}
                  onPress={() => {
                    onSimulateScam?.();
                    onClose();
                  }}
                >
                  <Text style={styles.devBtnText}>Simulate Phishing Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devBtn}
                  onPress={() => {
                    onSimulateCallThreat?.();
                    onClose();
                  }}
                >
                  <Text style={styles.devBtnText}>Simulate Call Threat Lookup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devBtn}
                  onPress={() => {
                    onToggleInterlockDirect?.();
                    onClose();
                  }}
                >
                  <Text style={styles.devBtnText}>Toggle Interlock Overlay</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SAVE BUTTON */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: THEME.colors.textMuted,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  pingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pingText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 10,
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  permName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  permAction: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.emerald,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  devToggle: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  devToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  devBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  devBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  devBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: THEME.colors.emerald,
    borderRadius: THEME.radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
