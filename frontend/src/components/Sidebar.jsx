import React from 'react';
import { Search, Plus } from 'lucide-react';

export const Sidebar = ({ conversations, activeConversationId, onSelectConversation, onRefresh }) => {
  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search conversations..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
              activeConversationId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {conv.type === 'GROUP' ? (
                <div className="w-12 h-12 rounded-lg bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                  {conv.name?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">👤</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {conv.name || conv.members?.map(m => m.userName).join(', ')}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {conv.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
              {conv.unreadCount && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
