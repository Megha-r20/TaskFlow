'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Calendar,
  Zap,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    velocity: 42,
    leadTimeDays: 2.4,
    cycleTimeDays: 1.1,
    completionRate: 88,
    totalCompleted: 156,
  });

  const exportReportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Workspace,${activeWorkspace?.name || 'TaskFlow'}\n` +
      `Velocity (Tasks/wk),${stats.velocity}\n` +
      `Avg Lead Time (Days),${stats.leadTimeDays}\n` +
      `Avg Cycle Time (Days),${stats.cycleTimeDays}\n` +
      `Completion Rate (%),${stats.completionRate}%\n` +
      `Total Tasks Completed,${stats.totalCompleted}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TaskFlow_Analytics_${activeWorkspace?.slug || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium tf-tag-blue mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Workspace Telemetry & Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--tf-text-main)] tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs text-[var(--tf-text-muted)] mt-1">
            Real-time Sprint Burndown, team execution velocity, lead time metrics, and exportable CSV reports.
          </p>
        </div>

        <button
          onClick={exportReportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase">
            <span>Sprint Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--tf-text-main)]">{stats.velocity}</span>
            <span className="text-xs font-mono text-emerald-500">+14% vs last week</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">Completed tasks / 7 days</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase">
            <span>Avg Lead Time</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--tf-text-main)]">{stats.leadTimeDays}</span>
            <span className="text-xs font-mono text-[var(--tf-text-muted)]">days</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">From creation to completion</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase">
            <span>Avg Cycle Time</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--tf-text-main)]">{stats.cycleTimeDays}</span>
            <span className="text-xs font-mono text-[var(--tf-text-muted)]">days</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">From in-progress to done</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-[var(--tf-text-subtle)] uppercase">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--tf-text-main)]">{stats.completionRate}%</span>
            <span className="text-xs font-mono text-emerald-500">High efficiency</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">{stats.totalCompleted} total tasks closed</p>
        </div>
      </div>

      {/* SVG Sprint Burndown Visual Chart */}
      <div className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--tf-text-main)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>Sprint Burndown Chart (Ideal vs. Actual Progress)</span>
            </h3>
            <p className="text-xs text-[var(--tf-text-muted)] mt-0.5">
              Tracks remaining task effort over the 14-day sprint lifecycle.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[var(--tf-text-muted)]">
              <span className="w-3 h-0.5 bg-slate-500 border border-dashed" />
              Ideal Guideline
            </span>
            <span className="flex items-center gap-1.5 text-amber-500 font-bold">
              <span className="w-3 h-1 bg-amber-500 rounded" />
              Actual Remaining
            </span>
          </div>
        </div>

        {/* Custom SVG Graphic */}
        <div className="w-full h-64 bg-[var(--tf-sidebar)] rounded-lg p-4 border border-[var(--tf-border)] relative flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="40" x2="500" y2="40" stroke="currentColor" className="text-[var(--tf-border)]" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-[var(--tf-border)]" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" className="text-[var(--tf-border)]" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="160" x2="500" y2="160" stroke="currentColor" className="text-[var(--tf-border)]" strokeWidth="1" strokeDasharray="4 4" />

            {/* Ideal Guideline Line (Linear slope from top-left to bottom-right) */}
            <line x1="20" y1="20" x2="480" y2="180" stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" />

            {/* Actual Remaining Line (Smooth polyline) */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="20,20 60,35 110,40 160,75 210,90 260,110 310,130 360,145 410,165 480,175"
            />

            {/* Glowing dots */}
            <circle cx="20" cy="20" r="4" fill="#f59e0b" />
            <circle cx="160" cy="75" r="4" fill="#f59e0b" />
            <circle cx="310" cy="130" r="4" fill="#f59e0b" />
            <circle cx="480" cy="175" r="5" fill="#10b981" />
          </svg>
        </div>
      </div>
    </div>
  );
}
