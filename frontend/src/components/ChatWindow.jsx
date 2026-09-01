import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { socketService } from '../websocket/socketService.js';
import { Send, Smile, Paperclip } from 'lucide-react';

export const ChatWindow = ({ conversationId, user, conversations }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      socketService.joinConversation(conversationId);
      
      // Listen for new messages
      const unsubscribe = socketService.on('chat:message', (payload) => {
        if (payload.conversationId === conversationId) {
          setMessages((prev) => [...prev, payload.message]);
        }
      });

      return unsubscribe;
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.getMessages(conversationId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const result = await api.sendMessage({
        conversationId,
        senderId: user.id,
        content: messageText,
        messageType: 'TEXT',
      });

      if (result.success) {
        setMessageText('');
        setMessages((prev) => [...prev, result.message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, user.fullName, true);
      setTimeout(() => {
        setIsTyping(false);
        socketService.sendTyping(conversationId, user.fullName, false);
      }, 2000);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === user.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-900'
              }`}
            >
              {msg.senderId !== user.id && (
                <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
              )}
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          className="text-gray-600 hover:text-gray-900 p-2"
          title="Add attachment"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="text-gray-600 hover:text-gray-900 p-2"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </form>
    </div>
  );
};
