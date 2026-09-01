import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Conversation, User } from '../types';
import {
  X,
  Users,
  Shield,
  UserMinus,
  UserPlus,
  LogOut,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';

interface GroupInfoDrawerProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  onGroupUpdated: () => void;
  onGroupDeleted: () => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  conversation,
  isOpen,
  onClose,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const { user, allUsers } = useAuth();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const currentMemberRecord = conversation.members.find((m) => m.userId === user?.id);
  const isAdmin = currentMemberRecord?.role === 'ADMIN' || user?.role === 'ADMIN';

  // Available users to add
  const existingMemberIds = conversation.members.map((m) => m.userId);
  const potentialNewUsers = allUsers.filter(
    (u) => !existingMemberIds.includes(u.id) && u.id !== 'user_ai'
  );

  const handleAddMembers = async () => {
    if (selectedNewUserIds.length === 0 || !user) return;
    setIsUpdating(true);
    try {
      await api.addGroupMembers(conversation.id, selectedNewUserIds, user.id);
      setSelectedNewUserIds([]);
      setIsAddingMember(false);
      onGroupUpdated();
    } catch (e) {
      console.error('Failed to add members:', e);
    }
    setIsUpdating(false);
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!isAdmin && targetUserId !== user?.id) return;
    try {
      await api.removeGroupMember(conversation.id, targetUserId);
      if (targetUserId === user?.id) {
        onClose();
        onGroupDeleted();
      } else {
        onGroupUpdated();
      }
    } catch (e) {
      console.error('Failed to remove member:', e);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <h3 className="text-base font-bold text-white">Group Information</h3>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto space-y-6 flex-1">
        {/* Avatar & Title */}
        <div className="text-center">
          <img
            src={
              conversation.groupImage ||
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
            }
            alt={conversation.name}
            className="w-20 h-20 rounded-2xl object-cover mx-auto ring-2 ring-indigo-500/50 mb-3"
          />
          <h4 className="text-lg font-bold text-white">{conversation.name}</h4>
          <p className="text-xs text-slate-400 mt-1">{conversation.description || 'No description provided.'}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium">
            {conversation.members.length} Total Members
          </span>
        </div>

        {/* Member Management */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Members ({conversation.members.length})
            </h5>
            {isAdmin && (
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isAddingMember ? 'Cancel' : 'Add Members'}
              </button>
            )}
          </div>

          {/* Add Members Panel */}
          {isAddingMember && (
            <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <p className="text-xs font-semibold text-slate-200">Select Contacts to Add:</p>
              {potentialNewUsers.length === 0 ? (
                <p className="text-xs text-slate-500">All available contacts are already members.</p>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {potentialNewUsers.map((u) => {
                    const isSelected = selectedNewUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() =>
                          setSelectedNewUserIds((prev) =>
                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          )
                        }
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                          isSelected ? 'bg-indigo-600/30 text-white' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={u.profileImage} alt={u.fullName} className="w-6 h-6 rounded-full object-cover" />
                          <span>{u.fullName}</span>
                        </div>
                        <span className="text-xs">{isSelected ? '✓' : '+'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedNewUserIds.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={isUpdating}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {isUpdating ? 'Adding...' : `Add (${selectedNewUserIds.length}) Members`}
                </button>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {conversation.members.map((m) => {
              const u = allUsers.find((userObj) => userObj.id === m.userId);
              return (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        m.userAvatar ||
                        u?.profileImage ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={m.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {m.userName}
                        {m.userId === user?.id && <span className="text-slate-400 font-normal">(You)</span>}
                      </p>
                      <span className="text-[10px] text-indigo-400 font-semibold">{m.role}</span>
                    </div>
                  </div>

                  {isAdmin && m.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      title="Remove Member"
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => handleRemoveMember(user?.id || '')}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};
