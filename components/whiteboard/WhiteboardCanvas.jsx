'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  StickyNote,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Download,
  FileCode,
  Zap,
  Tag,
  Palette,
  X,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';

const NODE_COLORS = {
  yellow: { bg: 'bg-amber-100 dark:bg-amber-950/70', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-900 dark:text-amber-100', accent: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/70', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-900 dark:text-emerald-100', accent: 'bg-emerald-500' },
  cyan: { bg: 'bg-sky-100 dark:bg-sky-950/70', border: 'border-sky-300 dark:border-sky-700', text: 'text-sky-900 dark:text-sky-100', accent: 'bg-sky-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-950/70', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100', accent: 'bg-purple-500' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-950/70', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-900 dark:text-rose-100', accent: 'bg-rose-500' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800/80', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-900 dark:text-slate-100', accent: 'bg-slate-500' },
};

const TEMPLATES = {
  feature_brainstorm: {
    name: 'Feature Mind Map',
    nodes: [
      { id: 'node-root', type: 'card', x: 420, y: 180, title: '🚀 New Feature Brainstorm', content: 'Central hub for defining scope, UX, and technical requirements.', color: 'amber', convertedTaskId: null },
      { id: 'node-ux', type: 'sticky', x: 120, y: 100, title: '🎨 UI/UX Design', content: 'Modern glassmorphic dialogs & keyboard shortcuts.', color: 'purple', convertedTaskId: null },
      { id: 'node-api', type: 'sticky', x: 140, y: 320, title: '⚡ Backend API', content: 'Rest/SSE endpoints for instant syncing & updates.', color: 'cyan', convertedTaskId: null },
      { id: 'node-db', type: 'sticky', x: 740, y: 120, title: '🗄️ Database Schema', content: 'Add required relation tables & Prisma migrations.', color: 'emerald', convertedTaskId: null },
      { id: 'node-qa', type: 'sticky', x: 730, y: 340, title: '🧪 QA & Testing', content: 'Verify mobile responsiveness & unit test coverage.', color: 'rose', convertedTaskId: null },
    ],
    connections: [
      { id: 'c1', fromId: 'node-root', toId: 'node-ux' },
      { id: 'c2', fromId: 'node-root', toId: 'node-api' },
      { id: 'c3', fromId: 'node-root', toId: 'node-db' },
      { id: 'c4', fromId: 'node-root', toId: 'node-qa' },
    ],
  },
  sprint_retro: {
    name: 'Sprint Retrospective',
    nodes: [
      { id: 'r1', type: 'card', x: 80, y: 80, title: '🟢 What Went Well', content: 'Shipped Gantt chart ahead of schedule. Great team collaboration.', color: 'emerald', convertedTaskId: null },
      { id: 'r2', type: 'card', x: 420, y: 80, title: '🟡 What Needs Improvement', content: 'CI/CD pipeline test runner timeout issues during peak hours.', color: 'yellow', convertedTaskId: null },
      { id: 'r3', type: 'card', x: 760, y: 80, title: '🔥 Action Items', content: 'Optimize docker caching for parallel PR builds.', color: 'rose', convertedTaskId: null },
    ],
    connections: [
      { id: 'cr1', fromId: 'r1', toId: 'r2' },
      { id: 'cr2', fromId: 'r2', toId: 'r3' },
    ],
  },
};

export default function WhiteboardCanvas({ projectId = null, onTaskCreated = null }) {
  const storageKey = `taskflow_whiteboard_${projectId || 'global'}`;

  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingFromId, setConnectingFromId] = useState(null);
  
  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Convert to Task Modal State
  const [convertingNode, setConvertingNode] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjId, setSelectedProjId] = useState(projectId || '');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const canvasRef = useRef(null);

  // Load saved state or default template
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.nodes && parsed.nodes.length > 0) {
            setNodes(parsed.nodes);
            setConnections(parsed.connections || []);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved whiteboard:', e);
        }
      }
    }
    // Fallback to default template
    loadTemplate('feature_brainstorm');
  }, [storageKey]);

  // Auto save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && nodes.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({ nodes, connections }));
    }
  }, [nodes, connections, storageKey]);

  // Fetch projects list for task conversion selector if needed
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjectsList(data.projects || []);
          if (!selectedProjId && data.projects?.length > 0) {
            setSelectedProjId(data.projects[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching projects for whiteboard:', err);
      }
    }
    fetchProjects();
  }, [selectedProjId]);

  const loadTemplate = (key) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setNodes(tpl.nodes);
      setConnections(tpl.connections);
      setSelectedNodeId(null);
    }
  };

  const handleAddNode = (type = 'sticky', color = 'yellow') => {
    const newId = `node-${Date.now()}`;
    const x = Math.floor(Math.random() * 200) + 300;
    const y = Math.floor(Math.random() * 200) + 150;

    const newNode = {
      id: newId,
      type,
      x,
      y,
      title: type === 'sticky' ? 'New Sticky Note' : type === 'card' ? 'Idea Card' : 'Process Step',
      content: 'Click to edit description or add visual details.',
      color,
      convertedTaskId: null,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  const handleUpdateNode = (id, fields) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...fields } : n)));
  };

  const handleDeleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Node Dragging Logic
  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    if (connectingFromId) {
      if (connectingFromId !== node.id) {
        // Create connection
        const newConnId = `conn-${Date.now()}`;
        setConnections((prev) => {
          if (prev.some((c) => (c.fromId === connectingFromId && c.toId === node.id) || (c.fromId === node.id && c.toId === connectingFromId))) {
            return prev;
          }
          return [...prev, { id: newConnId, fromId: connectingFromId, toId: node.id }];
        });
      }
      setConnectingFromId(null);
      return;
    }

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoomLevel - node.x,
      y: (e.clientY - rect.top) / zoomLevel - node.y,
    });
  };

  const handleMouseMoveCanvas = (e) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(2200, (e.clientX - rect.left) / zoomLevel - dragOffset.x));
    const newY = Math.max(20, Math.min(1500, (e.clientY - rect.top) / zoomLevel - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n))
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // Convert Node to Live TaskFlow Task
  const handleConvertNodeToTask = async (e) => {
    e.preventDefault();
    if (!convertingNode) return;

    const targetProjId = selectedProjId || projectId;
    if (!targetProjId) {
      alert('Please select a project for the task.');
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: convertingNode.title,
          description: convertingNode.content,
          projectId: targetProjId,
          priority: taskPriority,
          status: 'TODO',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        handleUpdateNode(convertingNode.id, { convertedTaskId: data.task?.id || 'created' });
        if (onTaskCreated) onTaskCreated(data.task);
        setConvertingNode(null);
      } else {
        const err = await res.json();
        alert(`Error creating task: ${err.error || 'Failed'}`);
      }
    } catch (err) {
      console.error('Task conversion error:', err);
      alert('Failed to connect to server.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, connections }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `taskflow-whiteboard-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the entire whiteboard?')) {
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
    }
  };

  const getNodeCenter = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const width = node.type === 'card' ? 240 : 200;
    const height = node.type === 'card' ? 140 : 130;
    return { x: node.x + width / 2, y: node.y + height / 2 };
  };

  return (
    <div className="flex flex-col h-full bg-[var(--tf-bg)] rounded-xl border border-[var(--tf-border)] overflow-hidden shadow-xl select-none">
      {/* Top Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--tf-card)] border-b border-[var(--tf-border)] z-20">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--tf-text-main)] mr-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Visual Whiteboard</span>
          </div>

          <div className="h-4 w-px bg-[var(--tf-border)] mx-1" />

          <button
            onClick={() => handleAddNode('sticky', 'yellow')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Add Sticky</span>
          </button>

          <button
            onClick={() => handleAddNode('card', 'emerald')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Idea Card</span>
          </button>

          <button
            onClick={() => {
              if (selectedNodeId) {
                setConnectingFromId(selectedNodeId);
              } else {
                alert('Please click on a node first, then click Link Node!');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              connectingFromId
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-[var(--tf-hover)] text-[var(--tf-text-main)] hover:bg-[var(--tf-card-hover)] border border-[var(--tf-border)]'
            }`}
            title="Click to connect selected node to another node"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{connectingFromId ? 'Select Target Node...' : 'Link Node'}</span>
          </button>
        </div>

        {/* Center Templates Loader */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--tf-text-muted)] hidden md:inline">Templates:</span>
          <button
            onClick={() => loadTemplate('feature_brainstorm')}
            className="px-2.5 py-1 rounded bg-[var(--tf-hover)] text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] text-xs border border-[var(--tf-border)] transition cursor-pointer"
          >
            🧠 Mind Map
          </button>
          <button
            onClick={() => loadTemplate('sprint_retro')}
            className="px-2.5 py-1 rounded bg-[var(--tf-hover)] text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] text-xs border border-[var(--tf-border)] transition cursor-pointer"
          >
            🔄 Sprint Retro
          </button>
        </div>

        {/* Right Canvas Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-[var(--tf-hover)] p-0.5 border border-[var(--tf-border)]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] cursor-pointer"
              title="Zoom Out"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2 text-[var(--tf-text-main)]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] cursor-pointer"
              title="Zoom In"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="p-1.5 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] rounded bg-[var(--tf-hover)] border border-[var(--tf-border)] transition cursor-pointer"
            title="Export Board as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearCanvas}
            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded border border-rose-500/20 transition cursor-pointer"
            title="Clear Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace Container */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onClick={() => {
          setSelectedNodeId(null);
          setConnectingFromId(null);
        }}
        className="flex-1 relative overflow-auto min-h-[550px] cursor-crosshair"
        style={{
          backgroundImage: 'radial-gradient(var(--tf-border) 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
        }}
      >
        {/* Transform Layer for Zoom */}
        <div
          className="absolute inset-0 min-w-[2400px] min-h-[1600px] transition-transform origin-top-left"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* SVG Connecting Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--tf-text-muted)" opacity="0.6" />
              </marker>
            </defs>

            {connections.map((conn) => {
              const p1 = getNodeCenter(conn.fromId);
              const p2 = getNodeCenter(conn.toId);
              if (p1.x === 0 || p2.x === 0) return null;

              const dx = p2.x - p1.x;
              const cx1 = p1.x + dx * 0.4;
              const cy1 = p1.y;
              const cx2 = p2.x - dx * 0.4;
              const cy2 = p2.y;

              const isSelected = selectedNodeId === conn.fromId || selectedNodeId === conn.toId;

              return (
                <path
                  key={conn.id}
                  d={`M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`}
                  stroke={isSelected ? '#f59e0b' : 'var(--tf-border)'}
                  strokeWidth={isSelected ? '3' : '2'}
                  strokeDasharray={isSelected ? '4' : 'none'}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-150"
                />
              );
            })}
          </svg>

          {/* Render Whiteboard Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const colorTheme = NODE_COLORS[node.color] || NODE_COLORS.yellow;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
                className={`absolute z-10 p-3.5 rounded-xl border transition-shadow cursor-grab active:cursor-grabbing shadow-lg backdrop-blur-sm ${
                  colorTheme.bg
                } ${colorTheme.border} ${
                  isSelected ? 'ring-2 ring-amber-500 ring-offset-2 scale-105 z-30' : 'hover:scale-[1.02]'
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: node.type === 'card' ? '250px' : '210px',
                }}
              >
                {/* Node Top Action Header */}
                <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-black/10 dark:border-white/10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${colorTheme.accent}`} />
                    {node.type}
                  </span>

                  <div className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-0.5">
                      {Object.keys(NODE_COLORS).map((c) => (
                        <button
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateNode(node.id, { color: c });
                          }}
                          className={`w-2.5 h-2.5 rounded-full ${NODE_COLORS[c].accent} hover:scale-125 transition-transform cursor-pointer`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition cursor-pointer"
                      title="Delete Node"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Editable Title */}
                <input
                  type="text"
                  value={node.title}
                  onChange={(e) => handleUpdateNode(node.id, { title: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full bg-transparent font-bold text-xs ${colorTheme.text} focus:outline-none focus:bg-white/40 dark:focus:bg-black/40 rounded px-1 mb-1 truncate`}
                  placeholder="Title..."
                />

                {/* Editable Content */}
                <textarea
                  value={node.content}
                  onChange={(e) => handleUpdateNode(node.id, { content: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  rows={2}
                  className={`w-full bg-transparent text-[11px] leading-relaxed ${colorTheme.text} focus:outline-none focus:bg-white/40 dark:focus:bg-black/40 rounded p-1 resize-none font-sans`}
                  placeholder="Add details..."
                />

                {/* Bottom Footer: 1-Click Convert to Task Button */}
                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                  {node.convertedTaskId ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Task Created</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvertingNode(node);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded transition border border-amber-500/40 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Convert to Task</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert Node to Task Modal */}
      {convertingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--tf-card)] border border-[var(--tf-border)] rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--tf-border)]">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>Convert Visual Idea to Live Task</span>
              </div>
              <button
                onClick={() => setConvertingNode(null)}
                className="p-1 rounded text-[var(--tf-text-muted)] hover:text-[var(--tf-text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertNodeToTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--tf-text-muted)] mb-1">Task Title</label>
                <input
                  type="text"
                  value={convertingNode.title}
                  onChange={(e) => setConvertingNode({ ...convertingNode, title: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--tf-text-muted)] mb-1">Description</label>
                <textarea
                  value={convertingNode.content}
                  onChange={(e) => setConvertingNode({ ...convertingNode, content: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)] focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--tf-text-muted)] mb-1">Project</label>
                  <select
                    value={selectedProjId}
                    onChange={(e) => setSelectedProjId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)]"
                  >
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--tf-text-muted)] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text-main)]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--tf-border)]">
                <button
                  type="button"
                  onClick={() => setConvertingNode(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md text-[var(--tf-text-muted)] hover:bg-[var(--tf-hover)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-slate-900 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTask ? 'Creating Task...' : '🚀 Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
