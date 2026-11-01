declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_TEAM_TOKEN?: string;
      EXPO_PUBLIC_FAMILY_ID?: string;
      EXPO_PUBLIC_DEVICE_ID?: string;
      EXPO_PUBLIC_FALLBACK_URL?: string;
    }
  }
}

export {};
