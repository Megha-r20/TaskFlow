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
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function IntroPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');

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

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-[var(--tf-text-main)] transition-colors duration-150 selection:bg-amber-500/20 selection:text-amber-500 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-[var(--tf-bg)]/80 backdrop-blur-md border-b border-[var(--tf-border)] transition-colors duration-150">
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
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                  Pro
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--tf-text-muted)]">
            <a href="#features" className="hover:text-[var(--tf-text-main)] transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--tf-text-main)] transition">
              How It Works
            </a>
            <a href="#demo" className="hover:text-[var(--tf-text-main)] transition">
              Demo Access
            </a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] transition flex items-center gap-1.5 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
              <span className="hidden sm:inline text-xs font-mono text-[var(--tf-text-subtle)]">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {loadingSession ? (
              <div className="w-20 h-8 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] animate-pulse" />
            ) : session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
              >
                <span>Dashboard</span>
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
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
          {/* Subtle Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono font-medium shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Project Management Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--tf-text-main)] max-w-4xl mx-auto leading-[1.15]">
              Streamline work.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500">
                Deliver faster.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[var(--tf-text-muted)] max-w-2xl mx-auto leading-relaxed">
              TaskFlow brings your team’s projects, tasks, real-time activity streams, and role permissions together in one beautifully minimalist workspace.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <span>Try Demo Accounts</span>
                <Users className="w-4 h-4 text-[var(--tf-text-muted)]" />
              </a>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--tf-text-subtle)] font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Real-time SSE Sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> RBAC Security
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dual Light & Dark
              </span>
            </div>

            {/* Interactive Showcase Mockup */}
            <div className="pt-10 max-w-4xl mx-auto">
              <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden text-left transition-colors duration-150">
                {/* Mockup Header Bar */}
                <div className="px-4 py-3 bg-[var(--tf-sidebar)] border-b border-[var(--tf-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80 inline-block" />
                    <span className="ml-3 text-xs font-mono text-[var(--tf-text-subtle)] hidden sm:inline">
                      taskflow.dev / workspace / alpha-launch
                    </span>
                  </div>
                  {/* Tab Selector */}
                  <div className="flex items-center gap-1 bg-[var(--tf-bg)] p-1 rounded-lg border border-[var(--tf-border)]">
                    <button
                      onClick={() => setActiveTab('kanban')}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                        activeTab === 'kanban'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                      }`}
                    >
                      Kanban
                    </button>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                        activeTab === 'dashboard'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
                      }`}
                    >
                      Metrics
                    </button>
                  </div>
                </div>

                {/* Mockup Body Content */}
                <div className="p-4 sm:p-6 bg-[var(--tf-bg)] min-h-[300px]">
                  {activeTab === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Column Todo */}
                      <div className="bg-[var(--tf-sidebar)] p-3 rounded-xl border border-[var(--tf-border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-[var(--tf-text-muted)] uppercase">
                            Todo (2)
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-gray">Low</span>
                        </div>
                        <div className="p-3 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg shadow-xs space-y-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-blue">Frontend</span>
                          <p className="text-xs font-semibold text-[var(--tf-text-main)]">Design landing page intro</p>
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--tf-border)]">
                            <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono">APP-101</span>
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[9px] flex items-center justify-center">
                              AR
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg shadow-xs space-y-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-purple">Security</span>
                          <p className="text-xs font-semibold text-[var(--tf-text-main)]">Audit RBAC permissions</p>
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--tf-border)]">
                            <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono">APP-102</span>
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-[9px] flex items-center justify-center">
                              SC
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Column In Progress */}
                      <div className="bg-[var(--tf-sidebar)] p-3 rounded-xl border border-[var(--tf-border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-[var(--tf-text-muted)] uppercase">
                            In Progress (1)
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-blue">High</span>
                        </div>
                        <div className="p-3 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg shadow-xs space-y-2 border-l-2 border-amber-500">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-green">API Sync</span>
                          <p className="text-xs font-semibold text-[var(--tf-text-main)]">SSE stream handler optimization</p>
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--tf-border)]">
                            <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono">APP-103</span>
                            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-500 font-bold text-[9px] flex items-center justify-center">
                              MV
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Column Done */}
                      <div className="bg-[var(--tf-sidebar)] p-3 rounded-xl border border-[var(--tf-border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-[var(--tf-text-muted)] uppercase">
                            Done (4)
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-green">Completed</span>
                        </div>
                        <div className="p-3 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg shadow-xs space-y-2 opacity-80">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-gray">Theme</span>
                          <p className="text-xs font-semibold text-[var(--tf-text-main)] line-through">Dual Light & Dark mode</p>
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--tf-border)]">
                            <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono">APP-099</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1">
                          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] uppercase">Total Tasks</span>
                          <p className="text-xl font-bold text-[var(--tf-text-main)]">128</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1">
                          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] uppercase">Completed</span>
                          <p className="text-xl font-bold text-emerald-500">94</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1">
                          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] uppercase">In Progress</span>
                          <p className="text-xl font-bold text-amber-500">22</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1">
                          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] uppercase">Completion Rate</span>
                          <p className="text-xl font-bold text-[var(--tf-text-main)]">73.4%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-16 md:py-24 border-t border-[var(--tf-border)] bg-[var(--tf-sidebar)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">
                Built for High-Performing Teams
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[var(--tf-text-main)] tracking-tight">
                Everything you need to ship projects on time
              </h2>
              <p className="text-xs sm:text-sm text-[var(--tf-text-muted)]">
                Minimal distraction, maximum velocity. Powerful features packed into a clean interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Real-Time Sync</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Server-Sent Events (SSE) deliver instant status updates across all connected team members without refreshing.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Kanban className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Interactive Kanban</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Smooth HTML5 drag-and-drop task boards with custom priorities, status columns, labels, and assignment tags.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">RBAC Security</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Role-Based Access Control ensures Owners, Admins, and Members have strict workspace isolation and data protection.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Dual Theme Support</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Instant toggle between Light and Dark mode with persistent user preferences stored across sessions.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Dashboard Insights</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Real-time analytics for task completion rates, upcoming deadlines, activity logs, and workspace distribution.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs space-y-3 hover:border-amber-500/50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Team Workspaces</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Switch seamlessly between personal and team workspaces, manage member invitations, and control permissions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 border-t border-[var(--tf-border)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">
                Simple & Intuitive
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[var(--tf-text-main)] tracking-tight">
                How TaskFlow Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold font-mono text-lg flex items-center justify-center mx-auto shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Create Workspace</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Initialize a clean workspace, set up your project key, and invite team members.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold font-mono text-lg flex items-center justify-center mx-auto shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Organize Tasks</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Create task cards, set priority badges, assign owners, and track progress on the Kanban board.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold font-mono text-lg flex items-center justify-center mx-auto shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-[var(--tf-text-main)]">Collaborate Live</h3>
                <p className="text-xs text-[var(--tf-text-muted)] leading-relaxed">
                  Add comments, mention team members, and receive real-time notifications when updates occur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Demo Access Section */}
        <section id="demo" className="py-16 md:py-24 border-t border-[var(--tf-border)] bg-[var(--tf-sidebar)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">
                  ⚡ Instant Demo Sign-in
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--tf-text-main)]">
                  Explore TaskFlow in 1 Click
                </h2>
                <p className="text-xs text-[var(--tf-text-muted)] max-w-lg mx-auto">
                  Select a pre-configured role below to log straight into the live interactive demo workspace.
                </p>
              </div>

              {/* Demo Account Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Alex Rivera - Owner */}
                <button
                  onClick={() => loginAsDemoUser('alex@taskflow.dev')}
                  className="p-4 rounded-xl bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-left transition group cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono tf-tag-blue">Workspace Owner</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--tf-text-subtle)] group-hover:text-amber-500 group-hover:translate-x-1 transition" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--tf-text-main)]">Alex Rivera</p>
                    <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">alex@taskflow.dev</p>
                  </div>
                </button>

                {/* Sarah Chen - Admin */}
                <button
                  onClick={() => loginAsDemoUser('sarah@taskflow.dev')}
                  className="p-4 rounded-xl bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-left transition group cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono tf-tag-green">Admin</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--tf-text-subtle)] group-hover:text-amber-500 group-hover:translate-x-1 transition" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--tf-text-main)]">Sarah Chen</p>
                    <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">sarah@taskflow.dev</p>
                  </div>
                </button>

                {/* Marcus Vance - Member */}
                <button
                  onClick={() => loginAsDemoUser('marcus@taskflow.dev')}
                  className="p-4 rounded-xl bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-left transition group cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono tf-tag-yellow">Member</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--tf-text-subtle)] group-hover:text-amber-500 group-hover:translate-x-1 transition" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--tf-text-main)]">Marcus Vance</p>
                    <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">marcus@taskflow.dev</p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-amber-500 hover:underline"
                >
                  <span>Standard Login / Sign Up Page &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--tf-border)] py-8 bg-[var(--tf-bg)] transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--tf-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--tf-text-main)]">TaskFlow Pro</span>
            <span>&copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[var(--tf-text-main)] transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-[var(--tf-text-main)] transition">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
