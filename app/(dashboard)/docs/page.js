'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  BookOpen,
  Tag,
  Clock,
  User,
  Save,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '@/components/layout/AppShell';

export default function DocsPage() {
  const { activeWorkspace, user } = useWorkspace();
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      fetchDocs();
    }
  }, [activeWorkspace?.id]);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/docs?workspaceId=${activeWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.docs || []);
        if (data.docs && data.docs.length > 0) {
          selectDoc(data.docs[0]);
        }
      }
    } catch (err) {
      console.error('Fetch docs error:', err);
    }
  };

  const selectDoc = (doc) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditCategory(doc.category);
    setIsEditing(false);
  };

  const handleCreateNewDoc = async () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: '📝 New Project Specification',
      category: 'Engineering',
      content: '# New Specification\n\nWrite your markdown documentation specs here...',
      author: user?.name || 'You',
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [newDoc, ...prev]);
    selectDoc(newDoc);
    setIsEditing(true);
  };

  const handleSaveDoc = () => {
    if (!selectedDoc) return;
    const updated = {
      ...selectedDoc,
      title: editTitle,
      content: editContent,
      category: editCategory,
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => prev.map((d) => (d.id === selectedDoc.id ? updated : d)));
    setSelectedDoc(updated);
    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Left Sidebar: Document List */}
      <div className="w-full lg:w-80 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg p-4 flex flex-col gap-3 shrink-0 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-[var(--tf-text-main)]">Workspace Docs</h2>
          </div>
          <button
            onClick={handleCreateNewDoc}
            className="p-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition cursor-pointer"
            title="Create New Doc"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--tf-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs or tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => selectDoc(doc)}
              className={`w-full text-left p-3 rounded-md border transition cursor-pointer ${
                selectedDoc?.id === doc.id
                  ? 'bg-[var(--tf-sidebar)] border-amber-500 text-[var(--tf-text-main)] font-semibold shadow-xs'
                  : 'border-transparent text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate block max-w-[170px]">{doc.title}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {doc.category}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--tf-text-subtle)] mt-1 truncate">
                {new Date(doc.updatedAt).toLocaleDateString()} by {doc.author}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Editor / Preview Pane */}
      <div className="flex-1 bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-lg p-6 flex flex-col gap-4 overflow-y-auto shadow-xs">
        {selectedDoc ? (
          <>
            <div className="flex items-center justify-between border-b border-[var(--tf-border)] pb-4">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-lg font-bold bg-[var(--tf-sidebar)] border border-[var(--tf-border)] px-3 py-1 rounded text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-[var(--tf-text-main)]">{selectedDoc.title}</h1>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--tf-text-muted)] font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-500" />
                    {selectedDoc.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500" />
                    {selectedDoc.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {savedNotice && (
                  <span className="text-xs text-emerald-500 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                {isEditing ? (
                  <button
                    onClick={handleSaveDoc}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded bg-[var(--tf-sidebar)] hover:bg-[var(--tf-hover)] border border-[var(--tf-border)] text-xs font-semibold text-[var(--tf-text-main)] transition cursor-pointer"
                  >
                    Edit Doc
                  </button>
                )}
              </div>
            </div>

            {/* Content Body */}
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={16}
                className="w-full p-4 rounded-md bg-[var(--tf-sidebar)] border border-[var(--tf-border)] text-xs font-mono text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none text-xs text-[var(--tf-text-main)] space-y-3 font-sans leading-relaxed whitespace-pre-wrap">
                {selectedDoc.content}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--tf-text-subtle)] text-xs italic">
            Select a document from the left tree or click + to create a new spec.
          </div>
        )}
      </div>
    </div>
  );
}
