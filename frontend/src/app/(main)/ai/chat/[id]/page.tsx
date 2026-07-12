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

  // Voice
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadConversation();
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) { setInput(text); handleSpeechSubmit(text); }
        };
        recognitionRef.current = rec;
      }
    }
    return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel(); };
  }, [aiId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const data = await api.getAIConversation(aiId);
      setAi(data.aiCompanion);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const speakAloud = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const sanitized = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(sanitized);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes('en-') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female')));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechSubmit = async (speechText: string) => {
    if (!speechText.trim() || sending) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: speechText, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    scrollToBottom();
    try {
      const aiResponse = await api.sendAIMessage(aiId, speechText);
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();
      speakAloud(aiResponse.content);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    scrollToBottom();
    try {
      const aiResponse = await api.sendAIMessage(aiId, text);
      setMessages(prev => [...prev, aiResponse]);
      scrollToBottom();
      if (voiceActive) speakAloud(aiResponse.content);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech recognition not supported.'); return; }
    isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
  };

  const toggleVoiceMode = () => {
    const next = !voiceActive;
    setVoiceActive(next);
    if (!next) window.speechSynthesis.cancel();
    else speakAloud(`Voice activated for ${ai?.name || 'AI Friend'}.`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
        <div className="ai-avatar-ring" style={{ width: 56, height: 56 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2.5px solid var(--bg-primary)' }} />
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Loading conversation...</p>
      </div>
    );
  }

  const suggestions = [
    `Tell me about yourself, ${ai?.name || 'AI'}`,
    'What can you help me with?',
    'Let\'s have a fun conversation',
    'Give me advice on something',
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      maxWidth: 860, margin: '0 auto',
      position: 'relative',
    }}>
      {/* ─── Chat Header ─── */}
      <div style={{
        padding: 'var(--space-3_5) var(--space-5)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--glass-bg-heavy)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/ai" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            transition: 'all 150ms ease',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>

          <div className="ai-avatar-ring" style={{ width: 40, height: 40 }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              border: '2px solid var(--bg-primary)',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, overflow: 'hidden',
            }}>
              {resolveAvatar(ai?.avatar) ? (
                <img src={resolveAvatar(ai?.avatar)!} alt={ai?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (ai?.avatar || '🤖')}
            </div>
          </div>

          <div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
              {ai?.name || 'AI Friend'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="status-pulse-green" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>Online</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <button
            className={`btn btn-sm ${voiceActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)' }}
            onClick={toggleVoiceMode}
          >
            {voiceActive ? '🔊 Voice On' : '🔇 Voice'}
          </button>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 'var(--space-5)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      }}>
        {/* Empty State + Suggestions */}
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: 'var(--space-8) 0',
          }}>
            <div className="ai-avatar-ring" style={{ width: 72, height: 72, marginBottom: 'var(--space-5)' }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                border: '3px solid var(--bg-primary)',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, overflow: 'hidden',
              }}>
                {resolveAvatar(ai?.avatar) ? (
                  <img src={resolveAvatar(ai?.avatar)!} alt={ai?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (ai?.avatar || '🤖')}
              </div>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
              Say hello to {ai?.name}!
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: 300, marginBottom: 'var(--space-6)', lineHeight: 'var(--line-height-relaxed)' }}>
              {ai?.shortDesc || 'Start a conversation — ask anything, share thoughts, or just chat.'}
            </p>

            {/* Suggestion Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', maxWidth: 400 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); }}
                  style={{
                    padding: 'var(--space-2) var(--space-3_5)',
                    background: 'var(--color-primary-alpha-05)',
                    border: '1px solid var(--color-primary-alpha-15)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--color-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 'var(--space-2)', marginTop: 2,
                overflow: 'hidden',
              }}>
                {resolveAvatar(ai?.avatar) ? (
                  <img src={resolveAvatar(ai?.avatar)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (ai?.avatar || '🤖')}
              </div>
            )}
            <div style={{
              maxWidth: '72%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-2xl)',
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-normal)',
              ...(msg.role === 'user' ? {
                background: 'var(--gradient-primary)',
                color: 'white',
                borderBottomRightRadius: 'var(--radius-sm)',
                boxShadow: '0 1px 3px rgba(99, 102, 241, 0.25)',
              } : {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderBottomLeftRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }),
            }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
              <span style={{
                fontSize: 'var(--font-size-2xs)', opacity: 0.5,
                marginTop: 'var(--space-1)', display: 'block', textAlign: 'right',
              }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>
              {ai?.avatar || '🤖'}
            </div>
            <div className="ai-typing-indicator">
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Bar ─── */}
      <div style={{
        padding: 'var(--space-3_5) var(--space-5)',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--glass-bg-heavy)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 10,
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {recognitionRef.current && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start speaking'}
              style={{
                width: 42, height: 42, borderRadius: '50%', padding: 0, flexShrink: 0,
                background: isListening ? 'var(--color-error)' : 'var(--bg-tertiary)',
                border: isListening ? 'none' : '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, cursor: 'pointer',
                transition: 'all 200ms ease',
                animation: isListening ? 'gentlePulse 1.5s infinite' : 'none',
              }}
            >
              {isListening ? '🛑' : '🎙️'}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : `Message ${ai?.name || 'AI'}...`}
            disabled={sending || isListening}
            style={{
              flex: 1, padding: 'var(--space-2_5) var(--space-4)',
              minHeight: 42,
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-base)',
              transition: 'all 150ms ease',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: '50%', padding: 0, flexShrink: 0,
              background: input.trim() ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: input.trim() ? 1 : 0.4,
              transition: 'all 200ms ease',
              boxShadow: input.trim() ? '0 1px 3px rgba(99, 102, 241, 0.3)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
