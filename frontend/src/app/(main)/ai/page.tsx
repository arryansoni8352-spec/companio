'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { API_URL } from '@/lib/api';

const DEFAULT_AVATARS = ['🤖', '🦄', '🦁', '🦊', '🐱', '🐼', '🐨', '🐙', '👾', '🧠', '✨', '💝'];

function resolveAvatar(avatar: string | undefined | null): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads')) {
    const backendBase = API_URL.replace(/\/api\/?$/, '');
    return `${backendBase}${avatar}`;
  }
  return null;
}

export default function AICompanionsPage() {
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Friend');
  const [avatar, setAvatar] = useState('🤖');
  const [personality, setPersonality] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadCompanions(); }, []);

  const loadCompanions = async () => {
    setLoading(true);
    try { const data = await api.getAICompanions(); setCompanions(data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      await api.createAICompanion({
        name: name.trim(), avatar,
        shortDesc: shortDesc.trim() || personality.trim(),
        personality: personality.trim(),
        systemPrompt: systemPrompt.trim() || `You are ${name}, a friendly AI companion.`,
        category,
      });
      setShowCreateModal(false);
      setName(''); setPersonality(''); setSystemPrompt(''); setShortDesc('');
      loadCompanions();
    } catch (err: any) { alert(err.message || 'Failed to create AI friend.'); }
    finally { setCreating(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-6) 0' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)',
      }}>
        <div>
          <h1 className="glow-text" style={{
            fontSize: 'var(--font-size-3xl)', fontWeight: 800,
            letterSpacing: '-0.03em', marginBottom: 'var(--space-1)',
          }}>AI Companions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-relaxed)' }}>
            Create custom AI friends or chat with virtual hosts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create Friend
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="skeleton skeleton-circle" style={{ width: 72, height: 72 }} />
              <div className="skeleton skeleton-title" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : companions.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
          {companions.map((ai: any, idx: number) => (
            <div key={ai.id} className="card card-interactive" style={{
              padding: 'var(--space-6)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', height: '100%',
              animation: `staggerFadeIn 0.4s ease ${idx * 0.06}s both`,
            }}>
              {/* Avatar */}
              <div className="ai-avatar-ring" style={{ width: 72, height: 72, marginBottom: 'var(--space-3)' }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: '2.5px solid var(--bg-primary)',
                  background: 'var(--gradient-cool)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden',
                  position: 'relative',
                }}>
                  {resolveAvatar(ai.avatar) ? (
                    <img src={resolveAvatar(ai.avatar)!} alt={ai.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (ai.avatar || '🤖')}
                  {ai.isPremium && (
                    <div style={{
                      position: 'absolute', top: -2, right: -2,
                      background: 'var(--gradient-warm)', fontSize: 8,
                      padding: '2px 6px', color: 'white', fontWeight: 800,
                      borderRadius: 'var(--radius-full)',
                    }}>PRO</div>
                  )}
                </div>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                {ai.name}
              </h3>
              <span className="badge badge-primary" style={{ marginBottom: 'var(--space-3)' }}>
                {ai.category || 'Virtual Friend'}
              </span>
              <p className="line-clamp-3" style={{
                fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
                lineHeight: 'var(--line-height-relaxed)', flex: 1,
                marginBottom: 'var(--space-4)',
              }}>
                {ai.shortDesc || ai.personality || 'Ready to chat, connect, and help!'}
              </p>

              <Link href={`/ai/chat/${ai.id}`} className="btn btn-primary btn-full" style={{ marginTop: 'auto' }}>
                Chat with {ai.name}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{
          border: '1.5px dashed var(--border-medium)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div className="empty-state-icon">🤖</div>
          <h3 className="empty-state-title">No AI friends yet</h3>
          <p className="empty-state-desc">Create your first custom AI companion to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>Build AI Persona</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create AI Friend</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateAI}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" required className="input" placeholder="e.g. Luna, Sage, Leo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label>Category</label>
                    <select className="select" style={{ width: '100%' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Friend">Friend</option>
                      <option value="Life Coach">Life Coach</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Study Assistant">Study Assistant</option>
                      <option value="Creative Partner">Creative Partner</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Avatar</label>
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 4,
                      background: 'var(--bg-input)', padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-light)',
                    }}>
                      {DEFAULT_AVATARS.map((av) => (
                        <span key={av} style={{
                          fontSize: 18, cursor: 'pointer', padding: 3,
                          borderRadius: 'var(--radius-sm)',
                          border: avatar === av ? '2px solid var(--color-primary)' : '2px solid transparent',
                          transition: 'all 100ms ease',
                        }} onClick={() => setAvatar(av)}>{av}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input type="file" accept="image/*" id="avatar-upload" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try { const res = await api.uploadFile(file, 'avatars'); setAvatar(res.url); }
                      catch (err: any) { alert('Upload failed: ' + err.message); }
                    }}
                  />
                  <label htmlFor="avatar-upload" className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    📷 Upload Photo
                  </label>
                  {resolveAvatar(avatar) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <img src={resolveAvatar(avatar)!} alt="Avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>✓</span>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Tagline</label>
                  <input type="text" className="input" placeholder="Short description..." value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Personality</label>
                  <textarea className="input" rows={2} placeholder="Traits, style, interests..." value={personality} onChange={(e) => setPersonality(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>System Prompt (Advanced)</label>
                  <textarea className="input" rows={3} placeholder="Detailed behavior instructions..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!name.trim() || creating}>
                  {creating ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : 'Create Companion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
