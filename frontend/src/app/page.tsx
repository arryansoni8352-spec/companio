'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('companio_token');
    if (token) {
      router.replace('/home');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 50%, #0c1020 0%, #030712 100%)', padding: 'var(--space-6)', textAlign: 'center' }}>
      
      <div className="glass-panel" style={{ maxWidth: 460, width: '100%', padding: 'var(--space-10) var(--space-8)', borderRadius: 'var(--radius-2xl)', animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* Glowing Brand Title */}
        <h1 className="glow-text" style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 'var(--space-2)' }}>
          COMPANIO
        </h1>
        
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto var(--space-8)', lineHeight: 1.6 }}>
          Discover verified rental companions, match in real-time, and customize personal AI friends.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 280, margin: '0 auto var(--space-8)' }}>
          <button
            className="btn btn-lg btn-primary hover-lift"
            onClick={() => router.push('/login')}
            style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
          >
            Enter Portal
          </button>
          <button
            className="btn btn-lg btn-secondary hover-lift"
            onClick={() => router.push('/login')}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Create Account
          </button>
        </div>

        {/* Feature Blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--space-6)', color: 'var(--text-secondary)', fontSize: '11px' }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: '4px' }}>🛡️</div>
            <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>Verified Users</strong>
            <span>Trusted profiles</span>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: '4px' }}>🌎</div>
            <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>Live Connections</strong>
            <span>Real-time matching</span>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: '4px' }}>🤖</div>
            <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>Custom AI</strong>
            <span>Voice calling</span>
          </div>
        </div>

      </div>

    </div>
  );
}
