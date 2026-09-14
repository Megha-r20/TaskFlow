'use client';

import { useState, useEffect } from 'react';
import { Command, X, Search, Plus, Moon, Sun, Keyboard, CheckSquare, FolderKanban } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && /Mac/i.test(navigator.platform || '')) {
      setIsMac(true);
    }
  }, []);

  if (!isOpen) return null;

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Navigation & Search',
      items: [
        { keys: [modKey, 'K'], description: 'Open Global Search Command Menu' },
        { keys: ['?'], description: 'Open Keyboard Shortcuts Cheat-Sheet' },
        { keys: ['ESC'], description: 'Close any active Modal / Dropdown' },
      ],
    },
    {
      category: 'Quick Actions',
      items: [
        { keys: ['Shift', 'N'], description: 'Create a New Task in active workspace' },
        { keys: ['Shift', 'P'], description: 'Create a New Project' },
        { keys: ['T'], description: 'Toggle Light / Dark Mode' },
      ],
    },
    {
      category: 'Kanban Board & Details',
      items: [
        { keys: ['Drag & Drop'], description: 'Move task between status columns' },
        { keys: ['Click Task'], description: 'Open full Task Detail view & comments' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--tf-modal-bg)] border border-[var(--tf-border)] rounded-2xl shadow-2xl overflow-hidden z-10 transition-colors duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--tf-border)] bg-[var(--tf-sidebar)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--tf-text-main)] font-bold text-sm">
            <Keyboard className="w-4 h-4 text-amber-500" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {shortcuts.map((sec, idx) => (
            <div key={idx} className="space-y-3">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--tf-text-subtle)] block">
                {sec.category}
              </span>
              <div className="space-y-2">
                {sec.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs"
                  >
                    <span className="text-[var(--tf-text-main)] font-medium">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-mono font-bold rounded bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)] shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--tf-sidebar)] border-t border-[var(--tf-border)] text-center">
          <p className="text-[10px] font-mono text-[var(--tf-text-subtle)]">
            Press <kbd className="px-1 rounded bg-[var(--tf-card)] text-[var(--tf-text-main)] border border-[var(--tf-border)]">ESC</kbd> or click outside to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
