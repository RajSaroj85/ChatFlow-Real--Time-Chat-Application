import React, { useState } from 'react';
import { api } from '../services/api';
import type { Message, Conversation } from '../types';
import {
  Search,
  X,
  FileText,
  Image,
  Mic,
  MessageSquare,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectMessage: (conversationId: string, messageId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectMessage,
}) => {
  const [query, setQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !selectedConvId && selectedType === 'ALL') return;

    setIsSearching(true);
    try {
      const res = await api.searchMessages({
        query: query.trim(),
        conversationId: selectedConvId || undefined,
        messageType: selectedType !== 'ALL' ? selectedType : undefined,
      });

      if (res.success) {
        setResults(res.messages);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
    setIsSearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Search className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Global Message Search</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Form */}
        <form onSubmit={handleSearch} className="p-4 border-b border-slate-800 space-y-3 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword in chat history..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Filter Conversation
              </label>
              <select
                value={selectedConvId}
                onChange={(e) => setSelectedConvId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Conversations</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'GROUP' ? c.name : 'Direct Chat'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Message Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Media Types</option>
                <option value="TEXT">Text Only</option>
                <option value="IMAGE">Photos & Images</option>
                <option value="DOCUMENT">Documents / PDFs</option>
                <option value="AUDIO">Voice Notes</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
          >
            {isSearching ? 'Searching...' : 'Search Messages'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-800/40">
          {!hasSearched ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Enter a search phrase or select media filters to locate messages.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching messages found.
            </div>
          ) : (
            results.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  onSelectMessage(msg.conversationId, msg.id);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-slate-800/70 text-left transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">{msg.content}</p>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-colors flex-shrink-0 mt-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
