'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  ListFilter,
  Search,
  Plus,
  Download,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import { useRealtime } from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import GanttChart from '@/components/gantt/GanttChart';
import WhiteboardCanvas from '@/components/whiteboard/WhiteboardCanvas';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import { exportTasksToCSV, exportTasksToJSON } from '@/lib/exportTasks';

export default function ProjectDetailPage({ params }) {
  const { id: projectId } = use(params);
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get('task');

  const { activeWorkspace } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'kanban' | 'list' | 'gantt'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals & Menus
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

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

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter || assigneeFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (assigneeFilter === 'unassigned' && task.assigneeId) return false;
    if (assigneeFilter && assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-28 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
        <div className="h-96 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center text-[var(--tf-text-muted)] font-mono text-xs">
        Project not found or access denied.
      </div>
    );
  }

  const completionPct = project.totalTasks > 0
    ? Math.round((project.completedTasks / project.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Header Banner - Design Tokens */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 relative overflow-hidden shadow-2xl transition-colors duration-150">
        {/* Live update pulse */}
        {recentlyUpdated && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-500 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Live update
          </span>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 border border-white/10 shadow-xs"
              style={{ backgroundColor: project.color || '#3b82f6' }}
            >
              {project.key}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[var(--tf-text-main)] tracking-tight">{project.name}</h2>
                <span className="px-2 py-0.2 text-[10px] font-mono uppercase rounded tf-tag-blue">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-[var(--tf-text-muted)] mt-1 max-w-2xl">
                {project.description || 'No description set for this project.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
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
                      exportTasksToCSV(filteredTasks, `project_${project.key}`);
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>CSV Spreadsheet</span>
                  </button>
                  <button
                    onClick={() => {
                      exportTasksToJSON(filteredTasks, `project_${project.key}`);
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
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-3 border-t border-[var(--tf-border)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--tf-text-muted)] font-mono">
            <div className="flex items-center gap-5">
              <span>Total: <strong className="text-[var(--tf-text-main)]">{project.totalTasks}</strong></span>
              <span>Done: <strong className="text-emerald-500">{project.completedTasks}</strong></span>
              <span>Progress: <strong className="text-amber-500">{completionPct}%</strong></span>
            </div>
            <div className="flex -space-x-1.5">
              {project.members?.slice(0, 5).map((m) => (
                <img
                  key={m.id}
                  src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                  alt={m.name}
                  title={m.name}
                  className="w-5 h-5 rounded-full object-cover border border-[var(--tf-border)]"
                />
              ))}
              {project.members?.length > 5 && (
                <div className="w-5 h-5 rounded-full bg-[var(--tf-sidebar)] border border-[var(--tf-border)] flex items-center justify-center text-[9px] font-mono text-[var(--tf-text-subtle)]">
                  +{project.members.length - 5}
                </div>
              )}
            </div>
          </div>
          <div className="h-2 bg-[var(--tf-sidebar)] rounded-full flex p-0.5 border border-[var(--tf-border)] overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs transition-colors duration-150">
        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-[var(--tf-bg)] p-1 rounded-lg border border-[var(--tf-border)]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Task List</span>
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
              viewMode === 'gantt'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Gantt Timeline</span>
          </button>
          <button
            onClick={() => setViewMode('whiteboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
              viewMode === 'whiteboard'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Whiteboard & Mind Map</span>
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-[var(--tf-text-subtle)] absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-2.5 py-1 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs text-[var(--tf-text-main)] placeholder-[var(--tf-text-subtle)] focus:outline-none focus:border-amber-500"
            />
          </div>

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

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1 bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-md text-xs font-mono text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {project.members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-[11px] font-mono text-amber-500 hover:underline transition"
            >
              Clear
            </button>
          )}
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
      ) : viewMode === 'gantt' ? (
        <GanttChart
          tasks={filteredTasks}
          onTaskClick={(t) => setSelectedTaskId(t.id)}
        />
      ) : viewMode === 'whiteboard' ? (
        <div className="h-[650px]">
          <WhiteboardCanvas
            projectId={projectId}
            onTaskCreated={() => fetchProject()}
          />
        </div>
      ) : (
        /* List View */
        <div className="bg-[#202020] rounded-lg border border-[#333] overflow-hidden divide-y divide-[#333]">
          <div className="p-3 bg-[#222] grid grid-cols-12 text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
            <div className="col-span-6 sm:col-span-7">Task Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2 sm:col-span-1 text-right">Assignee</div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-xs font-mono text-stone-500 italic">No matching tasks found</div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className="p-3 grid grid-cols-12 items-center text-xs hover:bg-[#282828] cursor-pointer transition group"
              >
                <div className="col-span-6 sm:col-span-7 flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-stone-400 px-1.5 py-0.2 rounded bg-[#191919] border border-[#333]">
                    {project.key}-{t.id.slice(0, 4).toUpperCase()}
                  </span>
                  <span className="font-medium text-[#e3e3e3] group-hover:text-amber-300 transition truncate">{t.title}</span>
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
                      className="w-5 h-5 rounded-full object-cover border border-[#444]"
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-stone-500">—</span>
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

function StatusBadge({ status }) {
  const config = {
    TODO: 'tf-tag-gray',
    IN_PROGRESS: 'tf-tag-blue',
    REVIEW: 'tf-tag-yellow',
    DONE: 'tf-tag-green',
    CANCELLED: 'tf-tag-red',
  };
  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded ${config[status] || config.TODO}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const config = {
    LOW: 'tf-tag-gray',
    MEDIUM: 'tf-tag-blue',
    HIGH: 'tf-tag-orange',
    URGENT: 'tf-tag-red font-semibold',
  };
  return (
    <span className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded ${config[priority] || config.LOW}`}>
      {priority}
    </span>
  );
}
