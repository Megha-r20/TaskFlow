'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchPublicProject();
    }
  }, [token]);

  const fetchPublicProject = async () => {
    try {
      const res = await fetch(`/api/share/${token}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      } else {
        setError('This shared project link is invalid or has been revoked.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load shared project data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Decrypting secure guest portal link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-100 mb-1">Access Link Expired</h1>
        <p className="text-xs text-slate-400 max-w-sm">{error}</p>
      </div>
    );
  }

  const tasks = project?.tasks || [];
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Client Share Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: project.color || '#3b82f6' }}
              />
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-slate-400 max-w-xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Overall Completion</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div className="bg-emerald-400 h-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['TODO', 'IN_PROGRESS', 'DONE'].map((statusKey) => {
            const statusTasks = tasks.filter((t) => t.status === statusKey);
            const statusLabel =
              statusKey === 'TODO' ? '📋 To Do' : statusKey === 'IN_PROGRESS' ? '⚡ In Progress' : '✅ Completed';

            return (
              <div key={statusKey} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200">{statusLabel}</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {statusTasks.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-600 italic">No tasks</div>
                  ) : (
                    statusTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-slate-100">{t.title}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              t.priority === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-400'
                                : t.priority === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t.priority}
                          </span>
                          {t.assignee && (
                            <div className="flex items-center gap-1">
                              <img
                                src={t.assignee.avatarUrl}
                                alt={t.assignee.name}
                                className="w-4 h-4 rounded-full border border-slate-700"
                              />
                              <span>{t.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
