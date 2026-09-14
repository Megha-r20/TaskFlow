'use client';

import { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function CreateTaskModal({ isOpen, onClose, defaultProjectId, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace?.id]);

  const fetchData = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        fetch(`/api/projects?workspaceId=${activeWorkspace.id}`),
        fetch(`/api/workspaces/${activeWorkspace.id}/members`),
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
        if (!projectId && projData.projects.length > 0) {
          setProjectId(projData.projects[0].id);
        }
      }

      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
      }
    } catch (err) {
      console.error('Fetch modal data error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title,
          description,
          status,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      onSuccess?.(data.task);
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
      <div className="relative w-full max-w-xl bg-[var(--notion-modal-bg)] border border-[var(--notion-border)] rounded-xl shadow-2xl overflow-hidden z-10">
        <div className="p-4 border-b border-[var(--notion-border)] bg-[var(--notion-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--notion-text-main)] font-bold text-base">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <span>Create New Task</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)] hover:bg-[var(--notion-hover)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] focus:outline-none focus:border-amber-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Social Login endpoints"
              className="w-full px-3 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] placeholder-[var(--notion-text-subtle)] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add technical specification, requirements, or links..."
              className="w-full px-3 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] placeholder-[var(--notion-text-subtle)] focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] focus:outline-none focus:border-amber-500"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2.5 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-2.5 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] focus:outline-none focus:border-amber-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--notion-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)] hover:bg-[var(--notion-hover)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
