import type {
  User,
  Conversation,
  Message,
  Notification,
  Report,
  AdminMetrics,
  Reaction,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(usernameOrEmail: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password: password || 'password123' }),
    });
    return res.json();
  },

  async register(data: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    profileImage?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe(token?: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
  },

  // Users
  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async searchUsers(query: string): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query)}`);
    return res.json();
  },

  async updateProfile(data: {
    userId: string;
    fullName?: string;
    bio?: string;
    profileImage?: string;
    phone?: string;
    privacy?: Partial<User['privacy']>;
  }): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async blockUser(userId: string, targetUserId: string) {
    const res = await fetch(`${API_BASE}/users/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  async unblockUser(userId: string, targetUserId: string) {
    const res = await fetch(`${API_BASE}/users/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  // Conversations
  async getConversations(userId: string): Promise<{ success: boolean; conversations: Conversation[] }> {
    const res = await fetch(`${API_BASE}/conversations?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async createDirectChat(userId: string, targetUserId: string): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/conversations/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId }),
    });
    return res.json();
  },

  // Groups
  async createGroup(data: {
    name: string;
    description?: string;
    groupImage?: string;
    memberIds: string[];
    creatorId: string;
  }): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateGroup(id: string, data: { name?: string; description?: string; groupImage?: string }) {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addGroupMembers(id: string, newMemberIds: string[], adderId: string) {
    const res = await fetch(`${API_BASE}/groups/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newMemberIds, adderId }),
    });
    return res.json();
  },

  async removeGroupMember(id: string, userId: string) {
    const res = await fetch(`${API_BASE}/groups/${id}/members/${userId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Messages
  async getMessages(conversationId: string): Promise<{ success: boolean; messages: Message[] }> {
    const res = await fetch(`${API_BASE}/messages/${conversationId}`);
    return res.json();
  },

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: Message['messageType'];
    attachments?: Message['attachments'];
    replyToMessageId?: string;
  }): Promise<{ success: boolean; message: Message }> {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async editMessage(id: string, content: string, userId: string): Promise<{ success: boolean; message: Message }> {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId }),
    });
    return res.json();
  },

  async deleteMessage(id: string, userId: string, deleteType: 'everyone' | 'for_me') {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deleteType }),
    });
    return res.json();
  },

  async reactToMessage(id: string, userId: string, reaction: string): Promise<{ success: boolean; reactions: Reaction[] }> {
    const res = await fetch(`${API_BASE}/messages/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reaction }),
    });
    return res.json();
  },

  async searchMessages(params: {
    query?: string;
    conversationId?: string;
    messageType?: string;
    senderId?: string;
  }): Promise<{ success: boolean; count: number; messages: Message[] }> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.conversationId) queryParams.append('conversationId', params.conversationId);
    if (params.messageType) queryParams.append('messageType', params.messageType);
    if (params.senderId) queryParams.append('senderId', params.senderId);

    const res = await fetch(`${API_BASE}/messages/search?${queryParams.toString()}`);
    return res.json();
  },

  // Notifications
  async getNotifications(userId: string): Promise<{ success: boolean; notifications: Notification[] }> {
    const res = await fetch(`${API_BASE}/notifications?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    });
    return res.json();
  },

  async markAllNotificationsRead(userId: string) {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Reports
  async submitReport(data: {
    reportedBy: string;
    reportedUser: string;
    reason: string;
    description: string;
    targetMessageId?: string;
  }) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getReports(): Promise<{ success: boolean; reports: Report[] }> {
    const res = await fetch(`${API_BASE}/reports`);
    return res.json();
  },

  async updateReportStatus(id: string, status: 'RESOLVED' | 'DISMISSED') {
    const res = await fetch(`${API_BASE}/reports/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Admin
  async getAdminMetrics(): Promise<{ success: boolean; metrics: AdminMetrics }> {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    return res.json();
  },

  // AI Features
  async askAiAssistant(prompt: string, conversationContext?: string): Promise<{ success: boolean; text: string }> {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, conversationContext }),
    });
    return res.json();
  },

  async summarizeChat(conversationId: string): Promise<{ success: boolean; summary: string }> {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    return res.json();
  },

  async getSmartReplies(conversationId: string, lastMessageText: string, senderName: string): Promise<{ success: boolean; suggestions: string[] }> {
    const res = await fetch(`${API_BASE}/ai/smart-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, lastMessageText, senderName }),
    });
    return res.json();
  },

  async checkModeration(content: string) {
    const res = await fetch(`${API_BASE}/ai/moderation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },
};
