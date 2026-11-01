import { useState, useEffect } from 'react';
import { streamService } from '../services/websocket';
import { StreamEvent } from '../types';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

export function useTelemetryStream(
  baseUrl?: string,
  token?: string,
  deviceId?: string,
  enabled: boolean = true,
  onEvent?: (event: StreamEvent) => void
) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !baseUrl || !token || !deviceId) {
      streamService.disconnect();
      return;
    }

    const unsubStatus = streamService.onStatusChange(setConnected);
    const unsubMsg = streamService.onMessage((msg) => {
      if (msg.type === 'arm_interlock') {
        const risk = msg.risk_score ? Math.round(msg.risk_score * 100) : 92;
        SetuNativeModule.armInterlock(msg.scam_type || 'Active Scam', risk);
      } else if (msg.type === 'release_interlock') {
        SetuNativeModule.releaseInterlock();
      }
      onEvent?.(msg);
    });

    streamService.connect(baseUrl, token, deviceId);

    return () => {
      unsubStatus();
      unsubMsg();
      streamService.disconnect();
    };
  }, [baseUrl, token, deviceId, enabled, onEvent]);

  return { connected };
}
