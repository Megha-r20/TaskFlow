'use client';

import { useState, useEffect } from 'react';
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

export default function TaskDetailModal({ taskId, isOpen, onClose, onUpdate, onDelete }) {
  const { user, activeWorkspace } = useWorkspace();
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTaskDetails();
      fetchWorkspaceMembers();
    }
  }, [taskId, isOpen]);

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
        const data = await res.json();
        setTask((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#121826] border-l border-slate-800 h-full shadow-2xl overflow-y-auto flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#121826] z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">
              {task?.project?.key}-{task?.id.slice(0, 4)}
            </span>
            <span className="text-xs text-slate-400">in {task?.project?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            {/* Title & Description */}
            <div className="space-y-3">
              <input
                type="text"
                value={task?.title || ''}
                onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
                onBlur={(e) => updateTaskField({ title: e.target.value })}
                className="w-full text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none py-1 transition"
              />

              <textarea
                rows={4}
                value={task?.description || ''}
                onChange={(e) => setTask((prev) => ({ ...prev, description: e.target.value }))}
                onBlur={(e) => updateTaskField({ description: e.target.value })}
                placeholder="Add a detailed task description..."
                className="w-full bg-[#0b0f17] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0b0f17] border border-slate-800/80">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={task?.status || 'TODO'}
                  onChange={(e) => updateTaskField({ status: e.target.value })}
                  className="w-full bg-[#121826] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  value={task?.priority || 'MEDIUM'}
                  onChange={(e) => updateTaskField({ priority: e.target.value })}
                  className="w-full bg-[#121826] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assignee
                </label>
                <select
                  value={task?.assigneeId || ''}
                  onChange={(e) => updateTaskField({ assigneeId: e.target.value || null })}
                  className="w-full bg-[#121826] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateTaskField({ dueDate: e.target.value || null })}
                  className="w-full bg-[#121826] border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Tabs for Discussion & Activity */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-2 mb-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-xs font-bold pb-1 transition ${
                    activeTab === 'comments'
                      ? 'text-indigo-400 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({task?.comments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 text-xs font-bold pb-1 transition ${
                    activeTab === 'activity'
                      ? 'text-indigo-400 border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-white'
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
                      <p className="text-xs text-slate-500 italic py-2">No comments yet. Start the conversation!</p>
                    ) : (
                      task?.comments?.map((c) => (
                        <div key={c.id} className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.user?.avatarUrl}
                                alt={c.user?.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-xs font-bold text-white">{c.user?.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap pl-7">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handlePostComment} className="relative pt-2">
                    {showMentionMenu && (
                      <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#121826] border border-slate-800 rounded-lg shadow-xl z-30 max-h-36 overflow-y-auto">
                        <div className="p-1 text-[10px] font-bold text-slate-500 uppercase px-2">Mention Member</div>
                        {members
                          .filter((m) => m.name.toLowerCase().includes(mentionFilter.toLowerCase()))
                          .map((m) => (
                            <button
                              key={m.userId}
                              type="button"
                              onClick={() => insertMention(m.name)}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition"
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
                        className="flex-1 px-3 py-2 bg-[#0b0f17] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !commentInput.trim()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
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
                    <p className="text-xs text-slate-500 italic py-2">No activity logged yet.</p>
                  ) : (
                    task?.activityLogs?.map((log) => (
                      <div key={log.id} className="flex items-start gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-bold text-white">{log.user?.name}</span>{' '}
                          <span className="text-slate-400">{log.details}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
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
