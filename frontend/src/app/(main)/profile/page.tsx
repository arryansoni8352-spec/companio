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
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', website: '', location: '', themeColor: '#6E56CF' });

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
        themeColor: me.profile?.themeColor || '#6E56CF',
      });
      const userPosts = await api.getUserPosts(me.username);
      setPosts(userPosts);
    } catch {}
  };

  const handleSave = async () => {
    try {
      await api.updateProfile(editForm);
      setEditing(false);
      loadProfile();
    } catch {}
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 614, margin: '0 auto' }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div style={{ width: 128, height: 128, borderRadius: '50%', background: user.profile?.themeColor ? `linear-gradient(135deg, ${user.profile.themeColor}, #333)` : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 48, boxShadow: user.profile?.themeColor ? `0 4px 20px ${user.profile.themeColor}40` : 'none' }}>
            {user.profile?.displayName?.[0] || user.username[0].toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <div className="profile-username" style={{ color: user.profile?.themeColor || 'inherit' }}>
            {user.username}
            {user.verified && <span className="badge badge-verified" style={{ fontSize: 11 }}>✓ Verified</span>}
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{posts.length}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user._count?.followers || 0}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user._count?.following || 0}</div>
              <div className="profile-stat-label">Following</div>
            </div>
          </div>
          {!editing ? (
            <>
              <div className="profile-bio">
                {user.profile?.displayName && <div className="display-name">{user.profile.displayName}</div>}
                {user.profile?.bio && <div>{user.profile.bio}</div>}
                {user.profile?.website && <a href={user.profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link)', fontWeight: 600 }}>{user.profile.website}</a>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ flex: 1 }}>Edit Profile</button>
                <button className="btn btn-secondary btn-sm" onClick={() => router.push('/settings')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <input className="input" placeholder="Display name" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} style={{ marginBottom: 'var(--space-2)' }} />
              <textarea className="input" placeholder="Bio" rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} style={{ marginBottom: 'var(--space-2)' }} />
              <input className="input" placeholder="Website" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} style={{ marginBottom: 'var(--space-2)' }} />
              <input className="input" placeholder="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} style={{ marginBottom: 'var(--space-2)' }} />
              <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Profile Color:</label>
                <input type="color" value={editForm.themeColor} onChange={(e) => setEditForm({ ...editForm, themeColor: e.target.value })} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ flex: 1 }}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ justifyContent: 'center' }}>
        <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          &nbsp;Posts
        </button>
        <button className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/></svg>
          &nbsp;Saved
        </button>
      </div>

      {/* Posts Grid */}
      <div className="profile-grid">
        {posts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 48 }}>📷</div>
            <p className="empty-state-title">No posts yet</p>
            <p className="empty-state-desc">Share your first post!</p>
            <button className="btn btn-primary" onClick={() => router.push('/create')}>Create Post</button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="profile-grid-item">
              <div style={{ width: '100%', height: '100%', background: `hsl(${Math.random() * 360}, 50%, 80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.type === 'text' ? (
                  <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-xs)', overflow: 'hidden', textAlign: 'center' }}>{post.content?.substring(0, 60)}</div>
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
