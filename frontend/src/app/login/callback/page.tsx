'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'google' | 'apple'>('google');
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const mock = searchParams.get('mock');
    const prov = searchParams.get('provider') as 'google' | 'apple';
    const err = searchParams.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      setLoading(false);
      return;
    }

    if (mock === 'true') {
      setIsMock(true);
      if (prov) setProvider(prov);
      setLoading(false);
      return;
    }

    if (accessToken && refreshToken) {
      api.setToken(accessToken);
      api.setRefreshToken(refreshToken);
      router.replace('/home');
    } else {
      setError('Invalid callback arguments');
      setLoading(false);
    }
  }, [searchParams, router]);

  const handleApproveMock = async () => {
    setLoading(true);
    try {
      await api.mockLogin(provider);
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Mock login failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Authenticating session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 380, width: '100%', padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>⚠️</div>
        <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Authentication Error</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)', lineHeight: 'var(--line-height-relaxed)' }}>
          {error}
        </p>
        <button className="btn btn-primary btn-full" onClick={() => router.push('/login')}>
          Back to Login
        </button>
      </div>
    );
  }

  if (isMock) {
    return (
      <div className="card hover-lift" style={{ maxWidth: 400, width: '100%', padding: 'var(--space-8)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: provider === 'google' ? '#4285F4' : '#000000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 24, margin: '0 auto var(--space-4)'
        }}>
          {provider === 'google' ? 'G' : ''}
        </div>
        <h3 style={{ fontWeight: 800, fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)', letterSpacing: 'var(--letter-spacing-tight)' }}>
          OAuth Sandbox Sign-In
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)', lineHeight: 'var(--line-height-relaxed)' }}>
          You are logging in to the COMPANIO sandbox container using a secure simulated <strong>{provider === 'google' ? 'Google' : 'Apple'} Account</strong>.
        </p>

        <div className="glass-panel" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-cool)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
            S
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Sandbox Tester</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>sandbox@companio.test</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button className="btn btn-primary btn-full" onClick={handleApproveMock}>
            Approve & Continue
          </button>
          <button className="btn btn-ghost btn-full btn-sm" onClick={() => router.push('/login')}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <div data-theme="dark" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      padding: 'var(--space-5)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        background: `
          radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)
        `
      }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Initializing...</p>
          </div>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
