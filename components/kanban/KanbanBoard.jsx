'use client';

import { useState } from 'react';
import { Plus, Circle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'TODO', title: 'Todo', color: 'text-slate-400', badgeBg: 'bg-slate-500/10', border: 'border-slate-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'text-blue-400', badgeBg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'REVIEW', title: 'In Review', color: 'text-amber-400', badgeBg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'DONE', title: 'Done', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

export default function KanbanBoard({ tasks = [], onTaskMove, onTaskClick, onQuickAdd }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTaskId) return;

    onTaskMove(draggedTaskId, colId);
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pb-8">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl bg-[#0b0f17]/90 border transition-all duration-200 ${
              dragOverColumn === col.id
                ? 'border-indigo-500/60 bg-indigo-950/20 shadow-xl ring-2 ring-indigo-500/30'
                : 'border-white/5 shadow-md'
            }`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0e1422]/60 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${col.badgeBg} ${col.color} border border-current`} />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">{col.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-[10px] font-mono font-bold text-slate-400 border border-white/5">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(col.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List Container */}
            <div className="flex-1 p-3.5 space-y-3 min-h-[420px]">
              {colTasks.length === 0 ? (
                <div className="h-36 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-xs text-slate-600 space-y-1">
                  <span>No tasks in {col.title}</span>
                  <span className="text-[10px] text-slate-700">Drag or create a task</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
