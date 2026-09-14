'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Plus,
  ChevronDown,
  Layers,
  X,
} from 'lucide-react';
import { useWorkspace } from './AppShell';
import CreateProjectModal from '../modals/CreateProjectModal';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      fetchProjects();
    }
  }, [activeWorkspace?.id]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects?workspaceId=${activeWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/my-tasks', icon: CheckSquare },
    { name: 'Team Members', href: '/members', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - Notion Soft Dark */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#202020] border-r border-[#2d2d2d] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Active Workspace Header */}
        <div className="p-3.5 border-b border-[#2d2d2d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                📋
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#e3e3e3] tracking-tight flex items-center gap-1.5">
                  TaskFlow
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    Notion
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setIsWsDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-md bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] text-left transition group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-5 h-5 rounded bg-stone-700/50 border border-stone-600 text-stone-200 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                  {activeWorkspace?.name?.charAt(0) || 'W'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-[#e3e3e3] block truncate">
                    {activeWorkspace?.name || 'Select Workspace'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0 group-hover:text-white transition" />
            </button>

            {/* Workspace Dropdown */}
            {isWsDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#252525] border border-[#333] rounded-lg shadow-2xl py-1 divide-y divide-[#333]">
                <div className="px-3 py-1 text-[10px] font-mono font-semibold text-stone-400 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="py-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws);
                        setIsWsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition ${
                        ws.id === activeWorkspace?.id
                          ? 'bg-[#2e2e2e] text-white font-semibold border-l-2 border-amber-500'
                          : 'text-stone-300 hover:bg-[#2e2e2e]'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#1c1c1c] text-stone-400 uppercase">
                        {ws.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {/* Main Menu */}
          <div>
            <span className="px-2 text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Workspace
            </span>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                      isActive
                        ? 'bg-[#2c2c2c] text-white border border-white/10 font-semibold shadow-sm'
                        : 'text-stone-300 hover:bg-[#282828] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-wider">
                Projects ({projects.length})
              </span>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="p-0.5 rounded text-stone-400 hover:text-white hover:bg-[#2e2e2e] transition"
                title="Create project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-2.5 py-1.5 text-xs text-stone-500 italic">No active projects</div>
              ) : (
                projects.map((proj) => {
                  const isActive = pathname.startsWith(`/projects/${proj.id}`);
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      onClick={onClose}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#2c2c2c] text-white border border-white/10 font-semibold'
                          : 'text-stone-300 hover:bg-[#282828] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#3b82f6' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1c1c1c] text-stone-400 border border-stone-800">
                        {proj.key}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Workspace Settings */}
          <div>
            <span className="px-2 text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Settings
            </span>
            <Link
              href="/settings"
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                pathname === '/settings'
                  ? 'bg-[#2c2c2c] text-white border border-white/10 font-semibold'
                  : 'text-stone-300 hover:bg-[#282828] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-stone-400" />
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>

        {/* User Card Footer - Notion Style */}
        <div className="p-3 border-t border-[#2d2d2d] bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-[#252525] border border-[#333]">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#e3e3e3] truncate">{user?.name}</p>
              <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[9px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase shrink-0">
              {activeWorkspace?.role || 'MEMBER'}
            </span>
          </div>
        </div>
      </aside>

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          onSuccess={fetchProjects}
        />
      )}
    </>
  );
}
