import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Zap, Shield, Sparkles } from 'lucide-react';

export const MultiUserSimulatorBar: React.FC<{
  onOpenAiAssistant?: () => void;
}> = ({ onOpenAiAssistant }) => {
  const { user, allUsers, switchUser } = useAuth();

  const demoUsers = allUsers.filter((u) => u.id !== 'user_ai');

  return (
    <div
      id="multi-user-simulator-bar"
      className="bg-slate-950/90 backdrop-blur border-b border-slate-800 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-300 z-30"
    >
      <div className="flex items-center gap-2 font-medium text-slate-200">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="font-semibold tracking-wide">Multi-User Live Simulator</span>
        </div>
        <span className="text-slate-400 hidden md:inline text-[11px]">
          Switch active persona to test real-time WebSocket messaging, reactions & status sync:
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {demoUsers.map((u) => {
          const isActive = user?.id === u.id;
          return (
            <button
              key={u.id}
              id={`switch-user-${u.username}`}
              onClick={() => switchUser(u.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <img
                src={u.profileImage}
                alt={u.fullName}
                className="w-4 h-4 rounded-full object-cover border border-white/20"
              />
              <span>{u.fullName.split(' ')[0]}</span>
              {u.role === 'ADMIN' && (
                <Shield className="w-3 h-3 text-amber-400" />
              )}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          );
        })}

        {onOpenAiAssistant && (
          <button
            id="open-ai-assistant-header-btn"
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-700/40 text-[11px] font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>ChatFlow AI</span>
          </button>
        )}
      </div>
    </div>
  );
};
