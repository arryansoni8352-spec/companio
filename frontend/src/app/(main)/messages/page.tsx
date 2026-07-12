'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try { const data = await api.getConversations(); setConversations(data); } catch {}
    setLoading(false);
  };

  const openChat = async (convId: string) => {
    setActiveChat(convId);
    try { const msgs = await api.getMessages(convId); setMessages(msgs); } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    try {
      const msg = await api.sendMessage(activeChat, { content: newMessage });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch {}
  };

  const activeConv = conversations.find((c) => c.id === activeChat);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 80px)',
      margin: '0 calc(-1 * var(--space-5))',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      border: '1px solid var(--border-light)',
      background: 'var(--bg-elevated)',
    }}>
      {/* ─── Conversation List ─── */}
      <div style={{
        width: activeChat ? '0' : '100%',
        maxWidth: 380,
        borderRight: '1px solid var(--border-light)',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-primary)',
      }} className={activeChat ? 'hidden' : ''} id="conversation-list">
        <div style={{
          padding: 'var(--space-5)',
          borderBottom: '1px solid var(--border-separator)',
        }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-tight)' }}>Messages</h2>
        </div>

        <div className="chat-list" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) 0' }}>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="chat-item">
                <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '70%', height: 10 }} />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">💬</div>
              <h3 className="empty-state-title">No messages yet</h3>
              <p className="empty-state-desc">Start a conversation with someone!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id}
                className={`chat-item ${activeChat === conv.id ? 'active' : ''}`}
                onClick={() => openChat(conv.id)}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--gradient-cool)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0,
                }}>
                  {conv.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-name">{conv.name}</div>
                  <div className="chat-item-preview">{conv.lastMessage?.content || 'No messages'}</div>
                </div>
                {conv.lastMessage && <div className="chat-item-time">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</div>}
                {conv.unreadCount > 0 && <div className="chat-item-unread">{conv.unreadCount}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Chat View ─── */}
      {activeChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-3_5) var(--space-5)',
            borderBottom: '1px solid var(--border-separator)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            background: 'var(--glass-bg-heavy)',
            backdropFilter: 'blur(24px)',
          }}>
            <button className="btn-icon btn-ghost btn-sm" onClick={() => setActiveChat(null)} style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--gradient-cool)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 15,
            }}>
              {activeConv?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{activeConv?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="status-pulse-green" style={{ width: 6, height: 6 }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>Online</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button className="btn-icon btn-ghost" title="Voice Call" style={{ fontSize: 18 }}>📞</button>
              <button className="btn-icon btn-ghost" title="Video Call" style={{ fontSize: 18 }}>📹</button>
            </div>
          </div>

          {/* Messages */}
          <div className="message-container" style={{ flex: 1 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.sender?.id === activeConv?.members?.[0]?.id ? 'message-received' : 'message-sent'}`}>
                {msg.content}
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', gap: 'var(--space-2)' }}>
                <div style={{ fontSize: 40 }}>👋</div>
                <p style={{ fontWeight: 500 }}>Say hello!</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              style={{
                width: 40, height: 40, borderRadius: '50%', padding: 0,
                background: newMessage.trim() ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'default',
                opacity: newMessage.trim() ? 1 : 0.4,
                transition: 'all 200ms ease',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="desktop-only">
          <div style={{ textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ margin: '0 auto var(--space-4)' }}>💬</div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Your Messages</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
