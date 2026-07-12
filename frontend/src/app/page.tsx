'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('companio_token');
    if (token) {
      router.replace('/home');
    } else {
      setLoading(false);
      // Slight delay for entry animation
      requestAnimationFrame(() => setMounted(true));
    }
  }, [router]);

  if (loading) {
    return (
      <div className="loading-screen" data-theme="dark">
        <div className="loading-logo">C</div>
      </div>
    );
  }

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#000000',
      padding: 'var(--space-6)',
    }}>
      {/* Animated Gradient Mesh Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: mounted ? 0.7 : 0,
        transition: 'opacity 1.5s ease',
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.18) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.14) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)
        `,
      }} />

      {/* Floating Orbs */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        top: '10%', left: '10%', filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.10) 0%, transparent 70%)',
        bottom: '15%', right: '10%', filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />

      {/* Main Content */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 500, width: '100%',
        textAlign: 'center',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Brand Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 'var(--font-size-2xl)',
          margin: '0 auto var(--space-6)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
        }}>C</div>

        {/* Display Heading */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          marginBottom: 'var(--space-4)',
          background: 'linear-gradient(135deg, #F5F5F7 0%, #AEAEB2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Connect.<br />
          <span style={{
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Beautifully.</span>
        </h1>

        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: '#AEAEB2',
          maxWidth: 380,
          margin: '0 auto var(--space-8)',
          lineHeight: 'var(--line-height-relaxed)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
        }}>
          Meet real people, create AI companions, and build meaningful connections — all in one place.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
          maxWidth: 300, margin: '0 auto var(--space-10)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
        }}>
          <button
            className="btn btn-primary btn-xl"
            onClick={() => router.push('/login')}
            style={{ width: '100%' }}
          >
            Get Started
          </button>
          <button
            className="btn btn-xl"
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#F5F5F7',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(12px)',
            }}
          >
            Sign In
          </button>
        </div>

        {/* Feature Blocks */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 'var(--space-6)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
        }}>
          {[
            { icon: '🛡️', title: 'Verified', desc: 'Trusted profiles' },
            { icon: '⚡', title: 'Live Match', desc: 'Real-time' },
            { icon: '✨', title: 'AI Friends', desc: 'Custom companions' },
          ].map((f, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, margin: '0 auto var(--space-2)',
              }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#F5F5F7', marginBottom: 2 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#636366' }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
