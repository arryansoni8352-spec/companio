'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('privacy');
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
    } catch (err: any) { alert(err.message || 'Failed to update API keys.'); }
    finally { setSavingKeys(false); }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.updatePrivacySetting(key, value);
      setSettings(settings.map((s) => s.key === key ? { ...s, value } : s));
    } catch {}
  };

  const sections = [
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Alerts', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'ai', label: 'AI Keys', icon: '🤖' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      <h2 style={{
        fontSize: 'var(--font-size-2xl)', fontWeight: 700,
        letterSpacing: 'var(--letter-spacing-tight)',
        marginBottom: 'var(--space-5)',
      }}>Settings</h2>

      {/* Section Tabs */}
      <div style={{
        display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)',
        overflowX: 'auto', scrollbarWidth: 'none', padding: 'var(--space-0_5) 0',
      }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1_5)',
              padding: 'var(--space-2) var(--space-3_5)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-sm)', fontWeight: 500,
              whiteSpace: 'nowrap',
              background: activeSection === s.id ? 'var(--color-primary-alpha-10)' : 'var(--bg-tertiary)',
              color: activeSection === s.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: activeSection === s.id ? '1px solid var(--color-primary-alpha-20)' : '1px solid var(--border-light)',
              transition: 'all 200ms ease',
              cursor: 'pointer',
            }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Privacy */}
      {activeSection === 'privacy' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)', background: 'var(--gradient-primary-subtle)', border: '1px solid var(--color-primary-alpha-15)' }}>
            <div className="card-body-compact">
              <h3 style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-base)' }}>🔒 Privacy Center</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Control who can see your information.</p>
            </div>
          </div>

          <div className="card">
            {settings.map((setting, i) => (
              <div key={setting.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: i < settings.length - 1 ? '1px solid var(--border-separator)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{setting.label}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>Currently: {setting.value}</div>
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
        </div>
      )}

      {/* Security */}
      {activeSection === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Two-Factor Authentication</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Add an extra layer of security</p>
              <button className="btn btn-secondary btn-sm">Enable 2FA</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Active Sessions</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Manage logged-in devices</p>
              <button className="btn btn-secondary btn-sm">View Sessions</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Change Password</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <input className="input" type="password" placeholder="Current password" />
                <input className="input" type="password" placeholder="New password" />
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-1)' }}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Keys */}
      {activeSection === 'ai' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)', background: 'var(--gradient-primary-subtle)', border: '1px solid var(--color-primary-alpha-15)' }}>
            <div className="card-body-compact">
              <h3 style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-base)' }}>🤖 AI API Keys</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                Connect your own API keys. Your AI companions will use them directly.
              </p>
            </div>
          </div>

          <form onSubmit={saveAIKeys} className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                { label: 'Google Gemini', value: geminiKey, setter: setGeminiKey, placeholder: 'AIzaSy...' },
                { label: 'OpenAI (ChatGPT)', value: openaiKey, setter: setOpenaiKey, placeholder: 'sk-proj-...' },
                { label: 'Anthropic Claude', value: claudeKey, setter: setClaudeKey, placeholder: 'sk-ant-...' },
              ].map((field) => (
                <div className="input-group" key={field.label}>
                  <label>{field.label}</label>
                  <input className="input" type="password"
                    placeholder={field.value ? '••••••••••••••••' : field.placeholder}
                    value={field.value} onChange={(e) => field.setter(e.target.value)} />
                </div>
              ))}

              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={savingKeys}>
                {savingKeys ? <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : 'Save API Keys'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account */}
      {activeSection === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Verification</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Verify your identity to earn trust badges</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {['📧 Email', '📱 Phone', '🪪 ID', '📹 Video'].map((v) => (
                  <button key={v} className="btn btn-secondary btn-sm">{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="card" style={{ borderColor: 'rgba(255, 59, 48, 0.2)' }}>
            <div className="card-body">
              <h4 style={{ fontWeight: 600, color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>Danger Zone</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>This action cannot be undone</p>
              <button className="btn btn-danger btn-sm">Deactivate Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
