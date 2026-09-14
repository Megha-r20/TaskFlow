'use client';

import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!key || key.length <= 4) {
      setKey(val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          name,
          key,
          description,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-lg shadow-2xl overflow-hidden z-10">
        <div className="p-3.5 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--tf-text-main)] font-semibold text-sm">
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>Create New Project</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="Mobile App v2.0"
                className="w-full px-3 py-1.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
                Key (Prefix)
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="MOB"
                className="w-full px-3 py-1.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs text-[var(--tf-text-main)] uppercase font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project scope, objectives, and goals..."
              className="w-full px-3 py-1.5 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition transform ${
                    color === c ? 'scale-125 ring-2 ring-amber-500 ring-offset-2 ring-offset-[var(--tf-modal-bg)]' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--tf-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 border border-[var(--tf-border)] transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
