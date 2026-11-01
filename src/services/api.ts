import {
  DetectRequest,
  DetectResponse,
  DecoyReplyRequest,
  DecoyReplyResponse,
  ThreatIntelResponse,
  RegisterRequest,
  RegisterResponse,
  InterlockApproveRequest,
  InterlockApproveResponse,
  LiveKitTokenRequest,
  LiveKitTokenResponse,
  CallTranscriptResponse,
  Police1930ReportResponse,
  ImpactStats,
} from '../types';
import { DEFAULT_CONFIG } from '../constants/config';

export class SetuApiService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = DEFAULT_CONFIG.BASE_URL, token: string = DEFAULT_CONFIG.TEAM_TOKEN) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  updateCredentials(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 5000
  ): Promise<T | null> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (response.ok) {
        return (await response.json()) as T;
      }
      return null;
    } catch (_e) {
      clearTimeout(id);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    const res = await this.fetchWithTimeout<{ status?: string }>(
      '/threat-intel/health-check',
      { method: 'GET' },
      DEFAULT_CONFIG.TIMEOUTS.HEALTH_MS
    );
    return res !== null;
  }

  async register(req: RegisterRequest): Promise<RegisterResponse | null> {
    return this.fetchWithTimeout<RegisterResponse>(
      '/register',
      { method: 'POST', body: JSON.stringify(req) },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }

  async detect(req: DetectRequest): Promise<DetectResponse | null> {
    return this.fetchWithTimeout<DetectResponse>(
      '/detect',
      { method: 'POST', body: JSON.stringify(req) },
      DEFAULT_CONFIG.TIMEOUTS.DETECT_MS
    );
  }

  async getDecoyReply(req: DecoyReplyRequest): Promise<DecoyReplyResponse | null> {
    return this.fetchWithTimeout<DecoyReplyResponse>(
      '/chat/decoy-reply',
      { method: 'POST', body: JSON.stringify(req) },
      DEFAULT_CONFIG.TIMEOUTS.DECOY_REPLY_MS
    );
  }

  async getThreatIntel(phone: string): Promise<ThreatIntelResponse | null> {
    const encoded = encodeURIComponent(phone);
    return this.fetchWithTimeout<ThreatIntelResponse>(
      `/threat-intel/${encoded}`,
      { method: 'GET' },
      DEFAULT_CONFIG.TIMEOUTS.THREAT_INTEL_MS
    );
  }

  async sendEvent(eventType: string, deviceId: string, payload: Record<string, any>): Promise<boolean> {
    const body = {
      event_type: eventType,
      device_id: deviceId,
      ts: new Date().toISOString(),
      payload,
    };
    const res = await this.fetchWithTimeout<{ status?: string }>(
      '/event',
      { method: 'POST', body: JSON.stringify(body) },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
    return res !== null;
  }

  async approveInterlock(req: InterlockApproveRequest): Promise<InterlockApproveResponse | null> {
    return this.fetchWithTimeout<InterlockApproveResponse>(
      '/interlock/approve',
      { method: 'POST', body: JSON.stringify(req) },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }

  async getLiveKitToken(req: LiveKitTokenRequest): Promise<LiveKitTokenResponse | null> {
    return this.fetchWithTimeout<LiveKitTokenResponse>(
      '/calls/token',
      { method: 'POST', body: JSON.stringify(req) },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }

  async getCallTranscript(callId: string): Promise<CallTranscriptResponse | null> {
    return this.fetchWithTimeout<CallTranscriptResponse>(
      `/calls/${encodeURIComponent(callId)}/transcript`,
      { method: 'GET' },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }

  async get1930PoliceReport(
    verdictId: string,
    elderName: string = 'Saroj Sharma',
    elderPhone: string = '+919822012345'
  ): Promise<Police1930ReportResponse | null> {
    const params = new URLSearchParams({
      elder_name: elderName,
      elder_phone: elderPhone,
    }).toString();
    return this.fetchWithTimeout<Police1930ReportResponse>(
      `/report/1930/${encodeURIComponent(verdictId)}?${params}`,
      { method: 'GET' },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }

  async getImpactStats(): Promise<ImpactStats | null> {
    return this.fetchWithTimeout<ImpactStats>(
      '/scam-economy/stats',
      { method: 'GET' },
      DEFAULT_CONFIG.TIMEOUTS.TELEMETRY_MS
    );
  }
}

export const api = new SetuApiService();
