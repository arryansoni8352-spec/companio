'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

const COUNTRIES = [
  'Global',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'India',
  'Japan',
  'Australia',
  'France',
  'Brazil'
];

interface ChatMessage {
  sender: 'me' | 'partner' | 'system';
  text: string;
  time: string;
}

export default function RandomMeetPage() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // Custom Settings
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [country, setCountry] = useState('Global');
  const [matchMode, setMatchMode] = useState<'video' | 'voice'>('video');
  
  // Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const matchedUserIdRef = useRef<string | null>(null);
  const callIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('companio_token');
    if (!token) return;

    socketRef.current = io('http://localhost:3001/webrtc', {
      auth: { token }
    });

    socketRef.current.on('match:found', async (data) => {
      setStatus('matched');
      matchedUserIdRef.current = data.matchedUserId;
      callIdRef.current = data.callId;
      setChatMessages([{ sender: 'system', text: 'Connected to a new partner! Say hi!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      await initPeerConnection(data.isInitiator, data.matchedUserId, data.callId);
    });

    socketRef.current.on('match:ended', () => {
      endMatch(false);
      // Auto reconnect searches if partner skips
      startSearching();
    });

    socketRef.current.on('webrtc:offer', async (data) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current?.emit('webrtc:answer', { targetUserId: data.fromUserId, answer, callId: data.callId });
    });

    socketRef.current.on('webrtc:answer', async (data) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socketRef.current.on('webrtc:ice-candidate', async (data) => {
      if (!peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    });

    // Custom text chat message channel over WebRTC socket
    socketRef.current.on('match:text_message', (data: { text: string }) => {
      setChatMessages(prev => [...prev, {
        sender: 'partner',
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    });

    return () => {
      socketRef.current?.disconnect();
      endMatch(true);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [status, localStream, remoteStream]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  // Keyboard shortcut listener (Space to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (status === 'matched') {
          skipMatch();
        } else if (status === 'idle') {
          startSearching();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, interests, country, matchMode, localStream]);

  // Request user media devices
  const requestMedia = async (mode: 'video' | 'voice') => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: mode === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing video/audio hardware', err);
      alert('Camera and microphone access are required for matching.');
      return null;
    }
  };

  const startSearching = async () => {
    setStatus('searching');
    setRemoteStream(null);
    const stream = await requestMedia(matchMode);
    if (!stream) {
      setStatus('idle');
      return;
    }
    socketRef.current?.emit('match:join_queue', {
      interests,
      country,
      mode: matchMode
    });
  };

  const skipMatch = () => {
    endMatch(true);
    socketRef.current?.emit('match:skip');
    startSearching();
  };

  const cancelSearch = () => {
    socketRef.current?.emit('match:leave_queue');
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setStatus('idle');
  };

  const endMatch = (manual: boolean) => {
    setStatus(manual ? 'idle' : 'searching');
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    matchedUserIdRef.current = null;
    callIdRef.current = null;
  };

  const initPeerConnection = async (isInitiator: boolean, targetUserId: string, callId: string) => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerRef.current?.addTrack(track, localStream);
      });
    }

    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
          callId
        });
      }
    };

    if (isInitiator) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current?.emit('webrtc:offer', { targetUserId, offer, callId });
    }
  };

  // Toggle Mute / Camera
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Submit Text Chat Messages
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !matchedUserIdRef.current) return;
    
    socketRef.current?.emit('match:send_message', {
      targetUserId: matchedUserIdRef.current,
      text: chatInput.trim()
    });

    setChatMessages(prev => [...prev, {
      sender: 'me',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setChatInput('');
  };

  // Manage interest tags
  const addInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = interestInput.trim().toLowerCase().replace(/,/g, '');
      if (val && !interests.includes(val)) {
        setInterests([...interests, val]);
      }
      setInterestInput('');
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter(i => i !== tag));
  };

  return (
    <div style={{ height: 'calc(100vh - var(--nav-height))', display: 'flex', background: '#030712', color: '#FFFFFF', overflow: 'hidden', position: 'relative' }}>
      
      {/* Top Banner (Overlaid) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: 'var(--space-4)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(3,7,18,0.9), rgba(3,7,18,0))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="status-pulse-green"></span>
          <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-tight)' }}>COMPANIO MEET</h2>
        </div>
        {status === 'matched' && (
          <button className="btn btn-primary glow-text" style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }} onClick={skipMatch}>
            Skip [Space] &rarr;
          </button>
        )}
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#020617', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* SETUP SCREEN */}
        {status === 'idle' && (
          <div className="glass-panel" style={{ maxWidth: 460, width: '90%', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', zIndex: 20, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 56, marginBottom: 'var(--space-4)' }}>🌍</div>
            <h1 className="glow-text" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Live Connection Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
              Instantly match with random friends worldwide. Filters verify location matching and mutual interests.
            </p>

            {/* Country Selector */}
            <div style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>MATCH REGION</label>
              <select className="select" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-md)' }} value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#111827' }}>{c}</option>)}
              </select>
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <button 
                className={`btn ${matchMode === 'video' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-md)', padding: '10px 0' }}
                onClick={() => setMatchMode('video')}
              >📹 Video Call</button>
              <button 
                className={`btn ${matchMode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-md)', padding: '10px 0' }}
                onClick={() => setMatchMode('voice')}
              >🔊 Voice Call</button>
            </div>

            {/* Interests Input */}
            <div style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>MUTUAL INTERESTS</label>
              <input 
                type="text"
                placeholder="Type interest & press Enter..." 
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addInterest}
                className="input"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '12px' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--space-2)' }}>
                {interests.map(tag => (
                  <span key={tag} className="companion-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(79,70,229,0.15)', color: 'var(--color-primary-light)' }} onClick={() => removeInterest(tag)}>
                    #{tag} <span style={{ opacity: 0.6 }}>&times;</span>
                  </span>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg hover-lift" style={{ borderRadius: 'var(--radius-lg)' }} onClick={startSearching}>
              Start Matchmaking
            </button>
          </div>
        )}

        {/* SEARCHING ANIMATION */}
        {status === 'searching' && (
          <div style={{ zIndex: 20, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="radar-ring" style={{ animationDelay: '0s' }}></div>
              <div className="radar-ring" style={{ animationDelay: '0.8s' }}></div>
              <div className="radar-ring" style={{ animationDelay: '1.6s' }}></div>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: 'var(--shadow-glow)', zIndex: 5 }}>🔍</div>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: '6px' }}>Scanning Connection Nodes...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
              Looking for users in <span style={{ color: 'white', fontWeight: 600 }}>{country}</span> {interests.length > 0 && `sharing #${interests.join(', #')}`}
            </p>
            <button className="btn btn-secondary btn-sm" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)' }} onClick={cancelSearch}>
              Cancel Search
            </button>
          </div>
        )}

        {/* ACTIVE WEBRTC VIDEO ELEMENT */}
        {status === 'matched' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#000' }}>
            {matchMode === 'video' && remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', background: 'radial-gradient(circle, #1e1b4b 0%, #030712 100%)' }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, border: '1px solid rgba(255,255,255,0.1)' }}>🔊</div>
                <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Voice Match Active</h4>
                <p style={{ color: 'var(--text-secondary)' }}>You are connected via high-fidelity audio channel</p>
              </div>
            )}
            
            {/* Remote audio loopback container */}
            <video ref={remoteVideoRef} autoPlay playsInline style={{ display: matchMode === 'voice' ? 'none' : 'none' }} />
          </div>
        )}

        {/* Local Stream PIP (Draggable Frame mock) */}
        {localStream && status === 'matched' && (
          <div className="pip-video-window" style={{ background: '#111827', pointerEvents: 'none' }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* BOTTOM VIDEO CONTROLS PANEL */}
        {status === 'matched' && (
          <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 20, display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn glass-panel" style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', padding: 0 }} onClick={toggleMute} title={isMuted ? 'Unmute microphone' : 'Mute microphone'}>
              {isMuted ? '🎙️' : '🎤'}
            </button>
            {matchMode === 'video' && (
              <button className="btn glass-panel" style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', padding: 0 }} onClick={toggleVideo} title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}>
                {isVideoOff ? '❌📹' : '📹'}
              </button>
            )}
            <button className="btn glass-panel" style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', padding: 0 }} onClick={() => setChatOpen(!chatOpen)} title="Toggle Side Chat">
              💬
            </button>
            <button className="btn btn-danger" style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', padding: 0 }} onClick={() => endMatch(true)} title="Disconnect matching">
              🛑
            </button>
          </div>
        )}
      </div>

      {/* TEXT CHAT SIDEBAR PANEL OVERLAY */}
      {status === 'matched' && chatOpen && (
        <div className="glass-panel" style={{ width: 330, borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 15, position: 'relative' }}>
          
          {/* Chat Header */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Companion Live Chat</h3>
            <button style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setChatOpen(false)}>&times;</button>
          </div>

          {/* Messages Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.sender === 'me' ? 'flex-end' : (msg.sender === 'system' ? 'center' : 'flex-start'), maxWidth: '85%' }}>
                {msg.sender === 'system' ? (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-light)', background: 'rgba(79,70,229,0.08)', padding: '4px 12px', borderRadius: 'var(--radius-full)', textAlign: 'center' }}>
                    {msg.text}
                  </span>
                ) : (
                  <>
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: 'var(--radius-md)', 
                      fontSize: 'var(--font-size-sm)',
                      background: msg.sender === 'me' ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                      color: 'white',
                      borderBottomRightRadius: msg.sender === 'me' ? 0 : 'var(--radius-md)',
                      borderBottomLeftRadius: msg.sender === 'partner' ? 0 : 'var(--radius-md)'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', alignSelf: 'flex-end', marginTop: 2 }}>{msg.time}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={sendChatMessage} style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Type message..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="input"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', padding: '10px 14px', fontSize: 'var(--font-size-sm)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', borderRadius: 'var(--radius-full)' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
