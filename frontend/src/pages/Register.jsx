import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Customer');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
      case 2:
        return { score, text: 'Weak Password', color: '#ef4444' };
      case 3:
      case 4:
        return { score, text: 'Medium Password', color: '#f59e0b' };
      case 5:
        return { score, text: 'Strong Secure Password', color: '#10b981' };
      default:
        return { score: 0, text: '', color: 'transparent' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      setSuccess(res.data.message || 'Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
          <Shield size={32} color="#6366f1" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraGuard</h1>
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Create Secure Account</h2>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" required className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, transition: 'width 0.3s' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>{strength.text}</span>
              </div>
            )}
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Register As</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="radio" name="role" value="Customer" checked={role === 'Customer'} onChange={() => setRole('Customer')} style={{ accentColor: '#6366f1' }} />
                Customer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="radio" name="role" value="Agent" checked={role === 'Agent'} onChange={() => setRole('Agent')} style={{ accentColor: '#6366f1' }} />
                Agent
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
