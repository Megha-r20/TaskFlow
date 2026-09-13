'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckSquare, Calendar, FolderKanban, Clock, ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';
import TaskDetailModal from '@/components/modals/TaskDetailModal';

export default function MyTasksPage() {
  const { user, activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    if (user && activeWorkspace) {
      fetchMyTasks();
    }
  }, [user?.id, activeWorkspace?.id]);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tasks?workspaceId=${activeWorkspace.id}&assigneeId=${user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Fetch my tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-800/40 rounded-xl" />
        <div className="h-64 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">My Assigned Tasks</h2>
          <p className="text-xs text-slate-400 mt-1">
            All tasks currently assigned to <strong className="text-white">{user?.name}</strong> in {activeWorkspace?.name}.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
          {tasks.length} Assigned
        </span>
      </div>

      <div className="bg-[#111622] border border-slate-800 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        <div className="p-3 bg-[#0d121d] grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="col-span-6 sm:col-span-7">Task Title</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-3 sm:col-span-2 text-right">Status</div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 italic">
            You currently have zero assigned pending tasks. You're all caught up! 🎉
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3.5 grid grid-cols-12 items-center text-xs hover:bg-slate-800/50 cursor-pointer transition group"
            >
              <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                <span className="font-mono text-[10px] text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {task.project?.key}-{task.id.slice(0, 4)}
                </span>
                <span className="font-semibold text-white group-hover:text-indigo-300 transition truncate">
                  {task.title}
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: task.project?.color || '#6366f1' }}
                />
                <span className="text-slate-300 font-medium truncate">{task.project?.name}</span>
              </div>
              <div className="col-span-3 sm:col-span-2 flex justify-end">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {task.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchMyTasks}
          onDelete={fetchMyTasks}
        />
      )}
    </div>
  );
}
