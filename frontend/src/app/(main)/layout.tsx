'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

/* ─── SVG Icon Components ─── */
const Icons = {
  home: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
    </svg>
  ),
  ai: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
      <circle cx="8" cy="11" r="1.2" fill={active ? 'currentColor' : 'none'} />
      <circle cx="16" cy="11" r="1.2" fill={active ? 'currentColor' : 'none'} />
      <path d="M9 16c2 1.5 4 1.5 6 0" />
    </svg>
  ),
  meet: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  messages: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  companio: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  communities: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  family: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  profile: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  moon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  sun: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  create: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('companio_theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      router.replace('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('companio_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadUser();
  }, [loadUser, router]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('companio_theme', next);
  };

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo" style={{ animation: 'gentlePulse 2s ease infinite' }}>C</div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', fontWeight: 500, letterSpacing: 'var(--letter-spacing-wide)' }}>
          Loading...
        </p>
      </div>
    );
  }

  const navItems = [
    { path: '/home', label: 'Home', icon: Icons.home },
    { path: '/meet', label: 'Live', icon: Icons.meet },
    { path: '/ai', label: 'AI', icon: Icons.ai },
    { path: '/companio', label: 'Explore', icon: Icons.companio },
    { path: '/communities', label: 'Search', icon: Icons.communities },
    { path: '/messages', label: 'Chat', icon: Icons.messages },
    { path: '/family', label: 'Family', icon: Icons.family },
    { path: '/profile', label: 'Profile', icon: Icons.profile },
  ];

  /* Bottom bar shows fewer items on mobile */
  const mobileNavItems = [
    navItems[0], // Home
    navItems[2], // AI
    navItems[1], // Live
    navItems[5], // Chat
    navItems[7], // Profile
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div data-theme={theme}>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">C</div>
          <span className="sidebar-brand-text glow-text">COMPANIO</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
              title={item.label}
            >
              {item.icon(isActive(item.path))}
              <span className="sidebar-item-label">{item.label}</span>
            </button>
          ))}

          <div style={{ height: 1, background: 'var(--border-separator)', margin: 'var(--space-3) var(--space-2)' }} />

          <button
            className={`sidebar-item ${isActive('/create') ? 'active' : ''}`}
            onClick={() => router.push('/create')}
            title="Create"
          >
            {Icons.create()}
            <span className="sidebar-item-label">Create</span>
          </button>

          <button
            className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
            onClick={() => router.push('/settings')}
            title="Settings"
          >
            {Icons.settings()}
            <span className="sidebar-item-label">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={toggleTheme} title="Toggle theme" style={{ width: '100%' }}>
            {theme === 'light' ? Icons.moon() : Icons.sun()}
            <span className="sidebar-item-label">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button className="sidebar-item" onClick={handleLogout} title="Log out" style={{ width: '100%', color: 'var(--color-error)' }}>
            {Icons.logout()}
            <span className="sidebar-item-label">Log out</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <nav className="top-nav mobile-only">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 'var(--font-size-sm)'
          }}>C</div>
          <span className="glow-text" style={{
            fontSize: 'var(--font-size-lg)', fontWeight: 800,
            letterSpacing: 'var(--letter-spacing-tight)'
          }}>COMPANIO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <button className="btn-icon btn-ghost" onClick={() => router.push('/notifications')} title="Notifications">
            {Icons.bell()}
          </button>
          <button className="btn-icon btn-ghost" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? Icons.moon() : Icons.sun()}
          </button>
          <button className="btn-icon btn-ghost" onClick={handleLogout} title="Log out" style={{ color: 'var(--text-tertiary)' }}>
            {Icons.logout()}
          </button>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="app-layout app-with-sidebar">
        <div className="container page">
          {children}
        </div>
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="bottom-nav mobile-only">
        {mobileNavItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            {item.icon(isActive(item.path))}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
