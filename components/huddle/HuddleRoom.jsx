'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Minimize2,
  Maximize2,
  MessageSquare,
  FileText,
  Users,
  Sparkles,
  Zap,
  Plus,
  Send,
  CheckCircle2,
  Volume2,
  Pin,
  X,
  Share2,
} from 'lucide-react';
import { useWorkspace } from '../layout/AppShell';

export default function HuddleRoom({ project = null, onMinimize = null, onLeave = null }) {
  const { user, activeWorkspace } = useWorkspace();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'chat' | 'notes'

  // WebRTC Local Stream Refs
  const localVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Chat & Notes State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Sarah Jenkins', text: 'Hey team! Let’s review the sprint backlog & Gantt timeline.', time: '11:30 AM' },
    { id: 2, sender: 'Alex Rivera', text: 'Ready! Screen sharing the new Whiteboard layout now.', time: '11:31 AM' },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [actionItems, setActionItems] = useState([
    { id: 1, title: 'Finalize mobile responsive design for Whiteboard', assignee: 'Sarah Jenkins', converted: false },
    { id: 2, title: 'Verify WebRTC connection fallback on staging', assignee: 'Alex Rivera', converted: false },
  ]);
  const [newActionItemTitle, setNewActionItemTitle] = useState('');

  // Simulated Workspace Participants
  const [participants, setParticipants] = useState([
    {
      id: user?.id || 'me',
      name: `${user?.name || 'You'} (Host)`,
      role: 'Host',
      avatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host',
      isMe: true,
      isMuted: false,
      isVideoOff: false,
      isSpeaking: true,
    },
    {
      id: 'p-sarah',
      name: 'Sarah Jenkins',
      role: 'Product Designer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      isMe: false,
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
    },
    {
      id: 'p-alex',
      name: 'Alex Rivera',
      role: 'Frontend Lead',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      isMe: false,
      isMuted: true,
      isVideoOff: false,
      isSpeaking: false,
    },
    {
      id: 'p-david',
      name: 'David Chen',
      role: 'Backend Eng',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      isMe: false,
      isMuted: false,
      isVideoOff: true,
      isSpeaking: false,
    },
  ]);

  // Initialize Media Devices (Camera / Microphone)
  useEffect(() => {
    async function initMedia() {
      if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn('Camera/Microphone permissions not granted or unavailable:', err);
        }
      }
    }
    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Mute Mic toggle
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted((prev) => !prev);
    setParticipants((prev) =>
      prev.map((p) => (p.isMe ? { ...p, isMuted: !isMuted } : p))
    );
  };

  // Handle Video On/Off toggle
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff((prev) => !prev);
    setParticipants((prev) =>
      prev.map((p) => (p.isMe ? { ...p, isVideoOff: !isVideoOff } : p))
    );
  };

  // Handle Screen Share toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setScreenStream(stream);
          setIsScreenSharing(true);
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = stream;
          }

          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenStream(null);
          };
        }
      } catch (err) {
        console.warn('Screen share cancelled or not supported:', err);
      }
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: user?.name || 'You',
        text: newMsg.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNewMsg('');
  };

  const handleAddActionItem = (e) => {
    e.preventDefault();
    if (!newActionItemTitle.trim()) return;
    setActionItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newActionItemTitle.trim(),
        assignee: user?.name || 'Unassigned',
        converted: false,
      },
    ]);
    setNewActionItemTitle('');
  };

  const handleConvertActionItemToTask = async (item) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: `Action item generated during Team Huddle call (${new Date().toLocaleDateString()}).`,
          priority: 'HIGH',
          status: 'TODO',
        }),
      });
      if (res.ok) {
        setActionItems((prev) =>
          prev.map((ai) => (ai.id === item.id ? { ...ai, converted: true } : ai))
        );
      }
    } catch (err) {
      console.error('Error converting action item:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Huddle Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <span className="text-amber-500">🎙️</span>
            <span>TaskFlow Team Huddle</span>
            {project && (
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {project.name}
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher & Dock Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Video Grid ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'chat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat ({chatMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'notes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AI Action Notes
            </button>
          </div>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title="Minimize to Floating Dock"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex">
        {/* Screen Share Layer (if screen sharing is active) */}
        {isScreenSharing ? (
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-3 relative">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-amber-400 font-mono flex items-center gap-2 border border-amber-500/30">
              <Monitor className="w-3.5 h-3.5" />
              <span>You are sharing your screen</span>
            </div>
            <video
              ref={screenShareVideoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded-xl object-contain shadow-2xl border border-slate-800"
            />
          </div>
        ) : activeTab === 'grid' ? (
          /* Video Participant Gallery Grid */
          <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto items-center justify-center">
            {participants.map((p) => (
              <div
                key={p.id}
                className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden aspect-video flex flex-col items-center justify-center shadow-xl group hover:border-slate-700 transition"
              >
                {/* Local Video Stream or Avatar fallback */}
                {p.isMe && !p.isVideoOff && localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-md"
                      />
                      {p.isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
                          <Volume2 className="w-3 h-3 text-slate-950" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{p.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{p.role}</span>
                  </div>
                )}

                {/* Bottom Overlay Card */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs font-semibold text-slate-200 truncate">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {p.isMuted ? (
                      <span className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <MicOff className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Mic className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'chat' ? (
          /* Live Huddle Meeting Chat */
          <div className="flex-1 flex flex-col p-4 bg-slate-900/60 max-w-2xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">{msg.sender}</span>
                    <span className="text-[10px] font-mono text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a meeting message or paste task link..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* AI Action Items Notes Tab */
          <div className="flex-1 p-5 overflow-y-auto max-w-2xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI Meeting Action Items & Notes</span>
              </div>
            </div>

            {/* Action Item Input */}
            <form onSubmit={handleAddActionItem} className="flex items-center gap-2">
              <input
                type="text"
                value={newActionItemTitle}
                onChange={(e) => setNewActionItemTitle(e.target.value)}
                placeholder="Add meeting decision or action item..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </form>

            <div className="space-y-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                    <p className="text-[10px] font-mono text-slate-400">Assigned: {item.assignee}</p>
                  </div>

                  {item.converted ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Task Created</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertActionItemToTask(item)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Convert to Task</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Huddle Control Bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 border-t border-slate-800 z-20">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full border transition cursor-pointer ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full border transition cursor-pointer ${
            isVideoOff
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full border transition cursor-pointer ${
            isScreenSharing
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
          title="Share Screen"
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Leave Huddle */}
        <button
          onClick={onLeave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition cursor-pointer ml-4"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Huddle</span>
        </button>
      </div>
    </div>
  );
}
