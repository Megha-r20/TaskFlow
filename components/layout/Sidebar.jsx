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
  Building2,
  Sparkles,
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
    { name: 'Settings', href: '/settings', icon: Settings },
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

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d121d] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand & Workspace Selector */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">TaskFlow</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsWsDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#121826] hover:bg-slate-800/80 border border-slate-800 text-left transition"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white truncate">
                  {activeWorkspace?.name || 'Select Workspace'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isWsDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#121826] border border-slate-800 rounded-lg shadow-2xl py-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws);
                      setIsWsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition ${
                      ws.id === activeWorkspace?.id
                        ? 'bg-indigo-600/10 text-indigo-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {ws.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Projects ({projects.length})
              </span>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Create project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500 italic">No projects yet</div>
              ) : (
                projects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.id}`}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname.startsWith(`/projects/${proj.id}`)
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                      {proj.key}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer User Card */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0a0e17]">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#111622] border border-slate-800/80">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
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
