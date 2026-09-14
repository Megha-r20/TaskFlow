'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Check, X, Mail, Shield, BarChart3 } from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import WorkloadPlanner from '@/components/workload/WorkloadPlanner';

export default function MembersPage() {
  const { user, activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'workload'
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      fetchMembers();
    }
  }, [activeWorkspace?.id]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error('Update role error:', err);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteMessage('');
    setInviteError('');
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMessage('Member added to workspace successfully!');
        setInviteEmail('');
        fetchMembers();
        setTimeout(() => setIsInviteOpen(false), 1200);
      } else {
        setInviteError(data.error || 'Failed to invite member');
      }
    } catch (err) {
      setInviteError('Network error while sending invite');
    }
  };

  const canManageRoles = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-12 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
        <div className="h-64 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--tf-text-main)] tracking-tight">Team Members & Access Control</h2>
          <p className="text-xs text-[var(--tf-text-muted)] mt-1">
            Manage permissions, invite new teammates, and assign roles in <strong className="text-[var(--tf-text-main)]">{activeWorkspace?.name}</strong>.
          </p>
        </div>

        {canManageRoles ? (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Teammate</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] bg-[var(--tf-sidebar)] px-3 py-1.5 rounded-lg border border-[var(--tf-border)]">
            🔒 Only Owners & Admins can change roles or invite members
          </span>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-[var(--tf-card)] p-1 rounded-lg border border-[var(--tf-border)] w-fit shadow-xs">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-amber-500 text-slate-900 shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
            activeTab === 'workload'
              ? 'bg-amber-500 text-slate-900 shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Workload & Capacity</span>
        </button>
      </div>

      {activeTab === 'workload' ? (
        <WorkloadPlanner />
      ) : (
        /* Members Table */
        <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl overflow-hidden shadow-2xl divide-y divide-[var(--tf-border)] transition-colors duration-150">
        <div className="p-3.5 bg-[var(--tf-sidebar)] grid grid-cols-12 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-subtle)] border-b border-[var(--tf-border)]">
          <div className="col-span-5 sm:col-span-6">Member</div>
          <div className="col-span-4 sm:col-span-3">Role & Permissions</div>
          <div className="col-span-3 text-right">Joined Date</div>
        </div>

        {members.map((m) => (
          <div key={m.id} className="p-4 grid grid-cols-12 items-center text-xs hover:bg-[var(--tf-hover)] transition">
            <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
              <img
                src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                alt={m.name}
                className="w-8 h-8 rounded-full object-cover border border-[var(--tf-border)]"
              />
              <div>
                <p className="font-bold text-[var(--tf-text-main)] flex items-center gap-1.5">
                  <span>{m.name}</span>
                  {m.userId === user?.id && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                      You
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-[var(--tf-text-muted)] font-mono">{m.email}</p>
              </div>
            </div>

            <div className="col-span-4 sm:col-span-3">
              {canManageRoles && m.role !== 'OWNER' && m.userId !== user?.id ? (
                <select
                  value={m.role}
                  onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                  className="bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md px-2 py-1 text-xs text-[var(--tf-text-main)] font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              ) : (
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    m.role === 'OWNER'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : m.role === 'ADMIN'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-[var(--tf-sidebar)] text-[var(--tf-text-subtle)] border-[var(--tf-border)]'
                  }`}
                >
                  {m.role === 'OWNER' ? '👑 OWNER' : m.role === 'ADMIN' ? '🛡️ ADMIN' : '👤 MEMBER'}
                </span>
              )}
            </div>

            <div className="col-span-3 text-right text-[var(--tf-text-muted)] font-mono text-[11px]">
              {new Date(m.joinedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsInviteOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-xl shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--tf-text-main)] font-bold text-sm">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Invite Workspace Member</span>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteMessage && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{inviteMessage}</span>
                </div>
              )}

              {inviteError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-main)] placeholder-[var(--tf-text-subtle)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                  Assign Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="MEMBER">Member (Standard Task & Project Access)</option>
                  <option value="ADMIN">Admin (Manage Members & Settings)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--tf-border)]">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition shadow-xs cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
