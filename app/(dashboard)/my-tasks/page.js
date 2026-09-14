'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckSquare, Calendar, FolderKanban, Clock, ArrowRight, Plus } from 'lucide-react';
import { useWorkspace, useRealtime } from '@/components/layout/AppShell';
import TaskDetailModal from '@/components/modals/TaskDetailModal';

export default function MyTasksPage() {
  const { user, activeWorkspace, openCreateTask } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchMyTasks = useCallback(async () => {
    if (!user?.id || !activeWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tasks?workspaceId=${activeWorkspace.id}&assigneeId=${user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Fetch my tasks error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeWorkspace?.id]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // Real-time updates handler
  useEffect(() => {
    if (!registerRealtimeHandler) return;
    const unsubCreated = registerRealtimeHandler('TASK_CREATED', fetchMyTasks);
    const unsubUpdated = registerRealtimeHandler('TASK_UPDATED', fetchMyTasks);
    const unsubDeleted = registerRealtimeHandler('TASK_DELETED', fetchMyTasks);
    return () => {
      unsubCreated?.();
      unsubUpdated?.();
      unsubDeleted?.();
    };
  }, [registerRealtimeHandler, fetchMyTasks]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-10 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
        <div className="h-64 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--tf-text-main)] tracking-tight">My Assigned Tasks</h2>
          <p className="text-xs text-[var(--tf-text-muted)] mt-1">
            All tasks currently assigned to <strong className="text-[var(--tf-text-main)]">{user?.name}</strong> in {activeWorkspace?.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold font-mono">
            {tasks.length} Assigned
          </span>
          <button
            onClick={() => openCreateTask()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Table Container */}
      <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl overflow-hidden shadow-2xl divide-y divide-[var(--tf-border)] transition-colors duration-150">
        <div className="p-3 bg-[var(--tf-sidebar)] grid grid-cols-12 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-subtle)] border-b border-[var(--tf-border)]">
          <div className="col-span-6 sm:col-span-7">Task Title</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-3 sm:col-span-2 text-right">Status</div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--tf-text-muted)] space-y-3">
            <p className="italic">You currently have zero assigned pending tasks. You're all caught up! 🎉</p>
            <button
              onClick={() => openCreateTask()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first task</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3.5 grid grid-cols-12 items-center text-xs hover:bg-[var(--tf-hover)] cursor-pointer transition group"
            >
              <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                <span className="font-mono text-[10px] text-amber-500 font-bold px-1.5 py-0.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                  {task.project?.key}-{task.id.slice(0, 4)}
                </span>
                <span className="font-semibold text-[var(--tf-text-main)] group-hover:text-amber-500 transition truncate">
                  {task.title}
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: task.project?.color || '#3b82f6' }}
                />
                <span className="text-[var(--tf-text-muted)] font-medium truncate">{task.project?.name}</span>
              </div>
              <div className="col-span-3 sm:col-span-2 flex justify-end">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--tf-sidebar)] text-[var(--tf-text-main)] border border-[var(--tf-border)]">
                  {task.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchMyTasks}
          onDelete={fetchMyTasks}
        />
      )}
    </div>
  );
}
