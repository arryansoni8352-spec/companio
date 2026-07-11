'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { API_URL } from '@/lib/api';

function resolveAvatar(avatar: string | undefined | null): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads')) {
    const backendBase = API_URL.replace(/\/api\/?$/, '');
    return `${backendBase}${avatar}`;
  }
  return null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export default function AIChatPage() {
  const params = useParams();
  const router = useRouter();
  const aiId = params.id as string;
  
  const [ai, setAi] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API Voice Mode State
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize data and Speech Recognition
  useEffect(() => {
    loadConversation();

    // Check for webkitSpeechRecognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) {
            setInput(text);
            // Trigger automatic submit helper
            handleSpeechSubmit(text);
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [aiId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const data = await api.getAIConversation(aiId);
      setAi(data.aiCompanion);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load conversation history', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Speaks response aloud using Web Speech Synthesis
  const speakAloud = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Stop any current voice output first
    window.speechSynthesis.cancel();

    // Clean up text format slightly for speech engine
    const sanitized = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(sanitized);
    
    // Select warm voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Submit audio speech transcribed text
  const handleSpeechSubmit = async (speechText: string) => {
    if (!speechText.trim() || sending) return;
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: speechText, 
      createdAt: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    scrollToBottom();

    try {
      const aiResponse = await api.sendAIMessage(aiId, speechText);
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();
      speakAloud(aiResponse.content);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    
    const text = input;
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      createdAt: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    scrollToBottom();

    try {
      const aiResponse = await api.sendAIMessage(aiId, text);
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();
      
      // Auto speak response aloud if Voice Mode is active
      if (voiceActive) {
        speakAloud(aiResponse.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Trigger microphone capture
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser version.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const toggleVoiceMode = () => {
    const next = !voiceActive;
    setVoiceActive(next);
    if (!next) {
      window.speechSynthesis.cancel();
    } else {
      speakAloud(`Voice output activated for ${ai?.name || 'AI Friend'}. You can click the mic button to speak.`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - var(--nav-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-height))', maxWidth: 850, margin: '0 auto', background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', position: 'relative' }}>
      
      {/* AI Chat Header */}
      <div className="glass-panel" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/ai" style={{ fontSize: 20, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            &larr;
          </Link>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden', position: 'relative' }}>
            {resolveAvatar(ai?.avatar) ? (
              <img src={resolveAvatar(ai?.avatar)!} alt={ai?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              ai?.avatar || '🤖'
            )}
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>{ai?.name || 'AI Friend'}</h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-pulse-green" style={{ width: 6, height: 6 }}></span> Online Custom Friend
            </p>
          </div>
        </div>

        {/* Action Toggle buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className={`btn ${voiceActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={toggleVoiceMode}
          >
            {voiceActive ? '🔊 Voice Mode On' : '🔇 Mute Voice Output'}
          </button>
        </div>
      </div>

      {/* Messages Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', background: 'var(--bg-secondary)' }}>
        
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 56, marginBottom: 'var(--space-4)' }}>👋</div>
            <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>Say hello to {ai?.name}!</h4>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>
              Ask anything, ask for advice, or run a simulated voice conversation.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ 
              maxWidth: '75%', 
              padding: '12px 18px', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: 'var(--font-size-md)',
              lineHeight: 'var(--line-height-normal)',
              background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-elevated)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              boxShadow: msg.role === 'user' ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
              borderBottomRightRadius: msg.role === 'user' ? 0 : 'var(--radius-lg)',
              borderBottomLeftRadius: msg.role === 'assistant' ? 0 : 'var(--radius-lg)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)'
            }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <span style={{ fontSize: 9, opacity: 0.6, marginTop: 4, display: 'block', textAlign: 'right' }}>
                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderBottomLeftRadius: 0 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 1 }}></span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls layout */}
      <div className="glass-panel" style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-light)', zIndex: 10 }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {recognitionRef.current && (
            <button 
              type="button" 
              className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
              style={{ width: 44, height: 44, borderRadius: '50%', padding: 0 }}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start speech input'}
            >
              {isListening ? '🛑' : '🎙️'}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening. Speak clearly now...' : `Message ${ai?.name || 'AI Companion'}...`}
            className="input"
            style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '12px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            disabled={sending || isListening}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending} 
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0 24px' }}
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
