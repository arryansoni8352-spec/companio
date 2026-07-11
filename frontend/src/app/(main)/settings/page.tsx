'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('privacy');

  // AI API Keys State
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  useEffect(() => { 
    if (activeSection === 'privacy') loadSettings(); 
    else if (activeSection === 'ai') loadAIKeys();
  }, [activeSection]);

  const loadSettings = async () => {
    try { const data = await api.getPrivacySettings(); setSettings(data); } catch {}
  };

  const loadAIKeys = async () => {
    try {
      const data = await api.getAIKeysConfig();
      setGeminiKey(data.geminiKey || '');
      setOpenaiKey(data.openaiKey || '');
      setClaudeKey(data.claudeKey || '');
    } catch {}
  };

  const saveAIKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    try {
      await api.updateAIKeysConfig({ geminiKey, openaiKey, claudeKey });
      alert('API keys updated successfully!');
      loadAIKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to update API keys.');
    } finally {
      setSavingKeys(false);
    }
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
    { id: 'ai', label: '🤖 AI Keys', icon: '🤖' },
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

      {activeSection === 'ai' && (
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-4)', background: 'rgba(99, 102, 241, 0.08)', margin: '0 0 var(--space-4) 0', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: 'var(--space-1)' }}>🤖 Personal AI Connections</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Enter your own Google Gemini, OpenAI (ChatGPT), or Anthropic Claude API keys. 
              If configured, your custom AI companions will call your own API keys directly, saving platform credits!
            </p>
          </div>

          <form onSubmit={saveAIKeys} className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '6px' }}>Google Gemini API Key</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder={geminiKey ? "••••••••••••••••" : "AIzaSy..."} 
                  value={geminiKey} 
                  onChange={(e) => setGeminiKey(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '6px' }}>OpenAI (ChatGPT) API Key</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder={openaiKey ? "••••••••••••••••" : "sk-proj-..."} 
                  value={openaiKey} 
                  onChange={(e) => setOpenaiKey(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '6px' }}>Anthropic Claude API Key</label>
                <input 
                  className="input" 
                  type="password" 
                  placeholder={claudeKey ? "••••••••••••••••" : "sk-ant-..."} 
                  value={claudeKey} 
                  onChange={(e) => setClaudeKey(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px' }} disabled={savingKeys}>
                {savingKeys ? 'Saving...' : 'Save API Keys'}
              </button>
            </div>
          </form>
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
