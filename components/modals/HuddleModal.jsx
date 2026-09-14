'use client';

import { useState } from 'react';
import { Maximize2, PhoneOff, Mic, MicOff, Users, Volume2 } from 'lucide-react';
import HuddleRoom from '../huddle/HuddleRoom';

export default function HuddleModal({ isOpen, isMinimized, project = null, onMinimize, onMaximize, onLeave }) {
  if (!isOpen) return null;

  // Render Floating Picture-in-Picture Dock Widget when minimized
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
        <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="text-amber-500">🎙️</span>
              <span>Team Huddle</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Expand Button */}
          <button
            onClick={onMaximize}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Expand Meeting Room"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition cursor-pointer"
            title="Leave Call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Render Fullscreen Meeting Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh]">
        <HuddleRoom project={project} onMinimize={onMinimize} onLeave={onLeave} />
      </div>
    </div>
  );
}
