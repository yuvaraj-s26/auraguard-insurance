import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingAuth, setPendingAuth] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });
      
      // If role is Admin, prompt for 2FA verification step
      if (response.data.role === 'Admin') {
        setPendingAuth(response.data);
        setIs2FAStep(true);
        setOtpCode('824915'); // Pre-fill default demo token for seamless verification
      } else {
        onLogin(response.data.token, response.data);
        navigate('/');
      }
    } catch (err) {
      if (!err.response) {
        setError('Server is warming up or unreachable. Please wait 10 seconds and try again.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter a valid 6-digit 2FA security token.');
      return;
    }
    if (pendingAuth) {
      onLogin(pendingAuth.token, pendingAuth);
      navigate('/');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
          <Shield size={32} color="#6366f1" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraGuard</h1>
        </div>

        {!is2FAStep ? (
          <>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Sign In to Portal</h2>
            
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Password</label>
                <input type={showPassword ? 'text' : 'password'} required className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <input type="checkbox" id="show-pass-check" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="show-pass-check" style={{ cursor: 'pointer', userSelect: 'none' }}>Show Password</label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '10px' }}>
                Quick Demo Accounts (Click to Fill)
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill('yuvaraj@insurance.com', 'Yuva@123')}
                  style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', cursor: 'pointer', fontWeight: '600' }}
                >
                  Admin
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill('praveen@insurance.com', 'Praveen@123')}
                  style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', cursor: 'pointer', fontWeight: '600' }}
                >
                  Agent
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickFill('raj@insurance.com', 'Raj@123')}
                  style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.4)', background: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee', cursor: 'pointer', fontWeight: '600' }}
                >
                  Customer
                </button>
              </div>
            </div>

            <p style={{ marginTop: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
              Don't have an account? <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
            </p>
          </>
        ) : (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <KeyRound size={24} color="#6366f1" />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Two-Factor Authentication</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '6px' }}>
                Admin access requires secondary verification. Enter your 6-digit Authenticator OTP code:
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleVerify2FA}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  maxLength="6"
                  required
                  autoFocus
                  className="form-input"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="• • • • • •"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: '700', padding: '12px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                Verify & Enter Portal <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => setIs2FAStep(false)} className="btn btn-secondary" style={{ width: '100%', marginTop: '10px', padding: '10px' }}>
                Back to Sign In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
