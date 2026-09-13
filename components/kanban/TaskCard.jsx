'use client';

import { Calendar, MessageSquare, AlertCircle, Clock } from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart }) {
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return {
          dot: 'bg-red-500',
          text: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/20',
          label: 'Urgent',
        };
      case 'HIGH':
        return {
          dot: 'bg-orange-500',
          text: 'text-orange-400',
          bg: 'bg-orange-500/10 border-orange-500/20',
          label: 'High',
        };
      case 'MEDIUM':
        return {
          dot: 'bg-blue-500',
          text: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          label: 'Medium',
        };
      case 'LOW':
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-400',
          bg: 'bg-slate-500/10 border-slate-500/20',
          label: 'Low',
        };
    }
  };

  const prio = getPriorityBadge(task.priority);

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="group p-4 rounded-xl saas-card saas-card-hover cursor-grab active:cursor-grabbing space-y-3 relative overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
        style={{ backgroundColor: task.project?.color || '#6366f1' }}
      />

      {/* Header: Project Key & Priority Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-indigo-400 border border-indigo-500/20 shadow-inner">
          {task.project?.key}-{task.id.slice(0, 4)}
        </span>
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${prio.bg} ${prio.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
          <span>{prio.label}</span>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {task.labels.map((tl) => (
            <span
              key={tl.label?.id || tl.labelId}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${tl.label?.color || '#3b82f6'}15`,
                color: tl.label?.color || '#3b82f6',
                borderColor: `${tl.label?.color || '#3b82f6'}30`,
              }}
            >
              {tl.label?.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Comments, Assignee */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded ${
                isOverdue
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-bold'
                  : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {task._count?.comments > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <MessageSquare className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-[10px]">{task._count.comments}</span>
            </div>
          )}
        </div>

        {task.assignee ? (
          <img
            src={task.assignee.avatarUrl}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="w-5 h-5 rounded-full object-cover ring-2 ring-indigo-500/20 shadow"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[9px] text-slate-500">
            ?
          </div>
        )}
      </div>
    </div>
  );
}
