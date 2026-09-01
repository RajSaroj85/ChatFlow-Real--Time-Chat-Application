import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Conversation, User } from '../types';
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Pin,
  VolumeX,
  Sparkles,
  Filter,
  CheckCheck,
  Check,
  UserPlus,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSearch,
}) => {
  const { user, allUsers } = useAuth();
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'unread'>('all');

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'direct' && c.type !== 'PRIVATE') return false;
    if (activeTab === 'groups' && c.type !== 'GROUP') return false;
    if (activeTab === 'unread' && (!c.unreadCount || c.unreadCount === 0)) return false;

    // Search query
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();

    if (c.type === 'GROUP') {
      return (
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.lastMessage?.content.toLowerCase().includes(q)
      );
    } else {
      const otherMember = c.members.find((m) => m.userId !== user?.id);
      return (
        otherMember?.userName.toLowerCase().includes(q) ||
        c.lastMessage?.content.toLowerCase().includes(q)
      );
    }
  });

  const getConversationDetails = (c: Conversation) => {
    if (c.type === 'GROUP') {
      return {
        title: c.name || 'Group Chat',
        avatar: c.groupImage || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        isOnline: true,
        statusText: `${c.members.length} members`,
        isAi: false,
      };
    } else {
      const otherMember = c.members.find((m) => m.userId !== user?.id);
      const otherUser = allUsers.find((u) => u.id === otherMember?.userId);
      const isAi = otherMember?.userId === 'user_ai';

      return {
        title: otherUser?.fullName || otherMember?.userName || 'User',
        avatar: otherUser?.profileImage || otherMember?.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isOnline: otherUser?.status === 'ONLINE',
        statusText: isAi ? 'AI Assistant' : otherUser?.status === 'ONLINE' ? 'Online' : 'Offline',
        isAi,
      };
    }
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside
      id="chat-sidebar"
      className="w-full md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 select-none"
    >
      {/* Search and Action Bar */}
      <div className="p-3.5 border-b border-slate-800 space-y-3 bg-slate-900/90">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Chats
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              id="new-chat-btn"
              onClick={onOpenNewChat}
              title="Start New Direct Chat"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              id="new-group-btn"
              onClick={onOpenNewGroup}
              title="Create New Group"
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="sidebar-search-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={onOpenSearch}
            title="Advanced Search with Filters"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          {(['all', 'direct', 'groups', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              id={`filter-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div
        id="conversations-scroll-container"
        className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1"
      >
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-semibold text-slate-300">No conversations found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Start a new chat or create a group using the buttons above.
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const details = getConversationDetails(conv);
            const lastMsg = conv.lastMessage;

            return (
              <button
                key={conv.id}
                id={`conversation-item-${conv.id}`}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all relative group ${
                  isActive
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-white shadow-sm'
                    : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                }`}
              >
                {/* Avatar with Online Badge */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <img
                    src={details.avatar}
                    alt={details.title}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  {details.isAi ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] ring-2 ring-slate-900">
                      🤖
                    </span>
                  ) : details.isOnline ? (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                  ) : (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-600 ring-2 ring-slate-900"></span>
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'
                      }`}
                    >
                      {details.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-1">
                      {formatMessageTime(lastMsg?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-400 truncate flex-1 leading-tight">
                      {lastMsg ? (
                        <>
                          {lastMsg.senderId === user?.id && (
                            <span className="text-slate-500 mr-1">You:</span>
                          )}
                          {lastMsg.messageType === 'IMAGE' && '📷 [Image] '}
                          {lastMsg.messageType === 'DOCUMENT' && '📄 [Document] '}
                          {lastMsg.messageType === 'AUDIO' && '🎤 [Voice Note] '}
                          {lastMsg.content}
                        </>
                      ) : (
                        <span className="italic text-slate-500">No messages yet</span>
                      )}
                    </p>

                    {/* Unread badge & Pin status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {conv.isPinned && <Pin className="w-3 h-3 text-indigo-400" />}
                      {conv.isMuted && <VolumeX className="w-3 h-3 text-slate-500" />}
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] min-w-4 text-center">
                          {conv.unreadCount}
                        </span>
                      ) : lastMsg?.senderId === user?.id ? (
                        <span className="text-[11px]">
                          {lastMsg.status === 'READ' ? (
                            <span className="text-cyan-400 font-bold">🔵✓✓</span>
                          ) : lastMsg.status === 'DELIVERED' ? (
                            <span className="text-slate-400">✓✓</span>
                          ) : (
                            <span className="text-slate-500">✓</span>
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
