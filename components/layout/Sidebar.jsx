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
  Command,
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#090d16] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Active Workspace Header */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  TaskFlow
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    SaaS
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setIsWsDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-left transition group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  {activeWorkspace?.name?.charAt(0) || 'W'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate group-hover:text-indigo-300 transition">
                    {activeWorkspace?.name || 'Select Workspace'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-white transition" />
            </button>

            {/* Workspace Dropdown */}
            {isWsDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0d121d] border border-white/10 rounded-xl shadow-2xl py-1.5 divide-y divide-white/5">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        ws.id === activeWorkspace?.id
                          ? 'bg-indigo-600/10 text-indigo-400 font-bold border-l-2 border-indigo-500'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 uppercase">
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Menu */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Main Menu
            </span>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Projects ({projects.length})
              </span>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                title="Create project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500 italic">No active projects</div>
              ) : (
                projects.map((proj) => {
                  const isActive = pathname.startsWith(`/projects/${proj.id}`);
                  return (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-slate-800/90 text-white border border-white/10 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: proj.color || '#6366f1' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
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
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Management
            </span>
            <Link
              href="/settings"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                pathname === '/settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>

        {/* User Card Footer */}
        <div className="p-3 border-t border-white/5 bg-[#070a11]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0f1522] border border-white/5">
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0f1522]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20 uppercase shrink-0">
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
