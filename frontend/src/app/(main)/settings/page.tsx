'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('privacy');

  useEffect(() => { if (activeSection === 'privacy') loadSettings(); }, [activeSection]);

  const loadSettings = async () => {
    try { const data = await api.getPrivacySettings(); setSettings(data); } catch {}
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.updatePrivacySetting(key, value);
      setSettings(settings.map((s) => s.key === key ? { ...s, value } : s));
    } catch {}
  };

  const sections = [
    { id: 'privacy', label: '🔒 Privacy Center', icon: '🔒' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'security', label: '🛡️ Security', icon: '🛡️' },
    { id: 'account', label: '👤 Account', icon: '👤' },
  ];

  return (
    <div style={{ maxWidth: 614, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, padding: 'var(--space-4)' }}>Settings</h2>

      <div className="tabs">
        {sections.map((s) => (
          <button key={s.id} className={`tab ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'privacy' && (
        <div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-primary-alpha)', margin: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>🔒 Privacy Center</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Control who can see your information and interact with you.</p>
          </div>

          {settings.map((setting) => (
            <div key={setting.key} className="privacy-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <div className="privacy-item-label">{setting.label}</div>
                <div className="privacy-item-desc">Currently: {setting.value}</div>
              </div>
              <select className="select" value={setting.value} onChange={(e) => updateSetting(setting.key, e.target.value)}>
                <option value="everyone">Everyone</option>
                <option value="followers">Followers</option>
                <option value="friends">Friends</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'security' && (
        <div style={{ padding: 'var(--space-4)' }}>
          <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Two-Factor Authentication</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Add an extra layer of security to your account</p>
              <button className="btn btn-secondary btn-sm">Enable 2FA</button>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Active Sessions</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Manage devices logged into your account</p>
              <button className="btn btn-secondary btn-sm">View Sessions</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Change Password</h4>
              <input className="input" type="password" placeholder="Current password" style={{ marginBottom: 'var(--space-2)' }} />
              <input className="input" type="password" placeholder="New password" style={{ marginBottom: 'var(--space-2)' }} />
              <button className="btn btn-primary btn-sm">Update Password</button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'account' && (
        <div style={{ padding: 'var(--space-4)' }}>
          <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Verification</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Verify your identity to earn trust badges</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm">📧 Email</button>
                <button className="btn btn-secondary btn-sm">📱 Phone</button>
                <button className="btn btn-secondary btn-sm">🪪 Government ID</button>
                <button className="btn btn-secondary btn-sm">📹 Video</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ borderColor: 'var(--color-error)' }}>
            <div className="card-body">
              <h4 style={{ fontWeight: 600, color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>Danger Zone</h4>
              <button className="btn btn-danger btn-sm">Deactivate Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
