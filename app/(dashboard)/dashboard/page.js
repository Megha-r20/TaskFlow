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
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import { useRealtime } from '@/components/layout/AppShell';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

export default function DashboardPage() {
  const { activeWorkspace, openAiStandup } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};
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

  // Refresh dashboard stats when realtime task events arrive
  useEffect(() => {
    if (!registerRealtimeHandler || !activeWorkspace) return;
    const refresh = () => fetchDashboardStats();
    const u1 = registerRealtimeHandler('TASK_CREATED', refresh);
    const u2 = registerRealtimeHandler('TASK_UPDATED', refresh);
    const u3 = registerRealtimeHandler('TASK_DELETED', refresh);
    return () => { u1?.(); u2?.(); u3?.(); };
  }, [registerRealtimeHandler, activeWorkspace?.id]);

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
        <div className="h-24 bg-[var(--tf-card)] rounded-lg border border-[var(--tf-border)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[var(--tf-card)] rounded-lg border border-[var(--tf-border)]" />
          ))}
        </div>
        <div className="h-64 bg-[var(--tf-card)] rounded-lg border border-[var(--tf-border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Pro Callout Banner */}
      <div className="p-5 sm:p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-xs">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium tf-tag-yellow">
            <span>🚀</span>
            <span>Workspace Telemetry</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--tf-text-main)] tracking-tight">
            {activeWorkspace?.name} Overview
          </h2>
          <p className="text-xs text-[var(--tf-text-muted)] max-w-xl">
            Real-time project completion velocity, task deadlines, and workspace activity feeds.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={openAiStandup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold text-xs transition border border-amber-500/30 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>✨ AI Standup</span>
          </button>
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition border border-[var(--tf-border)] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Clean Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider">Projects</span>
            <FolderKanban className="w-4 h-4 text-[var(--tf-text-muted)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[var(--tf-text-main)]">{stats?.totalProjects || 0}</p>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded tf-tag-blue">
              Active
            </span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[var(--tf-text-main)]">{stats?.completedTasks || 0}</p>
            <span className="text-xs font-mono font-semibold text-emerald-500">({stats?.completionRate || 0}%)</span>
          </div>
          <p className="text-[10px] text-[var(--tf-text-subtle)] font-mono">of {stats?.totalTasks || 0} total tasks</p>
        </div>

        {/* Pending Tasks */}
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider">Pending Tasks</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-[var(--tf-text-main)]">{stats?.pendingTasks || 0}</p>
          <p className="text-[10px] text-[var(--tf-text-subtle)] font-mono">
            {stats?.inProgressTasks || 0} in active progress
          </p>
        </div>

        {/* Overdue Tasks */}
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase tracking-wider">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">{stats?.overdueTasks || 0}</p>
          <p className="text-[10px] text-[var(--tf-text-subtle)] font-mono">Requires attention</p>
        </div>
      </div>

      {/* Main Grid: Distribution & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Breakdown Bar */}
          <div className="p-5 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold text-[var(--tf-text-main)] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Task Status Breakdown</span>
              </h3>
              <span className="text-xs font-mono text-emerald-500 font-medium">{stats?.completionRate || 0}% Complete</span>
            </div>

            {/* Segmented Progress bar */}
            <div className="h-2.5 w-full bg-[var(--tf-sidebar)] rounded flex p-0.5 border border-[var(--tf-border)]">
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-emerald-500 rounded-l transition-all duration-300"
                title="Done"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-blue-500 transition-all duration-300"
                title="In Progress"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.reviewTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-amber-500 transition-all duration-300"
                title="Review"
              />
              <div
                style={{
                  width: `${stats?.totalTasks ? (stats.todoTasks / stats.totalTasks) * 100 : 0}%`,
                }}
                className="bg-stone-500 rounded-r transition-all duration-300"
                title="Todo"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono block">TODO</span>
                <span className="text-xs font-mono font-semibold text-[var(--tf-text-main)]">{stats?.todoTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono block">IN PROGRESS</span>
                <span className="text-xs font-mono font-semibold text-blue-500">{stats?.inProgressTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono block">IN REVIEW</span>
                <span className="text-xs font-mono font-semibold text-amber-500">{stats?.reviewTasks || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
                <span className="text-[10px] text-[var(--tf-text-subtle)] font-mono block">DONE</span>
                <span className="text-xs font-mono font-semibold text-emerald-500">{stats?.completedTasks || 0}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="p-5 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold text-[var(--tf-text-main)] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Upcoming Deadlines</span>
              </h3>
              <Link href="/my-tasks" className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1">
                My Tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {deadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--tf-text-subtle)] italic">No upcoming deadlines</div>
              ) : (
                deadlines.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}?task=${task.id}`}
                    className="flex items-center justify-between p-3 rounded bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.project?.color || '#3b82f6' }}
                      />
                      <div>
                        <p className="text-xs font-medium text-[var(--tf-text-main)] group-hover:text-amber-500 transition">
                          {task.title}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--tf-text-subtle)] mt-0.5">
                          {task.project?.name} ({task.project?.key})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded tf-tag-yellow">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignee && (
                        <img
                          src={task.assignee.avatarUrl}
                          alt={task.assignee.name}
                          className="w-5 h-5 rounded-full object-cover border border-[var(--tf-border)]"
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
        <div className="p-5 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3.5 shadow-xs">
          <h3 className="text-xs font-mono font-semibold text-[var(--tf-text-main)] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Activity Stream</span>
          </h3>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--tf-text-subtle)] italic">No activity logged yet</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 p-2.5 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs">
                  <img
                    src={act.user?.avatarUrl}
                    alt={act.user?.name}
                    className="w-6 h-6 rounded-full object-cover mt-0.5 shrink-0 border border-[var(--tf-border)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--tf-text-main)] truncate">{act.user?.name}</p>
                    <p className="text-[var(--tf-text-muted)] text-[11px] mt-0.5 leading-snug">{act.details}</p>
                    <span className="text-[9px] text-[var(--tf-text-subtle)] font-mono block mt-1">
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
