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

      {/* Sidebar Container - Pro Responsive Light/Dark */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--tf-sidebar)] border-r border-[var(--tf-border)] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 transition-colors duration-150 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Active Workspace Header */}
        <div className="p-3.5 border-b border-[var(--tf-border)] space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="TaskFlow Logo"
                className="w-7 h-7 rounded-lg border border-[var(--tf-border)] object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--tf-text-main)] tracking-tight flex items-center gap-1.5">
                  TaskFlow
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--tf-card-hover)] text-[var(--tf-text-muted)] border border-[var(--tf-border)]">
                    Pro
                  </span>
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setIsWsDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-md bg-[var(--tf-card)] hover:bg-[var(--tf-card-hover)] border border-[var(--tf-border)] text-left transition group shadow-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                  {activeWorkspace?.name?.charAt(0) || 'W'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-[var(--tf-text-main)] block truncate">
                    {activeWorkspace?.name || 'Select Workspace'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--tf-text-muted)] shrink-0 group-hover:text-[var(--tf-text-main)] transition" />
            </button>

            {/* Workspace Dropdown */}
            {isWsDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-lg shadow-2xl py-1 divide-y divide-[var(--tf-border)]">
                <div className="px-3 py-1 text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider">
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
                          ? 'bg-[var(--tf-hover)] text-[var(--tf-text-main)] font-semibold border-l-2 border-amber-500'
                          : 'text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] hover:text-[var(--tf-text-main)]'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[var(--tf-sidebar)] text-[var(--tf-text-subtle)] uppercase border border-[var(--tf-border)]">
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
            <span className="px-2 text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider block mb-1">
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
                        ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-semibold shadow-xs'
                        : 'text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] hover:text-[var(--tf-text-main)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-[var(--tf-text-muted)]'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider">
                Projects ({projects.length})
              </span>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="p-0.5 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition"
                title="Create project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-2.5 py-1.5 text-xs text-[var(--tf-text-subtle)] italic">No active projects</div>
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
                          ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-semibold shadow-xs'
                          : 'text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] hover:text-[var(--tf-text-main)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#3b82f6' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--tf-sidebar)] text-[var(--tf-text-subtle)] border border-[var(--tf-border)]">
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
            <span className="px-2 text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider block mb-1">
              Settings
            </span>
            <Link
              href="/settings"
              onClick={onClose}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                pathname === '/settings'
                  ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-semibold shadow-xs'
                  : 'text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] hover:text-[var(--tf-text-main)]'
              }`}
            >
              <Settings className="w-4 h-4 text-[var(--tf-text-muted)]" />
              <span>Workspace Settings</span>
            </Link>
          </div>
        </div>

        {/* User Card Footer - Clean Style */}
        <div className="p-3 border-t border-[var(--tf-border)] bg-[var(--tf-sidebar)]">
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-[var(--tf-card)] border border-[var(--tf-border)]">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-[var(--tf-border)]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--tf-text-main)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[var(--tf-text-muted)] truncate">{user?.email}</p>
            </div>
            <span className="text-[9px] font-mono font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase shrink-0">
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
