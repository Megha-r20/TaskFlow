'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle,
  CheckSquare,
  Sparkles,
  Flame,
  Coffee,
  BrainCircuit,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';
import { playAmbientSound, setAmbientVolume, stopAmbientSound } from '@/lib/ambientAudio';

export default function FocusModeModal({ isOpen, initialTask, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(initialTask || null);

  // Timer states
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' (25m) | 'shortBreak' (5m) | 'longBreak' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Ambient sound states
  const [ambientType, setAmbientType] = useState('rain'); // 'rain' | 'deep' | 'off'
  const [volume, setVolume] = useState(0.3);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      fetchUserTasks();
    }
  }, [isOpen, activeWorkspace?.id]);

  useEffect(() => {
    if (initialTask) {
      setSelectedTask(initialTask);
      parseSubtasks(initialTask.description);
    }
  }, [initialTask]);

  useEffect(() => {
    if (selectedTask) {
      parseSubtasks(selectedTask.description);
    }
  }, [selectedTask?.id]);

  const parseSubtasks = (desc) => {
    if (!desc) {
      setSubtasks([]);
      return;
    }
    const lines = desc.split('\n');
    const parsed = lines
      .filter((l) => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'))
      .map((l, i) => ({
        id: i,
        text: l.replace(/- \[[ x]\]/, '').trim(),
        done: l.trim().startsWith('- [x]'),
      }));
    setSubtasks(parsed);
  };

  const fetchUserTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?workspaceId=${activeWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        const activeOnly = (data.tasks || []).filter((t) => t.status !== 'DONE');
        setTasks(activeOnly);
        if (!selectedTask && activeOnly.length > 0) {
          setSelectedTask(activeOnly[0]);
          parseSubtasks(activeOnly[0].description);
        }
      }
    } catch (err) {
      console.error('Fetch focus tasks error:', err);
    }
  };

  // Timer Countdown Logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      stopAmbientSound();
      if (mode === 'pomodoro') {
        setSessionsCompleted((prev) => prev + 1);
        switchMode('shortBreak');
      } else {
        switchMode('pomodoro');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  // Ambient sound handler
  useEffect(() => {
    if (isOpen && isRunning && ambientType !== 'off') {
      playAmbientSound(ambientType, volume);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [isOpen, isRunning, ambientType]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    stopAmbientSound();
    if (newMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (newMode === 'shortBreak') setTimeLeft(5 * 60);
    else if (newMode === 'longBreak') setTimeLeft(15 * 60);
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    stopAmbientSound();
    switchMode(mode);
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    setAmbientVolume(v);
  };

  const toggleSubtask = (id) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const markTaskDone = async () => {
    if (!selectedTask) return;
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      if (res.ok) {
        setIsRunning(false);
        stopAmbientSound();
        setSelectedTask(null);
        fetchUserTasks();
      }
    } catch (err) {
      console.error('Mark task done error:', err);
    }
  };

  if (!isOpen) return null;

  const totalModeTime = mode === 'pomodoro' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalModeTime - timeLeft) / totalModeTime) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 text-white overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Focus Mode
              <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Deep Work
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">Distraction-free single task Pomodoro</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sessions Completed Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-amber-400 font-bold">{sessionsCompleted}</span>
            <span className="text-slate-400">Pomodoros</span>
          </div>

          <button
            onClick={() => {
              stopAmbientSound();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="max-w-2xl mx-auto w-full my-auto space-y-8 text-center flex flex-col items-center">
        {/* Mode Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => switchMode('pomodoro')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
              mode === 'pomodoro' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍅 Focus (25m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
              mode === 'shortBreak' ? 'bg-emerald-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ☕ Short Break (5m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
              mode === 'longBreak' ? 'bg-blue-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌿 Long Break (15m)
          </button>
        </div>

        {/* Big Countdown Timer Circle */}
        <div className="relative flex items-center justify-center">
          <svg className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              className="stroke-slate-800 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="50%"
              cy="50%"
              r="42%"
              className={`fill-none transition-all duration-1000 ${
                mode === 'pomodoro' ? 'stroke-amber-500' : mode === 'shortBreak' ? 'stroke-emerald-500' : 'stroke-blue-500'
              }`}
              strokeWidth="8"
              strokeDasharray="600"
              strokeDashoffset={600 - (600 * progressPercent) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl sm:text-7xl font-bold font-mono tracking-tight text-white drop-shadow-md">
              {formattedTime}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-2">
              {isRunning ? 'Session Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition shadow-lg flex items-center gap-2 cursor-pointer ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Start Focus Session'}</span>
          </button>
        </div>

        {/* Active Task Selector & Subtask Checklist */}
        <div className="w-full max-w-lg p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Task</span>
            {selectedTask && (
              <button
                onClick={markTaskDone}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Complete Task</span>
              </button>
            )}
          </div>

          <select
            value={selectedTask?.id || ''}
            onChange={(e) => {
              const matched = tasks.find((t) => t.id === e.target.value);
              setSelectedTask(matched || null);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
          >
            {tasks.length === 0 ? (
              <option value="">No pending tasks</option>
            ) : (
              tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))
            )}
          </select>

          {/* Subtasks Checklist */}
          {subtasks.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">Checklist Subtasks:</span>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {subtasks.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubtask(sub.id)}
                    className="w-full flex items-center gap-2 text-xs text-left p-1.5 rounded hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={() => {}}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                    />
                    <span className={sub.done ? 'line-through text-slate-500' : 'text-slate-200'}>{sub.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls: Ambient Sound Player */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Ambient Audio:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAmbientType('rain')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                ambientType === 'rain' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌧️ Rain & Thunder
            </button>
            <button
              onClick={() => setAmbientType('deep')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                ambientType === 'deep' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌌 Deep Focus
            </button>
            <button
              onClick={() => setAmbientType('off')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                ambientType === 'off' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Off
            </button>
          </div>
        </div>

        {ambientType !== 'off' && (
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
