'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  ListFilter,
  Search,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskDetailModal from '@/components/modals/TaskDetailModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

export default function ProjectDetailPage({ params }) {
  const { id: projectId } = use(params);
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get('task');

  const { activeWorkspace } = useWorkspace();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'kanban' | 'list' | 'overview'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState('TODO');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
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
  };

  const handleTaskMove = async (taskId, newStatus) => {
    // Optimistic UI state update
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
      fetchProject(); // Revert on failure
    }
  };

  const handleOpenQuickAdd = (status) => {
    setQuickAddStatus(status);
    setIsCreateTaskOpen(true);
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }
    if (assigneeFilter && task.assigneeId !== assigneeFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-800/40 rounded-xl" />
        <div className="h-96 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center text-slate-400">
        Project not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Header Banner */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shrink-0"
              style={{ backgroundColor: project.color || '#6366f1' }}
            >
              {project.key}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-indigo-400 border border-slate-700">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {project.description || 'No description set for this project.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenQuickAdd('TODO')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Project Metrics & Completion Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div>
              Total tasks: <strong className="text-white">{project.totalTasks}</strong>
            </div>
            <div>
              Completed: <strong className="text-emerald-400">{project.completedTasks}</strong>
            </div>
            <div>
              Progress: <strong className="text-indigo-400">{project.progress}%</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Team:</span>
            <div className="flex -space-x-2">
              {project.members?.map((m) => (
                <img
                  key={m.id}
                  src={m.avatarUrl}
                  alt={m.name}
                  title={m.name}
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-[#111622]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 rounded-xl bg-[#0d121d] border border-slate-800">
        {/* Left View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#121826] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Task List</span>
          </button>
        </div>

        {/* Right Search and Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#121826] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#121826] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
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
            className="px-2.5 py-1.5 bg-[#121826] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskClick={(taskId) => setSelectedTaskId(taskId)}
          onQuickAdd={handleOpenQuickAdd}
        />
      ) : (
        /* List View */
        <div className="bg-[#111622] border border-slate-800 rounded-xl overflow-hidden shadow-lg divide-y divide-slate-800/80">
          <div className="p-3 bg-[#0d121d] grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-5 sm:col-span-6">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-3 sm:col-span-2 text-right">Assignee</div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No matching tasks found</div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className="p-3 grid grid-cols-12 items-center text-xs hover:bg-slate-800/50 cursor-pointer transition"
              >
                <div className="col-span-5 sm:col-span-6 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-indigo-400 font-bold">
                    {project.key}-{t.id.slice(0, 4)}
                  </span>
                  <span className="font-semibold text-white truncate">{t.title}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {t.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t.priority}</span>
                </div>
                <div className="col-span-3 sm:col-span-2 flex justify-end">
                  {t.assignee ? (
                    <img
                      src={t.assignee.avatarUrl}
                      alt={t.assignee.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">Unassigned</span>
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

      {/* Task Detail Modal Drawer */}
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
