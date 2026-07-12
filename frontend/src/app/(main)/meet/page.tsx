'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api, { getWsUrl } from '@/lib/api';

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

    socketRef.current = io(getWsUrl('/webrtc'), {
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
      const offer = peerRef.current.createOffer ? await peerRef.current.createOffer() : null;
      if (offer) {
        await peerRef.current.setLocalDescription(offer);
        socketRef.current?.emit('webrtc:offer', { targetUserId, offer, callId });
      }
    }
  };

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
    <div style={{
      height: 'calc(100vh - 80px)',
      display: 'flex',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative',
      margin: '0 calc(-1 * var(--space-5))',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--border-light)'
    }}>
      
      {/* Top Banner (Overlaid) */}
      <div className="glass-panel" style={{
        position: 'absolute', top: 0, left: 0, width: '100%',
        padding: 'var(--space-3) var(--space-5)', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="status-pulse-green" style={{ width: 8, height: 8 }}></span>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-tight)', color: 'var(--text-primary)' }}>Live Matching</h2>
        </div>
        {status === 'matched' && (
          <button className="btn btn-primary btn-sm" onClick={skipMatch}>
            Skip Connection &rarr;
          </button>
        )}
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', background: 'var(--bg-secondary)', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* SETUP SCREEN */}
        {status === 'idle' && (
          <div className="modal" style={{ position: 'relative', width: '90%', maxWidth: 440, display: 'block', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)', animation: 'fadeInScale 0.4s var(--ease-spring)' }}>
            <div className="modal-header" style={{ justifyContent: 'center', padding: 'var(--space-6) var(--space-6) var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white' }}>🌍</div>
                <h2 className="modal-title" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>Live Portal</h2>
              </div>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', textAlign: 'center', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
                Instantly connect with other members globally based on region filters and shared interests.
              </p>

              <div className="input-group">
                <label>Region Filter</label>
                <select className="select" style={{ width: '100%' }} value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Interests</label>
                <input 
                  type="text"
                  placeholder="Type tag & press Enter..." 
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={addInterest}
                  className="input"
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'var(--space-2)' }}>
                  {interests.map(tag => (
                    <span key={tag} className="companion-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => removeInterest(tag)}>
                      #{tag} <span style={{ opacity: 0.6 }}>&times;</span>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  className={`btn ${matchMode === 'video' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMatchMode('video')}
                >📹 Video Call</button>
                <button 
                  className={`btn ${matchMode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMatchMode('voice')}
                >🔊 Voice Call</button>
              </div>

              <button className="btn btn-primary btn-full btn-lg hover-lift" style={{ marginTop: 'var(--space-2)' }} onClick={startSearching}>
                Start Matching
              </button>
            </div>
          </div>
        )}

        {/* SEARCHING ANIMATION */}
        {status === 'searching' && (
          <div style={{ zIndex: 20, textAlign: 'center', padding: 'var(--space-6)' }}>
            <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="radar-ring" style={{ animationDelay: '0s' }}></div>
              <div className="radar-ring" style={{ animationDelay: '0.8s' }}></div>
              <div className="radar-ring" style={{ animationDelay: '1.6s' }}></div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, zIndex: 5, color: 'white', boxShadow: 'var(--shadow-glow-primary)' }}>🔍</div>
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: '6px' }}>Searching Nodes...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
              Looking for companions in <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{country}</span> {interests.length > 0 && `sharing #${interests.join(', #')}`}
            </p>
            <button className="btn btn-secondary btn-sm" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)' }} onClick={cancelSearch}>
              Cancel Search
            </button>
          </div>
        )}

        {/* ACTIVE CALL VIEW */}
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
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', background: 'radial-gradient(circle, var(--color-primary-alpha-20) 0%, #000 100%)' }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '1px solid rgba(255,255,255,0.1)' }}>🔊</div>
                <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'white' }}>Voice Session Connected</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-size-sm)' }}>High-fidelity audio channel is active</p>
              </div>
            )}
            
            <video ref={remoteVideoRef} autoPlay playsInline style={{ display: 'none' }} />
          </div>
        )}

        {/* Local Stream PIP */}
        {localStream && status === 'matched' && (
          <div className="pip-video-window" style={{ background: '#1C1C1E', borderRadius: 'var(--radius-xl)' }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* FaceTime-style bottom floating panel controls */}
        {status === 'matched' && (
          <div className="glass-panel" style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, display: 'flex', gap: 'var(--space-2)', padding: '6px var(--space-3)',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button className="btn-icon btn-ghost btn-sm" onClick={toggleMute} title={isMuted ? 'Unmute microphone' : 'Mute microphone'} style={{ background: isMuted ? 'var(--color-error)' : 'rgba(255,255,255,0.06)', color: 'white' }}>
              {isMuted ? '🔇' : '🎙️'}
            </button>
            {matchMode === 'video' && (
              <button className="btn-icon btn-ghost btn-sm" onClick={toggleVideo} title={isVideoOff ? 'Turn camera on' : 'Turn camera off'} style={{ background: isVideoOff ? 'var(--color-error)' : 'rgba(255,255,255,0.06)', color: 'white' }}>
                {isVideoOff ? '📷 Off' : '📷'}
              </button>
            )}
            <button className="btn-icon btn-ghost btn-sm" onClick={() => setChatOpen(!chatOpen)} title="Toggle Chat" style={{ background: chatOpen ? 'var(--color-primary-alpha-15)' : 'rgba(255,255,255,0.06)', color: 'white' }}>
              💬
            </button>
            <button className="btn btn-danger btn-sm" style={{ minHeight: 'unset', width: 36, height: 36, padding: 0 }} onClick={() => endMatch(true)} title="Disconnect">
              🛑
            </button>
          </div>
        )}
      </div>

      {/* TEXT CHAT SIDEBAR */}
      {status === 'matched' && chatOpen && (
        <div className="glass-panel" style={{
          width: 320, borderLeft: '1px solid var(--border-light)',
          display: 'flex', flexDirection: 'column', height: '100%', zIndex: 15,
          background: 'var(--bg-primary)'
        }}>
          
          {/* Header */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Call Chat</h3>
            <button className="btn-ghost" style={{ fontSize: 20, cursor: 'pointer', padding: 0 }} onClick={() => setChatOpen(false)}>&times;</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column',
                alignSelf: msg.sender === 'me' ? 'flex-end' : (msg.sender === 'system' ? 'center' : 'flex-start'),
                maxWidth: '85%'
              }}>
                {msg.sender === 'system' ? (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', background: 'var(--color-primary-alpha-10)', padding: '4px 12px', borderRadius: 'var(--radius-full)', textAlign: 'center' }}>
                    {msg.text}
                  </span>
                ) : (
                  <>
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: 'var(--font-size-sm)',
                      background: msg.sender === 'me' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                      color: msg.sender === 'me' ? 'white' : 'var(--text-primary)',
                      borderBottomRightRadius: msg.sender === 'me' ? 0 : 'var(--radius-lg)',
                      borderBottomLeftRadius: msg.sender === 'partner' ? 0 : 'var(--radius-lg)',
                      border: msg.sender === 'me' ? 'none' : '1px solid var(--border-light)'
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

          {/* Input Form */}
          <form onSubmit={sendChatMessage} style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Send message..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="input"
              style={{ padding: '10px 14px', fontSize: 'var(--font-size-sm)', minHeight: 'unset', height: 38, borderRadius: 'var(--radius-full)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', minHeight: 'unset', height: 38, borderRadius: 'var(--radius-full)' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
