import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  Send,
  Bot,
  Zap,
  HelpCircle,
  Code,
  BookOpen,
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatItem {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const presetPrompts = [
  'Explain WebSocket STOMP architecture in ChatFlow',
  'How do delivery receipts and read indicators sync?',
  'Draft a polite message rescheduling a team sync',
  'Explain JWT security token verification flow',
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your ChatFlow AI Copilot powered by Gemini 3.7. Ask me anything about system architecture, real-time messaging, or message drafting.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatItem = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await api.askAiAssistant(q);
      const aiReply: ChatItem = {
        sender: 'ai',
        text: res.success ? res.text : 'I encountered an issue generating a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (e) {
      console.error('AI assistant query error:', e);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-purple-800/40 shadow-2xl flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">ChatFlow AI Copilot</h3>
            <p className="text-[10px] text-purple-300 font-medium">Gemini 3.7 Flash</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[90%] text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-slate-800 border border-purple-500/20 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold mb-1">
                  <Bot className="w-3.5 h-3.5" />
                  ChatFlow AI
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.text}</div>
              <span className="text-[9px] text-slate-400 block text-right mt-1">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800 text-purple-300 text-xs w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Generating intelligent response...</span>
          </div>
        )}
      </div>

      {/* Preset Prompts */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Suggested Topics:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {presetPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-950 hover:text-purple-200 text-slate-300 border border-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
