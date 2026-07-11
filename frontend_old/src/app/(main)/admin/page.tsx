'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any>({ users: [], total: 0 });
  const [reports, setReports] = useState<any>({ reports: [], total: 0 });

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try { const data = await api.getAdminDashboard(); setStats(data); } catch {}
  };

  const loadUsers = async () => {
    try { const data = await api.getAdminUsers(); setUsers(data); } catch {}
  };

  const loadReports = async () => {
    try { const data = await api.getAdminReports(); setReports(data); } catch {}
  };

  return (
    <div className="admin-layout" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <aside className="admin-sidebar">
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-6)', padding: 'var(--space-2)' }}>
          <span style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Panel</span>
        </h3>
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'users', icon: '👥', label: 'Users' },
          { id: 'reports', icon: '⚠️', label: 'Reports' },
          { id: 'communities', icon: '🏘️', label: 'Communities' },
          { id: 'moderation', icon: '🛡️', label: 'Moderation' },
          { id: 'analytics', icon: '📈', label: 'Analytics' },
        ].map((item) => (
          <button
            key={item.id}
            className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.id); if (item.id === 'users') loadUsers(); if (item.id === 'reports') loadReports(); }}
          >{item.icon} {item.label}</button>
        ))}
      </aside>

      <main className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, change: `+${stats.newUsersToday} today`, positive: true },
                { label: 'Total Posts', value: stats.totalPosts, change: `+${stats.newPostsToday} today`, positive: true },
                { label: 'Communities', value: stats.totalCommunities },
                { label: 'Active Chats', value: stats.activeChats },
                { label: 'Events', value: stats.totalEvents },
                { label: 'Pending Reports', value: stats.pendingReports, change: 'needs review', positive: false },
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value?.toLocaleString() || 0}</div>
                  {stat.change && <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>{stat.change}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>User Management ({users.total})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>User</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Posts</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users?.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{user.profile?.displayName || user.username}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>@{user.username}</div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{user.email || '—'}</td>
                      <td style={{ padding: 'var(--space-3)' }}><span className={`badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'moderator' ? 'badge-warning' : 'badge-success'}`}>{user.role}</span></td>
                      <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>{user._count?.posts || 0}</td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <button className="btn btn-ghost btn-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Reports ({reports.total})</h2>
            {reports.reports?.map((report: any) => (
              <div key={report.id} className="card" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Report by @{report.reporter?.username}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{report.reason} · {report.targetType}</div>
                    {report.description && <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>{report.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <span className={`badge ${report.status === 'pending' ? 'badge-warning' : report.status === 'resolved' ? 'badge-success' : 'badge-error'}`}>{report.status}</span>
                    <button className="btn btn-primary btn-sm">Review</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
