'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../modals/GlobalSearchModal';
import { useRealtimeEvents } from '@/lib/useRealtimeEvents';

export const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

// Real-time context exposes the connection status and event subscription helper
export const RealtimeContext = createContext(null);
export const useRealtime = () => useContext(RealtimeContext);

export default function AppShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global realtime event callbacks — components register handlers here
  const [realtimeHandlers, setRealtimeHandlers] = useState({});

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setWorkspaces(data.user.workspaces || []);

      if (data.user.workspaces && data.user.workspaces.length > 0) {
        const savedWsId = localStorage.getItem('taskflow_active_ws');
        const matched = data.user.workspaces.find((w) => w.id === savedWsId);
        const selected = matched || data.user.workspaces[0];
        setActiveWorkspace(selected);
      }
    } catch (error) {
      console.error('Session error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const switchWorkspace = useCallback((ws) => {
    setActiveWorkspace(ws);
    localStorage.setItem('taskflow_active_ws', ws.id);
    router.refresh();
  }, [router]);

  // Keyboard shortcut Cmd+K / Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── SSE Real-time subscription ──────────────────────────────────────────────
  // Components can register handlers by calling registerHandler(eventType, fn)
  // We use a single SSE connection at the AppShell level for efficiency.
  const registerRealtimeHandler = useCallback((eventType, handlerFn) => {
    setRealtimeHandlers((prev) => ({ ...prev, [eventType]: handlerFn }));
    return () => {
      setRealtimeHandlers((prev) => {
        const next = { ...prev };
        if (next[eventType] === handlerFn) delete next[eventType];
        return next;
      });
    };
  }, []);

  const { connectionStatus } = useRealtimeEvents(activeWorkspace?.id, realtimeHandlers);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading TaskFlow workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        switchWorkspace,
        refreshSession: fetchSession,
        openSearch: () => setIsSearchOpen(true),
      }}
    >
      <RealtimeContext.Provider
        value={{
          connectionStatus,
          registerRealtimeHandler,
        }}
      >
        <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0b0f17]">
              {children}
            </main>
          </div>
        </div>

        {/* Global Search Command-K Modal */}
        {isSearchOpen && (
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        )}
      </RealtimeContext.Provider>
    </WorkspaceContext.Provider>
  );
}
