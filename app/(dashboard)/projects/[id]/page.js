'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  ListFilter,
  Search,
  Plus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import { useRealtime } from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

export default function ProjectDetailPage({ params }) {
  const { id: projectId } = use(params);
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get('task');

  const { activeWorkspace } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Live indicator — briefly flash when a realtime update arrives
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setTasks(data.project.tasks || []);
      }
    } catch (err) {
      console.error('Fetch project error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // ── Real-time task sync ──────────────────────────────────────────────────
  // Instead of full re-fetch, we surgically update local state
  useEffect(() => {
    if (!registerRealtimeHandler) return;

    const flashUpdate = () => {
      setRecentlyUpdated(true);
      setTimeout(() => setRecentlyUpdated(false), 1500);
    };

    const handleTaskCreated = (data) => {
      const task = data.task;
      if (!task || task.projectId !== projectId) return;
      setTasks((prev) => {
        if (prev.find((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
      flashUpdate();
    };

    const handleTaskUpdated = (data) => {
      const task = data.task;
      if (!task || task.projectId !== projectId) return;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)));
      flashUpdate();
    };

    const handleTaskDeleted = (data) => {
      if (!data.taskId) return;
      setTasks((prev) => {
        // Only delete if the task belongs to this project
        const found = prev.find((t) => t.id === data.taskId);
        if (!found) return prev;
        flashUpdate();
        return prev.filter((t) => t.id !== data.taskId);
      });
    };

    const u1 = registerRealtimeHandler('TASK_CREATED', handleTaskCreated);
    const u2 = registerRealtimeHandler('TASK_UPDATED', handleTaskUpdated);
    const u3 = registerRealtimeHandler('TASK_DELETED', handleTaskDeleted);

    return () => {
      u1?.();
      u2?.();
      u3?.();
    };
  }, [registerRealtimeHandler, projectId]);

  // ── Optimistic drag-and-drop task move ──────────────────────────────────
  const handleTaskMove = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Task move error:', err);
      fetchProject();
    }
  };

  const handleOpenQuickAdd = (status) => {
    setIsCreateTaskOpen(true);
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-32 bg-slate-900/40 rounded-2xl border border-white/5" />
        <div className="h-96 bg-slate-900/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Project not found or access denied.
      </div>
    );
  }

  const completionPct = project.totalTasks > 0
    ? Math.round((project.completedTasks / project.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl saas-card space-y-5 relative overflow-hidden">
        {/* Live update pulse */}
        {recentlyUpdated && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Live update
          </span>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: project.color || '#6366f1' }}
            >
              {project.key}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{project.name}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {project.description || 'No description set for this project.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 ring-1 ring-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-6">
              <span>Total: <strong className="text-white">{project.totalTasks}</strong></span>
              <span>Done: <strong className="text-emerald-400">{project.completedTasks}</strong></span>
              <span>Progress: <strong className="text-indigo-400">{completionPct}%</strong></span>
            </div>
            <div className="flex -space-x-2">
              {project.members?.slice(0, 5).map((m) => (
                <img
                  key={m.id}
                  src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                  alt={m.name}
                  title={m.name}
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-[#0f172a]"
                />
              ))}
              {project.members?.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-slate-800 ring-2 ring-[#0f172a] flex items-center justify-center text-[9px] font-bold text-slate-400">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
          </div>
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 rounded-2xl bg-[#090d16] border border-white/5">
        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-[#0f1522] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'kanban'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Task List</span>
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0f1522] border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0f1522] border border-white/5 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none"
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
            className="px-3 py-1.5 bg-[#0f1522] border border-white/5 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskClick={(taskId) => setSelectedTaskId(taskId)}
          onQuickAdd={handleOpenQuickAdd}
        />
      ) : (
        /* List View */
        <div className="saas-card rounded-2xl overflow-hidden shadow-xl divide-y divide-white/5">
          <div className="p-3.5 bg-[#090d16] grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-6 sm:col-span-7">Task Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2 sm:col-span-1 text-right">Assignee</div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic">No matching tasks found</div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className="p-3.5 grid grid-cols-12 items-center text-xs hover:bg-slate-800/40 cursor-pointer transition group"
              >
                <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-indigo-400 px-2 py-0.5 rounded bg-slate-900 border border-indigo-500/20">
                    {project.key}-{t.id.slice(0, 4).toUpperCase()}
                  </span>
                  <span className="font-bold text-white group-hover:text-indigo-300 transition truncate">{t.title}</span>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={t.status} />
                </div>
                <div className="col-span-2">
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  {t.assignee ? (
                    <img
                      src={t.assignee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignee.name}`}
                      alt={t.assignee.name}
                      title={t.assignee.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          defaultProjectId={project.id}
          onClose={() => setIsCreateTaskOpen(false)}
          onSuccess={fetchProject}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchProject}
          onDelete={fetchProject}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    TODO: 'bg-slate-700/60 text-slate-300',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    REVIEW: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    DONE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config[status] || config.TODO}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    LOW: 'text-slate-400',
    MEDIUM: 'text-blue-400',
    HIGH: 'text-amber-400',
    URGENT: 'text-red-400 font-extrabold',
  };
  return (
    <span className={`text-[10px] font-bold uppercase ${config[priority] || 'text-slate-400'}`}>
      {priority}
    </span>
  );
}
