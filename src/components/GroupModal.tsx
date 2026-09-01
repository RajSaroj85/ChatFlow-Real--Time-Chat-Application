import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User } from '../types';
import { X, Users, Check, ArrowRight } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const groupAvatarPresets = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80',
];

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { user, allUsers } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(groupAvatarPresets[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectableUsers = allUsers.filter((u) => u.id !== user?.id && u.id !== 'user_ai');

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setErrorMsg('Please provide a group name.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setErrorMsg('Please select at least 1 member for the group.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        groupImage: selectedAvatar,
        memberIds: selectedMemberIds,
        creatorId: user.id,
      });

      if (res.success && res.conversation) {
        onGroupCreated(res.conversation.id);
        onClose();
      } else {
        setErrorMsg('Failed to create group. Please try again.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error creating group');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Users className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Create New Group</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleCreateGroup} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Avatar
            </label>
            <div className="flex items-center gap-3">
              {groupAvatarPresets.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(img)}
                  className={`relative rounded-xl p-0.5 transition-transform ${
                    selectedAvatar === img
                      ? 'ring-2 ring-indigo-500 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Preset" className="w-12 h-12 rounded-xl object-cover" />
                  {selectedAvatar === img && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Spring Boot Developers 🚀"
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="e.g. Real-time architecture discussions and updates."
              className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Group Members ({selectedMemberIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950/50 p-2 rounded-xl border border-slate-800/80">
              {selectableUsers.map((u) => {
                const isSelected = selectedMemberIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-600/20 text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.profileImage}
                        alt={u.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400">@{u.username}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Creating Channel...' : 'Create Group Channel'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
