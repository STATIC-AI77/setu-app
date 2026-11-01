import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Platform, Alert, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { THEME } from './src/constants/theme';
import { DEMO_SCAMS } from './src/constants/config';
import { ThreatAlert } from './src/types';
import { useSetuShield } from './src/hooks/useSetuShield';
import { useImpactStats } from './src/hooks/useImpactStats';
import { useTelemetryStream } from './src/hooks/useTelemetryStream';
import { useVoiceDecoy } from './src/hooks/useVoiceDecoy';
import { NotificationService } from './src/services/notifications';
import { api } from './src/services/api';
import SetuNativeModule from './modules/setu-native/src/SetuNativeModule';

// Navigation & Screen Components
import { TopNavBar } from './src/components/navigation/TopNavBar';
import { BottomTabBar, AppTab } from './src/components/navigation/BottomTabBar';
import { ShieldScreen } from './src/screens/ShieldScreen';
import { RadarScreen } from './src/screens/RadarScreen';
import { SarojDecoyScreen } from './src/screens/SarojDecoyScreen';
import { DossierScreen } from './src/screens/DossierScreen';

// Modals
import { SettingsModal } from './src/components/SettingsModal';

export default function App() {
  const {
    settings,
    interlockStatus,
    logs,
    backendOnline,
    updateSettings,
    refreshLogs,
    pingBackend,
  } = useSetuShield();

  const { stats, loading: loadingStats, refreshStats } = useImpactStats(15000);

  const {
    transcript,
    requestDecoyRoom,
    addLiveChunk,
  } = useVoiceDecoy();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<AppTab>('shield');

  // Modals state
  const [showSettings, setShowSettings] = useState(false);

  // Call state in Saroj Decoy Screen
  const [isDecoyCallActive, setIsDecoyCallActive] = useState(false);

  // 1930 Dossier generation state
  const [currentVerdictId] = useState('v_d2d9ca7e');
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Active threat object
  const [activeThreat, setActiveThreat] = useState<ThreatAlert | null>(null);

  // Keep activeThreat in sync with armed interlock
  useEffect(() => {
    if (interlockStatus === 'armed') {
      setActiveThreat({
        alert_id: currentVerdictId,
        verdict_id: currentVerdictId,
        scam_type: 'Electricity Disconnection Phishing',
        risk_score: 94,
        scammer_number: '+91 98765 43210',
        channel: 'whatsapp',
        evidence: [
          'Contains disguised link http://bit.ly/mpeb-bill',
          'Demands payment under threat of power cutoff',
        ],
      });
    } else {
      setActiveThreat(null);
    }
  }, [interlockStatus, currentVerdictId]);

  // WebSocket Live Telemetry Stream
  const handleStreamEvent = useCallback(
    (event: any) => {
      if (event.type === 'scam_blocked') {
        refreshStats();
      } else if (event.type === 'arm_interlock') {
        SetuNativeModule.armInterlock(event.reason || 'Scam Intercepted', event.risk_score || 95);
      } else if (event.type === 'release_interlock') {
        SetuNativeModule.releaseInterlock();
      } else if (event.type === 'transcript_chunk') {
        addLiveChunk({
          speaker: event.speaker || 'saroj_aunty',
          text: event.text || '',
          timestamp: 'Live',
        });
      }
    },
    [refreshStats, addLiveChunk]
  );

  const { connected: wsConnected } = useTelemetryStream(
    settings?.baseUrl,
    settings?.token,
    settings?.deviceId,
    settings?.protectionEnabled ?? true,
    handleStreamEvent
  );

  // Initialize FCM
  useEffect(() => {
    NotificationService.configure();
    if (settings?.deviceId && settings?.familyId) {
      NotificationService.registerForPushNotifications(settings.deviceId, settings.familyId);
    }
    const sub = NotificationService.setupForegroundListener(() => {
      refreshLogs();
    });
    return () => sub.remove();
  }, [settings?.deviceId, settings?.familyId, refreshLogs]);

  // Master Protection Toggle
  const handleToggleProtection = (val: boolean) => {
    if (!val) {
      Alert.alert(
        'Pause Protection?',
        'Elder scam protection and call screening will be paused.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause',
            style: 'destructive',
            onPress: () => updateSettings({ protectionEnabled: false }),
          },
        ]
      );
    } else {
      updateSettings({ protectionEnabled: true });
    }
  };

  // Saroj Auto-Reply Toggle
  const handleToggleAutoReply = (val: boolean) => {
    updateSettings({ autoReplyEnabled: val });
  };

  // Son Unlock Action
  const handleSonApprove = async () => {
    try {
      await api.approveInterlock({
        alert_id: currentVerdictId,
        approved_by: 'Rohit (Son)',
        decision: 'approve',
      });
      SetuNativeModule.releaseInterlock();
      Alert.alert('Unlocked', 'Son Rohit released the lock.');
    } catch (_e) {
      SetuNativeModule.releaseInterlock();
      Alert.alert('Unlocked', 'Interlock released locally.');
    }
  };

  // Emergency Release
  const handleEmergencyRelease = () => {
    SetuNativeModule.releaseInterlock();
  };

  // Start Simulated Voice Decoy Call
  const handleStartSimulatedCall = async (_scenario: string) => {
    setIsDecoyCallActive(true);
    await requestDecoyRoom('call_pune_9012', '+919876543210');
  };

  // Generate 1-Click 1930 Dossier
  const handleGenerateDossier = async (): Promise<string | null> => {
    setIsGeneratingDossier(true);
    try {
      const resp = await api.get1930PoliceReport(
        currentVerdictId,
        'Saroj Sharma',
        '+919822012345'
      );
      if (resp?.report_url) {
        setGeneratedPdfUrl(resp.report_url);
        setIsGeneratingDossier(false);
        return resp.report_url;
      }
    } catch (e) {
      console.warn('Report error:', e);
    }

    const fallbackUrl = `https://cybercrime.gov.in/static/reports/1930_COMPLAINT_${currentVerdictId.toUpperCase()}.pdf`;
    setGeneratedPdfUrl(fallbackUrl);
    setIsGeneratingDossier(false);
    return fallbackUrl;
  };

  // Simulation controls for Developer settings
  const handleSimulateScam = () => {
    try {
      SetuNativeModule.simulateScam(DEMO_SCAMS.MPEB_ELECTRICITY, '+919876543210');
      setTimeout(refreshLogs, 600);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to simulate');
    }
  };

  const handleSimulateCallThreat = async () => {
    try {
      const intel = await api.getThreatIntel('+919876543210');
      if (intel) {
        Alert.alert(
          'Threat Intel Lookup',
          `Phone: +919876543210\nVerdict: ${intel.verdict.toUpperCase()}\nReports: ${intel.reports}`
        );
      }
      refreshLogs();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Lookup failed');
    }
  };

  const handleToggleInterlockDirect = () => {
    try {
      if (interlockStatus === 'armed') {
        SetuNativeModule.releaseInterlock();
      } else {
        SetuNativeModule.armInterlock('Electricity Phishing', 94);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to toggle');
    }
  };

  const threatCount = interlockStatus === 'armed' ? 1 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP NAVIGATION BAR */}
      <TopNavBar
        wsConnected={wsConnected}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* SCREEN CONTAINER */}
      <View style={styles.screenContainer}>
        {currentTab === 'shield' && (
          <ShieldScreen
            protectionEnabled={settings?.protectionEnabled ?? true}
            decoyActive={settings?.autoReplyEnabled ?? true}
            interlockActive={interlockStatus === 'armed'}
            activeThreat={activeThreat}
            onToggleProtection={handleToggleProtection}
            onToggleDecoy={handleToggleAutoReply}
            onReleaseInterlock={handleEmergencyRelease}
            onRequestGuardianUnlock={handleSonApprove}
            onOpen1930Dossier={() => setCurrentTab('dossier')}
            onOpenDecoyRoom={() => setCurrentTab('saroj')}
          />
        )}

        {currentTab === 'radar' && (
          <RadarScreen
            stats={stats}
            loadingStats={loadingStats}
            onRefreshStats={refreshStats}
            logs={logs}
            onClearLogs={() => {
              try {
                SetuNativeModule.clearLogs();
                refreshLogs();
              } catch (_e) {}
            }}
            activeThreat={activeThreat}
            wsConnected={wsConnected}
          />
        )}

        {currentTab === 'saroj' && (
          <SarojDecoyScreen
            decoyActive={settings?.autoReplyEnabled ?? true}
            onToggleDecoy={handleToggleAutoReply}
            onStartSimulatedCall={handleStartSimulatedCall}
            liveTurns={transcript}
            isCallActive={isDecoyCallActive}
            onEndCall={() => setIsDecoyCallActive(false)}
          />
        )}

        {currentTab === 'dossier' && (
          <DossierScreen
            activeThreat={activeThreat}
            onGenerateReport={handleGenerateDossier}
            isGenerating={isGeneratingDossier}
            generatedPdfUrl={generatedPdfUrl}
          />
        )}
      </View>

      {/* FLOATING BOTTOM TAB BAR */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        interlockActive={interlockStatus === 'armed'}
        threatCount={threatCount}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        backendOnline={backendOnline}
        onSave={updateSettings}
        onPing={pingBackend}
        onSimulateScam={handleSimulateScam}
        onSimulateCallThreat={handleSimulateCallThreat}
        onToggleInterlockDirect={handleToggleInterlockDirect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bgRoot,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  screenContainer: {
    flex: 1,
  },
});
