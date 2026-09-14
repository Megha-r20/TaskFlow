'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Radio, CheckCircle2, AlertCircle, X, Bell } from 'lucide-react';
import { useRealtime } from '../layout/AppShell';

export default function ToastContainer() {
  const { registerRealtimeHandler } = useRealtime() || {};
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, title, message, type };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 5s
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Subscribe to real-time events
  useEffect(() => {
    if (!registerRealtimeHandler) return;

    const u1 = registerRealtimeHandler('TASK_CREATED', () => {
      addToast('Task Created', 'A new task was added to your workspace', 'success');
    });

    const u2 = registerRealtimeHandler('TASK_UPDATED', () => {
      addToast('Task Updated', 'A workspace task status or assignee was updated', 'info');
    });

    const u3 = registerRealtimeHandler('NOTIFICATION', () => {
      addToast('Live Activity Alert', 'You received a new workspace notification', 'huddle');
    });

    return () => {
      u1?.();
      u2?.();
      u3?.();
    };
  }, [registerRealtimeHandler]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 rounded-xl bg-slate-900/95 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-slide-up"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
              {toast.type === 'huddle' ? (
                <Radio className="w-4 h-4 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{toast.message}</p>
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
