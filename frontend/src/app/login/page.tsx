'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Login fields
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login({ login, password });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.signup({ username, email: email || undefined, password: signupPassword, displayName: displayName || undefined });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  const switchMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#000000',
      padding: 'var(--space-5)',
    }}>
      {/* Background Gradient Mesh */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5,
        background: `
          radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)
        `,
      }} />

      {/* Auth Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(28, 28, 30, 0.75)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-3xl)',
        padding: 'var(--space-10) var(--space-8)',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.96)',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 'var(--font-size-xl)',
            marginBottom: 'var(--space-3)',
            boxShadow: '0 0 32px rgba(99, 102, 241, 0.3)',
          }}>C</div>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)', fontWeight: 900,
            letterSpacing: '-0.03em', color: '#F5F5F7',
          }}>
            {isSignup ? 'Create Account' : 'Welcome back'}
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)', color: '#AEAEB2',
            marginTop: 'var(--space-1)',
          }}>
            {isSignup ? 'Start your journey on COMPANIO' : 'Sign in to your account'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 59, 48, 0.10)',
            color: '#FF6961',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            textAlign: 'center',
            fontWeight: 500,
            border: '1px solid rgba(255, 59, 48, 0.15)',
            animation: 'shake 0.5s ease',
          }}>
            {error}
          </div>
        )}

        {!isSignup ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <input
                id="login-input"
                type="text"
                placeholder="Username, email, or phone"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: '100%', padding: 'var(--space-3_5) var(--space-4)',
                  minHeight: 48, background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-xl)', color: '#F5F5F7',
                  fontSize: 'var(--font-size-base)',
                  transition: 'all 150ms ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <input
                id="password-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: 'var(--space-3_5) var(--space-4)',
                  minHeight: 48, background: 'rgba(255, 255, 255, 0.06)',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-xl)', color: '#F5F5F7',
                  fontSize: 'var(--font-size-base)',
                  transition: 'all 150ms ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', minHeight: 48,
                background: 'var(--gradient-primary)', backgroundSize: '200% 200%',
                color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-base)', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)',
                transition: 'all 250ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Sign In'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              margin: 'var(--space-6) 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#636366', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
            </div>

            {/* Social Buttons */}
            <button type="button" id="google-login-btn" onClick={() => window.location.href = `${API_URL}/auth/google`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
              width: '100%', padding: 'var(--space-3)', minHeight: 48,
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)', fontWeight: 600,
              fontSize: 'var(--font-size-base)', color: '#F5F5F7',
              background: 'rgba(255, 255, 255, 0.04)',
              transition: 'all 150ms ease', cursor: 'pointer',
              marginBottom: 'var(--space-2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <button type="button" id="apple-login-btn" onClick={() => window.location.href = `${API_URL}/auth/apple`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
              width: '100%', padding: 'var(--space-3)', minHeight: 48,
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)', fontWeight: 600,
              fontSize: 'var(--font-size-base)', color: '#F5F5F7',
              background: 'rgba(255, 255, 255, 0.04)',
              transition: 'all 150ms ease', cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            {[
              { id: 'signup-display-name', placeholder: 'Display Name', value: displayName, setter: setDisplayName, type: 'text', ac: 'name' },
              { id: 'signup-username', placeholder: 'Username', value: username, setter: setUsername, type: 'text', ac: 'username', required: true },
              { id: 'signup-email', placeholder: 'Email (optional)', value: email, setter: setEmail, type: 'email', ac: 'email' },
              { id: 'signup-password', placeholder: 'Password (8+ characters)', value: signupPassword, setter: setSignupPassword, type: 'password', ac: 'new-password', required: true, min: 8 },
            ].map((field, i) => (
              <div key={field.id} style={{ marginBottom: i === 3 ? 'var(--space-5)' : 'var(--space-3)' }}>
                <input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  required={field.required}
                  minLength={field.min}
                  autoComplete={field.ac}
                  style={{
                    width: '100%', padding: 'var(--space-3_5) var(--space-4)',
                    minHeight: 48, background: 'rgba(255, 255, 255, 0.06)',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-xl)', color: '#F5F5F7',
                    fontSize: 'var(--font-size-base)',
                    transition: 'all 150ms ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            ))}

            <button
              id="signup-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', minHeight: 48,
                background: 'var(--gradient-primary)', backgroundSize: '200% 200%',
                color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-base)', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)',
                transition: 'all 250ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Create Account'}
            </button>

            <p style={{
              fontSize: 'var(--font-size-xs)', color: '#636366',
              textAlign: 'center', marginTop: 'var(--space-3)', lineHeight: 'var(--line-height-relaxed)',
            }}>
              By signing up, you agree to our Terms, Privacy Policy, and Cookie Policy.
            </p>
          </form>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: '#AEAEB2' }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <a
              href="#"
              onClick={switchMode}
              style={{
                color: '#818CF8', fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 150ms ease',
              }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
