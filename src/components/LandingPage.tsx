import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  Users,
  Paperclip,
  Bell,
  CheckCheck,
  Sparkles,
  Bot,
  Search,
  Mic,
  ArrowRight,
  Smile,
  Shield,
  Layers,
  Lock,
  MessageCircle,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDirectDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onDirectDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'features' | 'architecture' | 'ai'>('all');

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "Real-Time Messaging ⚡",
      desc: "Sub-second bidirectional communication powered by WebSocket STOMP protocol. Zero polling delays.",
      tag: "WebSocket",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Secure Authentication 🔐",
      desc: "Spring Security & JWT token-based identity verification with role-based access control.",
      tag: "Security",
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      title: "Group Conversations 👥",
      desc: "Create vibrant community and team channels with Admin, Moderator, and Member permission hierarchies.",
      tag: "Collaboration",
    },
    {
      icon: <Paperclip className="w-6 h-6 text-cyan-400" />,
      title: "File & Voice Sharing 📎",
      desc: "Seamlessly exchange PDFs, images, source code, and recorded voice notes with waveform playback.",
      tag: "Rich Media",
    },
    {
      icon: <Bell className="w-6 h-6 text-rose-400" />,
      title: "Instant Notifications 🔔",
      desc: "Never miss crucial updates with real-time mention badges, unread indicators, and activity alerts.",
      tag: "Presence",
    },
    {
      icon: <CheckCheck className="w-6 h-6 text-blue-400" />,
      title: "Read Receipts & Status ✓✓",
      desc: "Clear visual tracking: Sent (✓), Delivered (✓✓), and Read (🔵✓✓) indicators with typing presence.",
      tag: "Telemetry",
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-400" />,
      title: "Gemini AI Co-Pilot 🤖",
      desc: "Built-in ChatFlow AI assistant for code explanations, meeting summarization, and smart quick replies.",
      tag: "AI Powered",
    },
    {
      icon: <Shield className="w-6 h-6 text-amber-500" />,
      title: "Admin Moderation Hub 🛡️",
      desc: "Comprehensive platform metrics, spam detection, user reporting, and content moderation tools.",
      tag: "Governance",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/80">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-fade-in shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ChatFlow Real-Time Architecture & AI Assistant</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Connect. Chat. Share.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed font-normal">
            A fast, secure and real-time communication platform built for modern conversations. Engineered with WebSocket STOMP broadcasting, rich media sharing, and intelligent Gemini AI features.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              id="hero-get-started-btn"
              onClick={onGetStarted}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-live-demo-btn"
              onClick={onDirectDemo}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700/80 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Launch Live Chat Demo
            </button>
            <button
              id="hero-login-btn"
              onClick={onLogin}
              className="px-5 py-3.5 rounded-xl text-slate-400 hover:text-white font-medium text-base transition-colors"
            >
              Existing User? Sign In
            </button>
          </div>

          {/* Interactive Preview Mockup */}
          <div className="relative mx-auto max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6 text-left overflow-hidden ring-1 ring-white/10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    RD
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Java Developers 🚀</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      12 Members
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Rahul Sharma is typing...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  AI Smart Replies Ready
                </span>
              </div>
            </div>

            {/* Mock messages */}
            <div className="space-y-3.5 py-2">
              <div className="flex items-start gap-2.5 max-w-md">
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  R
                </div>
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3 text-xs text-slate-200 border border-slate-700/50 shadow-sm">
                  <p className="font-semibold text-indigo-400 text-[11px] mb-1">Rahul Sharma</p>
                  <p>Hey team! Prepared the WebSocket STOMP endpoint `/app/chat.send` with JWT security.</p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">2:30 PM</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 max-w-md ml-auto flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  You
                </div>
                <div className="bg-indigo-600 rounded-2xl rounded-tr-none p-3 text-xs text-white shadow-md">
                  <p>Awesome! Just connected the React STOMP client with instant message delivery and reactions 👍</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-200">
                    <span>2:31 PM</span>
                    <span className="text-cyan-300 font-bold">🔵✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart reply pill preview */}
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">AI Suggestions:</span>
              <button
                onClick={onDirectDemo}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-colors"
              >
                Yes, let&apos;s test live! 🚀
              </button>
              <button
                onClick={onDirectDemo}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-colors"
              >
                Let&apos;s do a group call 📞
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Everything Needed for Real-Time Communication
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Architected for massive scalability, sub-second latency, and a delightful user experience across 1-on-1 and team conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-slate-800/90 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Architecture Flow Diagram */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400 mb-2 block">
              Behind the Scenes
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Full-Stack Architecture & Data Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-lg">
                1
              </div>
              <h4 className="font-bold text-white mb-2 text-sm">React 19 + Vite Frontend</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Responsive chat UI, STOMP / WebSocket client listener, optimistic local rendering, audio recorders, and AI smart prompts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-lg">
                2
              </div>
              <h4 className="font-bold text-white mb-2 text-sm">Server-Authoritative Hub</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Express + WebSocket event broker, JWT authentication, presence tracking, role governance, and Gemini AI agent routing.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-lg">
                3
              </div>
              <h4 className="font-bold text-white mb-2 text-sm">Persistent Data & AI</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relational schema model for users, channels, messages, delivery receipts, file metadata, and Google GenAI summarization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to experience modern real-time messaging?
        </h2>
        <p className="text-slate-400 mb-8 text-sm sm:text-base max-w-xl mx-auto">
          Start chatting now with pre-configured team personas or register your custom profile in seconds.
        </p>
        <button
          id="cta-launch-app-btn"
          onClick={onDirectDemo}
          className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
        >
          Open ChatFlow Dashboard
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>ChatFlow &copy; 2026 — Real-Time Communication Platform with WebSocket & Gemini AI</p>
      </footer>
    </div>
  );
};
