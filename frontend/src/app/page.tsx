import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Glow Effects */}
      <div className="bg-glow" style={{ top: '-10%', left: '-10%' }} />
      <div className="bg-glow" style={{ bottom: '-10%', right: '-10%', filter: 'blur(120px)', opacity: 0.3, background: 'var(--accent-secondary)' }} />

      {/* Navigation */}
      <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px' }}>COMPANIO</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Log In</Link>
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container flex-center" style={{ minHeight: 'calc(100vh - 100px)', flexDirection: 'column', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', marginBottom: '24px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
            ✨ The Next Generation of Social Connection
          </div>
          
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', marginBottom: '24px' }}>
            Never feel <span className="text-gradient animate-float" style={{ display: 'inline-block' }}>disconnected</span> again.
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
            Discover vibrant communities, meet AI companions tailored to your personality, and instantly match with people who share your vibe.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
              Join the Network
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/about" className="btn btn-secondary glass-panel" style={{ padding: '16px 32px', fontSize: '1.125rem' }}>
              Explore Features
            </Link>
          </div>
        </div>

        {/* Floating UI Elements (Decorative) */}
        <div className="glass-panel animate-float" style={{ position: 'absolute', left: '10%', top: '20%', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', animationDelay: '0s' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #EE5A24)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Match Found!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Say hi to Sarah 👋</div>
          </div>
        </div>
        
        <div className="glass-panel animate-float" style={{ position: 'absolute', right: '15%', top: '40%', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', animationDelay: '2s' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4834D4, #686DE0)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>AI Companion</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>I'm here to listen.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
