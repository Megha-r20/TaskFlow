'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  X,
  UserCheck,
  BarChart3,
  Clock,
} from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function WorkloadPlanner({ projectId = null }) {
  const { activeWorkspace } = useWorkspace();

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDays, setViewDays] = useState(7); // 7 or 14
  const [selectedCell, setSelectedCell] = useState(null); // { member, dateStr, tasks: [] }
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignTargetMemberId, setReassignTargetMemberId] = useState('');
  const [autoBalanceSuggestions, setAutoBalanceSuggestions] = useState([]);
  const [showAutoBalanceModal, setShowAutoBalanceModal] = useState(false);

  // Fetch workspace members & tasks
  useEffect(() => {
    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace?.id, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, taskRes] = await Promise.all([
        fetch(`/api/workspaces/${activeWorkspace.id}/members`),
        fetch(`/api/tasks${projectId ? `?projectId=${projectId}` : ''}`),
      ]);

      if (memRes.ok && taskRes.ok) {
        const memData = await memRes.json();
        const taskData = await taskRes.json();
        setMembers(memData.members || []);
        setTasks(taskData.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching workload data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate date columns for current week (Mon-Sun or 14 days)
  const dateColumns = useMemo(() => {
    const dates = [];
    const today = new Date();
    // Get Monday of current week
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);

    for (let i = 0; i < viewDays; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = d.toDateString() === today.toDateString();
      dates.push({ dateStr, dayName, dayNum, isToday, fullDate: d });
    }
    return dates;
  }, [viewDays]);

  // Calculate workload matrix per member & date
  const workloadMatrix = useMemo(() => {
    const matrix = {};

    members.forEach((m) => {
      matrix[m.userId] = {
        member: m,
        dailyHours: {},
        totalHours: 0,
        totalTasks: 0,
      };
      dateColumns.forEach((col) => {
        matrix[m.userId].dailyHours[col.dateStr] = { hours: 0, taskList: [] };
      });
    });

    tasks.forEach((t) => {
      if (!t.assigneeId || t.status === 'DONE') return;
      const memberData = matrix[t.assigneeId];
      if (!memberData) return;

      // Assign to task due date, or spread over dates if created earlier
      let taskDateStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : null;
      if (!taskDateStr || !memberData.dailyHours[taskDateStr]) {
        // Fallback to current week's target date
        taskDateStr = dateColumns[0].dateStr;
      }

      if (memberData.dailyHours[taskDateStr]) {
        const estHours = t.estimatedHours || 3; // Default 3h allocation per active task
        memberData.dailyHours[taskDateStr].hours += estHours;
        memberData.dailyHours[taskDateStr].taskList.push(t);
        memberData.totalHours += estHours;
        memberData.totalTasks += 1;
      }
    });

    return matrix;
  }, [members, tasks, dateColumns]);

  // Overall workspace capacity summary stats
  const capacityStats = useMemo(() => {
    let totalWorkload = 0;
    let overloadedCount = 0;
    const weeklyMax = viewDays === 7 ? 40 : 80;

    Object.values(workloadMatrix).forEach((m) => {
      totalWorkload += m.totalHours;
      if (m.totalHours > weeklyMax) {
        overloadedCount += 1;
      }
    });

    const totalTeamCapacity = members.length * weeklyMax;
    const utilizationPct = totalTeamCapacity > 0 ? Math.min(100, Math.round((totalWorkload / totalTeamCapacity) * 100)) : 0;

    return { totalWorkload, overloadedCount, utilizationPct, weeklyMax };
  }, [workloadMatrix, members.length, viewDays]);

  // Handle task reassignment
  const handleReassignTask = async (taskId, targetUserId) => {
    if (!targetUserId) return;
    setIsReassigning(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: targetUserId }),
      });
      if (res.ok) {
        await fetchData();
        setSelectedCell(null);
      } else {
        alert('Failed to reassign task.');
      }
    } catch (err) {
      console.error('Reassign error:', err);
      alert('Error updating task assignment.');
    } finally {
      setIsReassigning(false);
    }
  };

  // Generate Smart Auto-Balance Suggestions
  const generateAutoBalanceSuggestions = () => {
    const suggestions = [];
    const membersList = Object.values(workloadMatrix);
    const overloaded = membersList.filter((m) => m.totalHours > capacityStats.weeklyMax);
    const available = membersList.filter((m) => m.totalHours < capacityStats.weeklyMax * 0.75);

    overloaded.forEach((over) => {
      // Find tasks to transfer
      dateColumns.forEach((col) => {
        const dayObj = over.dailyHours[col.dateStr];
        if (dayObj && dayObj.taskList.length > 0 && available.length > 0) {
          const taskToMove = dayObj.taskList[0];
          const target = available[0];
          suggestions.push({
            id: `sugg-${taskToMove.id}`,
            task: taskToMove,
            fromMember: over.member,
            toMember: target.member,
            hoursSaved: taskToMove.estimatedHours || 3,
          });
        }
      });
    });

    setAutoBalanceSuggestions(suggestions);
    setShowAutoBalanceModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-16 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
        <div className="h-80 bg-[var(--tf-card)] rounded-xl border border-[var(--tf-border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[var(--tf-text-main)]">
      {/* Top Capacity Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-mono font-medium text-[var(--tf-text-muted)] uppercase tracking-wider">
              Total Assigned Workload
            </p>
            <p className="text-xl font-extrabold text-[var(--tf-text-main)] mt-0.5">
              {capacityStats.totalWorkload} <span className="text-xs font-normal text-[var(--tf-text-muted)]">hrs</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-mono font-medium text-[var(--tf-text-muted)] uppercase tracking-wider">
              Team Utilization Rate
            </p>
            <p className="text-xl font-extrabold text-[var(--tf-text-main)] mt-0.5">
              {capacityStats.utilizationPct}% <span className="text-xs font-normal text-[var(--tf-text-muted)]">capacity</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-mono font-medium text-[var(--tf-text-muted)] uppercase tracking-wider">
              Burnout Risk Alert
            </p>
            <p className="text-xl font-extrabold mt-0.5 flex items-center gap-1.5">
              {capacityStats.overloadedCount > 0 ? (
                <span className="text-rose-500">{capacityStats.overloadedCount} Overloaded</span>
              ) : (
                <span className="text-emerald-500">All Optimal</span>
              )}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
              capacityStats.overloadedCount > 0
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--tf-text-main)] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Resource Capacity Heatmap</span>
          </span>

          <div className="h-4 w-px bg-[var(--tf-border)] mx-1" />

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-[var(--tf-bg)] p-0.5 border border-[var(--tf-border)]">
            <button
              onClick={() => setViewDays(7)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                viewDays === 7 ? 'bg-amber-500 text-slate-900 font-bold' : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewDays(14)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition cursor-pointer ${
                viewDays === 14 ? 'bg-amber-500 text-slate-900 font-bold' : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)]'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={generateAutoBalanceSuggestions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Balance Workload</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] rounded-lg bg-[var(--tf-hover)] border border-[var(--tf-border)] transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workload Heatmap Table */}
      <div className="rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)] shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)]">
              <th className="p-3 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-muted)] w-56">
                Team Member
              </th>
              <th className="p-3 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-muted)] w-36">
                Weekly Workload
              </th>
              {dateColumns.map((col) => (
                <th
                  key={col.dateStr}
                  className={`p-2 text-center text-xs border-l border-[var(--tf-border)] font-mono ${
                    col.isToday ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-[var(--tf-text-muted)]'
                  }`}
                >
                  <div className="text-[10px] uppercase">{col.dayName}</div>
                  <div className="text-xs">{col.dayNum}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tf-border)]">
            {members.length === 0 ? (
              <tr>
                <td colSpan={dateColumns.length + 2} className="p-8 text-center text-xs italic text-[var(--tf-text-muted)]">
                  No workspace members found.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const memberWorkload = workloadMatrix[m.userId] || { totalHours: 0, dailyHours: {} };
                const pctOfCapacity = Math.min(100, Math.round((memberWorkload.totalHours / capacityStats.weeklyMax) * 100));
                const isOverloaded = memberWorkload.totalHours > capacityStats.weeklyMax;

                return (
                  <tr key={m.userId} className="hover:bg-[var(--tf-hover)] transition-colors">
                    {/* Member Details */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover border border-[var(--tf-border)] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--tf-text-main)] truncate">{m.name}</p>
                          <p className="text-[10px] text-[var(--tf-text-muted)] truncate">{m.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Capacity Progress Bar */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={isOverloaded ? 'text-rose-500 font-bold' : 'text-[var(--tf-text-main)]'}>
                            {memberWorkload.totalHours} hrs
                          </span>
                          <span className="text-[var(--tf-text-muted)]">/ {capacityStats.weeklyMax}h</span>
                        </div>
                        <div className="h-1.5 bg-[var(--tf-bg)] rounded-full overflow-hidden border border-[var(--tf-border)]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverloaded ? 'bg-rose-500' : pctOfCapacity > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pctOfCapacity}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Heatmap Cells for each date */}
                    {dateColumns.map((col) => {
                      const dayData = memberWorkload.dailyHours[col.dateStr] || { hours: 0, taskList: [] };
                      const hours = dayData.hours;

                      // Color coding thresholds
                      let cellStyle = 'bg-transparent text-[var(--tf-text-subtle)]';
                      if (hours > 0 && hours <= 4) {
                        cellStyle = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
                      } else if (hours > 4 && hours <= 7) {
                        cellStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
                      } else if (hours === 8) {
                        cellStyle = 'bg-amber-500 text-slate-900 font-bold border-amber-600 shadow-sm';
                      } else if (hours > 8) {
                        cellStyle = 'bg-rose-500/25 text-rose-600 dark:text-rose-400 font-bold border-rose-500/40 hover:bg-rose-500/35 animate-pulse';
                      }

                      return (
                        <td
                          key={col.dateStr}
                          onClick={() => {
                            if (dayData.taskList.length > 0) {
                              setSelectedCell({
                                member: m,
                                dateStr: col.dateStr,
                                tasks: dayData.taskList,
                                hours,
                              });
                            }
                          }}
                          className={`p-2 text-center border-l border-[var(--tf-border)] font-mono text-xs cursor-pointer transition ${cellStyle}`}
                          title={`${hours} hours allocated (${dayData.taskList.length} active tasks). Click to view details & reassign.`}
                        >
                          {hours > 0 ? (
                            <div>
                              <span>{hours}h</span>
                              <div className="text-[9px] font-sans opacity-75">{dayData.taskList.length} tsk</div>
                            </div>
                          ) : (
                            <span className="opacity-20">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cell Detail & Task Reassignment Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--tf-border)]">
              <div className="flex items-center gap-2">
                <img
                  src={selectedCell.member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCell.member.name}`}
                  alt={selectedCell.member.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <h3 className="text-xs font-bold text-[var(--tf-text-main)]">
                    {selectedCell.member.name}&apos;s Tasks for {selectedCell.dateStr}
                  </h3>
                  <p className="text-[10px] text-[var(--tf-text-muted)] font-mono">
                    {selectedCell.hours} hrs total ({selectedCell.tasks.length} active tasks)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task list for cell */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedCell.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[var(--tf-text-main)]">{task.title}</p>
                      <p className="text-[10px] text-[var(--tf-text-muted)] truncate max-w-xs">{task.description || 'No description'}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {task.estimatedHours || 3} hrs
                    </span>
                  </div>

                  {/* Reassign control */}
                  <div className="pt-2 border-t border-[var(--tf-border)] flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[var(--tf-text-muted)]">Reassign To:</span>
                    <select
                      onChange={(e) => handleReassignTask(task.id, e.target.value)}
                      disabled={isReassigning}
                      className="px-2 py-1 text-xs rounded bg-[var(--tf-card)] border border-[var(--tf-border)] text-[var(--tf-text-main)] cursor-pointer"
                    >
                      <option value="">Select team member...</option>
                      {members
                        .filter((m) => m.userId !== selectedCell.member.userId)
                        .map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.name} ({workloadMatrix[m.userId]?.totalHours || 0}h assigned)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Balance Smart Suggestions Drawer */}
      {showAutoBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--tf-border)]">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>Auto-Balance Smart Workload Suggestions</span>
              </div>
              <button
                onClick={() => setShowAutoBalanceModal(false)}
                className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {autoBalanceSuggestions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--tf-text-muted)] italic">
                  🎉 Team workload is already perfectly balanced! No immediate reassignments required.
                </div>
              ) : (
                autoBalanceSuggestions.map((sugg) => (
                  <div
                    key={sugg.id}
                    className="p-3 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--tf-text-main)] truncate">{sugg.task.title}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--tf-text-muted)]">
                        <span className="text-rose-500">{sugg.fromMember.name}</span>
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                        <span className="text-emerald-500">{sugg.toMember.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        await handleReassignTask(sugg.task.id, sugg.toMember.userId);
                        setAutoBalanceSuggestions((prev) => prev.filter((s) => s.id !== sugg.id));
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-slate-900 transition shrink-0 cursor-pointer"
                    >
                      <span>Apply</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
