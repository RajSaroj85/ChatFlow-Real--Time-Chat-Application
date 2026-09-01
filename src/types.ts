export type Role = 'USER' | 'ADMIN';

export type GroupRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export type ConversationType = 'PRIVATE' | 'GROUP';

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM';

export type MessageDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';

export type PrivacyOption = 'EVERYONE' | 'CONTACTS' | 'NOBODY';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage: string;
  bio?: string;
  role: Role;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  lastSeen?: string;
  privacy: {
    whoCanMessageMe: PrivacyOption;
    whoCanSeeOnlineStatus: PrivacyOption;
    whoCanSeeLastSeen: PrivacyOption;
    whoCanAddToGroups: PrivacyOption;
  };
  blockedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  messageId?: string;
  fileName: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'OTHER';
  fileSize: number; // in bytes
  duration?: number; // in seconds for audio
  createdAt: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  reaction: string; // e.g. 👍, ❤️, 😂, 😮, 😢, 🔥
  createdAt: string;
}

export interface MessageStatusEntry {
  userId: string;
  status: MessageDeliveryStatus;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  attachments?: Attachment[];
  replyToMessageId?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    content: string;
  };
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedForUserIds?: string[];
  reactions: Reaction[];
  status: MessageDeliveryStatus; // Overall status for sender
  statuses?: MessageStatusEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: GroupRole;
  joinedAt: string;
  lastReadMessageId?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  groupImage?: string;
  createdBy: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_MESSAGE' | 'GROUP_INVITE' | 'ADDED_TO_GROUP' | 'MENTION' | 'REACTION' | 'SYSTEM';
  title: string;
  message: string;
  referenceId?: string; // conversationId or messageId
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reportedBy: string;
  reporterName: string;
  reportedUser: string;
  reportedUserName: string;
  targetMessageId?: string;
  targetMessageContent?: string;
  reason: 'SPAM' | 'HARASSMENT' | 'FAKE_ACCOUNT' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  messagesToday: number;
  groupsCount: number;
  reportsCount: number;
  blockedUsersCount: number;
  dailyMessagesData: { date: string; count: number }[];
  activeUsersData: { hour: string; count: number }[];
  registrationTrend: { month: string; users: number }[];
}

export interface WebSocketEvent {
  type:
    | 'chat:message'
    | 'chat:typing'
    | 'chat:read'
    | 'chat:reaction'
    | 'chat:edit'
    | 'chat:delete'
    | 'user:status'
    | 'conversation:created'
    | 'group:update'
    | 'notification:new';
  payload: any;
}
