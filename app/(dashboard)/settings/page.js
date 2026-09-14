'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  ShieldAlert,
  CheckCircle2,
  User,
  Bell,
  Lock,
  ShieldCheck,
  Check,
  Sliders,
  Globe,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function SettingsPage() {
  const { user, activeWorkspace, refreshSession } = useWorkspace();

  // Tab State
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'personal' | 'permissions' | 'integrations'

  // Webhooks State
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);

  // Workspace Settings Form (Owner/Admin)
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [wsLoading, setWsLoading] = useState(false);
  const [wsMessage, setWsMessage] = useState('');
  const [wsError, setWsError] = useState('');

  // Personal Settings Form (Each user)
  const [userName, setUserName] = useState('');
  const [notifTaskAssigned, setNotifTaskAssigned] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifStatusUpdates, setNotifStatusUpdates] = useState(true);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalMessage, setPersonalMessage] = useState('');

  const isOwnerOrAdmin = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN';
  const role = activeWorkspace?.role || 'MEMBER';

  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name || '');
      setWsDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
    }
  }, [user?.id]);

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;
    setWsLoading(true);
    setWsMessage('');
    setWsError('');

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wsName, description: wsDescription }),
      });
      const data = await res.json();

      if (res.ok) {
        setWsMessage('Workspace settings updated successfully!');
        refreshSession();
      } else {
        setWsError(data.error || 'Failed to update workspace settings');
      }
    } catch (err) {
      setWsError('An unexpected network error occurred');
    } finally {
      setWsLoading(false);
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setPersonalLoading(true);
    setPersonalMessage('');

    try {
      // Simulate personal preferences update
      await new Promise((resolve) => setTimeout(resolve, 400));
      setPersonalMessage('Personal preferences saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setPersonalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--tf-text-main)] tracking-tight">Workspace Settings</h2>
          <p className="text-xs text-[var(--tf-text-muted)] mt-1">
            Manage settings for <strong className="text-[var(--tf-text-main)]">{activeWorkspace?.name}</strong> and your personal account preferences.
          </p>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[var(--tf-text-subtle)]">Logged in as:</span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border uppercase ${
              role === 'OWNER'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : role === 'ADMIN'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
            }`}
          >
            {role === 'OWNER' ? '👑 OWNER' : role === 'ADMIN' ? '🛡️ ADMIN' : '👤 MEMBER'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--tf-border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'workspace'
              ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-bold shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-500" />
          <span>Workspace Info</span>
          {!isOwnerOrAdmin && (
            <Lock className="w-3 h-3 text-[var(--tf-text-subtle)]" title="View only for Members" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'personal'
              ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-bold shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]'
          }`}
        >
          <User className="w-4 h-4 text-blue-500" />
          <span>My Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'permissions'
              ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-bold shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Role Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'integrations'
              ? 'bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] font-bold shadow-xs'
              : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-500" />
          <span>Slack & Discord Webhooks</span>
        </button>
      </div>

      {/* Tab 1: Workspace Info */}
      {activeTab === 'workspace' && (
        <div className="p-6 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xl space-y-6 transition-colors duration-150">
          {/* Permission Alert Banner for Members */}
          {!isOwnerOrAdmin && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">View-Only Mode</span>
                <span>
                  Your permission role in this workspace is <strong>MEMBER</strong>. Only Workspace Owners and Admins can modify organization details.
                </span>
              </div>
            </div>
          )}

          {wsMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{wsMessage}</span>
            </div>
          )}

          {wsError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{wsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                disabled={!isOwnerOrAdmin}
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 disabled:opacity-60 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1.5">
                Workspace Description
              </label>
              <textarea
                rows={3}
                disabled={!isOwnerOrAdmin}
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                placeholder="Outline workspace mission, project guidelines, or team description..."
                className="w-full px-3.5 py-2.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 disabled:opacity-60 resize-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider block">
                  Slug Identifier
                </span>
                <span className="text-xs font-mono font-semibold text-amber-500 mt-1 block truncate">
                  {activeWorkspace?.slug}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider block">
                  Your Access Role
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--tf-text-main)] mt-1 block">
                  {role}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider block">
                  Organization Capacity
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--tf-text-main)] mt-1 block">
                  {activeWorkspace?.memberCount || 1} Members • {activeWorkspace?.projectCount || 0} Projects
                </span>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={wsLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{wsLoading ? 'Saving...' : 'Save Workspace Settings'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: My Preferences (Per User) */}
      {activeTab === 'personal' && (
        <div className="p-6 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xl space-y-6 transition-colors duration-150">
          <div className="border-b border-[var(--tf-border)] pb-4">
            <h3 className="text-sm font-bold text-[var(--tf-text-main)]">Personal Account Preferences</h3>
            <p className="text-xs text-[var(--tf-text-muted)] mt-0.5">
              These settings apply specifically to <strong className="text-[var(--tf-text-main)]">{user?.name}</strong> ({user?.email}).
            </p>
          </div>

          {personalMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{personalMessage}</span>
            </div>
          )}

          <form onSubmit={handleSavePersonal} className="space-y-5">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-xs text-[var(--tf-text-muted)] opacity-70 cursor-not-allowed"
              />
            </div>

            {/* Notifications Section */}
            <div className="pt-2 space-y-3">
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider">
                Notification Alerts
              </label>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--tf-text-main)]">Task Assignments</p>
                      <p className="text-[10px] text-[var(--tf-text-muted)]">Receive notifications when tasks are assigned to you</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifTaskAssigned}
                    onChange={(e) => setNotifTaskAssigned(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--tf-text-main)]">Team Mentions</p>
                      <p className="text-[10px] text-[var(--tf-text-muted)]">Receive alerts when teammates mention you in comments</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifMentions}
                    onChange={(e) => setNotifMentions(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--tf-text-main)]">Task Status Activity</p>
                      <p className="text-[10px] text-[var(--tf-text-muted)]">Notify me when tasks I created change status</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifStatusUpdates}
                    onChange={(e) => setNotifStatusUpdates(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={personalLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{personalLoading ? 'Saving...' : 'Save Personal Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="p-6 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xl space-y-6 transition-colors duration-150">
          <div className="border-b border-[var(--tf-border)] pb-4">
            <h3 className="text-sm font-bold text-[var(--tf-text-main)]">Role & Access Permission Matrix</h3>
            <p className="text-xs text-[var(--tf-text-muted)] mt-0.5">
              Review editing and administrative capabilities enabled for your current role (<strong className="text-[var(--tf-text-main)]">{role}</strong>).
            </p>
          </div>
          {/* Who can choose roles info banner */}
          <div className="p-4 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--tf-text-main)]">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Who chooses and changes user roles?</span>
              </div>
              <p className="text-xs text-[var(--tf-text-muted)]">
                Workspace <strong>Owners</strong> and <strong>Admins</strong> can select roles when inviting new teammates or change existing member roles (Admin vs Member) in Team Members.
              </p>
            </div>
            {isOwnerOrAdmin && (
              <a
                href="/members"
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition shrink-0 self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>Manage Roles & Invites</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* OWNER Card */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                role === 'OWNER'
                  ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'bg-[var(--tf-sidebar)] border-[var(--tf-border)] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-500 uppercase">👑 Workspace Owner</span>
                {role === 'OWNER' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold uppercase">
                    Your Role
                  </span>
                )}
              </div>
              <ul className="space-y-2 text-xs text-[var(--tf-text-muted)]">
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Full Workspace Edit Access
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Manage Member Roles
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Project CRUD & Task Access
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Delete / Transfer Workspace
                </li>
              </ul>
            </div>

            {/* ADMIN Card */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                role === 'ADMIN'
                  ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-[var(--tf-sidebar)] border-[var(--tf-border)] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase">🛡️ Admin</span>
                {role === 'ADMIN' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-black font-bold uppercase">
                    Your Role
                  </span>
                )}
              </div>
              <ul className="space-y-2 text-xs text-[var(--tf-text-muted)]">
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Edit Workspace Info
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Invite & Manage Team Members
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Project Creation & Task Management
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-subtle)] line-through">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Delete Workspace
                </li>
              </ul>
            </div>

            {/* MEMBER Card */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                role === 'MEMBER'
                  ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'bg-[var(--tf-sidebar)] border-[var(--tf-border)] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-500 uppercase">👤 Member</span>
                {role === 'MEMBER' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold uppercase">
                    Your Role
                  </span>
                )}
              </div>
              <ul className="space-y-2 text-xs text-[var(--tf-text-muted)]">
                <li className="flex items-center gap-2 text-[var(--tf-text-subtle)]">
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> View Only Workspace Settings
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Personal Account Preferences
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Create & Update Assigned Tasks
                </li>
                <li className="flex items-center gap-2 text-[var(--tf-text-main)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Comment & Mention Teammates
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Slack & Discord Webhook Integrations */}
      {activeTab === 'integrations' && (
        <div className="p-6 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--tf-text-main)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span>Slack & Discord Incoming Webhooks</span>
            </h3>
            <p className="text-xs text-[var(--tf-text-muted)] mt-1">
              Automatically broadcast new task creations, completed milestones, and live Huddle notifications directly into your team chat channels.
            </p>
          </div>

          {webhookMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>{webhookMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                Slack Incoming Webhook URL
              </label>
              <input
                type="text"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK_URL"
                className="w-full px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                Discord Webhook URL
              </label>
              <input
                type="text"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz"
                className="w-full px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={async () => {
                  setWebhookLoading(true);
                  setWebhookMessage('');
                  try {
                    const res = await fetch('/api/integrations/webhooks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ slackWebhookUrl, discordWebhookUrl, testNotification: true }),
                    });
                    if (res.ok) {
                      setWebhookMessage('Test webhook dispatch sent successfully to configured channels!');
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setWebhookLoading(false);
                  }
                }}
                disabled={webhookLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{webhookLoading ? 'Sending Test...' : 'Save & Send Test Webhook'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
