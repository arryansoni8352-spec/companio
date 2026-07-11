'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { API_URL } from '@/lib/api';

const DEFAULT_AVATARS = ['🤖', '🦄', '🦁', '🦊', '🐱', '🐼', '🐨', '🐙', '👾', '🧠', '✨', '💝'];

// Resolve avatar URL: absolute URLs pass through; relative /uploads/... paths get backend base prepended
function resolveAvatar(avatar: string | undefined | null): string | null {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/uploads')) {
    const backendBase = API_URL.replace(/\/api\/?$/, '');
    return `${backendBase}${avatar}`;
  }
  return null; // emoji — handled separately
}

export default function AICompanionsPage() {
  const [companions, setCompanions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom AI Modal Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Friend');
  const [avatar, setAvatar] = useState('🤖');
  const [personality, setPersonality] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCompanions();
  }, []);

  const loadCompanions = async () => {
    setLoading(true);
    try {
      const data = await api.getAICompanions();
      setCompanions(data || []);
    } catch (err) {
      console.error('Failed to load AI companions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    try {
      await api.createAICompanion({
        name: name.trim(),
        avatar,
        shortDesc: shortDesc.trim() || personality.trim(),
        personality: personality.trim(),
        systemPrompt: systemPrompt.trim() || `You are ${name}, a friendly AI companion.`,
        category
      });
      setShowCreateModal(false);
      setName('');
      setPersonality('');
      setSystemPrompt('');
      setShortDesc('');
      loadCompanions();
    } catch (err: any) {
      alert(err.message || 'Failed to construct custom AI Friend.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>AI Companions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>Customize your own personal AI friend or chat with official virtual hosts.</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={() => setShowCreateModal(true)}>
          + Create Custom Friend
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <span className="spinner"></span>
        </div>
      ) : companions.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-6)' }}>
          {companions.map((ai: any) => (
            <div key={ai.id} className="companion-card hover-lift" style={{ border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', textAlign: 'center', padding: 'var(--space-6)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 'var(--space-4)', overflow: 'hidden', position: 'relative' }}>
                  {resolveAvatar(ai.avatar) ? (
                    <img src={resolveAvatar(ai.avatar)!} alt={ai.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    ai.avatar || '🤖'
                  )}
                  {ai.isPremium && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-accent-light)', fontSize: 8, padding: '2px 6px', color: '#000', fontWeight: 800, borderRadius: 'var(--radius-sm)' }}>
                      PRO
                    </div>
                  )}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{ai.name}</h3>
                <span className="badge badge-primary" style={{ margin: '6px 0 var(--space-3)' }}>{ai.category || 'Virtual Friend'}</span>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-normal)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 60 }}>
                  {ai.shortDesc || ai.personality || 'I am ready to chat, connect, and help!'}
                </p>
              </div>

              <Link href={`/ai/chat/${ai.id}`} className="btn btn-primary btn-full mt-4" style={{ borderRadius: 'var(--radius-md)' }}>
                Chat with {ai.name}
              </Link>

            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 'var(--space-12) 0', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: 54, marginBottom: 'var(--space-3)' }}>🤖</div>
          <h3 className="empty-state-title" style={{ fontWeight: 700 }}>No AI Friends slatted</h3>
          <p className="empty-state-desc">You haven&apos;t created any customizable AI companions yet.</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreateModal(true)}>Build AI Persona</button>
        </div>
      )}

      {/* CREATE CUSTOM AI FRIEND MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)' }}>
            
            <div className="modal-header">
              <h3 className="modal-title">Customize Personal AI Friend</h3>
              <button style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateAI}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div className="input-group">
                  <label>AI Friend Name</label>
                  <input type="text" required className="input" placeholder="e.g. Luna, Sage, Leo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label>Category Group</label>
                    <select className="select" style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="Friend">Friend</option>
                      <option value="Life Coach">Life Coach</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Study Assistant">Study Assistant</option>
                      <option value="Creative Partner">Creative Partner</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Choose Avatar Emoji or Upload Picture</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '8px' }}>
                      {DEFAULT_AVATARS.map((av) => (
                        <span 
                          key={av} 
                          style={{ fontSize: 20, cursor: 'pointer', padding: '2px', border: avatar === av ? '2px solid var(--color-primary)' : '2px solid transparent', borderRadius: '4px' }}
                          onClick={() => setAvatar(av)}
                        >{av}</span>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="avatar-upload"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res = await api.uploadFile(file, 'avatars');
                            setAvatar(res.url);
                          } catch (err: any) {
                            alert('Upload failed: ' + err.message);
                          }
                        }}
                      />
                      <label 
                        htmlFor="avatar-upload" 
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: 'pointer', margin: 0 }}
                      >
                        📷 Upload Custom Picture
                      </label>
                      {resolveAvatar(avatar) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src={resolveAvatar(avatar)!} alt="Uploaded avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}>Uploaded!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Short Description (Tagline)</label>
                  <input type="text" className="input" placeholder="e.g. Empathic listener for daily updates" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Personality Traits / Role</label>
                  <textarea className="input" rows={2} placeholder="e.g. Empathetic, supportive, loves philosophy, speaks warmly." value={personality} onChange={(e) => setPersonality(e.target.value)}></textarea>
                </div>

                <div className="input-group">
                  <label>System Instructions (Advanced Prompt)</label>
                  <textarea className="input" rows={3} placeholder="Describe exactly how the AI should behave and what it knows. E.g. 'You are Luna. You always reply warmly, ask how the user feels, and provide gentle emotional advice...'" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}></textarea>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!name.trim() || creating}>
                  {creating ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white' }}></span> : 'Create Companion'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
