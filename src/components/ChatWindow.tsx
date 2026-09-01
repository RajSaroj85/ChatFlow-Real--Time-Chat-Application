import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../websocket/socketService';
import { api } from '../services/api';
import type { Conversation, Message, User } from '../types';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  MoreVertical,
  Phone,
  Video,
  Sparkles,
  Search,
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  Flag,
  FileText,
  Download,
  X,
  Bot,
  Play,
  Pause,
  ArrowDown,
  Info,
  Maximize2,
} from 'lucide-react';

interface ChatWindowProps {
  conversation: Conversation;
  onOpenGroupInfo?: () => void;
  onReportMessage?: (message: Message) => void;
  onSearchInChat?: () => void;
}

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🚀', '🎉'];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onOpenGroupInfo,
  onReportMessage,
  onSearchInChat,
}) => {
  const { user, allUsers } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Call simulation modal
  const [activeCallModal, setActiveCallModal] = useState<'audio' | 'video' | null>(null);

  // Image zoom modal
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Auto scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const res = await api.getMessages(conversation.id);
      if (res.success) {
        setMessages(res.messages);
        socketService.sendReadReceipt(conversation.id);

        // Fetch smart replies for last message if it's from another user
        const lastMsg = res.messages[res.messages.length - 1];
        if (lastMsg && lastMsg.senderId !== user?.id && lastMsg.content) {
          fetchSmartReplies(lastMsg.content, lastMsg.senderName);
        }
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
    setIsLoadingMessages(false);
  };

  const fetchSmartReplies = async (text: string, sender: string) => {
    try {
      const res = await api.getSmartReplies(conversation.id, text, sender);
      if (res.success && res.suggestions) {
        setSmartReplies(res.suggestions);
      }
    } catch (e) {
      console.error('Failed to get smart replies:', e);
    }
  };

  useEffect(() => {
    loadMessages();
    socketService.joinConversation(conversation.id);
    setReplyingTo(null);
    setEditingMessage(null);
    setSmartReplies([]);
  }, [conversation.id]);

  // WebSocket listeners
  useEffect(() => {
    const unsubMsg = socketService.on('chat:message', (payload) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => [...prev, payload.message]);
        if (payload.message.senderId !== user?.id) {
          socketService.sendReadReceipt(conversation.id, [payload.message.id]);
          fetchSmartReplies(payload.message.content, payload.message.senderName);
        }
      }
    });

    const unsubStatus = socketService.on('chat:status_update', (payload) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            payload.messageIds.includes(m.id) ? { ...m, status: payload.status } : m
          )
        );
      }
    });

    const unsubTyping = socketService.on('chat:typing', (payload) => {
      if (payload.conversationId === conversation.id && payload.userId !== user?.id) {
        if (payload.isTyping) {
          setTypingUsers((prev) => Array.from(new Set([...prev, payload.userName])));
        } else {
          setTypingUsers((prev) => prev.filter((u) => u !== payload.userName));
        }
      }
    });

    const unsubReaction = socketService.on('chat:reaction', (payload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
        )
      );
    });

    return () => {
      unsubMsg();
      unsubStatus();
      unsubTyping();
      unsubReaction();
    };
  }, [conversation.id, user]);

  // Scroll to bottom
  useEffect(() => {
    if (!showScrollBottomBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
      setShowScrollBottomBtn(isScrolledUp);
    }
  };

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!isTyping && user) {
      setIsTyping(true);
      socketService.sendTyping(conversation.id, user.fullName, true);
    }

    // Auto clear typing after 2.5s
    setTimeout(() => {
      if (isTyping && user) {
        setIsTyping(false);
        socketService.sendTyping(conversation.id, user.fullName, false);
      }
    }, 2500);
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim() && !replyingTo) return;
    if (!user) return;

    if (editingMessage) {
      // Edit existing
      await api.editMessage(editingMessage.id, inputText.trim(), user.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id
            ? { ...m, content: inputText.trim(), isEdited: true, updatedAt: new Date().toISOString() }
            : m
        )
      );
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const payload = {
      conversationId: conversation.id,
      senderId: user.id,
      content: inputText.trim(),
      messageType: 'TEXT' as const,
      replyToMessageId: replyingTo?.id,
    };

    setInputText('');
    setReplyingTo(null);
    setSmartReplies([]);

    if (isTyping) {
      setIsTyping(false);
      socketService.sendTyping(conversation.id, user.fullName, false);
    }

    await api.sendMessage(payload);
  };

  // Quick Emoji Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const res = await api.reactToMessage(messageId, user.id, emoji);
    if (res.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string, deleteType: 'everyone' | 'for_me') => {
    if (!user) return;
    await api.deleteMessage(messageId, user.id, deleteType);
    if (deleteType === 'everyone') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted.' } : m
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  // File uploads
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fakeImageUrl = URL.createObjectURL(file);
    await api.sendMessage({
      conversationId: conversation.id,
      senderId: user.id,
      content: file.name,
      messageType: 'IMAGE',
      attachments: [
        {
          id: `att_${Date.now()}`,
          fileName: file.name,
          fileType: 'IMAGE',
          fileSize: file.size,
          fileUrl: fakeImageUrl,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setShowAttachmentMenu(false);
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fakeDocUrl = URL.createObjectURL(file);
    await api.sendMessage({
      conversationId: conversation.id,
      senderId: user.id,
      content: file.name,
      messageType: 'DOCUMENT',
      attachments: [
        {
          id: `att_${Date.now()}`,
          fileName: file.name,
          fileType: 'DOCUMENT',
          fileSize: file.size,
          fileUrl: fakeDocUrl,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setShowAttachmentMenu(false);
  };

  // Voice recording toggle
  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Finish recording and send
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      if (user && recordingDuration > 0) {
        await api.sendMessage({
          conversationId: conversation.id,
          senderId: user.id,
          content: `Voice Message (${recordingDuration}s)`,
          messageType: 'AUDIO',
          attachments: [
            {
              id: `att_${Date.now()}`,
              fileName: `voice_note_${Date.now()}.mp3`,
              fileType: 'AUDIO',
              fileSize: 45000,
              fileUrl: 'https://cdn.freesound.org/previews/536/536108_11861866-lq.mp3',
              duration: recordingDuration,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }
      setRecordingDuration(0);
    }
  };

  // Summarize chat with Gemini AI
  const handleSummarizeChat = async () => {
    setIsAiSummarizing(true);
    try {
      const res = await api.summarizeChat(conversation.id);
      if (res.success) {
        setChatSummary(res.summary);
      }
    } catch (e) {
      console.error('Error summarizing chat:', e);
    }
    setIsAiSummarizing(false);
  };

  // Recipient details
  const getHeaderDetails = () => {
    if (conversation.type === 'GROUP') {
      return {
        title: conversation.name || 'Group Chat',
        avatar: conversation.groupImage || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        subtitle: `${conversation.members.length} members`,
        isOnline: true,
      };
    } else {
      const otherMember = conversation.members.find((m) => m.userId !== user?.id);
      const otherUser = allUsers.find((u) => u.id === otherMember?.userId);
      const isAi = otherMember?.userId === 'user_ai';

      return {
        title: otherUser?.fullName || otherMember?.userName || 'User',
        avatar: otherUser?.profileImage || otherMember?.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        subtitle: isAi
          ? 'ChatFlow AI Assistant'
          : otherUser?.status === 'ONLINE'
          ? '🟢 Online'
          : '⚫ Offline',
        isOnline: otherUser?.status === 'ONLINE',
      };
    }
  };

  const header = getHeaderDetails();

  return (
    <div id="active-chat-window" className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleUploadImage}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleUploadDoc}
        accept=".pdf,.doc,.docx,.txt,.zip"
        className="hidden"
      />

      {/* Top Chat Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={header.avatar}
              alt={header.title}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700"
            />
            {header.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {header.title}
            </h2>
            <p className="text-xs text-slate-400 font-medium">{header.subtitle}</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* AI Summarizer Button */}
          <button
            id="chat-summarize-ai-btn"
            onClick={handleSummarizeChat}
            disabled={isAiSummarizing}
            title="Summarize Chat with Gemini AI"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-700/40 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">
              {isAiSummarizing ? 'Summarizing...' : 'AI Summary'}
            </span>
          </button>

          {/* Search inside conversation */}
          {onSearchInChat && (
            <button
              id="search-in-chat-btn"
              onClick={onSearchInChat}
              title="Search messages in chat"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Audio Call */}
          <button
            id="chat-audio-call-btn"
            onClick={() => setActiveCallModal('audio')}
            title="Start Audio Call"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            id="chat-video-call-btn"
            onClick={() => setActiveCallModal('video')}
            title="Start Video Call"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Group details or drawer */}
          {conversation.type === 'GROUP' && onOpenGroupInfo && (
            <button
              id="open-group-info-btn"
              onClick={onOpenGroupInfo}
              title="View Group Details & Members"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message List Scroll Area */}
      <div
        id="messages-container"
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 mb-3 border border-slate-800">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No messages here yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Say hello or ask ChatFlow AI for assistance to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const repliedMsg = msg.replyToMessageId
              ? messages.find((m) => m.id === msg.replyToMessageId)
              : null;

            return (
              <div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Sender Avatar (if not me in group) */}
                  {!isMe && (
                    <img
                      src={
                        msg.senderAvatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 ring-1 ring-slate-800"
                    />
                  )}

                  {/* Bubble Box */}
                  <div
                    className={`relative rounded-2xl p-3 shadow-md transition-all text-xs sm:text-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                    }`}
                  >
                    {/* Group Sender Name */}
                    {!isMe && conversation.type === 'GROUP' && (
                      <p className="text-[11px] font-bold text-indigo-400 mb-1">
                        {msg.senderName}
                      </p>
                    )}

                    {/* Replied Message Quote Preview */}
                    {repliedMsg && (
                      <div className="mb-2 p-2 rounded-lg bg-black/25 border-l-2 border-indigo-400 text-xs text-slate-200">
                        <p className="font-semibold text-[10px] text-indigo-300">
                          {repliedMsg.senderName}
                        </p>
                        <p className="truncate text-[11px] text-slate-300">{repliedMsg.content}</p>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.messageType === 'IMAGE' && msg.attachments?.[0] && (
                      <div className="mb-2 rounded-xl overflow-hidden cursor-pointer relative group/img">
                        <img
                          src={msg.attachments[0].fileUrl}
                          alt="Attachment"
                          onClick={() => setZoomImageUrl(msg.attachments![0].fileUrl)}
                          className="max-h-60 rounded-xl object-cover hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    {/* Document Attachment */}
                    {msg.messageType === 'DOCUMENT' && msg.attachments?.[0] && (
                      <div className="mb-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {msg.attachments[0].fileName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {(msg.attachments[0].fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <a
                          href={msg.attachments[0].fileUrl}
                          download={msg.attachments[0].fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Audio Voice Note Player */}
                    {msg.messageType === 'AUDIO' && msg.attachments?.[0] && (
                      <div className="mb-2 p-2 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center gap-3 min-w-[200px]">
                        <button
                          onClick={() => {
                            const audio = new Audio(msg.attachments![0].fileUrl);
                            audio.play().catch(() => {});
                          }}
                          className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0"
                        >
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>
                        <div className="flex-1">
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-indigo-400"></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>0:0{msg.attachments[0].duration || 5}</span>
                            <span>Voice Note</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Message Content */}
                    <div className="whitespace-pre-wrap break-words leading-relaxed font-normal">
                      {msg.isDeleted ? (
                        <span className="italic text-slate-400">{msg.content}</span>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Bubble Metadata (Time, Edited, Delivery Checks) */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                        isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.isEdited && <span className="italic">(edited)</span>}
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {isMe && (
                        <span>
                          {msg.status === 'READ' ? (
                            <span className="text-cyan-300 font-bold">🔵✓✓</span>
                          ) : msg.status === 'DELIVERED' ? (
                            <span>✓✓</span>
                          ) : (
                            <span>✓</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Emoji Reactions List */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 -mb-1">
                        {msg.reactions.map((r, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleReaction(msg.id, r.emoji)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs text-white shadow-sm hover:scale-105 transition-transform"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] text-slate-300 font-bold">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Action Menu */}
                  <div
                    className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-lg text-slate-400 flex-shrink-0 ${
                      isMe ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Quick Reactions */}
                    {quickEmojis.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="hover:scale-125 transition-transform p-0.5 text-xs"
                      >
                        {emoji}
                      </button>
                    ))}

                    {/* Reply */}
                    <button
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className="p-1 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit (if me) */}
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => {
                          setEditingMessage(msg);
                          setInputText(msg.content);
                        }}
                        title="Edit Message"
                        className="p-1 hover:text-white hover:bg-slate-800 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    {isMe && !msg.isDeleted && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                        title="Delete for Everyone"
                        className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Report */}
                    {!isMe && onReportMessage && (
                      <button
                        onClick={() => onReportMessage(msg)}
                        title="Report Message"
                        className="p-1 hover:text-amber-400 hover:bg-slate-800 rounded"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium py-1 animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
            </span>
            <span>{typingUsers.join(', ')} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute right-6 bottom-24 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-110 z-30"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Gemini AI Smart Replies Toolbar */}
      {smartReplies.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3" />
            AI Suggestions:
          </span>
          {smartReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(reply);
              }}
              className="px-3 py-1 rounded-full bg-purple-950/60 hover:bg-purple-900 border border-purple-700/50 text-purple-200 text-xs font-medium whitespace-nowrap transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Replying/Editing Banner */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-indigo-400">
              {replyingTo ? `Replying to ${replyingTo.senderName}:` : 'Editing message:'}
            </span>
            <p className="text-slate-300 truncate">
              {replyingTo ? replyingTo.content : editingMessage?.content}
            </p>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInputText('');
            }}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 z-20">
        <div className="flex items-center gap-2 relative">
          {/* Attachment button & popover */}
          <div className="relative">
            <button
              id="attachment-menu-btn"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-40 space-y-1">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                >
                  <span>📷</span> Photos & Images
                </button>
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                >
                  <span>📄</span> Document / PDF
                </button>
              </div>
            )}
          </div>

          {/* Emoji button & popover */}
          <div className="relative">
            <button
              id="emoji-picker-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-40 grid grid-cols-4 gap-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-xl hover:bg-slate-800 rounded-lg transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Input or Voice Recording Bar */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-4 py-2 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-semibold">Recording voice note...</span>
              </div>
              <span className="font-mono text-xs font-bold">{recordingDuration}s</span>
            </div>
          ) : (
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message... (Enter to send)"
              className="flex-1 px-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          )}

          {/* Mic voice note recorder */}
          <button
            id="voice-record-btn"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl transition-colors ${
              isRecording
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isRecording ? 'Stop & Send Recording' : 'Record Voice Note'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            id="send-message-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim() && !isRecording}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AI Chat Summary Modal */}
      {chatSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-800/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Gemini AI Chat Summary</h3>
              </div>
              <button
                onClick={() => setChatSummary(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-slate-200 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
              {chatSummary}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setChatSummary(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Call Modal */}
      {activeCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <img
                src={header.avatar}
                alt={header.title}
                className="w-full h-full rounded-full object-cover ring-4 ring-indigo-500/50"
              />
              <span className="absolute inset-0 rounded-full ring-4 ring-indigo-500 animate-ping opacity-40"></span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{header.title}</h3>
              <p className="text-xs text-indigo-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Calling ({activeCallModal === 'audio' ? 'Voice HD' : 'Video 1080p'})...
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4">
              <button
                onClick={() => setActiveCallModal(null)}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-transform hover:scale-110"
              >
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <img
            src={zoomImageUrl}
            alt="Enlarged"
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
