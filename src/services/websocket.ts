import { StreamEvent } from '../types';

type MessageHandler = (event: StreamEvent) => void;
type StatusHandler = (connected: boolean) => void;

export class SetuStreamService {
  private ws: WebSocket | null = null;
  private messageListeners: Set<MessageHandler> = new Set();
  private statusListeners: Set<StatusHandler> = new Set();
  private reconnectTimeout: any = null;
  private isIntentionalClose = false;
  private retryCount = 0;

  connect(baseUrl: string, token: string, deviceId: string) {
    this.disconnect();
    this.isIntentionalClose = false;

    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const wsProtocol = cleanUrl.startsWith('https') ? 'wss' : 'ws';
      const host = cleanUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${host}/stream?role=elder&token=${token}&device_id=${deviceId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as StreamEvent;
          this.notifyMessage(parsed);
        } catch (_e) {}
      };

      this.ws.onerror = () => {
        this.notifyStatus(false);
      };

      this.ws.onclose = () => {
        this.notifyStatus(false);
        if (!this.isIntentionalClose) {
          this.scheduleReconnect(baseUrl, token, deviceId);
        }
      };
    } catch (_e) {
      this.notifyStatus(false);
    }
  }

  private scheduleReconnect(baseUrl: string, token: string, deviceId: string) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.retryCount++;
    const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 15000);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(baseUrl, token, deviceId);
    }, delay);
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }

  onMessage(listener: MessageHandler): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStatusChange(listener: StatusHandler): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyMessage(event: StreamEvent) {
    this.messageListeners.forEach((l) => { l(event) });
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((l) => { l(connected) });
  }
}

export const streamService = new SetuStreamService();
