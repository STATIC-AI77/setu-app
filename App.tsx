import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import SetuNativeModule from './modules/setu-native/src/SetuNativeModule';

// Notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

interface LogItem {
  id: string;
  time: string;
  tag: string;
  message: string;
}

export default function App() {
  // Settings & identity
  const [baseUrl, setBaseUrl] = useState('http://10.0.2.2:8000');
  const [token, setToken] = useState('setu-dev-token');
  const [deviceId, setDeviceId] = useState('device_demo_001');
  const [familyId, setFamilyId] = useState('fam_demo_001');
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  // Status & health
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [interlockStatus, setInterlockStatus] = useState<'idle' | 'armed' | 'released'>('idle');
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Permissions state
  const [hasNotifListener, setHasNotifListener] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasBatteryOpt, setHasBatteryOpt] = useState(false);

  // Settings expanded view
  const [showSettings, setShowSettings] = useState(false);

  // Initialize and load saved settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const savedUrl = await AsyncStorage.getItem('setu_base_url');
        const savedToken = await AsyncStorage.getItem('setu_token');
        let savedDevId = await AsyncStorage.getItem('setu_device_id');
        const savedFamId = await AsyncStorage.getItem('setu_family_id');
        const savedProt = await AsyncStorage.getItem('setu_protection');
        const savedReply = await AsyncStorage.getItem('setu_auto_reply');

        if (!savedDevId) {
          savedDevId = 'setu_' + Math.random().toString(36).substring(2, 10);
          await AsyncStorage.setItem('setu_device_id', savedDevId);
        }

        const bUrl = savedUrl || 'http://10.0.2.2:8000';
        const tkn = savedToken || 'setu-dev-token';
        const fId = savedFamId || 'fam_demo_001';
        const prot = savedProt !== null ? savedProt === 'true' : true;
        const reply = savedReply !== null ? savedReply === 'true' : true;

        setBaseUrl(bUrl);
        setToken(tkn);
        setDeviceId(savedDevId);
        setFamilyId(fId);
        setProtectionEnabled(prot);
        setAutoReplyEnabled(reply);

        // Sync to native SharedPreferences for background services
        syncNativeConfig(bUrl, tkn, savedDevId, fId, prot, reply);

        // Check backend health
        checkBackendHealth(bUrl, tkn);
      } catch (_e) {}
    }
    loadSettings();
  }, []);

  // Sync state to native SharedPreferences
  const syncNativeConfig = (
    url: string,
    tkn: string,
    devId: string,
    famId: string,
    prot: boolean,
    reply: boolean
  ) => {
    try {
      SetuNativeModule.updateConfig(url, tkn, devId, famId, prot, reply);
    } catch (_e) {}
  };

  // Poll permissions and logs every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkPermissions();
      fetchLogs();
      try {
        const armed = SetuNativeModule.isInterlockArmed();
        setInterlockStatus(armed ? 'armed' : 'idle');
      } catch (_e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = () => {
    try {
      setHasNotifListener(SetuNativeModule.checkNotificationListenerPermission());
      setHasOverlay(SetuNativeModule.checkOverlayPermission());
      setHasBatteryOpt(SetuNativeModule.checkBatteryOptimizationPermission());
    } catch (_e) {}
  };

  const fetchLogs = () => {
    try {
      const logsJson = SetuNativeModule.getRecentLogs();
      if (logsJson) {
        const parsed: LogItem[] = JSON.parse(logsJson);
        setLogs(parsed);
      }
    } catch (_e) {}
  };

  // Backend Health Check
  const checkBackendHealth = async (targetUrl = baseUrl, targetToken = token) => {
    try {
      const cleanUrl = targetUrl.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${cleanUrl}/threat-intel/health-check`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${targetToken}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setBackendOnline(res.status < 500);
    } catch (_e) {
      setBackendOnline(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      await AsyncStorage.setItem('setu_base_url', baseUrl);
      await AsyncStorage.setItem('setu_token', token);
      await AsyncStorage.setItem('setu_family_id', familyId);
      syncNativeConfig(baseUrl, token, deviceId, familyId, protectionEnabled, autoReplyEnabled);
      Alert.alert('Saved', 'Backend settings updated & synced with native shield.');
      checkBackendHealth(baseUrl, token);
    } catch (_e) {
      Alert.alert('Error', 'Could not save settings.');
    }
  };

  // Master Protection Toggle
  const toggleProtection = async (val: boolean) => {
    if (!val) {
      Alert.alert(
        'Pause Setu Protection?',
        'Elder phone scam detection, auto-reply, and call screening will be paused.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            style: 'destructive',
            onPress: async () => {
              setProtectionEnabled(false);
              await AsyncStorage.setItem('setu_protection', 'false');
              syncNativeConfig(baseUrl, token, deviceId, familyId, false, autoReplyEnabled);
            },
          },
        ]
      );
    } else {
      setProtectionEnabled(true);
      await AsyncStorage.setItem('setu_protection', 'true');
      syncNativeConfig(baseUrl, token, deviceId, familyId, true, autoReplyEnabled);
    }
  };

  // Saroj Auto-Reply Toggle
  const toggleAutoReply = async (val: boolean) => {
    setAutoReplyEnabled(val);
    await AsyncStorage.setItem('setu_auto_reply', val ? 'true' : 'false');
    syncNativeConfig(baseUrl, token, deviceId, familyId, protectionEnabled, val);
  };

  // Demo Action 1: Simulate Scam
  const handleSimulateScam = () => {
    try {
      const digitalArrestScam =
        'URGENT: This is Inspector Sharma from CBI Crime Branch Delhi. A money laundering case is registered in your Aadhaar. Digital arrest warrant issued. Transfer Rs 45,000 to safety verification RBI account immediately or police is arriving at your door.';
      SetuNativeModule.simulateScam(digitalArrestScam, '+919876543210');
      Alert.alert(
        'Simulated Scam Triggered',
        'Sent Digital Arrest Hinglish message to intake pipeline. Check Activity Log below.'
      );
      setTimeout(fetchLogs, 800);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not trigger simulation');
    }
  };

  // Demo Action 2: Test Interlock Overlay
  const handleTestInterlock = () => {
    try {
      if (interlockStatus === 'armed') {
        SetuNativeModule.releaseInterlock();
        setInterlockStatus('released');
      } else {
        SetuNativeModule.armInterlock('Demo Scam: Digital Arrest', 98);
        setInterlockStatus('armed');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Overlay action failed');
    }
  };

  // Clear Logs
  const handleClearLogs = () => {
    try {
      SetuNativeModule.clearLogs();
      setLogs([]);
    } catch (_e) {}
  };

  // FCM registration setup
  useEffect(() => {
    async function setupFCM() {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          if (tokenData?.data) {
            // Register token with backend
            registerWithBackend(tokenData.data);
          }
        }
      } catch (_e) {}
    }
    setupFCM();

    // Foreground notification received listener
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data && typeof data === 'object') {
        const cmd = (data as any).cmd;
        if (cmd === 'arm_interlock') {
          const scamType = typeof (data as any).scam_type === 'string' ? (data as any).scam_type : 'Active Scam';
          const riskScore = typeof (data as any).risk_score === 'number' ? (data as any).risk_score : 90;
          SetuNativeModule.armInterlock(scamType, riskScore);
          setInterlockStatus('armed');
        } else if (cmd === 'release_interlock') {
          SetuNativeModule.releaseInterlock();
          setInterlockStatus('released');
        }
        fetchLogs();
      }
    });

    return () => sub.remove();
  }, [baseUrl, token, deviceId, familyId]);

  const registerWithBackend = async (fcmToken: string) => {
    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      await fetch(`${cleanUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          fcm_token: fcmToken,
          family_id: familyId,
        }),
      });
    } catch (_e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <View>
            <Text style={styles.appName}>SETU GUARDIAN</Text>
            <Text style={styles.appHindi}>सेतु सुरक्षा कवच • Elder Shield</Text>
          </View>
        </View>

        {/* Status Banner / Interlock Pill */}
        <View
          style={[
            styles.statusCard,
            interlockStatus === 'armed'
              ? styles.statusCardArmed
              : !protectionEnabled
              ? styles.statusCardPaused
              : styles.statusCardSafe,
          ]}
        >
          <View style={styles.statusRow}>
            <Text style={styles.statusDot}>
              {interlockStatus === 'armed' ? '🛑' : !protectionEnabled ? '⚠️' : '🟢'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {interlockStatus === 'armed'
                  ? 'INTERLOCK ARMED (भुगतान अवरुद्ध)'
                  : !protectionEnabled
                  ? 'SHIELD PAUSED (सुरक्षा रुकी है)'
                  : 'GUARDIAN ACTIVE (सक्रिय सुरक्षा)'}
              </Text>
              <Text style={styles.statusDesc}>
                {interlockStatus === 'armed'
                  ? 'Payment apps blocked — scam detected'
                  : !protectionEnabled
                  ? 'Elder shield is currently disabled'
                  : 'Monitoring WhatsApp, SMS & Phone calls silently'}
              </Text>
            </View>
          </View>
        </View>

        {/* Master Protection Switch */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Shield Protection</Text>
              <Text style={styles.switchHindi}>समग्र धोखाधड़ी सुरक्षा</Text>
            </View>
            <Switch
              value={protectionEnabled}
              onValueChange={toggleProtection}
              trackColor={{ false: '#475569', true: '#22c55e' }}
              thumbColor={protectionEnabled ? '#ffffff' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* Saroj Aunty AI Decoy Switch */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Saroj Auto-Reply Decoy</Text>
              <Text style={styles.switchHindi}>सरोज आंटी एआई डेकॉय (स्कैमर का समय बर्बाद)</Text>
              {autoReplyEnabled && (
                <Text style={styles.activePersonaTag}>
                  💬 Saroj persona ready to engage scammers
                </Text>
              )}
            </View>
            <Switch
              value={autoReplyEnabled}
              onValueChange={toggleAutoReply}
              trackColor={{ false: '#475569', true: '#06b6d4' }}
              thumbColor={autoReplyEnabled ? '#ffffff' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* Permission Badges */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Elder Shield Permissions (अनुमतियाँ)</Text>
          <View style={styles.permList}>
            {/* Notification Access */}
            <TouchableOpacity
              style={styles.permItem}
              onPress={() => SetuNativeModule.openNotificationListenerSettings()}
            >
              <Text style={styles.permIcon}>{hasNotifListener ? '✅' : '❌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.permName}>WhatsApp & SMS Intake</Text>
                <Text style={styles.permDesc}>
                  {hasNotifListener ? 'Granted' : 'Tap to enable Notification Listener'}
                </Text>
              </View>
              {!hasNotifListener && <Text style={styles.fixBtn}>Fix</Text>}
            </TouchableOpacity>

            {/* Overlay Permission */}
            <TouchableOpacity
              style={styles.permItem}
              onPress={() => SetuNativeModule.openOverlaySettings()}
            >
              <Text style={styles.permIcon}>{hasOverlay ? '✅' : '❌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.permName}>Payment App Interlock Overlay</Text>
                <Text style={styles.permDesc}>
                  {hasOverlay ? 'Granted' : 'Tap to enable Display over other apps'}
                </Text>
              </View>
              {!hasOverlay && <Text style={styles.fixBtn}>Fix</Text>}
            </TouchableOpacity>

            {/* Call Screening Role */}
            <TouchableOpacity
              style={styles.permItem}
              onPress={() => SetuNativeModule.requestCallScreeningRole()}
            >
              <Text style={styles.permIcon}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.permName}>Call Screening Protection</Text>
                <Text style={styles.permDesc}>Tap to request Call Screening Role</Text>
              </View>
              <Text style={styles.fixBtn}>Check</Text>
            </TouchableOpacity>

            {/* Battery Optimization */}
            <TouchableOpacity
              style={styles.permItem}
              onPress={() => SetuNativeModule.requestIgnoreBatteryOptimization()}
            >
              <Text style={styles.permIcon}>{hasBatteryOpt ? '✅' : '⚡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.permName}>Background Silent Operation</Text>
                <Text style={styles.permDesc}>
                  {hasBatteryOpt ? 'Optimized' : 'Tap to exempt from battery sleep'}
                </Text>
              </View>
              {!hasBatteryOpt && <Text style={styles.fixBtn}>Exempt</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Stage Controls */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Live Demo Controls (लाइव डेमो)</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnScam]}
              onPress={handleSimulateScam}
            >
              <Text style={styles.demoBtnIcon}>🚨</Text>
              <Text style={styles.demoBtnText}>Simulate Scam Message</Text>
              <Text style={styles.demoBtnSub}>Digital Arrest Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoBtn,
                interlockStatus === 'armed' ? styles.demoBtnRelease : styles.demoBtnArm,
              ]}
              onPress={handleTestInterlock}
            >
              <Text style={styles.demoBtnIcon}>
                {interlockStatus === 'armed' ? '🟢' : '🛑'}
              </Text>
              <Text style={styles.demoBtnText}>
                {interlockStatus === 'armed' ? 'Release Interlock' : 'Test Interlock'}
              </Text>
              <Text style={styles.demoBtnSub}>
                {interlockStatus === 'armed' ? 'Dismiss Overlay' : 'Lock Payment Apps'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Log */}
        <View style={styles.card}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>Activity Log (गतिविधि लॉग)</Text>
            <TouchableOpacity onPress={handleClearLogs}>
              <Text style={styles.clearLogsText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.emptyLog}>No events recorded yet. Ready and monitoring.</Text>
          ) : (
            logs.slice(0, 20).map((item) => (
              <View key={item.id} style={styles.logEntry}>
                <Text style={styles.logTime}>{item.time}</Text>
                <Text
                  style={[
                    styles.logTag,
                    item.tag === 'SAROJ'
                      ? styles.tagSaroj
                      : item.tag === 'INTERLOCK'
                      ? styles.tagInterlock
                      : item.tag === 'CALL'
                      ? styles.tagCall
                      : styles.tagDefault,
                  ]}
                >
                  [{item.tag}]
                </Text>
                <Text style={styles.logMsg} numberOfLines={3}>
                  {item.message}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Backend & Identity Settings Toggle */}
        <TouchableOpacity
          style={styles.settingsToggle}
          onPress={() => setShowSettings(!showSettings)}
        >
          <View style={styles.statusDotRow}>
            <View
              style={[
                styles.healthIndicator,
                backendOnline ? styles.healthGreen : styles.healthRed,
              ]}
            />
            <Text style={styles.settingsToggleText}>
              Backend Config ({backendOnline ? 'Online' : 'Offline / Checking'})
            </Text>
          </View>
          <Text style={styles.settingsChevron}>{showSettings ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Backend Base URL</Text>
            <TextInput
              style={styles.input}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://xxx.trycloudflare.com or http://10.0.2.2:8000"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Team Authorization Token</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="setu-dev-token"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.identityRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Family ID</Text>
                <TextInput
                  style={styles.input}
                  value={familyId}
                  onChangeText={setFamilyId}
                  placeholder="fam_demo_001"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Device ID</Text>
                <Text style={styles.readOnlyText} numberOfLines={1}>
                  {deviceId}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
              <Text style={styles.saveBtnText}>Save & Ping Backend</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 38,
    marginRight: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.2,
  },
  appHindi: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  statusCardSafe: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  statusCardArmed: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  statusCardPaused: {
    backgroundColor: '#334155',
    borderColor: '#64748b',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    fontSize: 28,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusDesc: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  switchHindi: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  activePersonaTag: {
    fontSize: 12,
    color: '#38bdf8',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permList: {
    marginTop: 4,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  permIcon: {
    fontSize: 18,
    width: 28,
  },
  permName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  permDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fixBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: '#0f172a',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBtnScam: {
    backgroundColor: '#b45309',
  },
  demoBtnArm: {
    backgroundColor: '#b91c1c',
  },
  demoBtnRelease: {
    backgroundColor: '#15803d',
  },
  demoBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  demoBtnSub: {
    fontSize: 11,
    color: '#fef3c7',
    marginTop: 2,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearLogsText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyLog: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  logTime: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    marginRight: 6,
  },
  logTag: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  tagSaroj: {
    color: '#38bdf8',
  },
  tagInterlock: {
    color: '#ef4444',
  },
  tagCall: {
    color: '#f59e0b',
  },
  tagDefault: {
    color: '#10b981',
  },
  logMsg: {
    flex: 1,
    fontSize: 13,
    color: '#e2e8f0',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  healthGreen: {
    backgroundColor: '#22c55e',
  },
  healthRed: {
    backgroundColor: '#ef4444',
  },
  settingsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  settingsChevron: {
    fontSize: 14,
    color: '#94a3b8',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    padding: 10,
    fontSize: 14,
  },
  identityRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  readOnlyText: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#64748b',
    padding: 10,
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerSpace: {
    height: 40,
  },
});
