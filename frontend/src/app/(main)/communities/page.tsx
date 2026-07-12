'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<any[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'mine'>('discover');
  
  // Create Community Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [newCommunityCategory, setNewCommunityCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        api.getCommunities(),
        api.getMyCommunities()
      ]);
      setCommunities(all || []);
      setMyCommunities(mine || []);
    } catch (err) {
      console.error('Failed to load communities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;
    
    try {
      await api.createCommunity({
        name: newCommunityName.trim(),
        description: newCommunityDescription.trim(),
        category: newCommunityCategory || 'General',
        privacy: 'public'
      });
      setShowCreateModal(false);
      setNewCommunityName('');
      setNewCommunityDescription('');
      setNewCommunityCategory('');
      loadData();
    } catch (err) {
      console.error('Failed to create community', err);
      alert('Failed to create community');
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await api.joinCommunity(id);
      loadData();
    } catch (err) {
      console.error('Failed to join', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  const displayedCommunities = activeTab === 'discover' ? communities : myCommunities;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-6) 0' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)'
      }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
            Communities
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
            Find your tribe and connect with like-minded people.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create Community
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button 
          className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
        <button 
          className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          My Communities
        </button>
      </div>

      {/* Grid Content */}
      {displayedCommunities.length === 0 ? (
        <div className="empty-state" style={{ border: '1.5px dashed var(--border-medium)', borderRadius: 'var(--radius-2xl)' }}>
          <div className="empty-state-icon">🌐</div>
          <h3 className="empty-state-title">No communities found</h3>
          <p className="empty-state-desc">
            {activeTab === 'mine' ? "You haven't joined any communities yet." : "There are no communities available to join right now."}
          </p>
          {activeTab === 'mine' && (
            <button className="btn btn-primary" onClick={() => setActiveTab('discover')}>
              Discover Communities
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
          {displayedCommunities.map((c, idx) => {
            const isMember = myCommunities.some(mc => mc.id === c.id);
            return (
              <div key={c.id} className="community-card hover-lift" style={{
                animation: `staggerFadeIn 0.4s ease ${idx * 0.05}s both`,
                display: 'flex', flexDirection: 'column', height: '100%'
              }}>
                <div className="community-cover">
                  {/* Category tag */}
                  <span className="badge badge-primary" style={{ position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', color: 'var(--color-primary)' }}>
                    {c.category || 'General'}
                  </span>
                  {/* Member count */}
                  <span className="badge" style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', background: 'rgba(0,0,0,0.4)', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                    👤 {c._count?.members || 0}
                  </span>
                </div>
                <div className="community-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="community-name" style={{ color: 'var(--text-primary)' }}>{c.name}</h3>
                    <p className="line-clamp-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-4)' }}>
                      {c.description || 'No description provided for this community. Join to find out more!'}
                    </p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-3)', marginTop: 'auto' }}>
                    {isMember ? (
                      <button 
                        onClick={() => router.push(`/communities/${c.id}`)}
                        className="btn btn-secondary btn-sm btn-full"
                      >
                        View Community
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoin(c.id)}
                        className="btn btn-primary btn-sm btn-full"
                      >
                        Join Tribe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Community</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Community Name</label>
                  <input 
                    type="text" 
                    value={newCommunityName}
                    onChange={e => setNewCommunityName(e.target.value)}
                    className="input"
                    placeholder="e.g. Digital Nomads London"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Category</label>
                  <select 
                    value={newCommunityCategory}
                    onChange={e => setNewCommunityCategory(e.target.value)}
                    className="select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a category</option>
                    <option value="Tech">Technology</option>
                    <option value="Travel">Travel & Adventure</option>
                    <option value="Fitness">Health & Fitness</option>
                    <option value="Creative">Arts & Creativity</option>
                    <option value="Gaming">Gaming</option>
                    <option value="General">General Interest</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea 
                    value={newCommunityDescription}
                    onChange={e => setNewCommunityDescription(e.target.value)}
                    className="input"
                    rows={4}
                    placeholder="What is this community about?"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newCommunityName.trim()}
                  className="btn btn-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
