import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Platform, Alert, View, Linking, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { THEME } from './src/constants/theme';
import { DEMO_SCAMS } from './src/constants/config';
import { ThreatAlert } from './src/types';
import { useSetuShield } from './src/hooks/useSetuShield';
import { useImpactStats } from './src/hooks/useImpactStats';
import { useTelemetryStream } from './src/hooks/useTelemetryStream';
import { useVoiceDecoy } from './src/hooks/useVoiceDecoy';
import { NotificationService } from './src/services/notifications';
import { scamAlertListener } from './src/services/scamAlertListener';
import { api } from './src/services/api';
import { supabase } from './src/services/supabase';
import SetuNativeModule from './modules/setu-native/src/SetuNativeModule';

// Navigation & Screen Components
import { TopNavBar } from './src/components/navigation/TopNavBar';
import { BottomTabBar, AppTab } from './src/components/navigation/BottomTabBar';
import { ShieldScreen } from './src/screens/ShieldScreen';
import { RadarScreen } from './src/screens/RadarScreen';
import { SarojDecoyScreen } from './src/screens/SarojDecoyScreen';
import { DossierScreen } from './src/screens/DossierScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CallSimulatorScreen } from './src/screens/CallSimulatorScreen';
import { IncomingCallScreen } from './src/screens/IncomingCallScreen';

// Modals
import { SettingsModal } from './src/components/SettingsModal';
import { EmergencyPanicModal } from './src/components/EmergencyPanicModal';

export default function App() {
  // Supabase Google OAuth & User Session State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
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

  const voiceDecoy = useVoiceDecoy();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<AppTab>('shield');

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);

  // Incoming call state
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{
    callId: string;
    scammerNumber: string;
    scamScenario: string;
  } | null>(null);

  // 1930 Dossier generation state
  const [currentVerdictId] = useState('v_d2d9ca7e');
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [localPdfPath, setLocalPdfPath] = useState<string | null>(null);

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

  // Supabase Google OAuth & Session Manager
  useEffect(() => {
    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        api.setAuthToken(session.access_token);
      }
      setCheckingAuth(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        api.setAuthToken(session.access_token);
      } else {
        setCurrentUser(null);
        api.setAuthToken(null);
      }
      setCheckingAuth(false);
    });

    // 3. Deep link handler for Google OAuth redirect callback
    const handleUrl = async (event: { url: string }) => {
      const url = event.url;
      if (url && (url.includes('access_token') || url.includes('#') || url.includes('refresh_token'))) {
        try {
          const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (data?.session?.user) {
              setCurrentUser(data.session.user);
              api.setAuthToken(data.session.access_token);
            }
          }
        } catch (_e) {}
      }
    };

    const linkSub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  // WebSocket Live Telemetry Stream
  const handleStreamEvent = useCallback(
    (event: any) => {
      if (event.type === 'scam_blocked') {
        refreshStats();
      } else if (event.type === 'arm_interlock') {
        SetuNativeModule.armInterlock(event.reason || 'Scam Intercepted', event.risk_score || 95);
      } else if (event.type === 'release_interlock') {
        SetuNativeModule.releaseInterlock();
      } else if (event.type === 'scam_call_detected') {
        scamAlertListener.triggerRedWarningNotification(event);
        setActiveThreat({
          alert_id: event.alert_id || currentVerdictId,
          verdict_id: event.alert_id || currentVerdictId,
          scam_type: event.scam_type || 'Scam Call Detected',
          risk_score: event.risk_score ? (event.risk_score <= 1.0 ? Math.round(event.risk_score * 100) : Math.round(event.risk_score)) : 95,
          scammer_number: event.caller_number || event.scammer_number || '+91 Scam Caller',
          channel: 'call',
          evidence: [
            event.message || 'Scam call detected by Setu AI Guard',
          ],
        });
        refreshStats();
        refreshLogs();
      } else if (event.type === 'transcript_chunk') {
        voiceDecoy.addLiveChunk({
          speaker: event.speaker || 'saroj_aunty',
          text: event.text || '',
          timestamp: 'Live',
          stt_ms: event.stt_ms,
          llm_ms: event.llm_ms,
          threat_level: event.threat_level,
        });
      }
    },
    [refreshStats, voiceDecoy]
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

  // Public Scam Call Webhook & SSE Listener
  useEffect(() => {
    if (settings?.baseUrl && settings?.protectionEnabled !== false) {
      scamAlertListener.startListening(settings.baseUrl, (alert) => {
        setActiveThreat({
          alert_id: alert.alert_id,
          verdict_id: alert.alert_id,
          scam_type: alert.scam_type,
          risk_score: alert.risk_score || 95,
          scammer_number: alert.caller_number,
          channel: 'call',
          evidence: [
            alert.message,
            'Live voice scam detected by AI audio monitor',
          ],
        });
        refreshStats();
        refreshLogs();
      });
    }
    return () => {
      scamAlertListener.stopListening();
    };
  }, [settings?.baseUrl, settings?.protectionEnabled, refreshStats, refreshLogs]);

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

  // Sign Out handler
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (_e) {}
            setCurrentUser(null);
            api.setAuthToken(null);
          },
        },
      ]
    );
  };

  // Generate 1-Click 1930 Dossier from Real Backend and Save Locally
  const handleGenerateDossier = async (
    customVerdictId?: string
  ): Promise<{ pdfUrl: string; localPath?: string } | null> => {
    setIsGeneratingDossier(true);
    const targetVerdictId = customVerdictId || currentVerdictId;
    try {
      const resp = await api.get1930PoliceReport(
        targetVerdictId,
        'Saroj Sharma',
        '+919822012345'
      );
      const url = resp?.pdf_url || resp?.report_url;
      if (url) {
        setGeneratedPdfUrl(url);
        let savedPath: string | undefined;
        try {
          const fname = resp.filename || `1930_COMPLAINT_${targetVerdictId}.pdf`;
          savedPath = await SetuNativeModule.downloadAndSavePdf(url, fname);
          setLocalPdfPath(savedPath);
        } catch (downloadErr) {
          console.warn('Local PDF download warning:', downloadErr);
        }
        setIsGeneratingDossier(false);
        return { pdfUrl: url, localPath: savedPath };
      }
    } catch (e) {
      console.warn('Report error:', e);
    }

    setIsGeneratingDossier(false);
    Alert.alert('Error', 'Unable to fetch 1930 Dossier from backend. Please verify network connection.');
    return null;
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

  // Trigger incoming scam call simulation
  const handleTriggerScamCall = async (scenario: string, scammerNumber: string) => {
    try {
      // Call backend to trigger incoming call
      const response = await api.post<any>('/chat/trigger-scam-call', {
        scammer_number: scammerNumber,
        scam_scenario: scenario,
        auto_answer_if_decoy_active: settings?.autoReplyEnabled ?? true,
        device_id: settings?.deviceId,
      });

      if (response?.call_id) {
        // Simulate 2-second delay for realistic phone ring
        setTimeout(() => {
          setIncomingCallData({
            callId: response.call_id,
            scammerNumber: scammerNumber,
            scamScenario: scenario,
          });
          setShowIncomingCall(true);
        }, 2000);

        Alert.alert('Call Triggered', 'Your phone will ring in 2 seconds...');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to trigger scam call');
    }
  };

  // Handle incoming call acceptance
  const handleAcceptCall = async () => {
    setShowIncomingCall(false);
    
    if (!incomingCallData) return;

    // If decoy is active: auto-route to AI
    if (settings?.autoReplyEnabled) {
      // Start voice decoy call with AI
      await voiceDecoy.startCall(incomingCallData.scamScenario, incomingCallData.scammerNumber);
      setCurrentTab('saroj'); // Navigate to decoy screen
    } else {
      // Manual mode: start normal WebRTC call (user talks directly)
      await voiceDecoy.startCall(incomingCallData.scamScenario, incomingCallData.scammerNumber);
      setCurrentTab('saroj'); // Navigate to decoy screen for manual interaction
    }
  };

  // Handle incoming call rejection
  const handleRejectCall = () => {
    setShowIncomingCall(false);
    setIncomingCallData(null);
    Alert.alert('Call Rejected', 'Scam call was blocked and reported.');
  };

  const threatCount = interlockStatus === 'armed' ? 1 : 0;

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07090E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  // Any unauthenticated user must log in first
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />
      </SafeAreaView>
    );
  }

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
            onLogout={handleLogout}
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
            onGenerateDossier={handleGenerateDossier}
          />
        )}

        {currentTab === 'saroj' && (
          <SarojDecoyScreen
            decoyActive={settings?.autoReplyEnabled ?? true}
            onToggleDecoy={handleToggleAutoReply}
            voiceDecoy={voiceDecoy}
          />
        )}

        {currentTab === 'call' && (
          <CallSimulatorScreen
            onTriggerScamCall={handleTriggerScamCall}
          />
        )}

        {currentTab === 'dossier' && (
          <DossierScreen
            activeThreat={activeThreat}
            onGenerateReport={handleGenerateDossier}
            isGenerating={isGeneratingDossier}
            generatedPdfUrl={generatedPdfUrl}
            localPdfPath={localPdfPath}
          />
        )}
      </View>

      {/* FLOATING BOTTOM TAB BAR WITH CENTER PANIC BUTTON */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        interlockActive={interlockStatus === 'armed'}
        threatCount={threatCount}
        onPressPanic={() => setShowPanicModal(true)}
      />

      {/* EMERGENCY PANIC MODAL */}
      <EmergencyPanicModal
        visible={showPanicModal}
        onClose={() => setShowPanicModal(false)}
        onNavigateHelpline={() => {
          setShowPanicModal(false);
          setCurrentTab('dossier');
        }}
        onArmInterlock={() => {
          refreshLogs();
          refreshStats();
        }}
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

      {/* INCOMING SCAM CALL SCREEN (FULL-SCREEN OVERLAY) */}
      {showIncomingCall && incomingCallData && (
        <View style={StyleSheet.absoluteFill}>
          <IncomingCallScreen
            scammerNumber={incomingCallData.scammerNumber}
            scamScenario={incomingCallData.scamScenario}
            callId={incomingCallData.callId}
            decoyActive={settings?.autoReplyEnabled ?? false}
            autoAnswer={settings?.autoReplyEnabled ?? false}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        </View>
      )}
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
