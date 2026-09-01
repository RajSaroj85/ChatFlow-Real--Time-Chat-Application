import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { User } from '../types';
import {
  X,
  User as UserIcon,
  Shield,
  Lock,
  Phone,
  Mail,
  Edit2,
  Check,
  UserX,
  Sparkles,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'privacy' | 'blocked';
}

const avatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { user, updateUser, allUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'blocked'>(initialTab);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profileImage || avatarPresets[0]);

  // Privacy states
  const [whoCanMessage, setWhoCanMessage] = useState(user?.privacy?.whoCanMessageMe || 'EVERYONE');
  const [whoCanSeeOnline, setWhoCanSeeOnline] = useState(user?.privacy?.whoCanSeeOnlineStatus || 'EVERYONE');
  const [whoCanSeeLastSeen, setWhoCanSeeLastSeen] = useState(user?.privacy?.whoCanSeeLastSeen || 'EVERYONE');
  const [whoCanAddToGroups, setWhoCanAddToGroups] = useState(user?.privacy?.whoCanAddToGroups || 'EVERYONE');

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser({
      fullName,
      bio,
      phone,
      profileImage: selectedAvatar,
      privacy: {
        whoCanMessageMe: whoCanMessage,
        whoCanSeeOnlineStatus: whoCanSeeOnline,
        whoCanSeeLastSeen,
        whoCanAddToGroups,
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleUnblock = async (targetUserId: string) => {
    await api.unblockUser(user.id, targetUserId);
    const updatedBlocked = (user.blockedUserIds || []).filter((id) => id !== targetUserId);
    await updateUser({ blockedUserIds: updatedBlocked });
  };

  const blockedUserObjects = (user.blockedUserIds || [])
    .map((id) => allUsers.find((u) => u.id === id))
    .filter(Boolean) as User[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Account Settings & Profile</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-3 border-b border-slate-800 gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy Controls
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'blocked'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocked Users ({user.blockedUserIds?.length || 0})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-4 flex-1">
          {isSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Profile and privacy preferences updated successfully!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAvatar}
                    alt={user.fullName}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {avatarPresets.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedAvatar(img)}
                        className={`p-0.5 rounded-full ${
                          selectedAvatar === img ? 'ring-2 ring-indigo-400' : 'opacity-60'
                        }`}
                      >
                        <img src={img} alt="Preset" className="w-8 h-8 rounded-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${user.username}`}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bio / Status Note
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Hey there! I am using ChatFlow."
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Who can send me direct messages:
                </label>
                <select
                  value={whoCanMessage}
                  onChange={(e) => setWhoCanMessage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="CONTACTS">Contacts Only</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Who can see my Online Status:
                </label>
                <select
                  value={whoCanSeeOnline}
                  onChange={(e) => setWhoCanSeeOnline(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="CONTACTS">Contacts Only</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Who can see my Last Seen timestamp:
                </label>
                <select
                  value={whoCanSeeLastSeen}
                  onChange={(e) => setWhoCanSeeLastSeen(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="CONTACTS">Contacts Only</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Who can add me to Groups:
                </label>
                <select
                  value={whoCanAddToGroups}
                  onChange={(e) => setWhoCanAddToGroups(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="CONTACTS">Contacts Only</option>
                  <option value="NOBODY">Nobody</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-2">
              {blockedUserObjects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <UserX className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>You have not blocked any contacts.</p>
                </div>
              ) : (
                blockedUserObjects.map((bUser) => (
                  <div
                    key={bUser.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={bUser.profileImage}
                        alt={bUser.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{bUser.fullName}</p>
                        <p className="text-[10px] text-slate-400">@{bUser.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(bUser.id)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab !== 'blocked' && (
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all mt-4"
            >
              Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
