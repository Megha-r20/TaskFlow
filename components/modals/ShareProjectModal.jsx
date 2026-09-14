'use client';

import { useState } from 'react';
import { X, Copy, Check, ShieldCheck, ExternalLink, Link2, Trash2 } from 'lucide-react';

export default function ShareProjectModal({ isOpen, onClose, project }) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !project) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Client Read-Only Share Link</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[var(--tf-text-muted)]">
            Generate a secure, unauthenticated guest link for <strong>{project.name}</strong>. External clients can view task progress without needing a login account.
          </p>
        </div>

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--tf-sidebar)] border border-[var(--tf-border)]">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs font-mono text-[var(--tf-text-main)] bg-transparent outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-500 font-semibold hover:underline flex items-center gap-1"
              >
                Preview Link <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => setShareUrl('')}
                className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Revoke Access
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
          >
            <Link2 className="w-4 h-4" />
            <span>{loading ? 'Generating Token...' : 'Generate Client Share Link'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
