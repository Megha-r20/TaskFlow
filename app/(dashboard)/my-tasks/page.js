'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckSquare, Calendar, FolderKanban, Clock, ArrowRight, Plus, Search, Filter, Download, FileSpreadsheet, FileCode, ChevronDown } from 'lucide-react';
import { useWorkspace, useRealtime } from '@/components/layout/AppShell';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import { exportTasksToCSV, exportTasksToJSON } from '@/lib/exportTasks';

export default function MyTasksPage() {
  const { user, activeWorkspace, openCreateTask } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

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

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  });

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
            {filteredTasks.length} / {tasks.length} Assigned
          </span>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-[var(--tf-text-main)] font-semibold text-xs transition shadow-xs cursor-pointer"
              title="Export tasks"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-[var(--tf-text-muted)]" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-lg shadow-2xl z-30 py-1 divide-y divide-[var(--tf-border)]">
                <button
                  onClick={() => {
                    exportTasksToCSV(filteredTasks, 'my_tasks');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>CSV Spreadsheet</span>
                </button>
                <button
                  onClick={() => {
                    exportTasksToJSON(filteredTasks, 'my_tasks');
                    setIsExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition flex items-center gap-2 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-blue-500" />
                  <span>JSON Data</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => openCreateTask()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Filter Toolbar */}
      <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--tf-text-subtle)] absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my tasks..."
            className="w-full pl-8 pr-2.5 py-1 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs text-[var(--tf-text-main)] placeholder-[var(--tf-text-subtle)] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs font-mono text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs font-mono text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1 text-[11px] font-mono text-amber-500 hover:underline transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Task Table Container */}
      <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl overflow-hidden shadow-2xl divide-y divide-[var(--tf-border)] transition-colors duration-150">
        <div className="p-3 bg-[var(--tf-sidebar)] grid grid-cols-12 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-subtle)] border-b border-[var(--tf-border)]">
          <div className="col-span-6 sm:col-span-7">Task Title</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-3 sm:col-span-2 text-right">Status</div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--tf-text-muted)] space-y-3">
            <p className="italic">
              {hasActiveFilters ? 'No tasks match your current filter selection.' : "You currently have zero assigned pending tasks. You're all caught up! 🎉"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-xs text-[var(--tf-text-main)] font-semibold transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => openCreateTask()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create your first task</span>
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
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
