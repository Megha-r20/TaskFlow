'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Check, X, Mail } from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function MembersPage() {
  const { user, activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteMessage, setInviteMessage] = useState('');

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
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMessage('Member added or invitation sent!');
        setInviteEmail('');
        fetchMembers();
        setTimeout(() => setIsInviteOpen(false), 1200);
      } else {
        setInviteMessage(data.error || 'Failed to invite member');
      }
    } catch (err) {
      setInviteMessage('Invite error');
    }
  };

  const canManageRoles = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-slate-800/40 rounded-xl" />
        <div className="h-64 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Workspace Team Members</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage access control, permissions, and team member roles for <strong className="text-white">{activeWorkspace?.name}</strong>.
          </p>
        </div>

        {canManageRoles && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="bg-[#111622] border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        <div className="p-3.5 bg-[#0d121d] grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="col-span-5 sm:col-span-6">Member</div>
          <div className="col-span-4 sm:col-span-3">Role & Permissions</div>
          <div className="col-span-3 text-right">Joined Date</div>
        </div>

        {members.map((m) => (
          <div key={m.id} className="p-4 grid grid-cols-12 items-center text-xs">
            <div className="col-span-5 sm:col-span-6 flex items-center gap-3">
              <img
                src={m.avatarUrl}
                alt={m.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
              />
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>{m.name}</span>
                  {m.userId === user?.id && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded">
                      You
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">{m.email}</p>
              </div>
            </div>

            <div className="col-span-4 sm:col-span-3">
              {canManageRoles && m.role !== 'OWNER' && m.userId !== user?.id ? (
                <select
                  value={m.role}
                  onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                  className="bg-[#0b0f17] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              ) : (
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    m.role === 'OWNER'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : m.role === 'ADMIN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.role}
                </span>
              )}
            </div>

            <div className="col-span-3 text-right text-slate-400 text-[11px]">
              {new Date(m.joinedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsInviteOpen(false)} />
          <div className="relative w-full max-w-md bg-[#121826] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Invite Workspace Member</span>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteMessage && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
                  {inviteMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assign Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MEMBER">Member (Standard Task & Project Access)</option>
                  <option value="ADMIN">Admin (Manage Members & Settings)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
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
