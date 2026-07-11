'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('people');

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    try { const data = await api.searchUsers(q); setResults(data); } catch {}
  };

  return (
    <div style={{ maxWidth: 614, margin: '0 auto' }}>
      <div style={{ padding: 'var(--space-4)', position: 'sticky', top: 60, background: 'var(--bg-primary)', zIndex: 10 }}>
        <div className="search-bar">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="search-input" className="search-input" type="text" placeholder="Search people, communities, topics..." value={query} onChange={(e) => handleSearch(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        {['people', 'communities', 'topics'].map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {results.length > 0 ? (
        <div style={{ padding: 'var(--space-2)' }}>
          {results.map((user) => (
            <div key={user.id} className="chat-item" onClick={() => router.push(`/profile/${user.username}`)}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
                {user.profile?.displayName?.[0] || user.username[0].toUpperCase()}
              </div>
              <div className="chat-item-info">
                <div className="chat-item-name">{user.username}</div>
                <div className="chat-item-preview">{user.profile?.displayName || ''} {user.profile?.bio ? `· ${user.profile.bio.substring(0, 50)}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      ) : query.length === 0 ? (
        <div style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)' }}>Explore</h3>
          <div className="empty-state">
            <p className="empty-state-title">Start searching</p>
            <p className="empty-state-desc">Discover new friends and communities</p>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>🔍</div>
          <p className="empty-state-title">No results found</p>
          <p className="empty-state-desc">Try searching for a different term</p>
        </div>
      )}
    </div>
  );
}
