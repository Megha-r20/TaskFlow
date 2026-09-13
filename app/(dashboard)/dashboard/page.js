'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  ArrowRight,
  Plus,
  Layers,
  User,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      fetchDashboardStats();
    }
  }, [activeWorkspace?.id]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?workspaceId=${activeWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivity(data.recentActivity || []);
        setDeadlines(data.upcomingDeadlines || []);
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800/40 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-[#0d121d] border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Productivity Center</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {activeWorkspace?.name} Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time metric telemetry, project completion velocity, and pending team tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-5 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{stats?.totalProjects || 0}</p>
          <p className="text-[11px] text-slate-500">Active engineering repositories</p>
        </div>

        {/* Completed Tasks & Velocity */}
        <div className="p-5 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-white">{stats?.completedTasks || 0}</p>
            <span className="text-xs font-bold text-emerald-400">({stats?.completionRate || 0}%)</span>
          </div>
          <p className="text-[11px] text-slate-500">of {stats?.totalTasks || 0} total workspace tasks</p>
        </div>

        {/* Pending & In Progress */}
        <div className="p-5 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{stats?.pendingTasks || 0}</p>
          <p className="text-[11px] text-slate-500">
            {stats?.inProgressTasks || 0} currently in active progress
          </p>
        </div>

        {/* Overdue Alert */}
        <div className="p-5 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-400">{stats?.overdueTasks || 0}</p>
          <p className="text-[11px] text-slate-500">Requires immediate team attention</p>
        </div>
      </div>

      {/* Main Content Grid: Upcoming Deadlines & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Task Status Breakdown & Upcoming Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Progress Bar */}
          <div className="p-6 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Task Distribution & Completion Rate</span>
              </h3>
              <span className="text-xs font-bold text-indigo-400">{stats?.completionRate || 0}% Complete</span>
            </div>

            {/* Segmented Progress bar */}
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-emerald-500 transition-all duration-500"
                title="Done"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-blue-500 transition-all duration-500"
                title="In Progress"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.reviewTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-amber-500 transition-all duration-500"
                title="Review"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.todoTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-slate-600 transition-all duration-500"
                title="Todo"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Todo</span>
                <span className="text-sm font-bold text-slate-300">{stats?.todoTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">In Progress</span>
                <span className="text-sm font-bold text-blue-400">{stats?.inProgressTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">In Review</span>
                <span className="text-sm font-bold text-amber-400">{stats?.reviewTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Completed</span>
                <span className="text-sm font-bold text-emerald-400">{stats?.completedTasks || 0}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="p-6 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Upcoming Milestones & Deadlines</span>
              </h3>
              <Link href="/my-tasks" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View my tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {deadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">No upcoming deadlines</div>
              ) : (
                deadlines.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}?task=${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f17] hover:bg-slate-800 border border-slate-800/80 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.project?.color || '#6366f1' }}
                      />
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {task.project?.name} ({task.project?.key})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignee && (
                        <img
                          src={task.assignee.avatarUrl}
                          alt={task.assignee.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed */}
        <div className="p-6 rounded-xl bg-[#111622] border border-slate-800/80 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Workspace Activity Stream</span>
          </h3>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">No activity logs recorded yet</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0b0f17] border border-slate-800/80 text-xs">
                  <img
                    src={act.user?.avatarUrl}
                    alt={act.user?.name}
                    className="w-6 h-6 rounded-full object-cover mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{act.user?.name}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">{act.details}</p>
                    <span className="text-[9px] text-slate-500 block mt-1">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onSuccess={fetchDashboardStats}
        />
      )}
    </div>
  );
}

function Sparkles(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
