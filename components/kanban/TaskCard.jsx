'use client';

import { Calendar, MessageSquare } from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart }) {
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return { badgeClass: 'notion-tag-red', label: 'Urgent' };
      case 'HIGH':
        return { badgeClass: 'notion-tag-orange', label: 'High' };
      case 'MEDIUM':
        return { badgeClass: 'notion-tag-blue', label: 'Medium' };
      case 'LOW':
      default:
        return { badgeClass: 'notion-tag-gray', label: 'Low' };
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
      className="group p-3 rounded-md bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#444] cursor-grab active:cursor-grabbing space-y-2.5 transition relative overflow-hidden"
    >
      {/* Top project color indicator line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: task.project?.color || '#3b82f6' }}
      />

      {/* Header: Project Key & Priority Badge */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#1c1c1c] text-stone-400 border border-stone-800">
          {task.project?.key}-{task.id.slice(0, 4)}
        </span>
        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-medium ${prio.badgeClass}`}>
          {prio.label}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-[#e3e3e3] group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Labels - Notion Style Tags */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((tl) => (
            <span
              key={tl.label?.id || tl.labelId}
              className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border"
              style={{
                backgroundColor: `${tl.label?.color || '#3b82f6'}20`,
                color: tl.label?.color || '#93c5fd',
                borderColor: `${tl.label?.color || '#3b82f6'}40`,
              }}
            >
              {tl.label?.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Due Date, Comments, Assignee */}
      <div className="pt-2 border-t border-[#333] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded ${
                isOverdue
                  ? 'notion-tag-red font-semibold'
                  : 'text-stone-400 bg-[#1c1c1c]'
              }`}
            >
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {task._count?.comments > 0 && (
            <div className="flex items-center gap-1 text-stone-400 font-mono text-[10px]">
              <MessageSquare className="w-3 h-3 text-stone-500" />
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>

        {task.assignee ? (
          <img
            src={task.assignee.avatarUrl}
            alt={task.assignee.name}
            title={`Assigned to ${task.assignee.name}`}
            className="w-5 h-5 rounded-full object-cover border border-[#444]"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-stone-700 flex items-center justify-center text-[9px] text-stone-500 font-mono">
            ?
          </div>
        )}
      </div>
    </div>
  );
}
