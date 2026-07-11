'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.createPost({ type, content, visibility });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 614, margin: '0 auto', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Create Post</h2>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white' }}/> : 'Share'}
        </button>
      </div>

      {error && <div style={{ background: 'rgba(255,118,117,0.1)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'text', icon: '📝', label: 'Text' },
          { id: 'photo', icon: '📷', label: 'Photo' },
          { id: 'video', icon: '🎥', label: 'Video' },
        ].map((t) => (
          <button key={t.id} className={`btn ${type === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setType(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {type !== 'text' && (
        <div style={{ border: '2px dashed var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-10)', textAlign: 'center', marginBottom: 'var(--space-4)', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>{type === 'photo' ? '📷' : '🎥'}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Tap to add {type}</p>
        </div>
      )}

      <textarea
        className="input"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        style={{ resize: 'vertical', minHeight: 120 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Visibility:</span>
        <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option value="public">🌍 Public</option>
          <option value="followers">👥 Followers</option>
          <option value="friends">🤝 Friends</option>
          <option value="private">🔒 Private</option>
        </select>
      </div>
    </div>
  );
}
