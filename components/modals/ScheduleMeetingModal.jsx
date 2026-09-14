'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, FolderKanban, Sparkles, Check } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function ScheduleMeetingModal({ isOpen, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState('30');
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Load projects & workspace members
  useEffect(() => {
    if (activeWorkspace) {
      Promise.all([
        fetch(`/api/projects?workspaceId=${activeWorkspace.id}`).then((r) => r.json()),
        fetch(`/api/workspaces/${activeWorkspace.id}/members`).then((r) => r.json()),
      ])
        .then(([projData, memData]) => {
          setProjects(projData.projects || []);
          setMembers(memData.members || []);
        })
        .catch(console.error);
    }
  }, [activeWorkspace?.id]);

  if (!isOpen) return null;

  const toggleInvitee = (userId) => {
    setSelectedInvitees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    const newMeeting = {
      id: `m-${Date.now()}`,
      title: title.trim(),
      projectId: projectId || null,
      projectName: projects.find((p) => p.id === projectId)?.name || null,
      date,
      time,
      duration: `${duration} mins`,
      invitees: selectedInvitees,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const storageKey = `taskflow_scheduled_huddles_${activeWorkspace?.id || 'global'}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([newMeeting, ...existing]));

    setIsSubmitting(false);
    if (onSuccess) onSuccess(newMeeting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--tf-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--tf-text-main)]">Schedule Future Huddle & Meeting</h2>
              <p className="text-[11px] text-[var(--tf-text-muted)]">Set up future team calls with calendar invites.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--tf-text-muted)] mb-1">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Backlog Grooming & Architecture Sync"
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--tf-text-muted)] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--tf-text-muted)] mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--tf-text-muted)] mb-1">Associated Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] cursor-pointer"
              >
                <option value="">Workspace Wide (All Projects)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--tf-text-muted)] mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] cursor-pointer"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
              </select>
            </div>
          </div>

          {/* Invite Teammates Checklist */}
          <div>
            <label className="block font-semibold text-[var(--tf-text-muted)] mb-1.5">Invite Teammates</label>
            <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-[var(--tf-bg)] border border-[var(--tf-border)] rounded-lg divide-y divide-[var(--tf-border)]">
              {members.map((m) => {
                const isSelected = selectedInvitees.includes(m.userId);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleInvitee(m.userId)}
                    className="flex items-center justify-between p-1.5 hover:bg-[var(--tf-hover)] rounded cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                        alt={m.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-semibold text-[var(--tf-text-main)]">{m.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        isSelected ? 'bg-amber-500 border-amber-600 text-slate-950' : 'border-[var(--tf-border)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--tf-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-md cursor-pointer"
            >
              📅 Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
