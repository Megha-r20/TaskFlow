'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, CheckSquare, Users, X, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [], members: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || !activeWorkspace) {
      setResults({ projects: [], tasks: [], members: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&workspaceId=${activeWorkspace.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeWorkspace?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#202020] border border-[#333] rounded-lg shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar - Notion style */}
        <div className="p-3.5 border-b border-[#333] bg-[#222] flex items-center gap-3">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, or members..."
            className="w-full bg-transparent text-xs text-[#e3e3e3] placeholder-stone-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-[#2e2e2e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-6 text-center text-xs font-mono text-stone-400">Searching...</div>
          )}

          {!loading && !query.trim() && (
            <div className="py-6 text-center text-xs text-stone-500 font-mono">
              Type anything to search across {activeWorkspace?.name}
            </div>
          )}

          {!loading &&
            query.trim() &&
            results.projects.length === 0 &&
            results.tasks.length === 0 &&
            results.members.length === 0 && (
              <div className="py-6 text-center text-xs text-stone-500 font-mono">
                No matching results found for "{query}"
              </div>
            )}

          {/* Projects section */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-stone-400" />
                <span>Projects ({results.projects.length})</span>
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      router.push(`/projects/${proj.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[#191919] hover:bg-[#282828] border border-[#333] text-left transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: proj.color || '#3b82f6' }}
                      />
                      <div>
                        <span className="text-xs font-medium text-[#e3e3e3]">{proj.name}</span>
                        <span className="text-[10px] text-stone-500 ml-2 font-mono">{proj.key}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks section */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-stone-400" />
                <span>Tasks ({results.tasks.length})</span>
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      router.push(`/projects/${task.projectId}?task=${task.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-[#191919] hover:bg-[#282828] border border-[#333] text-left transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#252525] text-stone-400 border border-[#333]">
                          {task.project?.key}-{task.id.slice(0, 4)}
                        </span>
                        <span className="text-xs font-medium text-[#e3e3e3]">{task.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 mt-1 block">
                        Project: {task.project?.name} • Status: {task.status}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Members section */}
          {results.members.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span>Team Members ({results.members.length})</span>
              </div>
              <div className="space-y-1">
                {results.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded bg-[#191919] border border-[#333]"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-6 h-6 rounded-full object-cover border border-[#444]"
                      />
                      <div>
                        <span className="text-xs font-medium text-[#e3e3e3]">{member.name}</span>
                        <span className="text-[10px] font-mono text-stone-500 ml-2">{member.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#252525] text-stone-400 border border-[#333]">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
