'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', website: '', location: '', themeColor: '#6366F1' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      setEditForm({
        displayName: me.profile?.displayName || '',
        bio: me.profile?.bio || '',
        website: me.profile?.website || '',
        location: me.profile?.location || '',
        themeColor: me.profile?.themeColor || '#6366F1',
      });
      const userPosts = await api.getUserPosts(me.username);
      setPosts(userPosts);
    } catch {}
  };

  const handleSave = async () => {
    try { await api.updateProfile(editForm); setEditing(false); loadProfile(); } catch {}
  };

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      {/* Profile Header */}
      <div style={{
        display: 'flex', gap: 'var(--space-8)', padding: 'var(--space-6) 0',
        alignItems: 'flex-start',
      }}>
        <div style={{ flexShrink: 0 }}>
          <div className="avatar-ring" style={{
            padding: 3,
            background: user.profile?.themeColor
              ? `linear-gradient(135deg, ${user.profile.themeColor}, var(--color-primary))`
              : 'var(--gradient-primary)',
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              border: '3px solid var(--bg-primary)',
              background: user.profile?.themeColor
                ? `linear-gradient(135deg, ${user.profile.themeColor}, ${user.profile.themeColor}88)`
                : 'var(--gradient-cool)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 'var(--font-size-4xl)',
              boxShadow: user.profile?.themeColor ? `0 4px 24px ${user.profile.themeColor}30` : 'none',
            }}>
              {user.profile?.displayName?.[0] || user.username[0].toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            marginBottom: 'var(--space-3)', flexWrap: 'wrap',
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-2xl)', fontWeight: 600,
              letterSpacing: 'var(--letter-spacing-tight)',
              color: user.profile?.themeColor || 'var(--text-primary)',
            }}>
              {user.username}
            </h2>
            {user.verified && <span className="badge badge-verified">✓ Verified</span>}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            {[
              { value: posts.length, label: 'Posts' },
              { value: user._count?.followers || 0, label: 'Followers' },
              { value: user._count?.following || 0, label: 'Following' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{stat.value}</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {!editing ? (
            <>
              <div style={{ marginBottom: 'var(--space-3)', lineHeight: 'var(--line-height-relaxed)' }}>
                {user.profile?.displayName && (
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.profile.displayName}</div>
                )}
                {user.profile?.bio && <div style={{ color: 'var(--text-secondary)' }}>{user.profile.bio}</div>}
                {user.profile?.website && (
                  <a href={user.profile.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--text-link)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    {user.profile.website}
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ flex: 1 }}>
                  Edit Profile
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => router.push('/settings')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2_5)' }}>
              <input className="input" placeholder="Display name" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
              <textarea className="input" placeholder="Bio" rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
              <input className="input" placeholder="Website" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
              <input className="input" placeholder="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Color:</label>
                <input type="color" value={editForm.themeColor} onChange={(e) => setEditForm({ ...editForm, themeColor: e.target.value })}
                  style={{ width: 36, height: 36, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ flex: 1 }}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ margin: 'var(--space-2) 0 var(--space-4)' }}>
        <div className="tabs-underline" style={{ justifyContent: 'center' }}>
          <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            &nbsp;Posts
          </button>
          <button className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>
            &nbsp;Saved
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="profile-grid">
        {posts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">📷</div>
            <h3 className="empty-state-title">No posts yet</h3>
            <p className="empty-state-desc">Share your first post!</p>
            <button className="btn btn-primary" onClick={() => router.push('/create')}>Create Post</button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="profile-grid-item">
              <div style={{
                width: '100%', height: '100%',
                background: 'var(--gradient-primary-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {post.type === 'text' ? (
                  <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-xs)', overflow: 'hidden', textAlign: 'center' }}>
                    {post.content?.substring(0, 60)}
                  </div>
                ) : '📷'}
              </div>
              <div className="grid-overlay">
                <span>❤️ {post._count?.likes || 0}</span>
                <span>💬 {post._count?.comments || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
