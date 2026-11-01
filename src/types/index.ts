/**
 * 🛡️ Setu Guardian Domain & API Types
 */

export interface DetectRequest {
  channel: 'whatsapp' | 'sms';
  sender: string;
  content: string;
  media_url?: string | null;
  device_id: string;
  ts: string;
}

export interface DetectResponse {
  verdict_id: string;
  is_scam: boolean;
  scam_type: string;
  risk_score: number;
  evidence: string[];
  action: 'ignore' | 'alert' | 'arm_interlock' | 'auto_reject';
  extracted_intel: {
    urls: string[];
    phones: string[];
    upi_ids: string[];
    accounts: string[];
  };
  engine: string;
}

export interface DecoyReplyRequest {
  conversation_id?: string | null;
  scammer_number: string;
  history: Array<{ role: 'scammer' | 'saroj'; text: string }>;
  latest_message: string;
  scam_type?: string;
}

export interface DecoyReplyResponse {
  reply: string;
  persona: string;
  turn_number: number;
  intent: string;
  extracted_intel: Record<string, any>;
}

export interface ThreatIntelResponse {
  phone: string;
  known_scam: boolean;
  reports: number;
  last_seen?: string | null;
  scam_types: string[];
  verdict: 'auto_reject' | 'allow' | string;
}

export interface TelemetryEvent {
  event_type:
    | 'notification_read'
    | 'auto_reply_sent'
    | 'interlock_shown'
    | 'interlock_released'
    | 'payment_app_opened'
    | 'scam_blocked';
  device_id: string;
  ts: string;
  payload: Record<string, any>;
}

export interface RegisterRequest {
  device_id: string;
  fcm_token: string;
  family_id: string;
}

export interface RegisterResponse {
  status: string;
  device_id: string;
  family_id: string;
}

export interface InterlockApproveRequest {
  alert_id: string;
  approved_by: string;
  decision: 'approve' | 'deny';
}

export interface InterlockApproveResponse {
  status: string;
  alert_id: string;
  approved_by: string;
}

export interface LiveKitTokenRequest {
  call_id: string;
  scammer_number: string;
  participant_name: string;
}

export interface LiveKitTokenResponse {
  token: string;
  livekit_url: string;
  room: string;
  call_id: string;
}

export interface TranscriptTurn {
  speaker: 'scammer' | 'saroj_aunty';
  text: string;
  timestamp?: string;
  stt_ms?: number;
  llm_ms?: number;
  tts_ms?: number;
}

export interface CallTranscriptResponse {
  call_id: string;
  turns: TranscriptTurn[];
  total_turns: number;
}

export interface Police1930ReportResponse {
  status: string;
  report_id: string;
  filename: string;
  report_url: string;
}

export interface ImpactStats {
  time_wasted_min: number;
  money_saved_inr: number;
  mule_accounts_exposed: number;
  scam_calls_blocked: number;
  scam_messages_blocked: number;
  weekly_trend?: number[];
}

export interface StreamEvent {
  type:
    | 'risk_update'
    | 'arm_interlock'
    | 'release_interlock'
    | 'scam_blocked'
    | 'transcript_chunk'
    | string;
  call_id?: string;
  alert_id?: string;
  risk_score?: number;
  scam_type?: string;
  primary_indicator?: string;
  reason?: string;
  approved_by?: string;
  phone?: string;
  estimated_loss_prevented_inr?: number;
  speaker?: 'scammer' | 'saroj_aunty';
  text?: string;
}

export interface LogItem {
  id: string;
  time: string;
  tag: 'SIMULATE' | 'SAROJ' | 'INTERLOCK' | 'CALL' | 'SYSTEM' | 'WHATSAPP' | 'SMS';
  message: string;
}

export interface AppSettings {
  baseUrl: string;
  token: string;
  deviceId: string;
  familyId: string;
  protectionEnabled: boolean;
  autoReplyEnabled: boolean;
}

export interface ThreatAlert {
  alert_id?: string;
  verdict_id?: string;
  scam_type?: string;
  risk_score?: number;
  scammer_number?: string;
  channel?: string;
  evidence?: string[];
  ts?: string;
}
