'use client';

import { useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export default function ImportExportModal({ isOpen, onClose, activeWorkspace, projects = [] }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImportTasks = async () => {
    if (!jsonText.trim()) {
      setError('Please paste valid JSON task data or array');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');

    try {
      let taskData = [];
      try {
        taskData = JSON.parse(jsonText);
        if (!Array.isArray(taskData)) taskData = [taskData];
      } catch (e) {
        // Fallback simple line parser for title list
        taskData = jsonText
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => ({ title: line.trim() }));
      }

      const res = await fetch('/api/import-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'IMPORT_TASKS',
          projectId: selectedProjectId || projects[0]?.id,
          taskData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`Successfully imported ${data.count} tasks!`);
        setJsonText('');
      } else {
        setError('Failed to import tasks. Check format.');
      }
    } catch (err) {
      console.error(err);
      setError('Import processing error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/import-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXPORT_WORKSPACE',
          workspaceId: activeWorkspace.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.workspaceBackup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `TaskFlow_Backup_${activeWorkspace.slug || 'workspace'}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setMessage('Full workspace backup downloaded successfully!');
      }
    } catch (err) {
      console.error(err);
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Data Import, Export & Backup</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Import */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[var(--tf-text-main)] flex items-center gap-2 uppercase tracking-wider">
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Import Tasks (JSON or Line Titles)</span>
          </h4>

          {projects.length > 0 && (
            <div>
              <label className="block text-[10px] font-mono text-[var(--tf-text-subtle)] uppercase mb-1">Select Target Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={4}
            placeholder={`Paste JSON array or task titles per line:\n[{"title":"Task 1","priority":"HIGH"},{"title":"Task 2"}]`}
            className="w-full p-3 text-xs font-mono rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
          />

          <button
            onClick={handleImportTasks}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            {loading ? 'Processing Import...' : 'Import Tasks Now'}
          </button>
        </div>

        {/* Section 2: Backup */}
        <div className="border-t border-[var(--tf-border)] pt-4 space-y-2">
          <h4 className="text-xs font-bold text-[var(--tf-text-main)] flex items-center gap-2 uppercase tracking-wider">
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>2. Full Workspace Backup (1-Click JSON)</span>
          </h4>
          <p className="text-xs text-[var(--tf-text-muted)]">
            Export all projects, tasks, comments, and workspace telemetry into a portable JSON backup file.
          </p>

          <button
            onClick={handleExportWorkspace}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-xs font-bold text-[var(--tf-text-main)] transition cursor-pointer"
          >
            Download Workspace Backup
          </button>
        </div>
      </div>
    </div>
  );
}
