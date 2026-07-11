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
      // Auto-load discoveries regardless of profile, but let's make it smooth
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
      // Ensure we display verified providers and filter correctly
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
      // Redirect to bookings list
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
    <div style={{ maxWidth: 850, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      
      {/* Premium Header Banner */}
      <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', background: 'radial-gradient(circle, var(--color-primary-alpha) 0%, transparent 80%)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-4)' }}>
        <h1 className="glow-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: 'var(--letter-spacing-tight)' }}>
          Companionship Board
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-md)', marginTop: 'var(--space-2)' }}>
          Rent verified friends, mentors, and partners. Schedule meaningful sessions hourly.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'discover', label: 'Discover' },
          { id: 'matches', label: 'Compatibility Matches' },
          { id: 'bookings', label: 'My Bookings Dashboard' },
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
            style={{ flex: 1, padding: '16px 0', fontWeight: 600, borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none', color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DISCOVER MARKETPLACE PANEL */}
      {activeTab === 'discover' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Category Chips Scrollbar */}
          <div style={{ overflowX: 'auto', display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2) 0 var(--space-4) 0', scrollbarWidth: 'none' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="companion-card" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 72, height: 72 }} />
                  <div className="skeleton skeleton-title" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                </div>
              ))}
            </div>
          ) : discoveries.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) 0', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: 54, marginBottom: 'var(--space-3)' }}>🔎</div>
              <h3 className="empty-state-title" style={{ fontWeight: 700 }}>No Companions Registered</h3>
              <p className="empty-state-desc">Be the first to list yourself by setting up your profile in the tab!</p>
              <button className="btn btn-primary mt-4" onClick={() => setActiveTab('profile')}>Create Listing</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {discoveries.map((item, idx) => {
                const displayName = item.profile?.user?.profile?.displayName || item.profile?.user?.username || item.user?.profile?.displayName || item.user?.username || 'Companion';
                const firstChar = displayName[0]?.toUpperCase() || '?';
                const rate = item.profile?.hourlyRate !== undefined ? item.profile.hourlyRate : item.hourlyRate;
                const currency = item.profile?.currency || item.currency || 'USD';
                const interestsList = item.profile?.interests || item.interests || [];

                return (
                  <div key={idx} className="companion-card hover-lift" style={{ border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    
                    {/* Upper card section */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24, boxShadow: 'var(--shadow-sm)' }}>
                          {firstChar}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-verified-glow" style={{ fontSize: 10, borderRadius: 'var(--radius-sm)' }}>
                            {rate ? `$${rate}/${currency === 'USD' ? 'hr' : currency.toLowerCase()}` : 'Free'}
                          </span>
                        </div>
                      </div>

                      <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                        {displayName}
                        {item.profile?.isVerifiedProvider && <span title="Verified Host" style={{ fontSize: 14 }}>🛡️</span>}
                      </h3>
                      
                      <div className="compatibility-score" style={{ display: 'inline-flex', margin: '6px 0' }}>
                        <span>{item.compatibility?.score || 85}% Compatible Match</span>
                      </div>

                      <p className="companion-intro" style={{ textAlign: 'left', margin: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.profile?.introduction || item.introduction || 'Hi! Let\'s hang out, talk, network, study, or learn together. Reach out anytime!'}
                      </p>
                    </div>

                    {/* Lower tags and action buttons */}
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <div className="companion-interests" style={{ marginBottom: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: '4px', height: 28, overflow: 'hidden' }}>
                        {interestsList.slice(0, 3).map((tag: string, j: number) => (
                          <span key={j} className="companion-tag" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 10 }}>#{tag}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button 
                          className="btn btn-primary btn-sm flex-1"
                          onClick={() => { setTargetCompanion(item); setBookDate(new Date().toISOString().split('T')[0]); setShowBookModal(true); }}
                        >Book Now</button>
                        <button 
                          className="btn btn-secondary btn-sm flex-1"
                          onClick={() => { setProfileViewCompanion(item); setShowProfileModal(true); }}
                        >Profile Details</button>
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
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {matches.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) 0' }}>
              <div style={{ fontSize: 54 }}>🤝</div>
              <p className="empty-state-title" style={{ fontWeight: 700 }}>No Compatible Matches Calculated</p>
              <p className="empty-state-desc">Matches will generate automatically as more users fill out companion profiles.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {matches.map((match, idx) => (
                <div key={idx} className="card hover-lift" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: 'var(--space-4)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>
                      {(match.user?.displayName?.[0] || match.user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{match.user?.displayName || match.user?.username}</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {match.score}% Score Compatibility Match · Interest Category: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{match.category || 'Shared Interests'}</span>
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
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}><span className="spinner" style={{ margin: '0 auto' }}></span></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) 0' }}>
              <div style={{ fontSize: 54 }}>📅</div>
              <p className="empty-state-title" style={{ fontWeight: 700 }}>No Active Sessions Slotted</p>
              <p className="empty-state-desc">Your booked hourly companionship sessions will report status updates here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {bookings.map((booking, idx) => {
                const isBooker = booking.userId === me?.id;
                const partnerName = isBooker
                  ? booking.companion?.user?.profile?.displayName || booking.companion?.user?.username || 'Provider'
                  : booking.user?.profile?.displayName || booking.user?.username || 'Client';
                const rate = booking.companion?.hourlyRate || 0;
                
                let statusBadgeColor = 'badge-primary';
                if (booking.status === 'confirmed' || booking.status === 'accepted') statusBadgeColor = 'badge-success';
                if (booking.status === 'cancelled' || booking.status === 'declined') statusBadgeColor = 'badge-error';
                if (booking.status === 'pending') statusBadgeColor = 'badge-warning';

                return (
                  <div key={idx} className="card" style={{ borderLeft: `4px solid var(--color-${booking.status === 'confirmed' ? 'success' : (booking.status === 'pending' ? 'warning' : 'primary')})`, borderRadius: 'var(--radius-lg)' }}>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {isBooker ? 'OUTGOING BOOKING REQUEST' : 'INCOMING HOURLY ASSIGNMENT'}
                          </span>
                          <h4 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', marginTop: '2px' }}>
                            {isBooker ? 'Booked' : 'Assigned to'}: <span style={{ color: 'var(--color-primary)' }}>{partnerName}</span>
                          </h4>
                        </div>
                        <span className={`badge ${statusBadgeColor}`} style={{ textTransform: 'uppercase', padding: '4px 10px' }}>
                          {booking.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '12px 0', fontSize: 'var(--font-size-sm)' }}>
                        <div>📅 <strong>Date:</strong> {new Date(booking.startTime).toLocaleDateString()}</div>
                        <div>⏰ <strong>Hours:</strong> {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div>💰 <strong>Total Price:</strong> {booking.totalPrice ? `$${booking.totalPrice} USD` : 'Free'}</div>
                      </div>

                      {booking.notes && (
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          &ldquo;{booking.notes}&rdquo;
                        </p>
                      )}

                      {/* Action buttons depending on role */}
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                        {!isBooker && booking.status === 'pending' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>Accept & Confirmed</button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleUpdateStatus(booking.id, 'declined')}>Decline</button>
                          </>
                        )}
                        {isBooker && (booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>Cancel Booking</button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = `/meet`}>Join Match Session</button>
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
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <CompanionProfileEditor onSave={() => { setHasProfile(true); setActiveTab('discover'); loadDiscoveries(); }} />
        </div>
      )}

      {/* ==================================== MODAL DIALOGS ==================================== */}

      {/* HOURLY BOOKING MODAL */}
      {showBookModal && targetCompanion && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)' }}>
            
            <div className="modal-header">
              <h3 className="modal-title">Book Hourly Companionship</h3>
              <button style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowBookModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  You are scheduling a custom connecting session with <strong>{targetCompanion.profile?.user?.profile?.displayName || targetCompanion.profile?.user?.username || targetCompanion.user?.profile?.displayName || targetCompanion.user?.username}</strong>.
                </p>

                <div className="input-group">
                  <label>Session Date</label>
                  <input type="date" required className="input" value={bookDate} onChange={(e) => setBookDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label>Start Hour</label>
                    <input type="time" required className="input" value={bookStart} onChange={(e) => setBookStart(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>End Hour</label>
                    <input type="time" required className="input" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Session Notes / Topics to Discuss</label>
                  <textarea className="input" rows={3} placeholder="Study help, fitness training, general networking conversation..." value={bookNotes} onChange={(e) => setBookNotes(e.target.value)}></textarea>
                </div>

                {/* Live pricing calc block */}
                {bookingSummary.hours > 0 && (
                  <div className="glass-panel" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>Duration: <strong>{bookingSummary.hours.toFixed(1)} hrs</strong></span>
                    <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-primary)', fontWeight: 700 }}>Total: ${bookingSummary.price.toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={bookingSummary.hours <= 0 || bookSubmitting}>
                  {bookSubmitting ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'white' }}></span> : 'Submit Booking'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FULL COMPANION PROFILE DETAILS VIEW MODAL */}
      {showProfileModal && profileViewCompanion && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', maxWidth: 550 }}>
            
            <div className="modal-header">
              <h3 className="modal-title">Companion Profile Details</h3>
              <button style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24 }}>
                  {(profileViewCompanion.profile?.user?.profile?.displayName?.[0] || profileViewCompanion.profile?.user?.username?.[0] || 'C').toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>
                    {profileViewCompanion.profile?.user?.profile?.displayName || profileViewCompanion.profile?.user?.username}
                  </h3>
                  <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    Rate: {profileViewCompanion.profile?.hourlyRate ? `$${profileViewCompanion.profile.hourlyRate}/hr` : 'Free'}
                  </p>
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>ABOUT ME</h5>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)', whiteSpace: 'pre-wrap' }}>
                  {profileViewCompanion.profile?.aboutMe || 'No details provided.'}
                </p>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>INTERESTS</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(profileViewCompanion.profile?.interests || []).map((tag: string, i: number) => (
                    <span key={i} className="companion-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              {profileViewCompanion.profile?.skills?.length > 0 && (
                <div>
                  <h5 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>SPECIALIZED SKILLS</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profileViewCompanion.profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="companion-tag" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--color-secondary)' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {profileViewCompanion.profile?.languages?.length > 0 && (
                <div>
                  <h5 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>LANGUAGES SPOKEN</h5>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>{profileViewCompanion.profile.languages.join(', ')}</p>
                </div>
              )}

              <div>
                <h5 style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>LOCATION REGION</h5>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                  📍 {profileViewCompanion.profile?.city || 'Worldwide'}, {profileViewCompanion.profile?.country || 'Global'}
                </p>
              </div>

            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Close</button>
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
    <div style={{ padding: 'var(--space-4)', maxWidth: 500, margin: '0 auto' }}>
      <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Companion profile listing</h3>

      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>Short Introduction Caption</label>
        <input className="input" placeholder="Hi! I'm looking to play games and study..." value={form.introduction} onChange={(e) => setForm({ ...form, introduction: e.target.value })} />
      </div>
      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>About Me / Bio</label>
        <textarea className="input" rows={3} placeholder="Introduce yourself in detail..." value={form.aboutMe} onChange={(e) => setForm({ ...form, aboutMe: e.target.value })} />
      </div>
      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>Interests (comma-separated)</label>
        <input className="input" placeholder="Photography, hiking, coding..." value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
      </div>
      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>Hobbies (comma-separated)</label>
        <input className="input" placeholder="Guitar, cooking, gardening..." value={form.hobbies} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} />
      </div>
      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>Skills (comma-separated)</label>
        <input className="input" placeholder="JavaScript, design, marketing..." value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
      </div>
      <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
        <label>Languages (comma-separated)</label>
        <input className="input" placeholder="English, Spanish, Japanese..." value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="input-group"><label>City</label><input className="input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div className="input-group"><label>Country</label><input className="input" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div className="input-group"><label>Hourly Rate ($)</label><input type="number" className="input" placeholder="0 for Free" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })} /></div>
        <div className="input-group"><label>Currency</label><input className="input" placeholder="USD" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
      </div>

      <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>List Me In Categories</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {CATEGORIES.map((cat) => (
          <button type="button" key={cat.id} className={`btn btn-sm ${form.categories.includes(cat.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleCategory(cat.id)}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-full btn-lg hover-lift" onClick={handleSave} disabled={saving}>
        {saving ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white' }}/> : 'Save Companion Listing'}
      </button>
    </div>
  );
}
