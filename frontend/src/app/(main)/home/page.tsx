'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [feedType, setFeedType] = useState('following');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFeed(); loadStories(); }, [feedType]);

  const loadFeed = async () => {
    try { const data = await api.getFeed(feedType); setPosts(data); } catch {}
    setLoading(false);
  };

  const loadStories = async () => {
    try { const data = await api.getStories(); setStories(data); } catch {}
  };

  const handleLike = async (postId: string, index: number) => {
    try {
      const result = await api.likePost(postId);
      setPosts(posts.map((p, i) => i === index ? { ...p, isLiked: result.liked, likesCount: p.likesCount + (result.liked ? 1 : -1) } : p));
    } catch {}
  };

  const handleSave = async (postId: string, index: number) => {
    try {
      const result = await api.savePost(postId);
      setPosts(posts.map((p, i) => i === index ? { ...p, isSaved: result.saved } : p));
    } catch {}
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      {/* Stories */}
      <div className="stories-bar" style={{ margin: '0 calc(-1 * var(--space-5))', borderBottom: '1px solid var(--border-separator)' }}>
        <div className="story-item">
          <div className="story-ring" style={{ background: 'var(--border-medium)', position: 'relative' }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              border: '3px solid var(--bg-primary)', background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'var(--color-primary)', fontWeight: 300,
            }}>+</div>
          </div>
          <span className="story-name">Your story</span>
        </div>
        {stories.map((group, i) => (
          <div key={i} className="story-item">
            <div className="story-ring">
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                border: '3px solid var(--bg-primary)',
                background: 'var(--gradient-cool)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 18,
              }}>
                {group.user?.profile?.displayName?.[0] || group.user?.username?.[0] || '?'}
              </div>
            </div>
            <span className="story-name">{group.user?.username}</span>
          </div>
        ))}
      </div>

      {/* Feed Selector — Segmented Control */}
      <div style={{ padding: 'var(--space-4) 0' }}>
        <div className="tabs">
          {['following', 'friends', 'public'].map((type) => (
            <button key={type} className={`tab ${feedType === type ? 'active' : ''}`} onClick={() => setFeedType(type)}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-3_5) var(--space-4)', gap: 'var(--space-3)' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 40, height: 40 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '25%', height: 10 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 0 }} />
                <div style={{ padding: 'var(--space-4)' }}>
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📷</div>
            <h3 className="empty-state-title">Welcome to COMPANIO</h3>
            <p className="empty-state-desc">Follow people to see their posts here, or share your first post!</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/create'}>Create Post</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {posts.map((post, index) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--gradient-cool)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 16,
                  }}>
                    {post.user?.profile?.displayName?.[0] || post.user?.username?.[0] || '?'}
                  </div>
                  <div className="post-user-info">
                    <div className="post-username">{post.user?.username}</div>
                    {post.user?.profile?.location && <div className="post-location">{post.user.profile.location}</div>}
                  </div>
                  <button className="btn-ghost" style={{ padding: 4, color: 'var(--text-tertiary)' }}>•••</button>
                </div>

                {post.media && post.media.length > 0 ? (
                  <div style={{
                    width: '100%', aspectRatio: '1',
                    background: 'var(--gradient-primary-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', fontSize: 64,
                  }}>📷</div>
                ) : (
                  <div style={{ padding: 'var(--space-6)', fontSize: 'var(--font-size-lg)', lineHeight: 'var(--line-height-relaxed)' }}>
                    {post.content}
                  </div>
                )}

                <div className="post-actions">
                  <button className={`post-action-btn ${post.isLiked ? 'liked' : ''}`} onClick={() => handleLike(post.id, index)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                  </button>
                  <button className="post-action-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                  </button>
                  <button className="post-action-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                  <button className={`post-action-btn post-save ${post.isSaved ? 'saved' : ''}`} onClick={() => handleSave(post.id, index)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={post.isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>
                  </button>
                </div>

                <div className="post-likes">{post._count?.likes || post.likesCount || 0} likes</div>
                {post.content && (
                  <div className="post-caption"><strong>{post.user?.username}</strong>{post.content}</div>
                )}
                {(post._count?.comments || 0) > 0 && (
                  <div className="post-comments-link">View all {post._count.comments} comments</div>
                )}
                <div className="post-time">{timeAgo(post.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
