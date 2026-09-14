'use client';

import { useState, useEffect } from 'react';
import { X, Users, FolderKanban } from 'lucide-react';
import WorkloadPlanner from '../workload/WorkloadPlanner';
import { useWorkspace } from '../layout/AppShell';

export default function WorkloadModal({ isOpen, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (activeWorkspace) {
      fetch(`/api/projects?workspaceId=${activeWorkspace.id}`)
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
        })
        .catch(console.error);
    }
  }, [activeWorkspace?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[90vh] bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--tf-text-main)] flex items-center gap-2">
                Team Workload & Capacity Planner
              </h2>
              <p className="text-[11px] text-[var(--tf-text-muted)]">
                Track workload hours, spot over-allocation burnout risks, and reassign tasks in 1 click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by project */}
            <div className="flex items-center gap-1.5 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg px-2.5 py-1">
              <FolderKanban className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-[var(--tf-text-main)] focus:outline-none cursor-pointer"
              >
                <option value="">All Workspace Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--tf-bg)]">
          <WorkloadPlanner projectId={selectedProjectId || null} />
        </div>
      </div>
    </div>
  );
}
