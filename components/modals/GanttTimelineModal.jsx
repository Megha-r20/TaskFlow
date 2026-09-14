'use client';

import { useState, useEffect } from 'react';
import { Calendar, X, Filter } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';
import GanttChart from '../gantt/GanttChart';
import TaskDetailModal from './TaskDetailModal';

export default function GanttTimelineModal({ isOpen, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      fetchWorkspaceData();
    }
  }, [isOpen, activeWorkspace?.id]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const [taskRes, projRes] = await Promise.all([
        fetch(`/api/tasks?workspaceId=${activeWorkspace.id}`),
        fetch(`/api/projects?workspaceId=${activeWorkspace.id}`),
      ]);

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }
    } catch (err) {
      console.error('Fetch Gantt timeline error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredTasks =
    selectedProjectId === 'ALL'
      ? tasks
      : tasks.filter((t) => t.projectId === selectedProjectId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--tf-text-main)] flex items-center gap-2">
                Workspace Gantt Schedule Timeline
              </h3>
              <p className="text-[11px] text-[var(--tf-text-muted)]">
                Interactive schedule grid and milestone timelines across workspace tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Project */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[var(--tf-text-subtle)]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Workspace Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs font-mono text-[var(--tf-text-muted)] animate-pulse">
              Loading Gantt timeline tasks...
            </div>
          ) : (
            <GanttChart
              tasks={filteredTasks}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--tf-sidebar)] border-t border-[var(--tf-border)] text-center">
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">
            TaskFlow Gantt Engine • Click any task bar to view and edit details
          </p>
        </div>
      </div>

      {/* Task Detail Modal for clicked timeline bar */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchWorkspaceData}
          onDelete={fetchWorkspaceData}
        />
      )}
    </div>
  );
}
