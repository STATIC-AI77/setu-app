import { useState, useEffect, useCallback } from 'react';
import { AppSettings, LogItem } from '../types';
import { StorageService } from '../services/storage';
import { api } from '../services/api';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

export function useSetuShield() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [interlockStatus, setInterlockStatus] = useState<'idle' | 'armed' | 'released'>('idle');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [hasNotifListener, setHasNotifListener] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasBatteryOpt, setHasBatteryOpt] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const syncToNative = useCallback((cfg: AppSettings) => {
    try {
      SetuNativeModule.updateConfig(
        cfg.baseUrl,
        cfg.token,
        cfg.deviceId,
        cfg.familyId,
        cfg.protectionEnabled,
        cfg.autoReplyEnabled
      );
    } catch (_e) {}
  }, []);

  const refreshPermissions = useCallback(() => {
    try {
      setHasNotifListener(SetuNativeModule.checkNotificationListenerPermission());
      setHasOverlay(SetuNativeModule.checkOverlayPermission());
      setHasBatteryOpt(SetuNativeModule.checkBatteryOptimizationPermission());
    } catch (_e) {}
  }, []);

  const refreshLogs = useCallback(() => {
    try {
      const logsJson = SetuNativeModule.getRecentLogs();
      if (logsJson) {
        setLogs(JSON.parse(logsJson) as LogItem[]);
      }
    } catch (_e) {}
  }, []);

  const refreshInterlock = useCallback(() => {
    try {
      const armed = SetuNativeModule.isInterlockArmed();
      setInterlockStatus(armed ? 'armed' : 'idle');
    } catch (_e) {}
  }, []);

  const pingBackend = useCallback(async () => {
    const isUp = await api.checkHealth();
    setBackendOnline(isUp);
    return isUp;
  }, []);

  useEffect(() => {
    async function init() {
      const loaded = await StorageService.loadSettings();
      setSettings(loaded);
      api.updateCredentials(loaded.baseUrl, loaded.token);
      syncToNative(loaded);
      pingBackend();
      refreshPermissions();
      refreshLogs();
      refreshInterlock();
    }
    init();

    const interval = setInterval(() => {
      refreshPermissions();
      refreshLogs();
      refreshInterlock();
    }, 2000);

    return () => clearInterval(interval);
  }, [syncToNative, pingBackend, refreshPermissions, refreshLogs, refreshInterlock]);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      if (!settings) return;
      const updated = { ...settings, ...partial };
      setSettings(updated);
      await StorageService.saveSettings(partial);
      api.updateCredentials(updated.baseUrl, updated.token);
      syncToNative(updated);
      pingBackend();
    },
    [settings, syncToNative, pingBackend]
  );

  return {
    settings,
    interlockStatus,
    logs,
    hasNotifListener,
    hasOverlay,
    hasBatteryOpt,
    backendOnline,
    updateSettings,
    refreshLogs,
    refreshPermissions,
    pingBackend,
  };
}
