'use client';

import { useState, useEffect } from 'react';
import { Settings, Building2, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function SettingsPage() {
  const { activeWorkspace, refreshSession } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || '');
      setDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        setMessage('Workspace settings updated successfully!');
        refreshSession();
      } else {
        setMessage('Failed to update workspace settings');
      }
    } catch (err) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isOwnerOrAdmin = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Workspace Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure general preferences, branding, and parameters for <strong className="text-white">{activeWorkspace?.name}</strong>.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#111622] border border-slate-800/80 shadow-xl space-y-6">
        {message && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              disabled={!isOwnerOrAdmin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Workspace Description
            </label>
            <textarea
              rows={3}
              disabled={!isOwnerOrAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline workspace mission, project guidelines, or team description..."
              className="w-full px-3.5 py-2.5 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Workspace Slug Identifier
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-400 mt-1 block">
                {activeWorkspace?.slug}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Your Permission Role
              </span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                {activeWorkspace?.role || 'MEMBER'}
              </span>
            </div>
          </div>

          {isOwnerOrAdmin && (
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
