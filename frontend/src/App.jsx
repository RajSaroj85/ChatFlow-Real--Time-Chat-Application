import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { api } from './services/api.js';
import { socketService } from './websocket/socketService.js';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ChatWindow } from './components/ChatWindow.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { MessageSquare } from 'lucide-react';

const MainApp = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const res = await api.getConversations(user.id);

      if (res.success) {
        setConversations(res.conversations);

        if (!activeConversationId && res.conversations.length > 0) {
          setActiveConversationId(res.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      socketService.connect(user.id);
    }
  }, [user]);

  // ==============================
  // USER NOT LOGGED IN
  // ==============================
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuthModal={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
        />

        {authModalOpen && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthModalOpen(false)}
            onSwitchMode={() => {
              setAuthMode(
                authMode === 'login' ? 'register' : 'login'
              );
            }}
          />
        )}
      </>
    );
  }

  // ==============================
  // USER LOGGED IN
  // ==============================
  return (
    <div className="flex h-screen bg-gray-100">

      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onRefresh={fetchConversations}
      />

      <div className="flex-1 flex flex-col">

        <Navbar user={user} />

        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            user={user}
            conversations={conversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">

              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />

              <p>Select a conversation to start chatting</p>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;