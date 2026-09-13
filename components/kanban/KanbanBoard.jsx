'use client';

import { useState } from 'react';
import { Plus, Circle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'TODO', title: 'Todo', color: 'text-slate-400', badgeBg: 'bg-slate-500/10' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'text-blue-400', badgeBg: 'bg-blue-500/10' },
  { id: 'REVIEW', title: 'In Review', color: 'text-amber-400', badgeBg: 'bg-amber-500/10' },
  { id: 'DONE', title: 'Done', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10' },
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-xl bg-[#0d121d] border transition-all ${
              dragOverColumn === col.id
                ? 'border-indigo-500/60 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                : 'border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.badgeBg} ${col.color} border border-current`} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(col.id)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task List */}
            <div className="flex-1 p-3 space-y-3 min-h-[400px]">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-xs text-slate-600">
                  Drop tasks here
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
