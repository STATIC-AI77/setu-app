import { NativeModule, requireNativeModule } from 'expo';

declare class SetuNativeModule extends NativeModule<{}> {
  getGreeting(): string;
  checkNotificationListenerPermission(): boolean;
  openNotificationListenerSettings(): void;
  checkOverlayPermission(): boolean;
  openOverlaySettings(): void;
  checkBatteryOptimizationPermission(): boolean;
  requestIgnoreBatteryOptimization(): void;
  requestCallScreeningRole(): void;
  armInterlock(scamType: string, riskScore: number): void;
  releaseInterlock(): void;
  isInterlockArmed(): boolean;
  updateConfig(
    baseUrl: string,
    token: string,
    deviceId: string,
    familyId: string,
    protection: boolean,
    autoReply: boolean
  ): void;
  getRecentLogs(): string;
  clearLogs(): void;
  simulateScam(scamText: string, sender: string): void;
}

export default requireNativeModule<SetuNativeModule>('SetuNative');
