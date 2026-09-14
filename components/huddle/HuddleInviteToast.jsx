'use client';

import { Radio, X, UserPlus, PhoneCall } from 'lucide-react';

export default function HuddleInviteToast({ huddleNotice, onJoin, onDismiss }) {
  if (!huddleNotice) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-amber-500/40 text-slate-100 rounded-2xl shadow-2xl p-4 max-w-sm flex items-start gap-3 backdrop-blur-xl ring-2 ring-amber-500/20">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 animate-pulse text-amber-400" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Live Team Huddle
            </span>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-bold text-slate-100 truncate">
            {huddleNotice.hostName || 'Teammate'} started a Huddle
          </p>

          <p className="text-[11px] text-slate-400 truncate">
            {huddleNotice.projectName ? `Project: ${huddleNotice.projectName}` : 'Workspace-wide meeting'}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onJoin}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Join Huddle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
