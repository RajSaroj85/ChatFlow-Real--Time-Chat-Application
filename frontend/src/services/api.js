const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * API client for chat application
 */
export const api = {
  // Auth
  async login(usernameOrEmail, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password: password || 'password123' }),
    });
    return res.json();
  },
async register(data) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();

    console.log('REGISTER STATUS:', res.status);
    console.log('REGISTER RESPONSE:', text);

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = {
        success: false,
        message: text || `Server returned ${res.status}`,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: result.message || `Registration failed (${res.status})`,
      };
    }

    return result;
  } catch (error) {
    console.error('REGISTER NETWORK ERROR:', error);

    return {
      success: false,
      message: 'Cannot connect to backend at http://localhost:8080',
    };
  }
},

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
  },

  // Users
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async searchUsers(query) {
    const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query)}`);
    return res.json();
  },

  async updateProfile(data) {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async blockUser(userId, targetUserId) {
    const res = await fetch(`${API_BASE}/users/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  async unblockUser(userId, targetUserId) {
    const res = await fetch(`${API_BASE}/users/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  // Conversations
  async getConversations(userId) {
    const res = await fetch(`${API_BASE}/conversations?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async createDirectChat(userId, targetUserId) {
    const res = await fetch(`${API_BASE}/conversations/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  // Groups
  async createGroup(data) {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateGroup(id, data) {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addGroupMembers(id, newMemberIds, adderId) {
    const res = await fetch(`${API_BASE}/groups/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newMemberIds, adderId }),
    });
    return res.json();
  },

  async removeGroupMember(id, userId) {
    const res = await fetch(`${API_BASE}/groups/${id}/members/${userId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Messages
  async getMessages(conversationId) {
    const res = await fetch(`${API_BASE}/messages/${conversationId}`);
    return res.json();
  },

  async sendMessage(data) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async editMessage(id, content, userId) {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId }),
    });
    return res.json();
  },

  async deleteMessage(id, userId, deleteType) {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deleteType }),
    });
    return res.json();
  },

  async reactToMessage(id, userId, reaction) {
    const res = await fetch(`${API_BASE}/messages/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reaction }),
    });
    return res.json();
  },

  async searchMessages(params) {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.conversationId) queryParams.append('conversationId', params.conversationId);
    if (params.messageType) queryParams.append('messageType', params.messageType);
    if (params.senderId) queryParams.append('senderId', params.senderId);

    const res = await fetch(`${API_BASE}/messages/search?${queryParams.toString()}`);
    return res.json();
  },

  // Notifications
  async getNotifications(userId) {
    const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    });
    return res.json();
  },

  async markAllNotificationsRead(userId) {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Reports
  async submitReport(data) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    return res.json();
  },

  async updateReportStatus(id, status) {
    const res = await fetch(`${API_BASE}/reports/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Admin
  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    return res.json();
  },

  // AI Features
  async askAiAssistant(prompt, conversationContext) {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, conversationContext }),
    });
    return res.json();
  },

  async summarizeChat(conversationId) {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    return res.json();
  },

  async getSmartReplies(conversationId, lastMessageText, senderName) {
    const res = await fetch(`${API_BASE}/ai/smart-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, lastMessageText, senderName }),
    });
    return res.json();
  },

  async checkModeration(content) {
    const res = await fetch(`${API_BASE}/ai/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
};
