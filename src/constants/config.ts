export const DEFAULT_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://setu-backend.kintree.space',
  TEAM_TOKEN: process.env.EXPO_PUBLIC_TEAM_TOKEN || 'setu-dev-token',
  FAMILY_ID: process.env.EXPO_PUBLIC_FAMILY_ID || 'fam_pune_9823',
  DEFAULT_DEVICE_ID: process.env.EXPO_PUBLIC_DEVICE_ID || 'elder_pixel_6a_01',
  FALLBACK_URL:
    process.env.EXPO_PUBLIC_FALLBACK_URL ||
    'https://remix-boston-took-considering.trycloudflare.com',
  TIMEOUTS: {
    DETECT_MS: 12000,
    DECOY_REPLY_MS: 8000,
    THREAT_INTEL_MS: 1500,
    TELEMETRY_MS: 6000,
    HEALTH_MS: 3000,
  },
};

export const PAYMENT_APPS = [
  'com.phonepe.app',
  'com.google.android.apps.nbu.paisa.user',
  'net.one97.paytm',
  'in.org.npci.upiapp',
  'com.sbi.upi',
  'com.icicibank.pockets',
  'com.bankofbaroda.upi',
  'com.hdfcbank.payzapp',
];

export const DEMO_SCAMS = {
  MPEB_ELECTRICITY:
    'Aapka electricity bill overdue hai, turant update karein warna power cut ho jayega tonight at 9PM. Link: http://bit.ly/mpeb-bill',
  DIGITAL_ARREST:
    'URGENT: This is Inspector Sharma from CBI Crime Branch Delhi. A money laundering case is registered in your Aadhaar. Digital arrest warrant issued. Transfer Rs 45,000 to safety verification RBI account immediately.',
  BANK_KYC:
    'Dear SBI Customer, your YONO account will be blocked today due to pending KYC verification. Please click here to verify immediately: https://sbi-kyc-update.com/login',
};
