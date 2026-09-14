'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../modals/GlobalSearchModal';
import CreateTaskModal from '../modals/CreateTaskModal';
import KeyboardShortcutsModal from '../modals/KeyboardShortcutsModal';
import AiStandupModal from '../modals/AiStandupModal';
import AutomationRulesModal from '../modals/AutomationRulesModal';
import FocusModeModal from '../modals/FocusModeModal';
import GanttTimelineModal from '../modals/GanttTimelineModal';
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
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAiStandupOpen, setIsAiStandupOpen] = useState(false);
  const [isAutomationsOpen, setIsAutomationsOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [focusTask, setFocusTask] = useState(null);
  const [createTaskDefaultProjId, setCreateTaskDefaultProjId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global realtime event callbacks — components register handlers here
  const [realtimeHandlers, setRealtimeHandlers] = useState({});

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setLoading(false);
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setWorkspaces(data.user.workspaces || []);

      if (data.user.workspaces && data.user.workspaces.length > 0) {
        const savedWsId = typeof window !== 'undefined' ? localStorage.getItem('taskflow_active_ws') : null;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_active_ws', ws.id);
    }
    router.refresh();
  }, [router]);

  const openCreateTask = useCallback((defaultProjId = null) => {
    setCreateTaskDefaultProjId(defaultProjId);
    setIsCreateTaskOpen(true);
  }, []);

  const openShortcuts = useCallback(() => {
    setIsShortcutsOpen(true);
  }, []);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K for Search, ? or Ctrl+/ for Shortcuts Cheat-Sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcut if typing inside an input, textarea, or contenteditable
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (!isInput) {
        if (e.key === '?' || (e.shiftKey && e.key === '/') || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          return;
        }

        if (e.key === 'Escape') {
          setIsSearchOpen(false);
          setIsCreateTaskOpen(false);
          setIsShortcutsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── SSE Real-time subscription ──────────────────────────────────────────────
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
      <div className="min-h-screen bg-[var(--tf-bg)] text-[var(--tf-text-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[var(--tf-text-muted)]">Loading TaskFlow workspace...</span>
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
        openCreateTask,
        openShortcuts,
        openAiStandup: () => setIsAiStandupOpen(true),
        openAutomations: () => setIsAutomationsOpen(true),
        openFocusMode: (task = null) => {
          setFocusTask(task);
          setIsFocusModeOpen(true);
        },
        openGanttTimeline: () => setIsGanttOpen(true),
      }}
    >
      <RealtimeContext.Provider
        value={{
          connectionStatus,
          registerRealtimeHandler,
        }}
      >
        <div className="min-h-screen bg-[var(--tf-bg)] text-[var(--tf-text-main)] flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--tf-bg)]">
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

        {/* Global Create Task Modal */}
        {isCreateTaskOpen && (
          <CreateTaskModal
            isOpen={isCreateTaskOpen}
            defaultProjectId={createTaskDefaultProjId}
            onClose={() => setIsCreateTaskOpen(false)}
            onSuccess={() => {
              // Trigger realtime handler if registered or refresh
              if (realtimeHandlers['TASK_CREATED']) {
                realtimeHandlers['TASK_CREATED']();
              }
              router.refresh();
            }}
          />
        )}

        {/* Keyboard Shortcuts Cheat-Sheet Modal */}
        {isShortcutsOpen && (
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        )}

        {/* AI Standup & Breakdown Modal */}
        {isAiStandupOpen && (
          <AiStandupModal
            isOpen={isAiStandupOpen}
            onClose={() => setIsAiStandupOpen(false)}
          />
        )}

        {/* Automation Rules Modal */}
        {isAutomationsOpen && (
          <AutomationRulesModal
            isOpen={isAutomationsOpen}
            onClose={() => setIsAutomationsOpen(false)}
          />
        )}

        {/* Focus Mode & Pomodoro Timer Modal */}
        {isFocusModeOpen && (
          <FocusModeModal
            isOpen={isFocusModeOpen}
            initialTask={focusTask}
            onClose={() => setIsFocusModeOpen(false)}
          />
        )}

        {/* Gantt Schedule Timeline Modal */}
        {isGanttOpen && (
          <GanttTimelineModal
            isOpen={isGanttOpen}
            onClose={() => setIsGanttOpen(false)}
          />
        )}
      </RealtimeContext.Provider>
    </WorkspaceContext.Provider>
  );
}
