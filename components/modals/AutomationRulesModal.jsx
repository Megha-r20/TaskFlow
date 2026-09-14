'use client';

import { useState, useEffect } from 'react';
import { Zap, X, Plus, Trash2, CheckCircle, ArrowRight, UserCheck, Play, Power, ShieldAlert, Edit2, Save } from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function AutomationRulesModal({ isOpen, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [rules, setRules] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [userRole, setUserRole] = useState('MEMBER');

  // New rule form state
  const [ruleName, setRuleName] = useState('');
  const [triggerValue, setTriggerValue] = useState('REVIEW');
  const [actionValue, setActionValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit rule state
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTriggerValue, setEditTriggerValue] = useState('REVIEW');
  const [editActionValue, setEditActionValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      fetchRulesAndMembers();
    }
  }, [isOpen, activeWorkspace?.id]);

  const fetchRulesAndMembers = async () => {
    setLoading(true);
    try {
      const [rulesRes, memRes] = await Promise.all([
        fetch(`/api/automations?workspaceId=${activeWorkspace.id}`),
        fetch(`/api/workspaces/${activeWorkspace.id}/members`),
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
        setCanManage(rulesData.canManage || false);
        setUserRole(rulesData.userRole || 'MEMBER');
      }

      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
        if (memData.members.length > 0 && !actionValue) {
          setActionValue(memData.members[0].userId);
        }
      }
    } catch (err) {
      console.error('Fetch automations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!actionValue || !canManage) return;

    setSubmitting(true);
    const targetMember = members.find((m) => m.userId === actionValue);
    const generatedName = ruleName.trim() || `Auto-assign to ${targetMember?.name || 'Member'} on ${triggerValue}`;

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          name: generatedName,
          triggerType: 'STATUS_CHANGE',
          triggerValue,
          actionType: 'AUTO_ASSIGN',
          actionValue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) => [data.rule, ...prev]);
        setRuleName('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Create rule error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditRule = (rule) => {
    setEditingRuleId(rule.id);
    setEditName(rule.name);
    setEditTriggerValue(rule.triggerValue);
    setEditActionValue(rule.actionValue);
  };

  const cancelEdit = () => {
    setEditingRuleId(null);
  };

  const handleSaveEdit = async (ruleId) => {
    if (!canManage) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          triggerValue: editTriggerValue,
          actionValue: editActionValue,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, ...data.rule } : r))
        );
        setEditingRuleId(null);
      }
    } catch (err) {
      console.error('Save edit rule error:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleRuleEnabled = async (ruleId, currentStatus) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentStatus } : r))
        );
      }
    } catch (err) {
      console.error('Toggle rule error:', err);
    }
  };

  const deleteRule = async (ruleId) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      }
    } catch (err) {
      console.error('Delete rule error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--tf-text-main)] flex items-center gap-2">
                Workspace Automation Rules
                <span className={`px-2 py-0.5 text-[9px] font-mono font-semibold uppercase rounded-full border ${
                  userRole === 'OWNER' || userRole === 'ADMIN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-stone-500/20 text-stone-400 border-stone-500/30'
                }`}>
                  {userRole === 'OWNER' ? '👑 Owner' : userRole === 'ADMIN' ? '🛡️ Admin' : '👤 Member (View Only)'}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--tf-text-muted)]">
                Event-driven workflow triggers and automatic member re-assignments
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Role access notice if member */}
          {!canManage && !loading && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Workspace members can view rules. Only Workspace Admins and Owners can create, edit, or modify automations.</span>
            </div>
          )}

          {/* Header Action / Add Rule Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-subtle)]">
              Active Rules ({rules.length})
            </span>
            {canManage && (
              <button
                onClick={() => setIsAdding((prev) => !prev)}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Rule</span>
              </button>
            )}
          </div>

          {/* Add Rule Drawer Form */}
          {isAdding && canManage && (
            <form onSubmit={handleCreateRule} className="p-4 rounded-xl bg-[var(--tf-sidebar)] border border-amber-500/30 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-2">
                <span className="text-xs font-bold text-[var(--tf-text-main)] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Create Trigger Rule
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-[11px] text-[var(--tf-text-subtle)] hover:text-[var(--tf-text-main)]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">Rule Name (Optional)</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Auto-assign Review tasks to Lead Dev"
                  className="w-full px-3 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">WHEN status changes to</label>
                  <select
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="REVIEW">Review / QA</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done / Completed</option>
                    <option value="TODO">Todo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">THEN automatically assign to</label>
                  <select
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                  >
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating Rule...' : 'Save Automation Rule'}
                </button>
              </div>
            </form>
          )}

          {/* Rules List */}
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--tf-text-muted)] animate-pulse">
              Loading workspace automation rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
              <Zap className="w-8 h-8 text-[var(--tf-text-subtle)] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[var(--tf-text-main)]">No automation rules configured</p>
              <p className="text-[11px] text-[var(--tf-text-muted)] mt-1">
                {canManage
                  ? 'Create your first rule above to automatically re-assign tasks when status changes.'
                  : 'No active automation rules have been created by workspace admins yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const assignedMember = members.find((m) => m.userId === rule.actionValue);
                const isEditingThis = editingRuleId === rule.id;

                if (isEditingThis) {
                  return (
                    <div key={rule.id} className="p-4 rounded-xl bg-[var(--tf-sidebar)] border border-amber-500/40 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-2">
                        <span className="text-xs font-bold text-[var(--tf-text-main)] flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                          Edit Automation Rule
                        </span>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-[11px] text-[var(--tf-text-subtle)] hover:text-[var(--tf-text-main)] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">Rule Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">WHEN status changes to</label>
                          <select
                            value={editTriggerValue}
                            onChange={(e) => setEditTriggerValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 font-mono"
                          >
                            <option value="REVIEW">Review / QA</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done / Completed</option>
                            <option value="TODO">Todo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[var(--tf-text-subtle)] mb-1">THEN automatically assign to</label>
                          <select
                            value={editActionValue}
                            onChange={(e) => setEditActionValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[var(--tf-input-bg)] border border-[var(--tf-border)] rounded-lg text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                          >
                            {members.map((m) => (
                              <option key={m.userId} value={m.userId}>
                                {m.name} ({m.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(rule.id)}
                          disabled={savingEdit}
                          className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      rule.enabled
                        ? 'bg-[var(--tf-sidebar)] border-[var(--tf-border)]'
                        : 'bg-[var(--tf-sidebar)]/50 border-[var(--tf-border)] opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {canManage ? (
                        <button
                          onClick={() => toggleRuleEnabled(rule.id, rule.enabled)}
                          className={`mt-0.5 p-1 rounded transition cursor-pointer ${
                            rule.enabled ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-[var(--tf-text-subtle)] hover:bg-[var(--tf-hover)]'
                          }`}
                          title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className={`mt-0.5 p-1 rounded ${rule.enabled ? 'text-emerald-500' : 'text-[var(--tf-text-subtle)]'}`}>
                          <Power className="w-4 h-4" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--tf-text-main)] truncate">{rule.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[var(--tf-text-muted)]">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                            WHEN status → {rule.triggerValue}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[var(--tf-text-subtle)] shrink-0" />
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                            THEN assign → {assignedMember?.name || 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startEditRule(rule)}
                          className="p-1.5 text-[var(--tf-text-muted)] hover:text-amber-500 hover:bg-amber-500/10 rounded transition cursor-pointer"
                          title="Edit rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1.5 text-[var(--tf-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[var(--tf-sidebar)] border-t border-[var(--tf-border)] text-center">
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">
            TaskFlow Automation Engine • Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
}
