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
} from 'lucide-react';
import { useWorkspace } from './AppShell';
import { useRealtime } from './AppShell';

export default function Navbar({ onOpenMobileSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openSearch } = useWorkspace();
  const { connectionStatus, registerRealtimeHandler } = useRealtime() || {};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifPanelRef = useRef(null);
  const userMenuRef = useRef(null);

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
      router.push('/login');
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
      ? 'text-emerald-400'
      : connectionStatus === 'connecting'
      ? 'text-amber-400'
      : 'text-stone-600';

  const connTitle =
    connectionStatus === 'connected'
      ? 'Real-time: Connected'
      : connectionStatus === 'connecting'
      ? 'Real-time: Connecting...'
      : connectionStatus === 'error'
      ? 'Real-time: Connection failed (refresh to retry)'
      : 'Real-time: Disconnected';

  return (
    <header className="h-14 bg-[#191919] border-b border-[#2d2d2d] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded text-stone-400 hover:text-white hover:bg-[#282828]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-[#e3e3e3] tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Center: Search trigger - Notion style */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={openSearch}
          className="w-full flex items-center justify-between px-3 py-1 bg-[#222222] hover:bg-[#282828] border border-[#333] rounded-md text-stone-400 text-xs transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span>Search tasks, projects, members...</span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-[#191919] text-stone-400 border border-[#333] rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Mobile search */}
        <button
          onClick={openSearch}
          className="md:hidden p-1.5 rounded text-stone-400 hover:text-white hover:bg-[#282828]"
        >
          <Search className="w-4 h-4" />
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
            className="relative p-1.5 rounded text-stone-400 hover:text-white hover:bg-[#282828] transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] font-bold font-mono text-black flex items-center justify-center ring-2 ring-[#191919]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#252525] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-[#333] flex items-center justify-between bg-[#202020]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e3e3e3]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-amber-500/20 text-amber-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#333]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-7 h-7 text-stone-600 mx-auto mb-2" />
                    <p className="text-xs text-stone-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left p-3 transition hover:bg-[#2e2e2e] ${
                        !n.isRead ? 'bg-[#2a2a2a] border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-stone-300'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-mono text-stone-500 shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.linkUrl && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
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
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-stone-600 transition"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-[#333]"
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#252525] border border-[#333] rounded-lg shadow-2xl z-50 py-1 divide-y divide-[#333]">
              <div className="px-3.5 py-2.5">
                <p className="text-xs font-semibold text-[#e3e3e3] truncate">{user?.name}</p>
                <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition text-left"
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
