'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../modals/GlobalSearchModal';

export const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
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
  };

  const switchWorkspace = (ws) => {
    setActiveWorkspace(ws);
    localStorage.setItem('taskflow_active_ws', ws.id);
    router.refresh();
  };

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
    </WorkspaceContext.Provider>
  );
}
