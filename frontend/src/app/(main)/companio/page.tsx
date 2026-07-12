'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

const CATEGORIES = [
  { id: 'friend', emoji: '🤝', label: 'Friend' },
  { id: 'study_partner', emoji: '📚', label: 'Study Partner' },
  { id: 'language_partner', emoji: '🌍', label: 'Language Partner' },
  { id: 'gaming_partner', emoji: '🎮', label: 'Gaming Partner' },
  { id: 'mentor', emoji: '🎯', label: 'Mentor' },
  { id: 'accountability_partner', emoji: '✅', label: 'Accountability' },
  { id: 'travel_companion', emoji: '✈️', label: 'Travel Companion' },
  { id: 'local_guide', emoji: '📍', label: 'Local Guide' },
  { id: 'fitness_partner', emoji: '💪', label: 'Fitness Partner' },
  { id: 'walking_partner', emoji: '🚶', label: 'Walking Partner' },
  { id: 'business_networking', emoji: '💼', label: 'Networking' },
  { id: 'creative_collaborator', emoji: '🎨', label: 'Creative Collab' },
  { id: 'book_club_partner', emoji: '📖', label: 'Book Club' },
  { id: 'hobby_partner', emoji: '🎸', label: 'Hobby Partner' },
  { id: 'event_companion', emoji: '🎉', label: 'Event Companion' },
  { id: 'emotional_support', emoji: '💚', label: 'Support Partner' },
  { id: 'volunteer_partner', emoji: '🌱', label: 'Volunteer Partner' },
];

export default function CompanioPage() {
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Data lists
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [me, setMe] = useState<any>(null);

  // Booking Modal Form
  const [showBookModal, setShowBookModal] = useState(false);
  const [targetCompanion, setTargetCompanion] = useState<any>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookStart, setBookStart] = useState('09:00');
  const [bookEnd, setBookEnd] = useState('10:00');
  const [bookNotes, setBookNotes] = useState('');
  const [bookSubmitting, setBookSubmitting] = useState(false);

  // Companion Profile Modal View
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileViewCompanion, setProfileViewCompanion] = useState<any>(null);

  useEffect(() => {
    checkProfile();
    loadMe();
  }, []);

  const loadMe = async () => {
    try {
      const user = await api.getMe();
      setMe(user);
    } catch {}
  };

  const checkProfile = async () => {
    try {
      const profile = await api.getCompanioProfile();
      setHasProfile(!!profile);
      loadDiscoveries();
    } catch { 
      setHasProfile(false); 
      loadDiscoveries();
    }
  };

  const loadDiscoveries = async (category?: string) => {
    setLoading(true);
    try {
      const data = await api.discoverCompanions(category ? { category } : {});
      setDiscoveries(data || []);
    } catch {}
    setLoading(false);
  };

  const loadMatches = async () => {
    try { 
      const data = await api.getMatches(); 
      setMatches(data || []); 
    } catch {}
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data || []);
    } catch {}
    setLoading(false);
  };

  // Perform scheduling submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !targetCompanion || bookSubmitting) return;

    setBookSubmitting(true);
    try {
      const startTime = new Date(`${bookDate}T${bookStart}:00`).toISOString();
      const endTime = new Date(`${bookDate}T${bookEnd}:00`).toISOString();

      await api.bookCompanion({
        companionId: targetCompanion.profile?.id || targetCompanion.id,
        startTime,
        endTime,
        notes: bookNotes
      });

      setShowBookModal(false);
      setBookNotes('');
      setActiveTab('bookings');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to submit booking request.');
    } finally {
      setBookSubmitting(false);
    }
  };

  // Accept/Decline actions for bookings
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  // Calculate pricing preview helper
  const getBookingDurationAndPrice = () => {
    if (!bookDate || !targetCompanion) return { hours: 0, price: 0 };
    const t1 = new Date(`${bookDate}T${bookStart}:00`).getTime();
    const t2 = new Date(`${bookDate}T${bookEnd}:00`).getTime();
    if (t2 <= t1) return { hours: 0, price: 0 };
    
    const hours = (t2 - t1) / (1000 * 60 * 60);
    const rate = targetCompanion.profile?.hourlyRate || targetCompanion.hourlyRate || 0;
    return { hours, price: hours * rate };
  };

  const bookingSummary = getBookingDurationAndPrice();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-6) 0' }}>
      
      {/* Premium Header Banner */}
      <div className="glass-panel" style={{
        padding: 'var(--space-8) var(--space-6)',
        textAlign: 'center',
        background: 'var(--gradient-primary-subtle)',
        borderRadius: 'var(--radius-2xl)',
        marginBottom: 'var(--space-6)',
        border: '1px solid var(--color-primary-alpha-15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating background orb */}
        <div style={{
          position: 'absolute', width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-primary-alpha-20) 0%, transparent 70%)',
          top: '-20px', right: '-20px', filter: 'blur(30px)'
        }} />
        <h1 className="glow-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: 'var(--letter-spacing-tight)', marginBottom: 'var(--space-2)' }}>
          Companionship Board
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', maxWidth: 500, margin: '0 auto' }}>
          Connect with verified friends, mentors, and language partners for custom hourly sessions.
        </p>
      </div>

      {/* Navigation Tabs - Segmented Control */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'discover', label: 'Discover' },
          { id: 'matches', label: 'Matches' },
          { id: 'bookings', label: 'My Bookings' },
          { id: 'profile', label: 'Become a Companion' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => { 
              setActiveTab(tab.id); 
              if (tab.id === 'matches') loadMatches();
              if (tab.id === 'bookings') loadBookings();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DISCOVER MARKETPLACE PANEL */}
      {activeTab === 'discover' && (
        <div style={{ animation: 'fadeIn 0.3s var(--ease-out)' }}>
          {/* Category Chips Scrollbar */}
          <div style={{ overflowX: 'auto', display: 'flex', gap: 'var(--space-2)', padding: '0 0 var(--space-5) 0', scrollbarWidth: 'none' }}>
            <button
              className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setSelectedCategory(null); loadDiscoveries(); }}
              style={{ borderRadius: 'var(--radius-full)' }}
            >All Categories</button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
                onClick={() => { setSelectedCategory(cat.id); loadDiscoveries(cat.id); }}
              >{cat.emoji} {cat.label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 64, height: 64 }} />
                  <div className="skeleton skeleton-title" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                </div>
              ))}
            </div>
          ) : discoveries.length === 0 ? (
            <div className="empty-state" style={{ border: '1.5px dashed var(--border-medium)', borderRadius: 'var(--radius-2xl)' }}>
              <div className="empty-state-icon">🔎</div>
              <h3 className="empty-state-title">No companions found</h3>
              <p className="empty-state-desc">List yourself as a companion to get started!</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('profile')}>Become a Companion</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {discoveries.map((item, idx) => {
                const displayName = item.profile?.user?.profile?.displayName || item.profile?.user?.username || item.user?.profile?.displayName || item.user?.username || 'Companion';
                const firstChar = displayName[0]?.toUpperCase() || '?';
                const rate = item.profile?.hourlyRate !== undefined ? item.profile.hourlyRate : item.hourlyRate;
                const interestsList = item.profile?.interests || item.interests || [];

                return (
                  <div key={idx} className="companion-card hover-lift" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-5)' }}>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                        <div className="avatar-ring" style={{ padding: 2.5 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-cool)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20, border: '2px solid var(--bg-primary)' }}>
                            {firstChar}
                          </div>
                        </div>
                        <span className="badge badge-primary">
                          {rate ? `$${rate}/hr` : 'Free'}
                        </span>
                      </div>

                      <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                        {displayName}
                        {item.profile?.isVerifiedProvider && <span title="Verified Host">🛡️</span>}
                      </h3>
                      
                      <div className="compatibility-score" style={{ fontSize: 'var(--font-size-2xs)', padding: '2px 8px', marginBottom: 'var(--space-3)' }}>
                        <span>{item.compatibility?.score || 85}% Match</span>
                      </div>

                      <p className="line-clamp-3" style={{ textAlign: 'left', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-3)' }}>
                        {item.profile?.introduction || item.introduction || 'Hi! Let\'s hang out, network, study, or learn together. Reach out anytime!'}
                      </p>
                    </div>

                    <div>
                      <div className="companion-interests" style={{ marginBottom: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: '4px', height: 26, overflow: 'hidden' }}>
                        {interestsList.slice(0, 3).map((tag: string, j: number) => (
                          <span key={j} className="companion-tag" style={{ fontSize: '10px' }}>#{tag}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ flex: 1 }}
                          onClick={() => { setTargetCompanion(item); setBookDate(new Date().toISOString().split('T')[0]); setShowBookModal(true); }}
                        >Book</button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => { setProfileViewCompanion(item); setShowProfileModal(true); }}
                        >Details</button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COMPATIBILITY MATCHES PANEL */}
      {activeTab === 'matches' && (
        <div style={{ animation: 'fadeIn 0.3s var(--ease-out)' }}>
          {matches.length === 0 ? (
            <div className="empty-state" style={{ border: '1.5px dashed var(--border-medium)', borderRadius: 'var(--radius-2xl)' }}>
              <div className="empty-state-icon">🤝</div>
              <h3 className="empty-state-title">No compatible matches</h3>
              <p className="empty-state-desc">Matches will appear automatically as more users fill out companion profiles.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {matches.map((match, idx) => (
                <div key={idx} className="card hover-lift">
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="avatar-ring" style={{ padding: 2 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-cool)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, border: '2px solid var(--bg-primary)' }}>
                          {(match.user?.displayName?.[0] || match.user?.username?.[0] || 'U').toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{match.user?.displayName || match.user?.username}</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {match.score}% Compatibility · <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{match.category || 'Shared Interests'}</span>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => window.location.href = `/messages`}>Direct Message</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY BOOKINGS DASHBOARD PANEL */}
      {activeTab === 'bookings' && (
        <div style={{ animation: 'fadeIn 0.3s var(--ease-out)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><span className="spinner"></span></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state" style={{ border: '1.5px dashed var(--border-medium)', borderRadius: 'var(--radius-2xl)' }}>
              <div className="empty-state-icon">📅</div>
              <h3 className="empty-state-title">No bookings yet</h3>
              <p className="empty-state-desc">Your active and pending scheduled hourly sessions will be listed here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {bookings.map((booking, idx) => {
                const isBooker = booking.userId === me?.id;
                const partnerName = isBooker
                  ? booking.companion?.user?.profile?.displayName || booking.companion?.user?.username || 'Provider'
                  : booking.user?.profile?.displayName || booking.user?.username || 'Client';
                
                let statusBadgeColor = 'badge-primary';
                if (booking.status === 'confirmed' || booking.status === 'accepted') statusBadgeColor = 'badge-success';
                if (booking.status === 'cancelled' || booking.status === 'declined') statusBadgeColor = 'badge-error';
                if (booking.status === 'pending') statusBadgeColor = 'badge-warning';

                return (
                  <div key={idx} className="card" style={{ borderLeft: `4px solid var(--color-${booking.status === 'confirmed' ? 'success' : (booking.status === 'pending' ? 'warning' : 'primary')})` }}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        <div>
                          <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 'var(--letter-spacing-wide)', textTransform: 'uppercase' }}>
                            {isBooker ? 'OUTGOING BOOKING REQUEST' : 'INCOMING HOURLY ASSIGNMENT'}
                          </span>
                          <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                            {isBooker ? 'Booked' : 'Assigned to'}: <span style={{ color: 'var(--color-primary)' }}>{partnerName}</span>
                          </h4>
                        </div>
                        <span className={`badge ${statusBadgeColor}`} style={{ textTransform: 'uppercase' }}>
                          {booking.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '12px 0', fontSize: 'var(--font-size-sm)' }}>
                        <div>📅 <strong>Date:</strong> {new Date(booking.startTime).toLocaleDateString()}</div>
                        <div>⏰ <strong>Time:</strong> {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div>💰 <strong>Total Price:</strong> {booking.totalPrice ? `$${booking.totalPrice} USD` : 'Free'}</div>
                      </div>

                      {booking.notes && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: 'var(--space-2_5) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        {!isBooker && booking.status === 'pending' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>Accept</button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleUpdateStatus(booking.id, 'declined')}>Decline</button>
                          </>
                        )}
                        {isBooker && (booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>Cancel</button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = `/meet`}>Join Call</button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BECOME A COMPANION (PROFILE EDIT) */}
      {activeTab === 'profile' && (
        <div style={{ animation: 'fadeIn 0.3s var(--ease-out)' }}>
          <CompanionProfileEditor onSave={() => { setHasProfile(true); setActiveTab('discover'); loadDiscoveries(); }} />
        </div>
      )}

      {/* ==================================== MODAL DIALOGS ==================================== */}

      {/* HOURLY BOOKING MODAL */}
      {showBookModal && targetCompanion && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3 className="modal-title">Book Session</h3>
              <button className="modal-close" onClick={() => setShowBookModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                  Schedule a custom companionship session with <strong>{targetCompanion.profile?.user?.profile?.displayName || targetCompanion.profile?.user?.username || targetCompanion.user?.profile?.displayName || targetCompanion.user?.username}</strong>.
                </p>

                <div className="input-group">
                  <label>Session Date</label>
                  <input type="date" required className="input" value={bookDate} onChange={(e) => setBookDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label>Start Time</label>
                    <input type="time" required className="input" value={bookStart} onChange={(e) => setBookStart(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>End Time</label>
                    <input type="time" required className="input" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Session Notes / Topics</label>
                  <textarea className="input" rows={3} placeholder="Describe what you'd like to discuss or do..." value={bookNotes} onChange={(e) => setBookNotes(e.target.value)}></textarea>
                </div>

                {bookingSummary.hours > 0 && (
                  <div className="glass-panel" style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>Duration: <strong>{bookingSummary.hours.toFixed(1)} hrs</strong></span>
                    <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-primary)', fontWeight: 700 }}>Total: ${bookingSummary.price.toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={bookingSummary.hours <= 0 || bookSubmitting}>
                  {bookSubmitting ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }}></span> : 'Submit Request'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FULL COMPANION PROFILE DETAILS VIEW MODAL */}
      {showProfileModal && profileViewCompanion && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3 className="modal-title">Companion Details</h3>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4_5)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className="avatar-ring" style={{ padding: 3 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient-cool)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24, border: '2.5px solid var(--bg-primary)' }}>
                    {(profileViewCompanion.profile?.user?.profile?.displayName?.[0] || profileViewCompanion.profile?.user?.username?.[0] || 'C').toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
                    {profileViewCompanion.profile?.user?.profile?.displayName || profileViewCompanion.profile?.user?.username}
                  </h3>
                  <span className="badge badge-primary" style={{ marginTop: '2px' }}>
                    Rate: {profileViewCompanion.profile?.hourlyRate ? `$${profileViewCompanion.profile.hourlyRate}/hr` : 'Free'}
                  </span>
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1_5)' }}>About Me</h5>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {profileViewCompanion.profile?.aboutMe || 'No details provided.'}
                </p>
              </div>

              <div>
                <h5 style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1_5)' }}>Interests</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(profileViewCompanion.profile?.interests || []).map((tag: string, i: number) => (
                    <span key={i} className="companion-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              {profileViewCompanion.profile?.skills?.length > 0 && (
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1_5)' }}>Specialized Skills</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profileViewCompanion.profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="companion-tag" style={{ background: 'var(--color-primary-alpha-10)', color: 'var(--color-primary)' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {profileViewCompanion.profile?.languages?.length > 0 && (
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1_5)' }}>Languages</h5>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{profileViewCompanion.profile.languages.join(', ')}</p>
                </div>
              )}

              <div>
                <h5 style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-1_5)' }}>Location</h5>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  📍 {profileViewCompanion.profile?.city || 'Worldwide'}, {profileViewCompanion.profile?.country || 'Global'}
                </p>
              </div>

            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowProfileModal(false)}>Close</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => { setShowProfileModal(false); setTargetCompanion(profileViewCompanion); setBookDate(new Date().toISOString().split('T')[0]); setShowBookModal(true); }}
              >Book Session</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function CompanionProfileEditor({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    introduction: '', aboutMe: '', interests: '', hobbies: '', skills: '',
    languages: '', city: '', country: '', categories: [] as string[],
    hourlyRate: 0, currency: 'USD',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCompanioProfile().then((p) => {
      if (p) setForm({
        introduction: p.introduction || '', aboutMe: p.aboutMe || '',
        interests: (p.interests || []).join(', '), hobbies: (p.hobbies || []).join(', '),
        skills: (p.skills || []).join(', '), languages: (p.languages || []).join(', '),
        city: p.city || '', country: p.country || '',
        categories: p.categories?.map((c: any) => c.category) || [],
        hourlyRate: p.hourlyRate || 0, currency: p.currency || 'USD',
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCompanioProfile({
        introduction: form.introduction, aboutMe: form.aboutMe,
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        hobbies: form.hobbies.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        city: form.city, country: form.country, categories: form.categories,
        hourlyRate: form.hourlyRate, currency: form.currency,
      });
      onSave();
    } catch {}
    setSaving(false);
  };

  const toggleCategory = (id: string) => {
    setForm({ ...form, categories: form.categories.includes(id) ? form.categories.filter((c) => c !== id) : [...form.categories, id] });
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-5)' }}>Companion profile listing</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="input-group">
          <label>Short Introduction Caption</label>
          <input className="input" placeholder="Hi! I'm looking to play games and study..." value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} />
        </div>
        <div className="input-group">
          <label>About Me / Bio</label>
          <textarea className="input" rows={3} placeholder="Introduce yourself in detail..." value={form.aboutMe} onChange={(e) => setForm({ ...form, aboutMe: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Interests (comma-separated)</label>
          <input className="input" placeholder="Photography, hiking, coding..." value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Hobbies (comma-separated)</label>
          <input className="input" placeholder="Guitar, cooking, gardening..." value={form.hobbies} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Skills (comma-separated)</label>
          <input className="input" placeholder="JavaScript, design, marketing..." value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Languages (comma-separated)</label>
          <input className="input" placeholder="English, Spanish, Japanese..." value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="input-group"><label>City</label><input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="input-group"><label>Country</label><input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="input-group"><label>Hourly Rate ($)</label><input type="number" className="input" placeholder="0 for Free" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })} /></div>
          <div className="input-group"><label>Currency</label><input className="input" placeholder="USD" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>List Me In Categories</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {CATEGORIES.map((cat) => (
              <button type="button" key={cat.id} className={`btn btn-sm ${form.categories.includes(cat.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleCategory(cat.id)}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg hover-lift" style={{ marginTop: 'var(--space-3)' }} onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }}/> : 'Save Companion Listing'}
        </button>
      </div>
    </div>
  );
}
