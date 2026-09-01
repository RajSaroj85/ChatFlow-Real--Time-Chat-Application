class SocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.currentUserId = null;
    this.isConnected = false;
  }

  connect(userId) {
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
          const data = JSON.parse(event.data);
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

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  setUserId(userId) {
    this.currentUserId = userId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('auth:identify', { userId });
    } else {
      this.connect(userId);
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  joinConversation(conversationId) {
    this.send('chat:join', { conversationId });
  }

  sendTyping(conversationId, userName, isTyping) {
    this.send('chat:typing', { conversationId, userName, isTyping });
  }

  sendReadReceipt(conversationId, messageIds) {
    this.send('chat:read', { conversationId, messageIds });
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => this.off(eventType, callback);
  }

  off(eventType, callback) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(callback);
    }
  }

  emit(eventType, payload) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => cb(payload));
    }
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  notifyStatus(connected) {
    this.statusListeners.forEach((cb) => cb(connected));
  }
}

export const socketService = new SocketService();
