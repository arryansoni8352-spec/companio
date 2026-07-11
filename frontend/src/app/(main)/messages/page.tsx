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
    <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height) - var(--bottom-nav-height))', margin: '0 calc(-1 * var(--space-4))' }}>
      {/* Conversation List */}
      <div style={{ width: activeChat ? '0' : '100%', maxWidth: 400, borderRight: '1px solid var(--border-light)', overflow: 'hidden', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column' }}
           className={activeChat ? 'hidden' : ''}
           id="conversation-list">
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Messages</h2>
        </div>
        <div className="chat-list" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            Array.from({length: 5}, (_, i) => (
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
              <div style={{ fontSize: 48 }}>💬</div>
              <p className="empty-state-title">No messages yet</p>
              <p className="empty-state-desc">Start a conversation with someone!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="chat-item" onClick={() => openChat(conv.id)} style={{ background: activeChat === conv.id ? 'var(--bg-secondary)' : undefined }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
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

      {/* Chat View */}
      {activeChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className="btn-ghost" onClick={() => setActiveChat(null)} style={{ padding: 4 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
              {activeConv?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{activeConv?.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>Online</div>
            </div>
            
            {/* Call Buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn-icon btn-ghost text-xl" title="Voice Call">
                📞
              </button>
              <button className="btn-icon btn-ghost text-xl" title="Video Call">
                📹
              </button>
            </div>
          </div>

          <div className="message-container" style={{ flex: 1 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.sender?.id === activeConv?.members?.[0]?.id ? 'message-received' : 'message-sent'}`}>
                {msg.content}
                <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
                <div style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>👋</div>
                <p>Say hello!</p>
              </div>
            )}
          </div>

          <div className="chat-input-bar">
            <button className="btn-icon btn-ghost" style={{ color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <input
              className="chat-input"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="btn-icon btn-ghost" style={{ color: 'var(--color-primary)' }} onClick={sendMessage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="desktop-nav">
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>💬</div>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Your Messages</h3>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
