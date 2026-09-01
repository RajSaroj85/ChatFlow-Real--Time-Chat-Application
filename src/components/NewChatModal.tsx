import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User } from '../types';
import { X, Search, MessageSquare, UserCheck, Bot } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const { user, allUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const availableUsers = allUsers.filter((u) => u.id !== user?.id);
  const filteredUsers = availableUsers.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const handleStartChat = async (targetUser: User) => {
    if (!user) return;
    setIsCreating(true);
    try {
      const res = await api.createDirectChat(user.id, targetUser.id);
      if (res.success && res.conversation) {
        onConversationCreated(res.conversation.id);
        onClose();
      }
    } catch (e) {
      console.error('Failed to start chat:', e);
    }
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white">Start New Conversation</h3>
            <p className="text-xs text-slate-400">Select a contact or ChatFlow AI</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-800/40">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No contacts found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isAi = u.id === 'user_ai';
              return (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  disabled={isCreating}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={u.profileImage}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      {isAi ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center text-[8px] text-white">
                          🤖
                        </span>
                      ) : u.status === 'ONLINE' ? (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                      ) : null}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 flex items-center gap-1.5">
                        {u.fullName}
                        {isAi && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                            AI
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
