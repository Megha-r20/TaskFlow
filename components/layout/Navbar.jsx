'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  User,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from './AppShell';

export default function Navbar({ onOpenMobileSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openSearch } = useWorkspace();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
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
  };

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
    if (pathname === '/members') return 'Team Workspace Members';
    if (pathname === '/settings') return 'Workspace Settings';
    if (pathname.startsWith('/projects/')) return 'Project Details';
    return 'TaskFlow';
  };

  return (
    <header className="h-16 bg-[#0d121d] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30">
      {/* Left Title & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight">{getPageTitle()}</h1>
      </div>

      {/* Center Command-K Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={openSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#121826] hover:bg-slate-800/70 border border-slate-800 rounded-lg text-slate-400 text-xs transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Search tasks, projects, members...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right User Controls & Notifications */}
      <div className="flex items-center gap-3">
        {/* Search button for mobile */}
        <button
          onClick={openSearch}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications Popover Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#0d121d]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121826] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#0e131f]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 transition ${
                        !n.isRead ? 'bg-indigo-600/5' : 'bg-transparent opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-700 transition"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#121826] border border-slate-800 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-800/80">
              <div className="px-4 py-3">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition text-left"
                >
                  <LogOut className="w-4 h-4" />
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
