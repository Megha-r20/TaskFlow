'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Calendar,
  User,
  Clock,
  MessageSquare,
  History,
  Trash2,
  Send,
  AlertTriangle,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';
import { useRealtime } from '../layout/AppShell';

export default function TaskDetailModal({ taskId, isOpen, onClose, onUpdate, onDelete }) {
  const { user, activeWorkspace } = useWorkspace();
  const { registerRealtimeHandler } = useRealtime() || {};
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails();
      fetchWorkspaceMembers();
    }
  }, [taskId, isOpen]);

  // Subscribe to realtime comment and task-update events
  useEffect(() => {
    if (!registerRealtimeHandler || !taskId || !isOpen) return;

    const handleCommentAdded = (data) => {
      if (data.taskId !== taskId) return;
      setTask((prev) => {
        if (!prev) return prev;
        const exists = prev.comments?.find((c) => c.id === data.comment.id);
        if (exists) return prev;
        return { ...prev, comments: [...(prev.comments || []), data.comment] };
      });
      // Auto-scroll to new comment
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleTaskUpdated = (data) => {
      if (data.task?.id !== taskId) return;
      setTask((prev) => prev ? { ...prev, ...data.task } : prev);
    };

    const u1 = registerRealtimeHandler('COMMENT_ADDED', handleCommentAdded);
    const u2 = registerRealtimeHandler('TASK_UPDATED', handleTaskUpdated);
    return () => { u1?.(); u2?.(); };
  }, [registerRealtimeHandler, taskId, isOpen]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (err) {
      console.error('Fetch task details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceMembers = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  };

  const updateTaskField = async (fields) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev) => ({ ...prev, ...data.task }));
        onUpdate?.(data.task);
      }
    } catch (err) {
      console.error('Update task error:', err);
    }
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentInput(val);

    const lastWord = val.split(/\s+/).pop();
    if (lastWord.startsWith('@')) {
      setShowMentionMenu(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (memberName) => {
    const words = commentInput.split(/\s+/);
    words.pop();
    words.push(`@${memberName}`);
    setCommentInput(words.join(' ') + ' ');
    setShowMentionMenu(false);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput }),
      });
      if (res.ok) {
        // Optimistic update already handled by SSE; just clear the input
        setCommentInput('');
      }
    } catch (err) {
      console.error('Post comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(taskId);
        onClose();
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--notion-modal-bg)] border-l border-[var(--notion-border)] h-full shadow-2xl overflow-y-auto flex flex-col z-10 transition-colors duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--notion-border)] flex items-center justify-between sticky top-0 bg-[var(--notion-modal-bg)] z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--notion-sidebar)] text-amber-500 border border-[var(--notion-border)]">
              {task?.project?.key}-{task?.id.slice(0, 4)}
            </span>
            <span className="text-xs text-[var(--notion-text-muted)] font-medium">in {task?.project?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-2 rounded-lg text-[var(--notion-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)] hover:bg-[var(--notion-hover)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <input
                type="text"
                value={task?.title || ''}
                onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
                onBlur={(e) => updateTaskField({ title: e.target.value })}
                className="w-full text-xl sm:text-2xl font-bold text-[var(--notion-text-main)] bg-transparent border-b border-transparent hover:border-[var(--notion-border)] focus:border-amber-500 focus:outline-none py-1 transition tracking-tight"
              />

              <textarea
                rows={4}
                value={task?.description || ''}
                onChange={(e) => setTask((prev) => ({ ...prev, description: e.target.value }))}
                onBlur={(e) => updateTaskField({ description: e.target.value })}
                placeholder="Add a detailed technical specification or task description..."
                className="w-full bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg p-3 text-xs text-[var(--notion-text-main)] placeholder-[var(--notion-text-subtle)] focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--notion-sidebar)] border border-[var(--notion-border)]">
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--notion-text-subtle)] mb-1">
                  Status
                </label>
                <select
                  value={task?.status || 'TODO'}
                  onChange={(e) => updateTaskField({ status: e.target.value })}
                  className="w-full bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--notion-text-main)] font-semibold focus:outline-none"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--notion-text-subtle)] mb-1">
                  Priority
                </label>
                <select
                  value={task?.priority || 'MEDIUM'}
                  onChange={(e) => updateTaskField({ priority: e.target.value })}
                  className="w-full bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--notion-text-main)] font-semibold focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--notion-text-subtle)] mb-1">
                  Assignee
                </label>
                <select
                  value={task?.assigneeId || ''}
                  onChange={(e) => updateTaskField({ assigneeId: e.target.value || null })}
                  className="w-full bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--notion-text-main)] font-semibold focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--notion-text-subtle)] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateTaskField({ dueDate: e.target.value || null })}
                  className="w-full bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg px-2 py-1.5 text-xs text-[var(--notion-text-main)] focus:outline-none"
                />
              </div>
            </div>

            {/* Tabs for Discussion & Activity */}
            <div className="border-t border-[var(--notion-border)] pt-4">
              <div className="flex items-center gap-6 border-b border-[var(--notion-border)] pb-2 mb-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-xs font-bold pb-1.5 transition ${
                    activeTab === 'comments'
                      ? 'text-amber-500 border-b-2 border-amber-500'
                      : 'text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({task?.comments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 text-xs font-bold pb-1.5 transition ${
                    activeTab === 'activity'
                      ? 'text-amber-500 border-b-2 border-amber-500'
                      : 'text-[var(--notion-text-muted)] hover:text-[var(--notion-text-main)]'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Activity History</span>
                </button>
              </div>

              {/* Tab: Comments */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {task?.comments?.length === 0 ? (
                      <p className="text-xs text-[var(--notion-text-subtle)] italic py-3">No comments yet. Start the conversation!</p>
                    ) : (
                      task?.comments?.map((c) => (
                        <div key={c.id} className="p-3 rounded-lg bg-[var(--notion-sidebar)] border border-[var(--notion-border)] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.name}`}
                                alt={c.user?.name}
                                className="w-5 h-5 rounded-full object-cover border border-[var(--notion-border)]"
                              />
                              <span className="text-xs font-semibold text-[var(--notion-text-main)]">{c.user?.name}</span>
                            </div>
                            <span className="text-[10px] text-[var(--notion-text-subtle)] font-mono">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--notion-text-muted)] whitespace-pre-wrap pl-7 leading-relaxed">{c.content}</p>
                        </div>
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handlePostComment} className="relative pt-2">
                    {showMentionMenu && (
                      <div className="absolute bottom-full mb-2 left-0 w-52 bg-[var(--notion-modal-bg)] border border-[var(--notion-border)] rounded-lg shadow-2xl z-30 max-h-40 overflow-y-auto">
                        <div className="p-2 text-[10px] font-mono font-semibold text-[var(--notion-text-subtle)] uppercase">Mention Team Member</div>
                        {members
                          .filter((m) => m.name.toLowerCase().includes(mentionFilter.toLowerCase()))
                          .map((m) => (
                            <button
                              key={m.userId}
                              type="button"
                              onClick={() => insertMention(m.name)}
                              className="w-full text-left px-3 py-1.5 text-xs text-[var(--notion-text-main)] hover:bg-[var(--notion-hover)] transition"
                            >
                              @{m.name}
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={handleCommentChange}
                        placeholder="Add a comment... (Type @ to mention team members)"
                        className="flex-1 px-3 py-2 bg-[var(--notion-input-bg)] border border-[var(--notion-border)] rounded-lg text-xs text-[var(--notion-text-main)] placeholder-[var(--notion-text-subtle)] focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !commentInput.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab: Activity History */}
              {activeTab === 'activity' && (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {task?.activityLogs?.length === 0 ? (
                    <p className="text-xs text-[var(--notion-text-subtle)] italic py-3">No activity logged yet.</p>
                  ) : (
                    task?.activityLogs?.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-[var(--notion-sidebar)] border border-[var(--notion-border)]">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-[var(--notion-text-main)]">{log.user?.name}</span>{' '}
                          <span className="text-[var(--notion-text-muted)]">{log.details}</span>
                          <span className="block text-[9px] text-[var(--notion-text-subtle)] font-mono mt-0.5">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
