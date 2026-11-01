import * as Notifications from 'expo-notifications';
import { api } from './api';
import SetuNativeModule from '../../modules/setu-native/src/SetuNativeModule';

export class NotificationService {
  static configure() {
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
  }

  static async registerForPushNotifications(deviceId: string, familyId: string): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();
      if (tokenData?.data) {
        await api.register({
          device_id: deviceId,
          fcm_token: tokenData.data,
          family_id: familyId,
        });
        return tokenData.data;
      }
      return null;
    } catch (_e) {
      return null;
    }
  }

  static setupForegroundListener(onInterlockTrigger?: (cmd: string) => void) {
    return Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data && typeof data === 'object') {
        const cmd = (data as any).cmd;
        if (cmd === 'arm_interlock') {
          const scamType = typeof (data as any).scam_type === 'string' ? (data as any).scam_type : 'Active Scam';
          const riskScore = typeof (data as any).risk_score === 'number' ? (data as any).risk_score : 90;
          SetuNativeModule.armInterlock(scamType, riskScore);
          onInterlockTrigger?.('arm_interlock');
        } else if (cmd === 'release_interlock') {
          SetuNativeModule.releaseInterlock();
          onInterlockTrigger?.('release_interlock');
        }
      }
    });
  }
}
