'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GanttChart({ tasks = [], onTaskClick, onUpdateDueDate }) {
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState('days'); // 'days' | 'weeks'

  // Generate 14-day timeline columns starting from currentStartDate
  const daysCount = zoomLevel === 'days' ? 14 : 28;
  const dateHeaders = [];
  const baseDate = new Date(currentStartDate);
  baseDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    dateHeaders.push(d);
  }

  const handlePrev = () => {
    const prev = new Date(currentStartDate);
    prev.setDate(prev.getDate() - (zoomLevel === 'days' ? 7 : 14));
    setCurrentStartDate(prev);
  };

  const handleNext = () => {
    const next = new Date(currentStartDate);
    next.setDate(next.getDate() + (zoomLevel === 'days' ? 7 : 14));
    setCurrentStartDate(next);
  };

  const handleToday = () => {
    setCurrentStartDate(new Date());
  };

  // Helper to calculate column offset and span for a task
  const getTaskBarPosition = (task) => {
    const taskStart = new Date(task.createdAt || Date.now());
    taskStart.setHours(0, 0, 0, 0);

    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(taskStart.getTime() + 86400000 * 3);
    taskEnd.setHours(23, 59, 59, 999);

    const timelineStart = dateHeaders[0].getTime();
    const timelineEnd = dateHeaders[dateHeaders.length - 1].getTime() + 86400000;
    const totalDuration = timelineEnd - timelineStart;

    if (taskEnd.getTime() < timelineStart || taskStart.getTime() > timelineEnd) {
      return null; // Task is outside visible date window
    }

    const startOffsetMs = Math.max(0, taskStart.getTime() - timelineStart);
    const endOffsetMs = Math.min(totalDuration, taskEnd.getTime() - timelineStart);

    const leftPercent = (startOffsetMs / totalDuration) * 100;
    const widthPercent = Math.max(3, ((endOffsetMs - startOffsetMs) / totalDuration) * 100);

    return { leftPercent, widthPercent };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'IN_PROGRESS':
        return 'bg-blue-500 text-white border-blue-600';
      case 'REVIEW':
        return 'bg-amber-500 text-black border-amber-600';
      default:
        return 'bg-slate-600 text-white border-slate-700';
    }
  };

  return (
    <div className="bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Timeline Controls */}
      <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-[var(--tf-text-main)]">Project Schedule Timeline</span>
          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)] px-2 py-0.5 rounded bg-[var(--tf-bg)] border border-[var(--tf-border)]">
            {dateHeaders[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} –{' '}
            {dateHeaders[dateHeaders.length - 1].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold font-mono bg-[var(--tf-bg)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-[var(--tf-text-main)] rounded-lg transition cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center rounded-lg border border-[var(--tf-border)] bg-[var(--tf-bg)] overflow-hidden">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-[var(--tf-hover)] text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-[var(--tf-hover)] text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex p-0.5 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[11px] font-mono">
            <button
              onClick={() => setZoomLevel('days')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                zoomLevel === 'days' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--tf-text-subtle)]'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setZoomLevel('weeks')}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                zoomLevel === 'weeks' ? 'bg-amber-500 text-black font-bold' : 'text-[var(--tf-text-subtle)]'
              }`}
            >
              28 Days
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Grid Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Header Row */}
          <div className="flex border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] text-[10px] font-mono text-[var(--tf-text-subtle)] font-semibold">
            {/* Task Info Column */}
            <div className="w-64 p-3 border-r border-[var(--tf-border)] shrink-0">TASK NAME & ASSIGNEE</div>
            {/* Timeline Days Header */}
            <div className="flex-1 flex">
              {dateHeaders.map((d, idx) => {
                const isToday = new Date().toDateString() === d.toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={idx}
                    className={`flex-1 py-2 px-1 text-center border-r border-[var(--tf-border)] shrink-0 ${
                      isToday ? 'bg-amber-500/10 text-amber-500 font-bold' : isWeekend ? 'bg-[var(--tf-hover)]/40' : ''
                    }`}
                  >
                    <div>{d.toLocaleDateString([], { weekday: 'narrow' })}</div>
                    <div className="text-xs font-bold text-[var(--tf-text-main)]">{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Rows */}
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[var(--tf-text-subtle)]">
              No tasks available for Gantt Timeline view
            </div>
          ) : (
            <div className="divide-y divide-[var(--tf-border)]">
              {tasks.map((task) => {
                const pos = getTaskBarPosition(task);
                return (
                  <div key={task.id} className="flex items-center hover:bg-[var(--tf-hover)]/30 transition group h-12">
                    {/* Left Column: Task Info */}
                    <div
                      onClick={() => onTaskClick?.(task)}
                      className="w-64 px-3 py-2 border-r border-[var(--tf-border)] shrink-0 flex items-center justify-between cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <span className="text-xs font-semibold text-[var(--tf-text-main)] group-hover:text-amber-500 transition block truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--tf-text-subtle)]">
                          {task.project?.key || 'TASK'} • {task.status}
                        </span>
                      </div>
                      {task.assignee && (
                        <img
                          src={task.assignee.avatarUrl}
                          alt={task.assignee.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-[var(--tf-border)]"
                          title={`Assigned to ${task.assignee.name}`}
                        />
                      )}
                    </div>

                    {/* Right Timeline Bar Column */}
                    <div className="flex-1 relative h-full flex items-center px-1">
                      {/* Grid background vertical lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {dateHeaders.map((d, idx) => (
                          <div key={idx} className="flex-1 border-r border-[var(--tf-border)]/40 h-full" />
                        ))}
                      </div>

                      {/* Interactive Task Bar */}
                      {pos && (
                        <div
                          onClick={() => onTaskClick?.(task)}
                          style={{
                            left: `${pos.leftPercent}%`,
                            width: `${pos.widthPercent}%`,
                          }}
                          className={`absolute h-7 rounded-lg shadow-sm border text-[10px] font-mono font-bold px-2 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${getStatusColor(
                            task.status
                          )}`}
                          title={`Click to view: ${task.title} (Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'})`}
                        >
                          <span className="truncate">{task.title}</span>
                          {task.dueDate && (
                            <span className="text-[9px] opacity-90 shrink-0 ml-1">
                              {new Date(task.dueDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
