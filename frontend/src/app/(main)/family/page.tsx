'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function FamilyPage() {
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('CHILD');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getFamily();
      setFamily(data);
    } catch (err: any) {
      // If family not found, it means user is not part of a family
      setFamily(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setError('');
    setSuccess('');
    try {
      const data = await api.createFamily(familyName);
      setSuccess('Family created successfully!');
      setFamily(data);
      setFamilyName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create family');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUsername.trim()) return;
    setError('');
    setSuccess('');
    try {
      await api.addFamilyMember(newMemberUsername, newMemberRole);
      setSuccess(`Successfully added @${newMemberUsername} to the family!`);
      setNewMemberUsername('');
      loadFamily();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the family?')) return;
    setError('');
    setSuccess('');
    try {
      await api.removeFamilyMember(userId);
      setSuccess('Member removed successfully.');
      loadFamily();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 650, margin: '0 auto', padding: 'var(--space-4) 0' }}>
      
      {/* Premium Header Banner */}
      <div style={{ padding: 'var(--space-6) 0', textAlign: 'center', background: 'radial-gradient(circle, var(--color-primary-alpha) 0%, transparent 80%)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-4)' }}>
        <h1 className="glow-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, letterSpacing: 'var(--letter-spacing-tight)' }}>
          Family Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-md)', marginTop: 'var(--space-2)' }}>
          Manage your household, assign roles, and stay connected with loved ones.
        </p>
      </div>

      {error && (
        <div className="badge badge-error" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'block', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'block', textAlign: 'center' }}>
          ✅ {success}
        </div>
      )}

      {!family ? (
        <div className="card" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 54, marginBottom: 'var(--space-3)' }}>🏠</div>
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>You are not in a family yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
              Create a family circle to invite members, or wait for an invitation.
            </p>
            <form onSubmit={handleCreateFamily} style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: 400, margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Family Name (e.g., The Smith Household)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="input"
                required
              />
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Family Card */}
          <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>{family.name}</h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Created: {new Date(family.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="badge badge-primary">{family.members.length} Members</span>
              </div>

              {/* Members List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <h4 style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Members</h4>
                {family.members.map((member: any) => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                        {member.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.user.profile?.displayName || member.user.username}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>@{member.user.username}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span className={`badge ${member.role === 'PARENT' ? 'badge-primary' : member.role === 'GUARDIAN' ? 'badge-warning' : 'badge-success'}`}>
                        {member.role}
                      </span>
                      {member.role !== 'PARENT' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => handleRemoveMember(member.user.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Member Card */}
          <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
            <div className="card-body">
              <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Invite Member</h3>
              <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Enter username to invite"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Role</label>
                  <select
                    className="select"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="CHILD">CHILD</option>
                    <option value="PARENT">PARENT</option>
                    <option value="GUARDIAN">GUARDIAN</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add to Family</button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
