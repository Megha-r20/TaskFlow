'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  TrendingUp,
  User,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function GoalsPage() {
  const { user } = useWorkspace();
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newQuarter, setNewQuarter] = useState('Q3 2026');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error('Fetch goals error:', err);
    }
  };

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newG = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      quarter: newQuarter,
      owner: user?.name || 'You',
      targetProgress: 100,
      currentProgress: 0,
      keyResults: [
        { id: `kr-${Date.now()}-1`, title: 'Key Result 1', current: 0, target: 100, unit: '%' },
      ],
    };

    setGoals((prev) => [newG, ...prev]);
    setNewGoalTitle('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono font-medium tf-tag-yellow">
          <Target className="w-3.5 h-3.5" />
          <span>Objectives & Key Results (OKRs)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--tf-text-main)] tracking-tight">
          Workspace Strategic Goals
        </h1>
        <p className="text-xs text-[var(--tf-text-muted)] max-w-xl">
          Align daily tasks with high-level quarterly objectives and track Key Result completion percentages.
        </p>

        {/* Create Goal Form */}
        <form onSubmit={handleCreateGoal} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Enter new objective (e.g. Expand product adoption by 25%)..."
            className="flex-1 px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 w-full"
          />
          <select
            value={newQuarter}
            onChange={(e) => setNewQuarter(e.target.value)}
            className="px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)]"
          >
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q4 2026">Q4 2026</option>
            <option value="Q1 2027">Q1 2027</option>
          </select>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        </form>
      </div>

      {/* Goal Cards */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="p-6 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--tf-border)] pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                  {goal.quarter}
                </span>
                <h3 className="text-base font-bold text-[var(--tf-text-main)] mt-1">{goal.title}</h3>
                <p className="text-xs font-mono text-[var(--tf-text-muted)] mt-0.5">Owner: {goal.owner}</p>
              </div>

              <div className="flex items-center gap-3 text-right">
                <span className="text-xl font-bold font-mono text-emerald-500">{goal.currentProgress}%</span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-[var(--tf-sidebar)] h-2 rounded-full overflow-hidden border border-[var(--tf-border)]">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${goal.currentProgress}%` }}
              />
            </div>

            {/* Key Results List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[var(--tf-text-subtle)] uppercase">Key Results ({goal.keyResults.length})</span>
              {goal.keyResults.map((kr) => (
                <div key={kr.id} className="p-3 rounded bg-[var(--tf-sidebar)] border border-[var(--tf-border)] flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-[var(--tf-text-main)] flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {kr.title}
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {kr.current} / {kr.target} {kr.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
