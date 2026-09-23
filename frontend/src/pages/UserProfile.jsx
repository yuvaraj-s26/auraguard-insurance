import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, User } from 'lucide-react';
import api from '../api';

export default function UserProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(user?.role === 'Customer');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');

  // Form states for creating/updating customer profile details
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  const fetchProfile = () => {
    if (user?.role !== 'Customer') {
      setLoading(false);
      return;
    }
    setError('');
    api.get(`/customer/user/${user.userId}`)
      .then(res => {
        setProfile(res.data);
        setDob(res.data.dob ? res.data.dob.split('T')[0] : '');
        setGender(res.data.gender || 'Male');
        setPhone(res.data.phone || '');
        setAddress(res.data.address || '');
        setAadhaar(res.data.aadhaar || '');
        setNomineeName(res.data.nomineeName || '');
        setNomineeRelationship(res.data.nomineeRelationship || '');
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          setError('Failed to fetch profile details.');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      setError('Customer must be 18 years of age or older to register.');
      return;
    }
    try {
      if (profile) {
        await api.put(`/customer/${profile.customerId}`, {
          dob,
          gender,
          phone,
          address,
          aadhaar,
          nomineeName,
          nomineeRelationship
        });
        setSuccess('Profile updated successfully.');
      } else {
        await api.post('/customer', {
          userId: user.userId,
          dob,
          gender,
          phone,
          address,
          aadhaar,
          nomineeName,
          nomineeRelationship
        });
        setSuccess('Profile created successfully.');
      }
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('Associated user not found')) {
        alert('Your user session has expired or the user account was deleted. Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
      } else {
        setError(msg || 'Failed to save profile. Ensure Aadhaar is valid.');
      }
    }
  };

  if (loading) return <div>Loading User Profile...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '25px' }}>My Account Profile</h2>

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Left Side: Avatar Card */}
        <div>
          <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 20px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
              <User size={45} color="white" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '5px' }}>{user?.name}</h3>
            <span className="badge badge-under-review" style={{ marginBottom: '15px' }}>{user?.role}</span>
            
            <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '15px', marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}>User Account ID: <strong style={{ color: '#fff' }}>{user?.userId}</strong></div>
              <div>Registered Email: <strong style={{ color: '#fff', wordBreak: 'break-all' }}>{user?.email}</strong></div>
            </div>
          </div>
        </div>

        {/* Right Side: Account Details or Form */}
        <div>
          {isEditing || (user?.role === 'Customer' && !profile) ? (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                  {profile ? 'Edit Customer Profile Details' : 'Complete Your Customer Profile'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" required className="form-input" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" required className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0199" />
                </div>
                <div className="form-group">
                  <label className="form-label">Aadhaar Card Number</label>
                  <input type="text" required className="form-input" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="12-digit number" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input type="text" required className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full residential address" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nominee Name</label>
                  <input type="text" required className="form-input" value={nomineeName} onChange={e => setNomineeName(e.target.value)} placeholder="Beneficiary name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nominee Relationship</label>
                  <input type="text" required className="form-input" value={nomineeRelationship} onChange={e => setNomineeRelationship(e.target.value)} placeholder="e.g. Spouse, Child" />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  {profile && (
                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  )}
                  <button type="submit" className="btn btn-primary">Save Profile Details</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Verification & Profile Information</h3>
                {user?.role === 'Customer' && (
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Details</button>
                )}
              </div>

              {user?.role === 'Customer' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Date of Birth</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Gender</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.gender}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Phone Number</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.phone}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Aadhaar Number</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.aadhaar}</strong>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Residential Address</span>
                    <strong style={{ fontSize: '0.95rem' }}>{profile?.address}</strong>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Nominee Beneficiary</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.nomineeName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block' }}>Nominee Relationship</span>
                      <strong style={{ fontSize: '0.95rem' }}>{profile?.nomineeRelationship}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                    You are logged in with administrative/agent privileges. Security compliance profiles are only maintained for Customers. 
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                    To test customer functionalities (such as checking sum assured, uploading verification documents, making premium transactions, or filing accident claims), please register a new account with the <strong>Customer</strong> role.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
