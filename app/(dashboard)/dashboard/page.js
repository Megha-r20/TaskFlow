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
  Sparkles,
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
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-28 bg-slate-900/40 rounded-2xl border border-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/40 rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="h-64 bg-slate-900/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-[#0f172a] to-[#080c14] border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Telemetry & Productivity</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeWorkspace?.name} Overview
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Real-time project completion velocity, upcoming task deadlines, and live activity streams.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 ring-1 ring-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Metric Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects */}
        <div className="p-5 rounded-2xl saas-card saas-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white">{stats?.totalProjects || 0}</p>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Active repositories
            </span>
          </div>
        </div>

        {/* Completed Tasks & Velocity */}
        <div className="p-5 rounded-2xl saas-card saas-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white">{stats?.completedTasks || 0}</p>
            <span className="text-xs font-bold text-emerald-400">({stats?.completionRate || 0}%)</span>
          </div>
          <p className="text-[11px] text-slate-500">of {stats?.totalTasks || 0} total workspace tasks</p>
        </div>

        {/* Pending & In Progress */}
        <div className="p-5 rounded-2xl saas-card saas-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats?.pendingTasks || 0}</p>
          <p className="text-[11px] text-slate-500">
            {stats?.inProgressTasks || 0} currently in active progress
          </p>
        </div>

        {/* Overdue Alert */}
        <div className="p-5 rounded-2xl saas-card saas-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-red-400">{stats?.overdueTasks || 0}</p>
          <p className="text-[11px] text-slate-500">Requires immediate attention</p>
        </div>
      </div>

      {/* Main Grid: Distribution Chart & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Distribution Progress Bar */}
          <div className="p-6 rounded-2xl saas-card space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Task Status Breakdown & Completion Velocity</span>
              </h3>
              <span className="text-xs font-bold text-emerald-400">{stats?.completionRate || 0}% Complete</span>
            </div>

            {/* Segmented Progress bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-white/5">
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-emerald-500 rounded-l-full transition-all duration-500"
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
                className="bg-slate-700 rounded-r-full transition-all duration-500"
                title="Todo"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Todo</span>
                <span className="text-sm font-extrabold text-slate-300">{stats?.todoTasks || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">In Progress</span>
                <span className="text-sm font-extrabold text-blue-400">{stats?.inProgressTasks || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">In Review</span>
                <span className="text-sm font-extrabold text-amber-400">{stats?.reviewTasks || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Completed</span>
                <span className="text-sm font-extrabold text-emerald-400">{stats?.completedTasks || 0}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="p-6 rounded-2xl saas-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Upcoming Milestones & Deadlines</span>
              </h3>
              <Link href="/my-tasks" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                My Tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {deadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">No upcoming deadlines</div>
              ) : (
                deadlines.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}?task=${task.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#090d16] hover:bg-slate-800/60 border border-white/5 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
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
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignee && (
                        <img
                          src={task.assignee.avatarUrl}
                          alt={task.assignee.name}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-indigo-500/20"
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
        <div className="p-6 rounded-2xl saas-card space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Activity Stream</span>
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 italic">No activity logged yet</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-white/5 text-xs">
                  <img
                    src={act.user?.avatarUrl}
                    alt={act.user?.name}
                    className="w-7 h-7 rounded-full object-cover mt-0.5 shrink-0 ring-1 ring-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{act.user?.name}</p>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{act.details}</p>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">
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
