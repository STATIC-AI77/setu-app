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
  showRedScamNotification(title: string, message: string, scamType: string, sender: string): void;
  simulateScam(scamText: string, sender: string): void;
  startSpeechRecognition(): Promise<string>;
  stopSpeechRecognition(): void;
  speakAsSaroj(text: string): Promise<boolean>;
  stopSpeaking(): void;
  playAudio(audioSource: string): Promise<boolean>;
  stopAudio(): void;
  downloadAndSavePdf(pdfUrl: string, filename: string): Promise<string>;
  openPdf(pathOrUrl: string): Promise<boolean>;
  copyToClipboard(text: string): void;
  forceSpeakerphone(): Promise<boolean>;
  clearAudioRouting(): Promise<boolean>;
}

export default requireNativeModule<SetuNativeModule>('SetuNative');
