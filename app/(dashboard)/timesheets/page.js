'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  DollarSign,
  Plus,
  Calendar,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function TimesheetsPage() {
  const { user } = useWorkspace();
  const [timeEntries, setTimeEntries] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [taskTitle, setTaskTitle] = useState('');
  const [projectName, setProjectName] = useState('Frontend Platform');
  const [hourlyRate, setHourlyRate] = useState(75);

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  // Timer tick
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const fetchTimeEntries = async () => {
    try {
      const res = await fetch('/api/time-entries');
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(data.timeEntries || []);
      }
    } catch (err) {
      console.error('Fetch time entries error:', err);
    }
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSaveTimerEntry = async () => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const newEntry = {
      id: `te-${Date.now()}`,
      taskTitle: taskTitle || 'Active Deep Work Session',
      projectName,
      user: user?.name || 'You',
      avatarUrl: user?.avatarUrl,
      durationMinutes: minutes,
      hourlyRate: Number(hourlyRate),
      billable: true,
      date: new Date().toLocaleDateString(),
    };

    setTimeEntries((prev) => [newEntry, ...prev]);
    setIsRunning(false);
    setSeconds(0);
    setTaskTitle('');
  };

  const formatTimerTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalMinutesAll = timeEntries.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalCostAll = timeEntries.reduce(
    (acc, curr) => acc + (curr.durationMinutes / 60) * curr.hourlyRate,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Active Live Timer Card */}
      <div className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-500 uppercase">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Live Workspace Task Timer</span>
          </div>
          <span className="text-xl font-mono font-bold text-[var(--tf-text-main)]">
            {formatTimerTime(seconds)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="What task are you working on?"
            className="px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTimer}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs transition cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
            </button>
            {seconds > 0 && (
              <button
                onClick={handleSaveTimerEntry}
                className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Log Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] uppercase">Total Hours Tracked</span>
          <p className="text-2xl font-bold text-[var(--tf-text-main)]">
            {(totalMinutesAll / 60).toFixed(1)} hrs
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] uppercase">Estimated Billable Value</span>
          <p className="text-2xl font-bold text-emerald-500">${totalCostAll.toFixed(2)}</p>
        </div>

        <div className="p-4 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-1 shadow-xs">
          <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] uppercase">Logged Sessions</span>
          <p className="text-2xl font-bold text-[var(--tf-text-main)]">{timeEntries.length}</p>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 shadow-xs overflow-x-auto">
        <h3 className="text-sm font-bold text-[var(--tf-text-main)]">Logged Time Entries</h3>
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--tf-sidebar)] text-[var(--tf-text-subtle)] font-mono uppercase text-[10px] border-b border-[var(--tf-border)]">
            <tr>
              <th className="p-3">Task</th>
              <th className="p-3">Project</th>
              <th className="p-3">Member</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Rate ($/hr)</th>
              <th className="p-3">Total Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tf-border)] text-[var(--tf-text-main)]">
            {timeEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-[var(--tf-hover)] transition">
                <td className="p-3 font-semibold">{entry.taskTitle}</td>
                <td className="p-3 font-mono text-[var(--tf-text-muted)]">{entry.projectName}</td>
                <td className="p-3">{entry.user}</td>
                <td className="p-3 font-mono font-bold text-amber-500">{entry.durationMinutes} mins</td>
                <td className="p-3 font-mono">${entry.hourlyRate}/hr</td>
                <td className="p-3 font-mono font-bold text-emerald-500">
                  ${((entry.durationMinutes / 60) * entry.hourlyRate).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
