import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../websocket/socketService';
import { api } from '../services/api';
import type { Notification } from '../types';
import {
  MessageSquare,
  Bell,
  Shield,
  User as UserIcon,
  LogOut,
  Settings,
  CheckCircle2,
  Wifi,
  WifiOff,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Home,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'admin';
  setCurrentView: (view: 'landing' | 'dashboard' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenProfile,
  onOpenSettings,
  onSelectConversation,
}) => {
  const { user, logout } = useAuth();
  const [isWsConnected, setIsWsConnected] = useState<boolean>(socketService.isConnected);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubStatus = socketService.onStatusChange((status) => {
      setIsWsConnected(status);
    });
    return () => unsubStatus();
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications(user.id);
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    const unsubNotif = socketService.on('notification:new', (payload) => {
      if (payload.userId === user?.id) {
        setNotifications((prev) => [payload.notification, ...prev]);
      }
    });

    const unsubMsg = socketService.on('chat:message', (payload) => {
      if (user && payload.message.senderId !== user.id) {
        // create a lightweight local notification if not active
        const newNotif: Notification = {
          id: `notif_${Date.now()}`,
          userId: user.id,
          type: 'NEW_MESSAGE',
          title: payload.message.senderName,
          message: payload.message.content || 'Sent an attachment',
          referenceId: payload.conversationId,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    });

    return () => {
      unsubNotif();
      unsubMsg();
    };
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await api.markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notif: Notification) => {
    await api.markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setShowNotifDropdown(false);
    if (notif.referenceId && onSelectConversation) {
      setCurrentView('dashboard');
      onSelectConversation(notif.referenceId);
    }
  };

  return (
    <header
      id="main-navbar"
      className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-6 h-16 flex items-center justify-between transition-colors"
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <button
          id="navbar-brand-logo"
          onClick={() => setCurrentView(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                ChatFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Real-Time Communication Platform
            </p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            id="nav-link-home"
            onClick={() => setCurrentView('landing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'landing'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            id="nav-link-dashboard"
            onClick={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                onOpenAuth('login');
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Messages
          </button>
          <button
            id="nav-link-admin"
            onClick={() => {
              if (user) {
                setCurrentView('admin');
              } else {
                onOpenAuth('login');
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'admin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            Admin & Analytics
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* WebSocket Status Indicator */}
        <div
          id="ws-status-pill"
          title={isWsConnected ? 'WebSocket Connected (/ws STOMP)' : 'WebSocket Connecting...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isWsConnected
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
          }`}
        >
          {isWsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline text-[11px]">Live WebSocket</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="hidden sm:inline text-[11px]">Connecting...</span>
            </>
          )}
        </div>

        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notifications-dropdown-btn"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    id="unread-notifications-badge"
                    className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500 text-white shadow"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div
                  id="notifications-popover"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-0 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-600 text-white font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                            !n.isRead ? 'bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {n.type === 'NEW_MESSAGE' ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : n.type === 'REACTION' ? (
                              <Sparkles className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Menu */}
            <div className="relative" ref={userRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={user.profileImage}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/50 group-hover:ring-indigo-400"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-white group-hover:text-indigo-300 leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400">@{user.username}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </button>

              {/* Profile Dropdown */}
              {showUserDropdown && (
                <div
                  id="user-menu-popover"
                  className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-sm font-bold text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Online
                    </span>
                  </div>

                  <button
                    id="menu-btn-profile"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    My Profile
                  </button>

                  <button
                    id="menu-btn-settings"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Privacy & Settings
                  </button>

                  {user.role === 'ADMIN' && (
                    <button
                      id="menu-btn-admin"
                      onClick={() => {
                        setShowUserDropdown(false);
                        setCurrentView('admin');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Control Center
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    id="menu-btn-logout"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      setCurrentView('landing');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="navbar-login-btn"
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>
            <button
              id="navbar-get-started-btn"
              onClick={() => onOpenAuth('register')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
