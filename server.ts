import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import type {
  User,
  Conversation,
  Message,
  Reaction,
  Notification,
  Report,
  AdminMetrics,
  WebSocketEvent,
} from "./src/types";

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Google GenAI client (Server-Side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ==========================================
// In-Memory Database Seed & State
// ==========================================

const defaultAvatars = {
  raj: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  rahul: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  amit: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  priya: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  admin: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  ai_bot: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  group_java: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80",
  group_devops: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=150&auto=format&fit=crop&q=80",
};

let users: User[] = [
  {
    id: "user_raj",
    username: "rajsaroj",
    fullName: "Raj Saroj",
    email: "rajsaroj7991@gmail.com",
    phone: "+91 98765 43210",
    profileImage: defaultAvatars.raj,
    bio: "Full Stack Engineer & Real-Time Systems Enthusiast 🚀",
    role: "USER",
    status: "ONLINE",
    lastSeen: "Just now",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-08-29T02:00:00Z",
  },
  {
    id: "user_rahul",
    username: "rahul",
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98111 22233",
    profileImage: defaultAvatars.rahul,
    bio: "Senior Java & Spring Boot Architect | Microservices",
    role: "USER",
    status: "ONLINE",
    lastSeen: "2 mins ago",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-12T11:00:00Z",
    updatedAt: "2026-08-29T02:05:00Z",
  },
  {
    id: "user_amit",
    username: "amit",
    fullName: "Amit Patel",
    email: "amit.patel@example.com",
    phone: "+91 98222 33344",
    profileImage: defaultAvatars.amit,
    bio: "Database Optimization & MySQL Performance Geek ⚡",
    role: "USER",
    status: "AWAY",
    lastSeen: "15 mins ago",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-15T09:30:00Z",
    updatedAt: "2026-08-29T01:50:00Z",
  },
  {
    id: "user_priya",
    username: "priya",
    fullName: "Priya Singh",
    email: "priya.singh@example.com",
    phone: "+91 98333 44455",
    profileImage: defaultAvatars.priya,
    bio: "Lead Product Designer & React Tailwind UI Specialist ✨",
    role: "USER",
    status: "ONLINE",
    lastSeen: "Just now",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-20T14:00:00Z",
    updatedAt: "2026-08-29T02:08:00Z",
  },
  {
    id: "user_admin",
    username: "admin",
    fullName: "System Admin",
    email: "admin@chatflow.io",
    phone: "+1 800 555 0199",
    profileImage: defaultAvatars.admin,
    bio: "ChatFlow Platform Operations & Security Moderator 🛡️",
    role: "ADMIN",
    status: "ONLINE",
    lastSeen: "Active now",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-08-29T02:00:00Z",
  },
  {
    id: "user_ai",
    username: "chatflow_ai",
    fullName: "ChatFlow AI Assistant",
    email: "ai@chatflow.io",
    profileImage: defaultAvatars.ai_bot,
    bio: "Your intelligent real-time conversational co-pilot powered by Gemini 🤖",
    role: "USER",
    status: "ONLINE",
    lastSeen: "Always online",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-08-29T02:00:00Z",
  },
];

let conversations: Conversation[] = [
  {
    id: "conv_rahul_raj",
    type: "PRIVATE",
    createdBy: "user_rahul",
    members: [
      {
        id: "m_1",
        conversationId: "conv_rahul_raj",
        userId: "user_raj",
        userName: "Raj Saroj",
        userAvatar: defaultAvatars.raj,
        role: "MEMBER",
        joinedAt: "2026-02-01T10:00:00Z",
      },
      {
        id: "m_2",
        conversationId: "conv_rahul_raj",
        userId: "user_rahul",
        userName: "Rahul Sharma",
        userAvatar: defaultAvatars.rahul,
        role: "ADMIN",
        joinedAt: "2026-02-01T10:00:00Z",
      },
    ],
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-08-29T02:06:00Z",
  },
  {
    id: "conv_group_java",
    type: "GROUP",
    name: "Java Developers 🚀",
    description: "Official discussion channel for Spring Boot, WebSocket STOMP, JPA & high-throughput systems.",
    groupImage: defaultAvatars.group_java,
    createdBy: "user_rahul",
    members: [
      {
        id: "m_g1",
        conversationId: "conv_group_java",
        userId: "user_raj",
        userName: "Raj Saroj",
        userAvatar: defaultAvatars.raj,
        role: "MEMBER",
        joinedAt: "2026-02-05T10:00:00Z",
      },
      {
        id: "m_g2",
        conversationId: "conv_group_java",
        userId: "user_rahul",
        userName: "Rahul Sharma",
        userAvatar: defaultAvatars.rahul,
        role: "ADMIN",
        joinedAt: "2026-02-05T10:00:00Z",
      },
      {
        id: "m_g3",
        conversationId: "conv_group_java",
        userId: "user_amit",
        userName: "Amit Patel",
        userAvatar: defaultAvatars.amit,
        role: "MODERATOR",
        joinedAt: "2026-02-05T10:00:00Z",
      },
      {
        id: "m_g4",
        conversationId: "conv_group_java",
        userId: "user_priya",
        userName: "Priya Singh",
        userAvatar: defaultAvatars.priya,
        role: "MEMBER",
        joinedAt: "2026-02-05T10:00:00Z",
      },
    ],
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    createdAt: "2026-02-05T10:00:00Z",
    updatedAt: "2026-08-29T01:45:00Z",
  },
  {
    id: "conv_priya_raj",
    type: "PRIVATE",
    createdBy: "user_priya",
    members: [
      {
        id: "m_3",
        conversationId: "conv_priya_raj",
        userId: "user_raj",
        userName: "Raj Saroj",
        userAvatar: defaultAvatars.raj,
        role: "MEMBER",
        joinedAt: "2026-02-10T10:00:00Z",
      },
      {
        id: "m_4",
        conversationId: "conv_priya_raj",
        userId: "user_priya",
        userName: "Priya Singh",
        userAvatar: defaultAvatars.priya,
        role: "ADMIN",
        joinedAt: "2026-02-10T10:00:00Z",
      },
    ],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-08-29T00:30:00Z",
  },
  {
    id: "conv_amit_raj",
    type: "PRIVATE",
    createdBy: "user_amit",
    members: [
      {
        id: "m_5",
        conversationId: "conv_amit_raj",
        userId: "user_raj",
        userName: "Raj Saroj",
        userAvatar: defaultAvatars.raj,
        role: "MEMBER",
        joinedAt: "2026-02-15T10:00:00Z",
      },
      {
        id: "m_6",
        conversationId: "conv_amit_raj",
        userId: "user_amit",
        userName: "Amit Patel",
        userAvatar: defaultAvatars.amit,
        role: "ADMIN",
        joinedAt: "2026-02-15T10:00:00Z",
      },
    ],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-08-28T18:20:00Z",
  },
  {
    id: "conv_ai_raj",
    type: "PRIVATE",
    createdBy: "user_raj",
    members: [
      {
        id: "m_7",
        conversationId: "conv_ai_raj",
        userId: "user_raj",
        userName: "Raj Saroj",
        userAvatar: defaultAvatars.raj,
        role: "MEMBER",
        joinedAt: "2026-02-01T00:00:00Z",
      },
      {
        id: "m_8",
        conversationId: "conv_ai_raj",
        userId: "user_ai",
        userName: "ChatFlow AI Assistant",
        userAvatar: defaultAvatars.ai_bot,
        role: "ADMIN",
        joinedAt: "2026-02-01T00:00:00Z",
      },
    ],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-08-29T02:00:00Z",
  },
];

let messages: Message[] = [
  // Conversation with Rahul
  {
    id: "msg_1",
    conversationId: "conv_rahul_raj",
    senderId: "user_rahul",
    senderName: "Rahul Sharma",
    senderAvatar: defaultAvatars.rahul,
    content: "Hey Raj! Are you ready for the Java & Spring Boot architecture review today?",
    messageType: "TEXT",
    reactions: [
      {
        id: "rx_1",
        messageId: "msg_1",
        userId: "user_raj",
        userName: "Raj Saroj",
        reaction: "👍",
        createdAt: "2026-08-29T01:35:00Z",
      },
    ],
    status: "READ",
    createdAt: "2026-08-29T01:30:00Z",
    updatedAt: "2026-08-29T01:30:00Z",
  },
  {
    id: "msg_2",
    conversationId: "conv_rahul_raj",
    senderId: "user_raj",
    senderName: "Raj Saroj",
    senderAvatar: defaultAvatars.raj,
    content: "Yes bro! I prepared the WebSocket STOMP handlers and MySQL schema diagrams.",
    messageType: "TEXT",
    reactions: [
      {
        id: "rx_2",
        messageId: "msg_2",
        userId: "user_rahul",
        userName: "Rahul Sharma",
        reaction: "🔥",
        createdAt: "2026-08-29T01:40:00Z",
      },
    ],
    status: "READ",
    createdAt: "2026-08-29T01:35:00Z",
    updatedAt: "2026-08-29T01:35:00Z",
  },
  {
    id: "msg_3",
    conversationId: "conv_rahul_raj",
    senderId: "user_rahul",
    senderName: "Rahul Sharma",
    senderAvatar: defaultAvatars.rahul,
    content: "Here is the updated System Design Architecture document for our meeting.",
    messageType: "DOCUMENT",
    attachments: [
      {
        id: "att_1",
        fileName: "ChatFlow_Spring_Architecture_Spec.pdf",
        fileUrl: "https://example.com/docs/spec.pdf",
        fileType: "DOCUMENT",
        fileSize: 2450000,
        createdAt: "2026-08-29T02:00:00Z",
      },
    ],
    reactions: [],
    status: "READ",
    createdAt: "2026-08-29T02:00:00Z",
    updatedAt: "2026-08-29T02:00:00Z",
  },
  {
    id: "msg_4",
    conversationId: "conv_rahul_raj",
    senderId: "user_rahul",
    senderName: "Rahul Sharma",
    senderAvatar: defaultAvatars.rahul,
    content: "Tomorrow meeting at 2:30 PM. Prepare Spring Boot + JWT questions!",
    messageType: "TEXT",
    reactions: [
      {
        id: "rx_3",
        messageId: "msg_4",
        userId: "user_raj",
        userName: "Raj Saroj",
        reaction: "❤️",
        createdAt: "2026-08-29T02:07:00Z",
      },
    ],
    status: "DELIVERED",
    createdAt: "2026-08-29T02:06:00Z",
    updatedAt: "2026-08-29T02:06:00Z",
  },

  // Group: Java Developers
  {
    id: "msg_g1",
    conversationId: "conv_group_java",
    senderId: "user_rahul",
    senderName: "Rahul Sharma",
    senderAvatar: defaultAvatars.rahul,
    content: "Welcome everyone to Java Developers 🚀! Let's build scalable microservices.",
    messageType: "TEXT",
    reactions: [
      {
        id: "rx_g1",
        messageId: "msg_g1",
        userId: "user_amit",
        userName: "Amit Patel",
        reaction: "🔥",
        createdAt: "2026-08-29T00:05:00Z",
      },
      {
        id: "rx_g2",
        messageId: "msg_g1",
        userId: "user_priya",
        userName: "Priya Singh",
        reaction: "❤️",
        createdAt: "2026-08-29T00:06:00Z",
      },
    ],
    status: "READ",
    createdAt: "2026-08-29T00:00:00Z",
    updatedAt: "2026-08-29T00:00:00Z",
  },
  {
    id: "msg_g2",
    conversationId: "conv_group_java",
    senderId: "user_amit",
    senderName: "Amit Patel",
    senderAvatar: defaultAvatars.amit,
    content: "Quick reminder: Please use connection pooling with HikariCP for maximum MySQL throughput.",
    messageType: "TEXT",
    reactions: [],
    status: "READ",
    createdAt: "2026-08-29T01:15:00Z",
    updatedAt: "2026-08-29T01:15:00Z",
  },
  {
    id: "msg_g3",
    conversationId: "conv_group_java",
    senderId: "user_priya",
    senderName: "Priya Singh",
    senderAvatar: defaultAvatars.priya,
    content: "Just finalized the real-time chat UI tokens in Tailwind. Here's a snapshot preview!",
    messageType: "IMAGE",
    attachments: [
      {
        id: "att_img_1",
        fileName: "ChatFlow_Dashboard_Mockup.png",
        fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        fileType: "IMAGE",
        fileSize: 1850000,
        createdAt: "2026-08-29T01:45:00Z",
      },
    ],
    reactions: [
      {
        id: "rx_g3",
        messageId: "msg_g3",
        userId: "user_raj",
        userName: "Raj Saroj",
        reaction: "👍",
        createdAt: "2026-08-29T01:50:00Z",
      },
    ],
    status: "READ",
    createdAt: "2026-08-29T01:45:00Z",
    updatedAt: "2026-08-29T01:45:00Z",
  },

  // Conversation with Priya
  {
    id: "msg_p1",
    conversationId: "conv_priya_raj",
    senderId: "user_priya",
    senderName: "Priya Singh",
    senderAvatar: defaultAvatars.priya,
    content: "Hey Raj! How are the animations looking for message delivery checkmarks?",
    messageType: "TEXT",
    reactions: [],
    status: "READ",
    createdAt: "2026-08-29T00:20:00Z",
    updatedAt: "2026-08-29T00:20:00Z",
  },
  {
    id: "msg_p2",
    conversationId: "conv_priya_raj",
    senderId: "user_raj",
    senderName: "Raj Saroj",
    senderAvatar: defaultAvatars.raj,
    content: "They feel super snappy! Blue double checks `🔵✓✓` are working seamlessly on read receipt events.",
    messageType: "TEXT",
    reactions: [
      {
        id: "rx_p1",
        messageId: "msg_p2",
        userId: "user_priya",
        userName: "Priya Singh",
        reaction: "🔥",
        createdAt: "2026-08-29T00:28:00Z",
      },
    ],
    status: "READ",
    createdAt: "2026-08-29T00:25:00Z",
    updatedAt: "2026-08-29T00:25:00Z",
  },

  // Conversation with AI
  {
    id: "msg_ai1",
    conversationId: "conv_ai_raj",
    senderId: "user_ai",
    senderName: "ChatFlow AI Assistant",
    senderAvatar: defaultAvatars.ai_bot,
    content: "Hello Raj! 👋 I am your ChatFlow AI Assistant. You can ask me anything about Java, Spring Boot, WebSockets, system design, or have me summarize any conversation!",
    messageType: "TEXT",
    reactions: [],
    status: "READ",
    createdAt: "2026-08-29T01:00:00Z",
    updatedAt: "2026-08-29T01:00:00Z",
  },
];

let notifications: Notification[] = [
  {
    id: "notif_1",
    userId: "user_raj",
    type: "NEW_MESSAGE",
    title: "Rahul Sharma",
    message: "Tomorrow meeting at 2:30 PM. Prepare Spring Boot + JWT questions!",
    referenceId: "conv_rahul_raj",
    isRead: false,
    createdAt: "2026-08-29T02:06:00Z",
  },
  {
    id: "notif_2",
    userId: "user_raj",
    type: "REACTION",
    title: "Message Reaction",
    message: "Rahul Sharma reacted with 🔥 to your message.",
    referenceId: "conv_rahul_raj",
    isRead: false,
    createdAt: "2026-08-29T01:40:00Z",
  },
  {
    id: "notif_3",
    userId: "user_raj",
    type: "ADDED_TO_GROUP",
    title: "Group Invitation",
    message: "You were added to 'Java Developers 🚀' group by Rahul Sharma.",
    referenceId: "conv_group_java",
    isRead: true,
    createdAt: "2026-02-05T10:00:00Z",
  },
];

let reports: Report[] = [
  {
    id: "rep_1",
    reportedBy: "user_amit",
    reporterName: "Amit Patel",
    reportedUser: "user_spammer",
    reportedUserName: "crypto_bot_99",
    targetMessageContent: "Earn 500% in 1 day click here: http://spamme.xyz",
    reason: "SPAM",
    description: "Automated promotional bot sending bulk links to public rooms.",
    status: "PENDING",
    createdAt: "2026-08-29T01:10:00Z",
  },
  {
    id: "rep_2",
    reportedBy: "user_priya",
    reporterName: "Priya Singh",
    reportedUser: "user_troll",
    reportedUserName: "anon_dev_x",
    reason: "HARASSMENT",
    description: "Repeatedly sending aggressive messages in direct chat.",
    status: "RESOLVED",
    createdAt: "2026-08-28T22:00:00Z",
  },
];

// Helper to update last message on conversations
function syncLastMessages() {
  for (const conv of conversations) {
    const convMsgs = messages
      .filter((m) => m.conversationId === conv.id && !m.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (convMsgs.length > 0) {
      conv.lastMessage = convMsgs[convMsgs.length - 1];
    }
  }
}
syncLastMessages();

// ==========================================
// WebSocket Real-Time Event Hub
// ==========================================

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  activeConversationId?: string;
}

const connectedClients = new Map<WebSocket, ClientConnection>();

function broadcastEvent(event: WebSocketEvent, targetUserIds?: string[]) {
  const payloadStr = JSON.stringify(event);
  connectedClients.forEach(({ ws, userId }) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (!targetUserIds || targetUserIds.includes(userId)) {
        ws.send(payloadStr);
      }
    }
  });
}

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type, payload } = data;

      switch (type) {
        case "auth:identify": {
          const user = users.find((u) => u.id === payload.userId);
          if (user) {
            user.status = "ONLINE";
            user.lastSeen = "Just now";
            connectedClients.set(ws, {
              ws,
              userId: user.id,
            });

            // Broadcast presence
            broadcastEvent({
              type: "user:status",
              payload: { userId: user.id, status: "ONLINE", lastSeen: "Just now" },
            });
          }
          break;
        }

        case "chat:join": {
          const client = connectedClients.get(ws);
          if (client) {
            client.activeConversationId = payload.conversationId;
          }
          break;
        }

        case "chat:typing": {
          const client = connectedClients.get(ws);
          if (client) {
            const conv = conversations.find((c) => c.id === payload.conversationId);
            if (conv) {
              const targetIds = conv.members
                .map((m) => m.userId)
                .filter((id) => id !== client.userId);
              broadcastEvent(
                {
                  type: "chat:typing",
                  payload: {
                    conversationId: payload.conversationId,
                    userId: client.userId,
                    userName: payload.userName,
                    isTyping: payload.isTyping,
                  },
                },
                targetIds
              );
            }
          }
          break;
        }

        case "chat:read": {
          const client = connectedClients.get(ws);
          if (client) {
            const { conversationId, messageIds } = payload;
            messages.forEach((m) => {
              if (
                m.conversationId === conversationId &&
                (!messageIds || messageIds.includes(m.id)) &&
                m.senderId !== client.userId
              ) {
                m.status = "READ";
              }
            });

            const conv = conversations.find((c) => c.id === conversationId);
            if (conv) {
              const memberIds = conv.members.map((m) => m.userId);
              broadcastEvent(
                {
                  type: "chat:read",
                  payload: {
                    conversationId,
                    readerId: client.userId,
                    messageIds,
                  },
                },
                memberIds
              );
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("WebSocket message handling error:", err);
    }
  });

  ws.on("close", () => {
    const client = connectedClients.get(ws);
    if (client) {
      const user = users.find((u) => u.id === client.userId);
      if (user) {
        user.status = "OFFLINE";
        user.lastSeen = new Date().toISOString();
        broadcastEvent({
          type: "user:status",
          payload: {
            userId: user.id,
            status: "OFFLINE",
            lastSeen: "Just now",
          },
        });
      }
      connectedClients.delete(ws);
    }
  });
});

// ==========================================
// REST API Routes
// ==========================================

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail?.toLowerCase() ||
      u.email.toLowerCase() === usernameOrEmail?.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials. Try rahul, amit, priya, raj or admin.",
    });
  }

  // Token simulation
  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    success: true,
    token,
    user,
  });
});

app.post("/api/auth/register", (req, res) => {
  const { fullName, username, email, phone, password, profileImage } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Full name, username, email, and password are required.",
    });
  }

  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({
      success: false,
      message: "Username is already taken.",
    });
  }

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({
      success: false,
      message: "Email is already registered.",
    });
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    username,
    fullName,
    email,
    phone: phone || "",
    profileImage:
      profileImage ||
      `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    bio: "Hey there! I am using ChatFlow ⚡",
    role: "USER",
    status: "ONLINE",
    lastSeen: "Just now",
    privacy: {
      whoCanMessageMe: "EVERYONE",
      whoCanSeeOnlineStatus: "EVERYONE",
      whoCanSeeLastSeen: "EVERYONE",
      whoCanAddToGroups: "EVERYONE",
    },
    blockedUserIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Automatically create a direct chat with ChatFlow AI assistant for the new user
  const aiConv: Conversation = {
    id: `conv_ai_${newUser.id}`,
    type: "PRIVATE",
    createdBy: newUser.id,
    members: [
      {
        id: `m_${Date.now()}_1`,
        conversationId: `conv_ai_${newUser.id}`,
        userId: newUser.id,
        userName: newUser.fullName,
        userAvatar: newUser.profileImage,
        role: "MEMBER",
        joinedAt: new Date().toISOString(),
      },
      {
        id: `m_${Date.now()}_2`,
        conversationId: `conv_ai_${newUser.id}`,
        userId: "user_ai",
        userName: "ChatFlow AI Assistant",
        userAvatar: defaultAvatars.ai_bot,
        role: "ADMIN",
        joinedAt: new Date().toISOString(),
      },
    ],
    unreadCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  conversations.push(aiConv);

  const welcomeAiMsg: Message = {
    id: `msg_welcome_${Date.now()}`,
    conversationId: aiConv.id,
    senderId: "user_ai",
    senderName: "ChatFlow AI Assistant",
    senderAvatar: defaultAvatars.ai_bot,
    content: `Welcome to ChatFlow, ${newUser.fullName}! 🎉 Feel free to chat with me anytime for questions, code explanations, or message summaries.`,
    messageType: "TEXT",
    reactions: [],
    status: "SENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  messages.push(welcomeAiMsg);
  aiConv.lastMessage = welcomeAiMsg;

  const token = `jwt_token_${newUser.id}_${Date.now()}`;
  res.status(201).json({
    success: true,
    token,
    user: newUser,
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = authHeader?.replace("Bearer jwt_token_", "")?.split("_")?.[0];
  const user = users.find((u) => u.id === (userId ? `user_${userId}` : "user_raj")) || users[0];
  res.json({ success: true, user });
});

// Users Routes
app.get("/api/users", (req, res) => {
  res.json({ success: true, users });
});

app.get("/api/users/search", (req, res) => {
  const query = (req.query.query as string || "").toLowerCase();
  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
  );
  res.json({ success: true, users: filtered });
});

app.put("/api/users/profile", (req, res) => {
  const { userId, fullName, bio, profileImage, phone, privacy } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (fullName) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (profileImage) user.profileImage = profileImage;
  if (phone !== undefined) user.phone = phone;
  if (privacy) user.privacy = { ...user.privacy, ...privacy };
  user.updatedAt = new Date().toISOString();

  res.json({ success: true, user });
});

app.post("/api/users/block", (req, res) => {
  const { userId, targetUserId } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (!user.blockedUserIds.includes(targetUserId)) {
    user.blockedUserIds.push(targetUserId);
  }
  res.json({ success: true, blockedUserIds: user.blockedUserIds });
});

app.post("/api/users/unblock", (req, res) => {
  const { userId, targetUserId } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.blockedUserIds = user.blockedUserIds.filter((id) => id !== targetUserId);
  res.json({ success: true, blockedUserIds: user.blockedUserIds });
});

// Conversations Routes
app.get("/api/conversations", (req, res) => {
  const userId = (req.query.userId as string) || "user_raj";
  syncLastMessages();
  const userConvs = conversations.filter((c) =>
    c.members.some((m) => m.userId === userId)
  );
  res.json({ success: true, conversations: userConvs });
});

app.post("/api/conversations/direct", (req, res) => {
  const { userId, targetUserId } = req.body;
  const targetUser = users.find((u) => u.id === targetUserId);
  const currentUser = users.find((u) => u.id === userId);

  if (!targetUser || !currentUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check if direct conversation already exists
  let existing = conversations.find(
    (c) =>
      c.type === "PRIVATE" &&
      c.members.some((m) => m.userId === userId) &&
      c.members.some((m) => m.userId === targetUserId)
  );

  if (existing) {
    return res.json({ success: true, conversation: existing });
  }

  const newConv: Conversation = {
    id: `conv_${Date.now()}`,
    type: "PRIVATE",
    createdBy: userId,
    members: [
      {
        id: `m_${Date.now()}_1`,
        conversationId: `conv_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userAvatar: currentUser.profileImage,
        role: "ADMIN",
        joinedAt: new Date().toISOString(),
      },
      {
        id: `m_${Date.now()}_2`,
        conversationId: `conv_${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.fullName,
        userAvatar: targetUser.profileImage,
        role: "MEMBER",
        joinedAt: new Date().toISOString(),
      },
    ],
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  conversations.unshift(newConv);
  broadcastEvent(
    { type: "conversation:created", payload: { conversation: newConv } },
    [userId, targetUserId]
  );

  res.status(201).json({ success: true, conversation: newConv });
});

// Group Routes
app.post("/api/groups", (req, res) => {
  const { name, description, groupImage, memberIds, creatorId } = req.body;
  const creator = users.find((u) => u.id === creatorId);
  if (!creator || !name) {
    return res.status(400).json({ success: false, message: "Group name and creator are required" });
  }

  const allMemberIds = Array.from(new Set([creatorId, ...(memberIds || [])]));
  const convId = `conv_group_${Date.now()}`;

  const members = allMemberIds
    .map((mId) => {
      const u = users.find((usr) => usr.id === mId);
      if (!u) return null;
      return {
        id: `m_${Date.now()}_${mId}`,
        conversationId: convId,
        userId: u.id,
        userName: u.fullName,
        userAvatar: u.profileImage,
        role: (mId === creatorId ? "ADMIN" : "MEMBER") as any,
        joinedAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  const newGroup: Conversation = {
    id: convId,
    type: "GROUP",
    name,
    description: description || "",
    groupImage:
      groupImage ||
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
    createdBy: creatorId,
    members: members as any,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  conversations.unshift(newGroup);

  // System welcome message
  const sysMsg: Message = {
    id: `msg_sys_${Date.now()}`,
    conversationId: convId,
    senderId: "system",
    senderName: "System",
    content: `${creator.fullName} created the group "${name}"`,
    messageType: "SYSTEM",
    reactions: [],
    status: "READ",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  messages.push(sysMsg);
  newGroup.lastMessage = sysMsg;

  broadcastEvent(
    { type: "conversation:created", payload: { conversation: newGroup } },
    allMemberIds
  );

  res.status(201).json({ success: true, conversation: newGroup });
});

app.put("/api/groups/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, groupImage } = req.body;
  const group = conversations.find((c) => c.id === id && c.type === "GROUP");
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });

  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (groupImage) group.groupImage = groupImage;
  group.updatedAt = new Date().toISOString();

  broadcastEvent(
    { type: "group:update", payload: { conversation: group } },
    group.members.map((m) => m.userId)
  );

  res.json({ success: true, group });
});

app.post("/api/groups/:id/members", (req, res) => {
  const { id } = req.params;
  const { newMemberIds, adderId } = req.body;
  const group = conversations.find((c) => c.id === id && c.type === "GROUP");
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });

  for (const mId of newMemberIds) {
    if (!group.members.some((m) => m.userId === mId)) {
      const u = users.find((usr) => usr.id === mId);
      if (u) {
        group.members.push({
          id: `m_${Date.now()}_${mId}`,
          conversationId: group.id,
          userId: u.id,
          userName: u.fullName,
          userAvatar: u.profileImage,
          role: "MEMBER",
          joinedAt: new Date().toISOString(),
        });
      }
    }
  }

  broadcastEvent(
    { type: "group:update", payload: { conversation: group } },
    group.members.map((m) => m.userId)
  );

  res.json({ success: true, group });
});

app.delete("/api/groups/:id/members/:userId", (req, res) => {
  const { id, userId } = req.params;
  const group = conversations.find((c) => c.id === id && c.type === "GROUP");
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });

  group.members = group.members.filter((m) => m.userId !== userId);
  broadcastEvent(
    { type: "group:update", payload: { conversation: group } },
    group.members.map((m) => m.userId)
  );

  res.json({ success: true, group });
});

// Messages Routes
app.get("/api/messages/:conversationId", (req, res) => {
  const { conversationId } = req.params;
  const convMsgs = messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ success: true, messages: convMsgs });
});

app.post("/api/messages", async (req, res) => {
  const {
    conversationId,
    senderId,
    content,
    messageType,
    attachments,
    replyToMessageId,
  } = req.body;

  const sender = users.find((u) => u.id === senderId);
  const conv = conversations.find((c) => c.id === conversationId);

  if (!sender || !conv) {
    return res.status(404).json({ success: false, message: "Sender or conversation not found" });
  }

  // Check if sender is blocked by any private member
  if (conv.type === "PRIVATE") {
    const otherMember = conv.members.find((m) => m.userId !== senderId);
    const otherUser = users.find((u) => u.id === otherMember?.userId);
    if (otherUser && otherUser.blockedUserIds.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot message this user because you are blocked.",
      });
    }
  }

  let replyToMessage;
  if (replyToMessageId) {
    const replied = messages.find((m) => m.id === replyToMessageId);
    if (replied) {
      replyToMessage = {
        id: replied.id,
        senderName: replied.senderName,
        content: replied.content,
      };
    }
  }

  const newMsg: Message = {
    id: `msg_${Date.now()}`,
    conversationId,
    senderId: sender.id,
    senderName: sender.fullName,
    senderAvatar: sender.profileImage,
    content: content || "",
    messageType: messageType || "TEXT",
    attachments: attachments || [],
    replyToMessageId,
    replyToMessage,
    isEdited: false,
    isDeleted: false,
    reactions: [],
    status: "DELIVERED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  messages.push(newMsg);
  conv.lastMessage = newMsg;
  conv.updatedAt = newMsg.createdAt;

  const memberUserIds = conv.members.map((m) => m.userId);

  // Broadcast to all conversation members
  broadcastEvent(
    {
      type: "chat:message",
      payload: { message: newMsg, conversationId },
    },
    memberUserIds
  );

  // If conversation is with ChatFlow AI, generate an automatic intelligent response
  if (
    conv.members.some((m) => m.userId === "user_ai") &&
    senderId !== "user_ai"
  ) {
    setTimeout(async () => {
      try {
        // Send typing event first
        broadcastEvent(
          {
            type: "chat:typing",
            payload: {
              conversationId,
              userId: "user_ai",
              userName: "ChatFlow AI Assistant",
              isTyping: true,
            },
          },
          [senderId]
        );

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: content || "Hello",
          config: {
            systemInstruction:
              "You are ChatFlow AI, an intelligent, helpful, and concise real-time communication assistant. You answer technical questions about Java, Spring Boot, WebSockets, React, System Design, architecture, and general coding topics cleanly and helpfully with code blocks and bullet points.",
          },
        });

        const replyText =
          aiResponse.text ||
          "I'm here to assist you with any questions about ChatFlow or development!";

        // Stop typing
        broadcastEvent(
          {
            type: "chat:typing",
            payload: {
              conversationId,
              userId: "user_ai",
              userName: "ChatFlow AI Assistant",
              isTyping: false,
            },
          },
          [senderId]
        );

        const aiMsg: Message = {
          id: `msg_ai_${Date.now()}`,
          conversationId,
          senderId: "user_ai",
          senderName: "ChatFlow AI Assistant",
          senderAvatar: defaultAvatars.ai_bot,
          content: replyText,
          messageType: "TEXT",
          reactions: [],
          status: "SENT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        messages.push(aiMsg);
        conv.lastMessage = aiMsg;
        conv.updatedAt = aiMsg.createdAt;

        broadcastEvent(
          {
            type: "chat:message",
            payload: { message: aiMsg, conversationId },
          },
          [senderId]
        );
      } catch (aiErr) {
        console.error("AI automated response error:", aiErr);
      }
    }, 800);
  }

  res.status(201).json({ success: true, message: newMsg });
});

app.put("/api/messages/:id", (req, res) => {
  const { id } = req.params;
  const { content, userId } = req.body;
  const msg = messages.find((m) => m.id === id);

  if (!msg) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  if (msg.senderId !== userId) {
    return res.status(403).json({
      success: false,
      message: "Only the original sender can edit this message.",
    });
  }

  msg.content = content;
  msg.isEdited = true;
  msg.updatedAt = new Date().toISOString();

  const conv = conversations.find((c) => c.id === msg.conversationId);
  const memberIds = conv ? conv.members.map((m) => m.userId) : [];

  broadcastEvent(
    {
      type: "chat:edit",
      payload: { message: msg, conversationId: msg.conversationId },
    },
    memberIds
  );

  res.json({ success: true, message: msg });
});

app.delete("/api/messages/:id", (req, res) => {
  const { id } = req.params;
  const { userId, deleteType } = req.body; // 'everyone' | 'for_me'
  const msg = messages.find((m) => m.id === id);

  if (!msg) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  const conv = conversations.find((c) => c.id === msg.conversationId);
  const memberIds = conv ? conv.members.map((m) => m.userId) : [];

  if (deleteType === "everyone") {
    if (msg.senderId !== userId && userId !== "user_admin") {
      return res.status(403).json({
        success: false,
        message: "Only the sender or admin can delete for everyone.",
      });
    }
    msg.isDeleted = true;
    msg.content = "This message was deleted.";
    msg.attachments = [];
  } else {
    // Delete for me
    if (!msg.deletedForUserIds) msg.deletedForUserIds = [];
    if (!msg.deletedForUserIds.includes(userId)) {
      msg.deletedForUserIds.push(userId);
    }
  }

  broadcastEvent(
    {
      type: "chat:delete",
      payload: {
        messageId: msg.id,
        conversationId: msg.conversationId,
        deleteType,
        userId,
      },
    },
    memberIds
  );

  res.json({ success: true, message: msg });
});

// Reactions
app.post("/api/messages/:id/react", (req, res) => {
  const { id } = req.params;
  const { userId, reaction } = req.body;
  const msg = messages.find((m) => m.id === id);
  const user = users.find((u) => u.id === userId);

  if (!msg || !user) {
    return res.status(404).json({ success: false, message: "Message or user not found" });
  }

  const existingIdx = msg.reactions.findIndex(
    (r) => r.userId === userId && r.reaction === reaction
  );

  if (existingIdx >= 0) {
    // Remove reaction (toggle off)
    msg.reactions.splice(existingIdx, 1);
  } else {
    // Add reaction
    msg.reactions.push({
      id: `rx_${Date.now()}`,
      messageId: msg.id,
      userId: user.id,
      userName: user.fullName,
      reaction,
      createdAt: new Date().toISOString(),
    });
  }

  const conv = conversations.find((c) => c.id === msg.conversationId);
  const memberIds = conv ? conv.members.map((m) => m.userId) : [];

  broadcastEvent(
    {
      type: "chat:reaction",
      payload: {
        messageId: msg.id,
        conversationId: msg.conversationId,
        reactions: msg.reactions,
      },
    },
    memberIds
  );

  res.json({ success: true, reactions: msg.reactions });
});

// Search API (Advanced Filters)
app.get("/api/messages/search", (req, res) => {
  const query = (req.query.query as string || "").toLowerCase();
  const conversationId = req.query.conversationId as string;
  const messageType = req.query.messageType as string;
  const senderId = req.query.senderId as string;

  let results = messages.filter((m) => !m.isDeleted);

  if (conversationId) {
    results = results.filter((m) => m.conversationId === conversationId);
  }

  if (messageType && messageType !== "ALL") {
    results = results.filter((m) => m.messageType === messageType);
  }

  if (senderId) {
    results = results.filter((m) => m.senderId === senderId);
  }

  if (query) {
    results = results.filter(
      (m) =>
        m.content.toLowerCase().includes(query) ||
        m.senderName.toLowerCase().includes(query) ||
        m.attachments?.some((a) => a.fileName.toLowerCase().includes(query))
    );
  }

  res.json({ success: true, count: results.length, messages: results });
});

// Notifications Routes
app.get("/api/notifications", (req, res) => {
  const userId = (req.query.userId as string) || "user_raj";
  const userNotifs = notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, notifications: userNotifs });
});

app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) notif.isRead = true;
  res.json({ success: true, notification: notif });
});

app.put("/api/notifications/read-all", (req, res) => {
  const { userId } = req.body;
  notifications.forEach((n) => {
    if (n.userId === userId) n.isRead = true;
  });
  res.json({ success: true, message: "All notifications marked as read." });
});

// Reports & Moderation Routes
app.post("/api/reports", (req, res) => {
  const {
    reportedBy,
    reportedUser,
    reason,
    description,
    targetMessageId,
  } = req.body;

  const reporter = users.find((u) => u.id === reportedBy);
  const target = users.find((u) => u.id === reportedUser);
  const targetMsg = targetMessageId
    ? messages.find((m) => m.id === targetMessageId)
    : undefined;

  const newReport: Report = {
    id: `rep_${Date.now()}`,
    reportedBy: reportedBy || "user_raj",
    reporterName: reporter?.fullName || "Raj Saroj",
    reportedUser: reportedUser || "Unknown",
    reportedUserName: target?.fullName || target?.username || "Unknown User",
    targetMessageId,
    targetMessageContent: targetMsg?.content,
    reason: reason || "OTHER",
    description: description || "Report submitted by user.",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  reports.unshift(newReport);
  res.status(201).json({ success: true, report: newReport });
});

app.get("/api/reports", (req, res) => {
  res.json({ success: true, reports });
});

app.put("/api/reports/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const report = reports.find((r) => r.id === id);
  if (!report) return res.status(404).json({ success: false, message: "Report not found" });

  report.status = status;
  res.json({ success: true, report });
});

// Admin Dashboard & Moderation Routes
app.get("/api/admin/metrics", (req, res) => {
  const activeCount = users.filter((u) => u.status === "ONLINE").length;
  const groupsCount = conversations.filter((c) => c.type === "GROUP").length;
  const totalBlocked = users.reduce((acc, u) => acc + u.blockedUserIds.length, 0);

  const metrics: AdminMetrics = {
    totalUsers: users.length,
    activeUsers: activeCount,
    messagesToday: messages.length + 1420,
    groupsCount,
    reportsCount: reports.filter((r) => r.status === "PENDING").length,
    blockedUsersCount: totalBlocked + 2,
    dailyMessagesData: [
      { date: "Mon", count: 2400 },
      { date: "Tue", count: 3800 },
      { date: "Wed", count: 5200 },
      { date: "Thu", count: 4600 },
      { date: "Fri", count: 7100 },
      { date: "Sat", count: 6400 },
      { date: "Sun", count: 8300 },
    ],
    activeUsersData: [
      { hour: "00:00", count: 320 },
      { hour: "04:00", count: 180 },
      { hour: "08:00", count: 950 },
      { hour: "12:00", count: 2400 },
      { hour: "16:00", count: 3100 },
      { hour: "20:00", count: 4200 },
    ],
    registrationTrend: [
      { month: "Jan", users: 120 },
      { month: "Feb", users: 280 },
      { month: "Mar", users: 590 },
      { month: "Apr", users: 920 },
      { month: "May", users: 1450 },
    ],
  };

  res.json({ success: true, metrics });
});

// ==========================================
// Gemini AI Endpoints (Server-Side)
// ==========================================

// 1. AI Assistant Chat
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { prompt, conversationContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const systemInstruction = `You are ChatFlow AI, the built-in intelligent conversational assistant of the ChatFlow communication platform.
You assist developers and users with code explanations (Java, Spring Boot, MySQL, WebSocket, React, TypeScript), system design, debugging, and productivity.
Keep explanations crisp, formatted with clear markdown, headings, code snippets, and helpful tips.`;

    const contents = conversationContext
      ? `Recent Conversation Context:\n${conversationContext}\n\nUser Question:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      text: response.text || "I'm here to help with your questions!",
    });
  } catch (error: any) {
    console.error("AI assistant generation error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate AI response.",
    });
  }
});

// 2. AI Chat Summarization
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { conversationId } = req.body;
    const conv = conversations.find((c) => c.id === conversationId);
    const convMsgs = messages
      .filter((m) => m.conversationId === conversationId && !m.isDeleted)
      .slice(-30);

    if (convMsgs.length === 0) {
      return res.json({
        success: true,
        summary: "No recent messages to summarize in this conversation.",
      });
    }

    const conversationTranscript = convMsgs
      .map((m) => `[${m.createdAt}] ${m.senderName}: ${m.content}`)
      .join("\n");

    const prompt = `Please analyze the following conversation transcript from ChatFlow and produce a structured, high-value summary with:
1. 📌 Key Topic & Discussion Overview
2. 🎯 Action Items & Next Steps
3. 💡 Decisions Made & Milestones
4. ⏰ Deadlines or Dates Mentioned

Conversation (${conv?.name || "Direct Chat"}):
${conversationTranscript}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an executive meeting & conversation summarizer. Output well-formatted markdown bullet points.",
      },
    });

    res.json({
      success: true,
      summary: response.text || "Summary generated successfully.",
    });
  } catch (error: any) {
    console.error("AI summarization error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to summarize conversation.",
    });
  }
});

// 3. AI Smart Reply Suggestions
app.post("/api/ai/smart-reply", async (req, res) => {
  try {
    const { conversationId, lastMessageText, senderName } = req.body;

    const prompt = `Given the last received message: "${lastMessageText}" from "${senderName}", generate exactly 3 short, natural, and helpful quick reply suggestions that a user could tap to respond instantly.
Return ONLY a valid JSON array of 3 strings (e.g. ["Yes, sounds good 👍", "I'll check and update you shortly.", "Can we reschedule to 4 PM?"]). Do not include code fences or extra text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(response.text || "[]");
    } catch {
      suggestions = ["Yes, got it! 👍", "I'll check this right away.", "Thanks for the update!"];
    }

    res.json({
      success: true,
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 3) : [],
    });
  } catch (error: any) {
    console.error("AI smart reply error:", error);
    // Graceful fallback
    res.json({
      success: true,
      suggestions: ["Yes, sure! 👍", "I will get back to you shortly.", "Sounds great!"],
    });
  }
});

// 4. AI Toxicity & Content Moderation
app.post("/api/ai/moderation", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.json({ success: true, isSafe: true, reason: "Empty content" });
    }

    const prompt = `Analyze this chat message for toxicity, harassment, spam, hate speech, or inappropriate content.
Message: "${content}"

Return a JSON object with:
- isSafe: boolean (true if safe, false if toxic or spam)
- category: "SAFE" | "SPAM" | "HARASSMENT" | "HATE_SPEECH" | "INAPPROPRIATE"
- score: number (0.0 to 1.0 toxicity risk score)
- explanation: brief explanation`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let analysis: any = { isSafe: true, category: "SAFE", score: 0.0, explanation: "Safe content" };
    try {
      analysis = JSON.parse(response.text || "{}");
    } catch (e) {
      console.warn("Failed to parse moderation JSON:", e);
    }

    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error("AI moderation error:", error);
    res.json({
      success: true,
      analysis: { isSafe: true, category: "SAFE", score: 0.0, explanation: "Fallback pass" },
    });
  }
});

// ==========================================
// Vite Middleware & Static Serving
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ChatFlow Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
