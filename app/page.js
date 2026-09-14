'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Zap,
  Kanban,
  ShieldCheck,
  Moon,
  Sun,
  Users,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  Radio,
  BarChart3,
  BookOpen,
  Clock,
  Target,
  Globe,
  Database,
  Link2,
  Palette,
  BrainCircuit,
  Calendar,
  Lock,
  Star,
  Check,
  Flame,
  Shield,
  Key,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('huddle');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoadingSession(false);
      }
    }
    checkAuth();
  }, []);

  const loginAsDemoUser = async (email) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch (err) {
      router.push('/login');
    }
  };

  const proFeatures = [
    {
      icon: Radio,
      title: 'WebRTC Team Huddles',
      description: 'Live video & audio calls with screen sharing, dynamic participant cards, mic/camera mute controls, and AI meeting action items.',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Sprint Burndown',
      description: 'Interactive SVG burndown charts, lead/cycle time tracking, team velocity gauges, and 1-click CSV report exports.',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: BookOpen,
      title: 'Workspace Docs & Notion Wiki',
      description: 'Centralized document repository with rich Markdown editor, category tags, `@task` references, and real-time database save.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Clock,
      title: 'Live Time Tracker & Timesheets',
      description: 'Digital live timer widget on tasks, duration logs, hourly rate billing estimations, and timesheet reports.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Globe,
      title: 'SSRF-Safe Slack & Discord Webhooks',
      description: 'Automated incoming webhook dispatcher pushing task updates, milestones, and live huddle alerts with strict HTTPS URL validation.',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Target,
      title: 'OKRs & Strategic Goals',
      description: 'Quarterly Objectives & Key Results tracker with target sliders, unit progress tracking, and goal alignment.',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: Link2,
      title: 'Secure Client Share Links',
      description: 'Generate cryptographically hashed read-only guest links (`/share/[token]`) for external clients with expiration and revocation.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Multi-Tenant Security',
      description: 'Full database persistence, Zod request validation, rate limiting, hashed password resets, and complete tenant data isolation.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-[var(--tf-text-main)] transition-colors duration-150 selection:bg-amber-500/20 selection:text-amber-500 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-[var(--tf-bg)]/90 backdrop-blur-md border-b border-[var(--tf-border)] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="TaskFlow Logo"
              className="w-8 h-8 rounded-lg border border-amber-500/30 object-cover shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-[var(--tf-text-main)] tracking-tight flex items-center gap-1.5">
                TaskFlow
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  PRO
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[var(--tf-text-muted)]">
            <a href="#features" className="hover:text-[var(--tf-text-main)] transition">
              Features
            </a>
            <a href="#showcase" className="hover:text-[var(--tf-text-main)] transition">
              Live Showcase
            </a>
            <a href="#pro-suite" className="hover:text-[var(--tf-text-main)] transition">
              Enterprise Suite
            </a>
            <a href="#security" className="hover:text-[var(--tf-text-main)] transition">
              Security
            </a>
            <a href="#demo" className="hover:text-[var(--tf-text-main)] transition">
              1-Click Demo
            </a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] transition flex items-center gap-1.5 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden sm:inline text-xs font-mono text-[var(--tf-text-subtle)]">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {loadingSession ? (
              <div className="w-20 h-8 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] animate-pulse" />
            ) : session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] border border-transparent hover:border-[var(--tf-border)] transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono font-bold shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
              <span>Enterprise-Grade Collaboration Workspace</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--tf-text-main)] max-w-4xl mx-auto leading-[1.1]">
              The All-in-One Workspace for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500">
                Modern Product Teams.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-[var(--tf-text-muted)] max-w-3xl mx-auto leading-relaxed font-normal">
              Streamline tasks, live video huddles, team docs, and sprint analytics into one powerful platform.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Launch Workspace Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Users className="w-4 h-4 text-amber-500" />
                <span>Try 1-Click Demo Accounts</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--tf-text-subtle)] font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> WebRTC Video Huddles
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Database-Backed Realtime
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sprint Burndown Telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SSRF-Safe Webhooks
              </span>
            </div>
          </div>
        </section>

        {/* Tabbed Interactive Feature Showcase */}
        <section id="showcase" className="py-16 bg-[var(--tf-sidebar)] border-y border-[var(--tf-border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tf-text-main)]">
                Experience TaskFlow Pro in Action
              </h2>
              <p className="text-xs text-[var(--tf-text-muted)] max-w-xl mx-auto">
                Explore built-in modules engineered for high-velocity software and design teams.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] max-w-3xl mx-auto">
              <button
                onClick={() => setActiveTab('huddle')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'huddle'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>WebRTC Huddle</span>
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'kanban'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban Board</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Sprint Burndown</span>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Notion Wiki</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Security Engine</span>
              </button>
            </div>

            {/* Preview Box */}
            <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-2xl space-y-4">
              {activeTab === 'huddle' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                      <Radio className="w-4 h-4 animate-ping" />
                      <span>Live Team Audio/Video Huddle Call</span>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-200">
                      Mic & Camera OFF by Default
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-2 aspect-video">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Host"
                        className="w-16 h-16 rounded-full border-2 border-amber-500"
                        alt="Sarah Chen Avatar"
                      />
                      <span className="text-xs font-bold text-slate-200">Sarah Chen (Host)</span>
                      <span className="text-[10px] font-mono text-emerald-400">Microphone OFF • Camera OFF</span>
                    </div>
                    <div className="p-6 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-2 aspect-video text-center">
                      <Users className="w-8 h-8 text-amber-500 animate-bounce" />
                      <span className="text-xs font-bold text-slate-200">Waiting for teammates to join...</span>
                      <p className="text-[11px] text-slate-500">Live invite broadcasted to workspace team</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'kanban' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
                    <span className="text-xs font-bold text-amber-500">Drag-and-Drop Task Machine</span>
                    <span className="text-xs font-mono text-[var(--tf-text-muted)]">3 Columns • Real-Time SSE Sync</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-2">
                      <span className="text-xs font-bold text-[var(--tf-text-main)]">📋 To Do (2)</span>
                      <div className="p-3 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] text-xs font-semibold">
                        Design Landing Page Spec
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-2">
                      <span className="text-xs font-bold text-blue-500">⚡ In Progress (1)</span>
                      <div className="p-3 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] text-xs font-semibold">
                        Implement WebRTC Huddle Controls
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-2">
                      <span className="text-xs font-bold text-emerald-500">✅ Done (4)</span>
                      <div className="p-3 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] text-xs font-semibold">
                        Deploy Real-Time SSE Stream
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
                    <span className="text-xs font-bold text-amber-500">Sprint Burndown Telemetry</span>
                    <span className="text-xs font-mono text-emerald-500">Velocity: 42 Tasks/Wk</span>
                  </div>
                  <div className="w-full h-44 bg-[var(--tf-sidebar)] rounded-xl p-4 border border-[var(--tf-border)] relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <line x1="20" y1="10" x2="480" y2="140" stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" />
                      <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points="20,10 120,30 220,60 320,100 480,135" />
                    </svg>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
                    <span className="text-xs font-bold text-blue-500">Workspace Specs & Notion Wiki</span>
                    <span className="text-xs font-mono text-[var(--tf-text-muted)]">Database-Backed Docs</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs font-mono space-y-2">
                    <p className="font-bold text-amber-500"># TaskFlow Product Architecture</p>
                    <p className="text-[var(--tf-text-muted)]">
                      Built on Next.js 15 App Router, Prisma ORM, and WebRTC streaming for enterprise team collaboration.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Enterprise Security Engine
                    </span>
                    <span className="text-xs font-mono text-emerald-400">SOC-2 Architecture Verified</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-1">
                      <span className="font-bold text-amber-400">Crypto Hashing</span>
                      <p className="text-[var(--tf-text-muted)]">SHA-256 tokens for guest links & password resets.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-1">
                      <span className="font-bold text-blue-400">Tenant Isolation</span>
                      <p className="text-[var(--tf-text-muted)]">Membership verification on 100% of workspace queries.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] space-y-1">
                      <span className="font-bold text-purple-400">SSRF & Rate Limits</span>
                      <p className="text-[var(--tf-text-muted)]">Blocked local network targets & token bucket limiters.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Enterprise Suite Grid */}
        <section id="pro-suite" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tf-tag-yellow">
              <span>⚡</span>
              <span>Complete SaaS Ecosystem</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--tf-text-main)]">
              All 8 Enterprise Modules Included
            </h2>
            <p className="text-xs text-[var(--tf-text-muted)]">
              No extra plugins or subscriptions. Everything you need to plan, communicate, ship products, and protect data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {proFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-5 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3 hover:border-amber-500/50 transition shadow-xs group"
                >
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--tf-text-main)]">{feat.title}</h3>
                  <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-16 bg-[var(--tf-sidebar)] border-t border-[var(--tf-border)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Hardened Infrastructure</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--tf-text-main)]">
                Built for Security-Conscious Organizations
              </h2>
              <p className="text-xs text-[var(--tf-text-muted)] max-w-xl mx-auto">
                Every request, endpoint, and invitation is protected by defense-in-depth security layers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3">
                <Shield className="w-8 h-8 text-amber-500" />
                <h3 className="text-sm font-bold text-[var(--tf-text-main)]">Multi-Tenant Isolation</h3>
                <p className="text-xs text-[var(--tf-text-muted)]">
                  Strict workspace membership verification ensures zero cross-tenant data exposure across all queries and API routes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3">
                <Key className="w-8 h-8 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--tf-text-main)]">Hashed Random Tokens</h3>
                <p className="text-xs text-[var(--tf-text-muted)]">
                  Cryptographically secure `crypto.randomBytes(32)` tokens and SHA-256 hashing for password resets, client links, and invites.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3">
                <Lock className="w-8 h-8 text-blue-500" />
                <h3 className="text-sm font-bold text-[var(--tf-text-main)]">SSRF & Abuse Shield</h3>
                <p className="text-xs text-[var(--tf-text-muted)]">
                  Automated rate-limiting on sensitive auth routes and SSRF protection blocking local network targets on incoming webhooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 1-Click Demo Login Accounts Section */}
        <section id="demo" className="py-16 bg-[var(--tf-bg)] border-t border-[var(--tf-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">Instant Access</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--tf-text-main)]">
                Try TaskFlow Pro in 1-Click
              </h2>
              <p className="text-xs text-[var(--tf-text-muted)]">
                Select a pre-configured role below to log in instantly without filling out registration forms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* Owner */}
              <button
                onClick={() => loginAsDemoUser('alex@taskflow.com')}
                className="p-5 rounded-2xl bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] border border-[var(--tf-border)] hover:border-amber-500/50 space-y-3 transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    👑 OWNER
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--tf-text-muted)] group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--tf-text-main)]">Alex Rivera</h4>
                  <p className="text-[11px] font-mono text-[var(--tf-text-subtle)]">alex@taskflow.com</p>
                </div>
                <p className="text-xs text-[var(--tf-text-muted)]">Full admin access, workspace settings, automations & webhooks.</p>
              </button>

              {/* Admin */}
              <button
                onClick={() => loginAsDemoUser('sarah@taskflow.com')}
                className="p-5 rounded-2xl bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] border border-[var(--tf-border)] hover:border-emerald-500/50 space-y-3 transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🛡️ ADMIN
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--tf-text-muted)] group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--tf-text-main)]">Sarah Chen</h4>
                  <p className="text-[11px] font-mono text-[var(--tf-text-subtle)]">sarah@taskflow.com</p>
                </div>
                <p className="text-xs text-[var(--tf-text-muted)]">Project management, team workload planning & analytics.</p>
              </button>

              {/* Member */}
              <button
                onClick={() => loginAsDemoUser('david@taskflow.com')}
                className="p-5 rounded-2xl bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] border border-[var(--tf-border)] hover:border-blue-500/50 space-y-3 transition cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    👤 MEMBER
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--tf-text-muted)] group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--tf-text-main)]">David Chen</h4>
                  <p className="text-[11px] font-mono text-[var(--tf-text-subtle)]">david@taskflow.com</p>
                </div>
                <p className="text-xs text-[var(--tf-text-muted)]">Task execution, Pomodoro timer, docs & team huddle access.</p>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--tf-border)] bg-[var(--tf-bg)] py-8 text-center text-xs font-mono text-[var(--tf-text-subtle)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--tf-text-main)]">TaskFlow</span>
            <span>• Production-Grade Enterprise Workspace</span>
          </div>
          <p>© 2026 TaskFlow Inc. Built for high-velocity teams.</p>
        </div>
      </footer>
    </div>
  );
}
