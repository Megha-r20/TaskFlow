'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'TODO', title: 'Todo', badgeClass: 'notion-tag-gray' },
  { id: 'IN_PROGRESS', title: 'In Progress', badgeClass: 'notion-tag-blue' },
  { id: 'REVIEW', title: 'In Review', badgeClass: 'notion-tag-yellow' },
  { id: 'DONE', title: 'Done', badgeClass: 'notion-tag-green' },
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
            className={`flex flex-col rounded-lg bg-[var(--notion-sidebar)] border transition-all duration-150 ${
              dragOverColumn === col.id
                ? 'border-amber-500/50 bg-[var(--notion-hover)] ring-1 ring-amber-500/20'
                : 'border-[var(--notion-border)]'
            }`}
          >
            {/* Column Header - Notion Style */}
            <div className="p-3 border-b border-[var(--notion-border)] flex items-center justify-between bg-[var(--notion-card)] rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${col.badgeClass}`}>
                  {col.title}
                </span>
                <span className="text-[11px] font-mono text-[var(--notion-text-subtle)] font-medium">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onQuickAdd(col.id)}
                className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)] hover:bg-[var(--notion-hover)] transition"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task List Container */}
            <div className="flex-1 p-2.5 space-y-2.5 min-h-[420px]">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-[var(--notion-border)] rounded-md flex flex-col items-center justify-center text-xs text-[var(--notion-text-subtle)] space-y-1">
                  <span>No tasks</span>
                  <span className="text-[10px] opacity-75">Drag or create a task</span>
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
