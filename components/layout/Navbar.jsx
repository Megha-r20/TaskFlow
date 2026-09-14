'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Check,
  ExternalLink,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Plus,
  Keyboard,
  Sparkles,
  Zap,
  BrainCircuit,
  Radio,
} from 'lucide-react';
import { useWorkspace } from './AppShell';
import { useRealtime } from './AppShell';
import { useTheme } from '../theme/ThemeProvider';

export default function Navbar({ onOpenMobileSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openSearch, openCreateTask, openShortcuts, openAiStandup, openAutomations, openFocusMode, startHuddle, maximizeHuddle, isHuddleActive, isHuddleMinimized } = useWorkspace();
  const { connectionStatus, registerRealtimeHandler } = useRealtime() || {};
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifPanelRef = useRef(null);
  const userMenuRef = useRef(null);

  const [shortcutLabel, setShortcutLabel] = useState('Ctrl K');

  useEffect(() => {
    if (typeof window !== 'undefined' && /Mac/i.test(navigator.platform || '')) {
      setShortcutLabel('⌘K');
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notification events via SSE
  useEffect(() => {
    if (!registerRealtimeHandler) return;
    const unsubscribe = registerRealtimeHandler('NOTIFICATION', () => {
      fetchNotifications();
    });
    return unsubscribe;
  }, [registerRealtimeHandler, fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markOneRead = async (notifId) => {
    try {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark one read error:', err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markOneRead(notif.id);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
      setIsNotifOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname === '/my-tasks') return 'My Assigned Tasks';
    if (pathname === '/members') return 'Team Members';
    if (pathname === '/settings') return 'Workspace Settings';
    if (pathname.startsWith('/projects/')) return 'Project Board';
    return 'TaskFlow';
  };

  // Connection indicator
  const connColor =
    connectionStatus === 'connected'
      ? 'text-emerald-500'
      : connectionStatus === 'connecting'
      ? 'text-amber-500'
      : 'text-[var(--tf-text-subtle)]';

  const connTitle =
    connectionStatus === 'connected'
      ? 'Real-time: Connected'
      : connectionStatus === 'connecting'
      ? 'Real-time: Connecting...'
      : connectionStatus === 'error'
      ? 'Real-time: Connection failed (refresh to retry)'
      : 'Real-time: Disconnected';

  return (
    <header className="h-14 bg-[var(--tf-header-bg)] border-b border-[var(--tf-border)] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 transition-colors duration-150">
      {/* Left: Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-[var(--tf-text-main)] tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Center: Search trigger - Pro style */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={openSearch}
          className="w-full h-9 px-3 bg-[var(--tf-input-bg)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] hover:border-amber-500/40 rounded-lg text-xs text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] transition shadow-2xs group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-[var(--tf-text-muted)] group-hover:text-amber-500 transition" />
            <span>Search tasks, projects, members...</span>
          </div>
          <kbd className="h-5 px-1.5 flex items-center justify-center text-[10px] font-mono font-semibold rounded bg-[var(--tf-bg)] text-[var(--tf-text-subtle)] border border-[var(--tf-border)] group-hover:border-amber-500/30 group-hover:text-amber-500 transition shadow-2xs">
            {shortcutLabel}
          </kbd>
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Mobile search */}
        <button
          onClick={openSearch}
          className="md:hidden p-1.5 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Live Huddle Meeting Button */}
        <button
          onClick={() => {
            if (isHuddleActive && isHuddleMinimized) {
              maximizeHuddle();
            } else if (!isHuddleActive) {
              startHuddle();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
            isHuddleActive
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title={isHuddleActive ? 'Active Huddle - Click to Expand' : 'Start Team Audio/Video Huddle'}
        >
          <Radio className={`w-3.5 h-3.5 ${isHuddleActive ? 'text-rose-500' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">{isHuddleActive ? 'Live Huddle' : 'Huddle'}</span>
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          onClick={openShortcuts}
          className="p-1.5 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition flex items-center gap-1 cursor-pointer"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4 text-amber-500" />
        </button>

        {/* Theme Toggle Button (Light vs Dark) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition flex items-center gap-1.5 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
          <span className="hidden sm:inline text-[11px] font-medium font-mono text-[var(--tf-text-subtle)]">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Real-time connection indicator */}
        <div
          className={`hidden sm:flex items-center gap-1 text-[10px] font-mono font-medium ${connColor}`}
          title={connTitle}
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden lg:inline">
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? '...' : 'Offline'}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifPanelRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-1.5 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] font-bold font-mono text-black flex items-center justify-center ring-2 ring-[var(--tf-bg)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-[var(--tf-border)] flex items-center justify-between bg-[var(--tf-sidebar)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--tf-text-main)]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-amber-500/20 text-amber-500">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-amber-500 hover:underline transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--tf-border)]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-7 h-7 text-[var(--tf-text-subtle)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--tf-text-muted)]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left p-3 transition hover:bg-[var(--tf-hover)] ${
                        !n.isRead ? 'bg-[var(--tf-hover)] border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${!n.isRead ? 'text-[var(--tf-text-main)]' : 'text-[var(--tf-text-muted)]'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--tf-text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                      {n.linkUrl && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                          <ExternalLink className="w-2.5 h-2.5" />
                          View task
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-stone-400 transition"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-[var(--tf-border)]"
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-lg shadow-2xl z-50 py-1 divide-y divide-[var(--tf-border)]">
              <div className="px-3.5 py-2.5">
                <p className="text-xs font-semibold text-[var(--tf-text-main)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--tf-text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

