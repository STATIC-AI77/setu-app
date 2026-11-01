import * as Notifications from 'expo-notifications';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

export interface ScamCallAlert {
  event: string;
  type?: string;
  alert_id: string;
  timestamp: string;
  caller_number: string;
  scam_type: string;
  risk_score: number;
  title: string;
  message: string;
  severity: string;
  color?: string;
  action?: string;
  [key: string]: any;
}

class ScamAlertListenerService {
  private activeBaseUrl: string | null = null;
  private isListening: boolean = false;
  private lastAlertId: string | null = null;
  private sseAbortController: AbortController | null = null;
  private onAlertCallbacks: Set<(alert: ScamCallAlert) => void> = new Set();
  private processedAlertIds: Set<string> = new Set();

  /**
   * Displays the standard Android system warning notification banner in the notification bar.
   * NEVER opens a full screen red takeover overlay.
   */
  public async triggerRedWarningNotification(alert: ScamCallAlert) {
    if (!alert?.alert_id || this.processedAlertIds.has(alert.alert_id)) {
      return;
    }
    this.processedAlertIds.add(alert.alert_id);
    this.lastAlertId = alert.alert_id;

    const title = alert.title || '🚨 DANGER: SCAM CALL DETECTED';
    const message = alert.message || `Suspicious scam call detected from ${alert.caller_number}. Do NOT pay or share OTP!`;
    const scamType = alert.scam_type || 'Fraud Extortion';
    const caller = alert.caller_number || '+91 Scam Caller';

    // 1. Native Android notification banner with Color.RED
    try {
      SetuNativeModule.showRedScamNotification(title, message, scamType, caller);
    } catch (_e) {}

    // 2. Expo Notifications banner with red accent color #E53935
    try {
      await Notifications.setNotificationChannelAsync('critical_scam_alerts', {
        name: 'Setu Scam Warnings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#E53935',
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          color: '#E53935',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 500, 200, 500],
          data: {
            alert_id: alert.alert_id,
            scam_type: alert.scam_type,
            caller_number: alert.caller_number,
            risk_score: alert.risk_score,
          },
        },
        trigger: null,
      });
    } catch (_e) {}

    // 3. Notify React state listeners
    this.onAlertCallbacks.forEach((cb) => {
      try {
        cb(alert);
      } catch (_e) {}
    });
  }

  /**
   * Starts listening to the backend's public alert stream:
   * GET /alerts/stream
   */
  public startListening(baseUrl: string, callback?: (alert: ScamCallAlert) => void) {
    if (callback) {
      this.onAlertCallbacks.add(callback);
    }

    if (this.isListening && this.activeBaseUrl === baseUrl) {
      return;
    }

    this.stopListening();
    this.isListening = true;
    this.activeBaseUrl = baseUrl;

    // Seed lastAlertId from current latest alert so old historical alerts are NEVER re-notified
    this.seedInitialAlertId(baseUrl);

    // Connect to live SSE stream
    this.connectSseStream(baseUrl);
  }

  public stopListening() {
    this.isListening = false;
    if (this.sseAbortController) {
      this.sseAbortController.abort();
      this.sseAbortController = null;
    }
  }

  private async seedInitialAlertId(baseUrl: string) {
    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/alerts/latest`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.alert_id) {
          // Mark already existing alert as processed so it will NOT trigger spam
          this.lastAlertId = data.alert_id;
          this.processedAlertIds.add(data.alert_id);
        }
      }
    } catch (_e) {}
  }

  private async connectSseStream(baseUrl: string) {
    if (!this.isListening) return;

    this.sseAbortController = new AbortController();
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const streamUrl = `${cleanUrl}/alerts/stream`;

    try {
      const response = await fetch(streamUrl, {
        headers: { Accept: 'text/event-stream' },
        signal: this.sseAbortController.signal,
      });

      if (!response.ok || !response.body) {
        return;
      }

      const reader = (response.body as any).getReader?.();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (this.isListening) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const dataLine = block
            .split('\n')
            .find((l) => l.startsWith('data:'));
          if (dataLine) {
            try {
              const jsonStr = dataLine.replace(/^data:\s*/, '').trim();
              const payload = JSON.parse(jsonStr);
              // Handle both scam_call_detected and incoming_scam_call events
              if (
                payload &&
                (payload.event === 'scam_call_detected' || 
                 payload.type === 'scam_call_detected' ||
                 payload.event === 'incoming_scam_call' ||
                 payload.event_type === 'incoming_scam_call') &&
                payload.alert_id &&
                !this.processedAlertIds.has(payload.alert_id)
              ) {
                await this.triggerRedWarningNotification(payload);
              }
            } catch (_e) {}
          }
        }
      }
    } catch (_e) {
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening && this.activeBaseUrl) {
            this.connectSseStream(this.activeBaseUrl);
          }
        }, 5000);
      }
    }
  }

  public registerCallback(cb: (alert: ScamCallAlert) => void) {
    this.onAlertCallbacks.add(cb);
    return () => {
      this.onAlertCallbacks.delete(cb);
    };
  }
}

export const scamAlertListener = new ScamAlertListenerService();
