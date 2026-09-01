import type { WebSocketEvent } from '../types';

type EventListener = (payload: any) => void;
type StatusListener = (isConnected: boolean) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimer: any = null;
  private currentUserId: string | null = null;
  public isConnected: boolean = false;

  public connect(userId?: string) {
    if (userId) {
      this.currentUserId = userId;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.currentUserId && this.ws.readyState === WebSocket.OPEN) {
        this.send('auth:identify', { userId: this.currentUserId });
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        if (this.currentUserId) {
          this.send('auth:identify', { userId: this.currentUserId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection notice:', err);
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      console.warn('WebSocket init exception:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public setUserId(userId: string) {
    this.currentUserId = userId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('auth:identify', { userId });
    } else {
      this.connect(userId);
    }
  }

  public send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public joinConversation(conversationId: string) {
    this.send('chat:join', { conversationId });
  }

  public sendTyping(conversationId: string, userName: string, isTyping: boolean) {
    this.send('chat:typing', { conversationId, userName, isTyping });
  }

  public sendReadReceipt(conversationId: string, messageIds?: string[]) {
    this.send('chat:read', { conversationId, messageIds });
  }

  public on(eventType: string, callback: EventListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => this.off(eventType, callback);
  }

  public off(eventType: string, callback: EventListener) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(callback);
    }
  }

  private emit(eventType: string, payload: any) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => cb(payload));
    }
  }

  public onStatusChange(callback: StatusListener) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }
}

export const socketService = new SocketService();
