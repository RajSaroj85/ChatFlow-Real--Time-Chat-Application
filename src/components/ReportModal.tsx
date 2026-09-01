import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Message } from '../types';
import { X, Flag, AlertTriangle, Check } from 'lucide-react';

interface ReportModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

const reportReasons = [
  { id: 'SPAM', label: 'Spam or unsolicited advertising' },
  { id: 'HARASSMENT', label: 'Harassment, bullying or hate speech' },
  { id: 'FAKE_ACCOUNT', label: 'Impersonation or fake account' },
  { id: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate media or explicit content' },
  { id: 'OTHER', label: 'Other violation of Community Guidelines' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  message,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState(reportReasons[0].id);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !message) return null;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await api.submitReport({
        reportedBy: user.id,
        reportedUser: message.senderId,
        reason: selectedReason,
        description: description.trim() || 'User submitted report',
        targetMessageId: message.id,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.error('Failed to submit report:', e);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400">
            <Flag className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Report Message or User</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Report Received</h4>
            <p className="text-xs text-slate-400">
              Thank you for keeping ChatFlow safe. Our moderation team and AI safety filter will review this incident.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
            {/* Message preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                Reported Message from {message.senderName}:
              </p>
              <p className="text-slate-200 line-clamp-2 italic">&ldquo;{message.content}&rdquo;</p>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Reason:
              </label>
              <div className="space-y-1.5">
                {reportReasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      selectedReason === r.id
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/25 transition-all"
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Report for Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
