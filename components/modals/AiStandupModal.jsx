'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, RefreshCw, Bot, FileText, Send } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function AiStandupModal({ isOpen, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [standupText, setStandupText] = useState('');
  const [copied, setCopied] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [customSubtasks, setCustomSubtasks] = useState([]);
  const [activeTab, setActiveTab] = useState('standup'); // 'standup' | 'breakdown'

  const generateStandup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STANDUP',
          workspaceId: activeWorkspace?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStandupText(data.standup || '');
      }
    } catch (err) {
      console.error('Standup generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomBreakdown = async (e) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BREAKDOWN',
          title: customGoal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomSubtasks(data.subtasks || []);
      }
    } catch (err) {
      console.error('Custom breakdown failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'standup' && !standupText) {
      generateStandup();
    }
  }, [isOpen, activeTab]);

  const copyToClipboard = () => {
    const textToCopy =
      activeTab === 'standup'
        ? standupText
        : customSubtasks.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden z-10 transition-colors duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--tf-text-main)] flex items-center gap-2">
                TaskFlow AI Assistant
                <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Beta
                </span>
              </h3>
              <p className="text-[11px] text-[var(--tf-text-muted)]">
                Auto-generate standups and smart subtask breakdowns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] px-4">
          <button
            onClick={() => setActiveTab('standup')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'standup'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Standup Report</span>
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'breakdown'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Task Breakdown Generator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'standup' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--tf-text-subtle)]">
                  Generated from workspace activity
                </span>
                <button
                  onClick={generateStandup}
                  disabled={loading}
                  className="text-xs text-amber-500 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-[var(--tf-sidebar)] rounded-xl border border-[var(--tf-border)]">
                  <Sparkles className="w-7 h-7 text-amber-500 animate-spin" />
                  <span className="text-xs font-mono text-[var(--tf-text-muted)]">
                    Analyzing workspace task history...
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs text-[var(--tf-text-main)] leading-relaxed whitespace-pre-wrap font-mono">
                  {standupText}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCustomBreakdown} className="flex gap-2">
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Enter a task or feature title (e.g. Implement OAuth Login)..."
                  className="flex-1 px-3 py-2 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading || !customGoal.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Generate</span>
                </button>
              </form>

              {customSubtasks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] block">
                    Suggested Subtasks ({customSubtasks.length}):
                  </span>
                  <div className="space-y-2">
                    {customSubtasks.map((sub, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs text-[var(--tf-text-main)] flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span>{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[var(--tf-sidebar)] border-t border-[var(--tf-border)] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--tf-text-subtle)]">
            Powered by TaskFlow AI Engine
          </span>
          <button
            onClick={copyToClipboard}
            disabled={loading || (activeTab === 'standup' ? !standupText : customSubtasks.length === 0)}
            className="px-3 py-1.5 text-xs font-semibold bg-[var(--tf-card)] border border-[var(--tf-border)] hover:border-amber-500/40 text-[var(--tf-text-main)] rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
