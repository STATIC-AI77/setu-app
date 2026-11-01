import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { DEFAULT_CONFIG } from '../constants/config';

const KEYS = {
  BASE_URL: 'setu_base_url',
  TOKEN: 'setu_token',
  DEVICE_ID: 'setu_device_id',
  FAMILY_ID: 'setu_family_id',
  PROTECTION: 'setu_protection',
  AUTO_REPLY: 'setu_auto_reply',
};

export class StorageService {
  static async loadSettings(): Promise<AppSettings> {
    try {
      const [baseUrl, token, deviceId, familyId, protection, autoReply] = await Promise.all([
        AsyncStorage.getItem(KEYS.BASE_URL),
        AsyncStorage.getItem(KEYS.TOKEN),
        AsyncStorage.getItem(KEYS.DEVICE_ID),
        AsyncStorage.getItem(KEYS.FAMILY_ID),
        AsyncStorage.getItem(KEYS.PROTECTION),
        AsyncStorage.getItem(KEYS.AUTO_REPLY),
      ]);

      let devId = deviceId;
      if (!devId) {
        devId = DEFAULT_CONFIG.DEFAULT_DEVICE_ID;
        await AsyncStorage.setItem(KEYS.DEVICE_ID, devId);
      }

      let effectiveUrl: string =
        baseUrl && baseUrl !== 'http://10.0.2.2:8000' && !baseUrl.includes('trycloudflare.com')
          ? baseUrl
          : DEFAULT_CONFIG.BASE_URL;
      if (effectiveUrl !== baseUrl) {
        await AsyncStorage.setItem(KEYS.BASE_URL, effectiveUrl);
      }

      return {
        baseUrl: effectiveUrl,
        token: token || DEFAULT_CONFIG.TEAM_TOKEN,
        deviceId: devId,
        familyId: familyId || DEFAULT_CONFIG.FAMILY_ID,
        protectionEnabled: protection !== null ? protection === 'true' : true,
        autoReplyEnabled: autoReply !== null ? autoReply === 'true' : true,
      };
    } catch (_e) {
      return {
        baseUrl: DEFAULT_CONFIG.BASE_URL,
        token: DEFAULT_CONFIG.TEAM_TOKEN,
        deviceId: DEFAULT_CONFIG.DEFAULT_DEVICE_ID,
        familyId: DEFAULT_CONFIG.FAMILY_ID,
        protectionEnabled: true,
        autoReplyEnabled: true,
      };
    }
  }

  static async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const promises: Promise<void>[] = [];
    if (settings.baseUrl !== undefined) promises.push(AsyncStorage.setItem(KEYS.BASE_URL, settings.baseUrl));
    if (settings.token !== undefined) promises.push(AsyncStorage.setItem(KEYS.TOKEN, settings.token));
    if (settings.familyId !== undefined) promises.push(AsyncStorage.setItem(KEYS.FAMILY_ID, settings.familyId));
    if (settings.protectionEnabled !== undefined)
      promises.push(AsyncStorage.setItem(KEYS.PROTECTION, settings.protectionEnabled ? 'true' : 'false'));
    if (settings.autoReplyEnabled !== undefined)
      promises.push(AsyncStorage.setItem(KEYS.AUTO_REPLY, settings.autoReplyEnabled ? 'true' : 'false'));
    await Promise.all(promises);
  }
}
