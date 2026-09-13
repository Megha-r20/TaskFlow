'use client';

import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart }) {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="group p-3.5 bg-[#111622] hover:bg-[#151c2c] border border-slate-800/90 rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-slate-700 space-y-2.5"
    >
      {/* Top Header: Task Key & Priority Pill */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
          {task.project?.key}-{task.id.slice(0, 4)}
        </span>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityStyle(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition line-clamp-2">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((tl) => (
            <span
              key={tl.label?.id || tl.labelId}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${tl.label?.color || '#3b82f6'}20`,
                color: tl.label?.color || '#3b82f6',
              }}
            >
              {tl.label?.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Comments, Assignee */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-medium ${
                isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {task._count?.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>

        {task.assignee ? (
          <img
            src={task.assignee.avatarUrl}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
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
