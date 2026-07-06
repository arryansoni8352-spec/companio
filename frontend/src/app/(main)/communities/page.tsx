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
      setCommunities(all);
      setMyCommunities(mine);
    } catch (err) {
      console.error('Failed to load communities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName) return;
    
    try {
      await api.createCommunity({
        name: newCommunityName,
        description: newCommunityDescription,
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
      loadData(); // Refresh list to show joined status
    } catch (err) {
      console.error('Failed to join', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Communities...</div>;
  }

  const displayedCommunities = activeTab === 'discover' ? communities : myCommunities;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">Communities</h1>
          <p className="text-gray-500 mt-2">Find your tribe and connect with like-minded people.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          + Create Community
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button 
          className={`pb-2 font-medium transition-colors ${activeTab === 'discover' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
        <button 
          className={`pb-2 font-medium transition-colors ${activeTab === 'mine' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('mine')}
        >
          My Communities
        </button>
      </div>

      {/* Grid */}
      {displayedCommunities.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No communities found</h3>
          <p className="text-gray-500">
            {activeTab === 'mine' ? "You haven't joined any communities yet." : "There are no communities available to join right now."}
          </p>
          {activeTab === 'mine' && (
            <button 
              onClick={() => setActiveTab('discover')}
              className="mt-4 text-purple-600 font-medium hover:underline"
            >
              Discover Communities
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCommunities.map((c) => {
            const isMember = myCommunities.some(mc => mc.id === c.id);
            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                      {c.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                      {c._count?.members || 0}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 line-clamp-1">{c.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {c.description || 'No description provided for this community. Join to find out more!'}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  {isMember ? (
                    <button 
                      onClick={() => router.push(`/communities/${c.id}`)}
                      className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      View Community
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoin(c.id)}
                      className="w-full py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl transform scale-100 transition-transform">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Community</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Community Name</label>
                <input 
                  type="text" 
                  value={newCommunityName}
                  onChange={e => setNewCommunityName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Digital Nomads Bali"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  value={newCommunityCategory}
                  onChange={e => setNewCommunityCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  value={newCommunityDescription}
                  onChange={e => setNewCommunityDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
                  placeholder="What is this community about?"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newCommunityName}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
