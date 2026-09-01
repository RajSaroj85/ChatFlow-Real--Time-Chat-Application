import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { socketService } from './websocket/socketService';
import type { Conversation, Message } from './types';
import { Navbar } from './components/Navbar';
import { MultiUserSimulatorBar } from './components/MultiUserSimulatorBar';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AuthModal } from './components/AuthModal';
import { NewChatModal } from './components/NewChatModal';
import { GroupModal } from './components/GroupModal';
import { GroupInfoDrawer } from './components/GroupInfoDrawer';
import { SearchModal } from './components/SearchModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { MessageSquare, ArrowLeft, Bot } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin'>('landing');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [groupInfoDrawerOpen, setGroupInfoDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState<'profile' | 'privacy' | 'blocked'>('profile');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetMessage, setReportTargetMessage] = useState<Message | null>(null);
  const [aiAssistantDrawerOpen, setAiAssistantDrawerOpen] = useState(false);

  // Load conversations for active user
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
    } catch (e) {
      console.error('Error fetching conversations:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Real-time socket updates for conversations & new messages
  useEffect(() => {
    const unsubMsg = socketService.on('chat:message', (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === payload.conversationId) {
            const isCurrentActive = activeConversationId === c.id;
            return {
              ...c,
              lastMessage: payload.message,
              updatedAt: payload.message.createdAt,
              unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    const unsubStatus = socketService.on('chat:status_update', (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === payload.conversationId && c.lastMessage) {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, status: payload.status },
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubMsg();
      unsubStatus();
    };
  }, [activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Persona Simulator Switcher Top Bar */}
      <MultiUserSimulatorBar
        onOpenAiAssistant={() => setAiAssistantDrawerOpen(true)}
      />

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => {
          setUserProfileTab('profile');
          setUserProfileModalOpen(true);
        }}
        onOpenSettings={() => {
          setUserProfileTab('privacy');
          setUserProfileModalOpen(true);
        }}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setCurrentView('dashboard');
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentView === 'landing' ? (
          <div className="flex-1 overflow-y-auto">
            <LandingPage
              onGetStarted={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              onLogin={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              onDirectDemo={() => {
                setCurrentView('dashboard');
              }}
            />
          </div>
        ) : currentView === 'admin' ? (
          <AdminDashboard />
        ) : (
          /* Dashboard: Sidebar + Chat Window */
          <div className="flex-1 flex w-full h-full overflow-hidden relative">
            {/* Sidebar list (hidden on mobile if a conversation is open) */}
            <div
              className={`h-full ${
                activeConversationId ? 'hidden md:flex' : 'flex w-full'
              }`}
            >
              <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onOpenNewChat={() => setNewChatModalOpen(true)}
                onOpenNewGroup={() => setNewGroupModalOpen(true)}
                onOpenSearch={() => setSearchModalOpen(true)}
              />
            </div>

            {/* Active Chat or Empty Placeholder */}
            {activeConversation ? (
              <div
                className={`flex-1 flex flex-col h-full ${
                  !activeConversationId ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Mobile back to list bar */}
                <div className="md:hidden bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center gap-2">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to chats
                  </button>
                </div>

                <ChatWindow
                  conversation={activeConversation}
                  onOpenGroupInfo={() => setGroupInfoDrawerOpen(true)}
                  onReportMessage={(msg) => {
                    setReportTargetMessage(msg);
                    setReportModalOpen(true);
                  }}
                  onSearchInChat={() => setSearchModalOpen(true)}
                />
              </div>
            ) : (
              <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Select a Conversation
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Choose a chat from the sidebar or click &ldquo;+&rdquo; to start a direct message or group channel.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onConversationCreated={(id) => {
          fetchConversations();
          setActiveConversationId(id);
          setCurrentView('dashboard');
        }}
      />

      <GroupModal
        isOpen={newGroupModalOpen}
        onClose={() => setNewGroupModalOpen(false)}
        onGroupCreated={(id) => {
          fetchConversations();
          setActiveConversationId(id);
          setCurrentView('dashboard');
        }}
      />

      {activeConversation && activeConversation.type === 'GROUP' && (
        <GroupInfoDrawer
          conversation={activeConversation}
          isOpen={groupInfoDrawerOpen}
          onClose={() => setGroupInfoDrawerOpen(false)}
          onGroupUpdated={fetchConversations}
          onGroupDeleted={() => {
            fetchConversations();
            setActiveConversationId(null);
          }}
        />
      )}

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        conversations={conversations}
        onSelectMessage={(convId, msgId) => {
          setActiveConversationId(convId);
          setCurrentView('dashboard');
        }}
      />

      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        initialTab={userProfileTab}
      />

      <ReportModal
        isOpen={reportModalOpen}
        message={reportTargetMessage}
        onClose={() => {
          setReportModalOpen(false);
          setReportTargetMessage(null);
        }}
      />

      <AiAssistantDrawer
        isOpen={aiAssistantDrawerOpen}
        onClose={() => setAiAssistantDrawerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
