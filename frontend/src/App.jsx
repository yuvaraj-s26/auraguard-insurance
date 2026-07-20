import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Shield, Users, FileText, CreditCard, AlertTriangle, TrendingUp, 
  LogOut, Download, Upload, Trash2, Plus, Search, Calendar, 
  User, CheckCircle2, XCircle, Info, ChevronRight, RefreshCw, FileUp,
  MessageCircle, Send, Bot, Bell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from './api';

// ==========================================
// APP COMPONENT & ROUTING
// ==========================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    const validateSession = async () => {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        try {
          const res = await api.get('/auth/me');
          const updatedUser = {
            token: activeToken,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            userId: res.data.userId,
            customerId: res.data.customerId
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (err) {
          console.warn("Session validation failed, logging out:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
    };

    validateSession();

    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {token ? (
          <DashboardLayout user={user} onLogout={logout}>
            <Routes>
              <Route path="/" element={<DashboardDispatcher user={user} />} />
              <Route path="/customers" element={<CustomerManager user={user} />} />
              <Route path="/policies" element={<PolicyManager user={user} />} />
              <Route path="/payments" element={<PaymentManager user={user} />} />
              <Route path="/claims" element={<ClaimManager user={user} />} />
              <Route path="/documents" element={<DocumentVault user={user} />} />
              <Route path="/profile" element={<UserProfile user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        ) : (
          <Routes>
            <Route path="/" element={<PublicLandingPage />} />
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

// ==========================================
// AUTHENTICATION PAGES
// ==========================================
function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      onLogin(response.data.token, response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
          <Shield size={32} color="#6366f1" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraGuard</h1>
        </div>
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
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        {/* Register Redirect link */}
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

function Register() {
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

// ==========================================
// MAIN SHELL LAYOUT
// ==========================================
function DashboardLayout({ user, onLogout, children }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  const handleNotifClick = (n) => {
    setShowNotif(false);
    if (n.type === 'policy') {
      navigate('/policies');
    } else if (n.type === 'claim') {
      navigate('/claims');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const loadNotifications = async () => {
      try {
        const notifs = [];
        
        // 1. Policies check
        const polRes = await api.get('/policy');
        const policies = polRes.data;
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);
        
        policies.forEach(p => {
          const endDate = new Date(p.endDate);
          if (p.status === 'Active' && endDate > now && endDate <= thirtyDaysLater) {
            const diffTime = Math.abs(endDate - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            notifs.push({
              id: `policy-exp-${p.policyId}`,
              type: 'policy',
              title: 'Policy Expiring Soon',
              message: `Policy ${p.policyNumber} (${p.policyName}) will expire in ${diffDays} days on ${endDate.toLocaleDateString()}.`,
              severity: 'warning'
            });
          }
        });
        
        // 2. Claims check
        const claimRes = await api.get('/claim');
        const claims = claimRes.data;
        claims.forEach(c => {
          if (c.status === 'Settled') {
            notifs.push({
              id: `claim-settled-${c.claimId}`,
              type: 'claim',
              title: 'Claim Settled',
              message: `Funds of ₹${c.claimAmount?.toLocaleString()} have been settled for claim #${c.claimId}.`,
              severity: 'success'
            });
          } else if (c.status === 'Approved') {
            notifs.push({
              id: `claim-approved-${c.claimId}`,
              type: 'claim',
              title: 'Claim Approved',
              message: `Claim #${c.claimId} has been approved. Settle funds in actions.`,
              severity: 'success'
            });
          } else if (c.status === 'Rejected') {
            notifs.push({
              id: `claim-rejected-${c.claimId}`,
              type: 'claim',
              title: 'Claim Auto-Rejected',
              message: `Claim #${c.claimId} failed validation check: ${c.rulesCheckReason || 'Manual rejection'}`,
              severity: 'danger'
            });
          }
        });
        
        // 3. Claim support comments check (concurrently)
        await Promise.all(claims.map(async (c) => {
          try {
            const commentRes = await api.get(`/claim/${c.claimId}/comments`);
            const claimComments = commentRes.data;
            claimComments.forEach(cc => {
              if (cc.userId?.toString() !== user?.userId?.toString()) {
                const commentDate = new Date(cc.commentDate);
                const diffMs = now - commentDate;
                if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
                  notifs.push({
                    id: `comment-${cc.claimCommentId}`,
                    type: 'claim',
                    title: `New Message (Claim #${c.claimId})`,
                    message: `${cc.authorName} (${cc.authorRole}): "${cc.message.length > 50 ? cc.message.substring(0, 47) + '...' : cc.message}"`,
                    severity: 'info'
                  });
                }
              }
            });
          } catch (commentErr) {
            console.error(`Error loading comments for claim ${c.claimId}:`, commentErr);
          }
        }));

        setNotifications(notifs);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    };
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: '0 8px' }}>
          <Shield size={28} color="#6366f1" />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraGuard</h1>
        </div>

        {/* User Card */}
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '30px', textDecoration: 'none', color: 'inherit', transition: 'var(--transition-smooth)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="white" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user?.name}</h3>
            <span className="badge badge-under-review" style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: '2px' }}>{user?.role}</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
          <SidebarLink to="/" icon={<TrendingUp size={18} />} label="Dashboard" />
          
          {(user?.role === 'Admin' || user?.role === 'Agent') && (
            <SidebarLink to="/customers" icon={<Users size={18} />} label="Customers" />
          )}

          <SidebarLink to="/policies" icon={<FileText size={18} />} label="Policies" />
          <SidebarLink to="/payments" icon={<CreditCard size={18} />} label="Payments" />
          <SidebarLink to="/claims" icon={<AlertTriangle size={18} />} label="Claims Office" />
          <SidebarLink to="/documents" icon={<FileUp size={18} />} label="Document Vault" />
        </nav>

        {/* Logout Button */}
        <button className="btn btn-secondary" onClick={onLogout} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Panel */}
      <main style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '0' }}>
        <header style={{ height: '70px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Calendar size={16} />
            <span style={{ fontSize: '0.9rem' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
            <div className="badge badge-active">System Online</div>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer', padding: '4px' }} onClick={() => setShowNotif(!showNotif)}>
              <Bell size={20} color={notifications.length > 0 ? '#f59e0b' : '#94a3b8'} style={{ transition: 'color 0.2s' }} />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444' }}></span>
              )}
            </div>

            {showNotif && (
              <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '40px', right: '0', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 1100, padding: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', transformOrigin: 'top right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>System Notifications</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{notifications.length} alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No pending alerts.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map(n => (
                      <div key={n.id} 
                        onClick={() => handleNotifClick(n)}
                        style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', borderLeft: `3px solid var(--${n.severity === 'danger' ? 'danger' : n.severity === 'warning' ? 'warning' : 'success'})`, cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', lineHeight: '1.3' }}>{n.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: '1', padding: '30px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Floating Chatbot Widget for Customers */}
      {user?.role === 'Customer' && <ChatbotWidget />}
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: '8px', fontWeight: '500', transition: 'var(--transition-smooth)' }} 
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function DashboardDispatcher({ user }) {
  if (user?.role === 'Admin') return <AdminDashboard />;
  if (user?.role === 'Agent') return <AgentDashboard />;
  return <CustomerDashboard user={user} />;
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [approvedAgents, setApprovedAgents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadAuditLogs = () => {
    api.get('/auditlog')
      .then(res => setAuditLogs(res.data))
      .catch(err => console.error("Error fetching audit logs:", err));
  };

  const loadPendingAgents = () => {
    api.get('/auth/pending-agents')
      .then(res => setPendingAgents(res.data))
      .catch(err => console.error(err));
  };

  const loadApprovedAgents = () => {
    api.get('/auth/approved-agents')
      .then(res => setApprovedAgents(res.data))
      .catch(err => console.error(err));
  };

  const handleApproveAgent = async (id) => {
    try {
      await api.post(`/auth/approve-agent/${id}`);
      loadPendingAgents();
      loadApprovedAgents();
    } catch (err) {
      console.error(err);
      alert('Failed to approve agent.');
    }
  };

  const handleRejectAgent = async (id) => {
    if (!window.confirm('Are you sure you want to reject this agent registration request?')) return;
    try {
      await api.post(`/auth/reject-agent/${id}`);
      loadPendingAgents();
      loadApprovedAgents();
    } catch (err) {
      console.error(err);
      alert('Failed to reject agent.');
    }
  };

  const handleRevokeAgent = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this agent's portal access?")) return;
    try {
      await api.post(`/auth/revoke-agent/${id}`);
      loadPendingAgents();
      loadApprovedAgents();
    } catch (err) {
      console.error(err);
      alert('Failed to revoke agent access.');
    }
  };

  useEffect(() => {
    api.get('/reports/admin-dashboard')
      .then(res => { setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    loadPendingAgents();
    loadApprovedAgents();
    loadAuditLogs();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Total Customers,${data.totalCustomers}\n`;
    csvContent += `Total Policies,${data.totalPolicies}\n`;
    csvContent += `Active Policies,${data.activePolicies}\n`;
    csvContent += `Pending Claims,${data.pendingClaims}\n`;
    csvContent += `Premium Collections,₹${data.totalPremiumCollection?.toFixed(2)}\n`;
    csvContent += `Avg Claim Processing Time (Hrs),${data.avgClaimProcessingTimeHours?.toFixed(1)}\n`;
    csvContent += `Loss Ratio (%),${data.lossRatio?.toFixed(1)}%\n`;
    csvContent += `Policy Retention Rate (%),${data.retentionRate?.toFixed(1)}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AuraGuard_Operational_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading Admin Dashboard Stats...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Administrative Intelligence Center</h2>
        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export CSV Report
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card metrics-card">
          <div className="metrics-icon"><Users /></div>
          <div className="metrics-info">
            <h3>Total Customers</h3>
            <p>{data?.totalCustomers}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}><FileText /></div>
          <div className="metrics-info">
            <h3>Active Policies</h3>
            <p>{data?.activePolicies} / {data?.totalPolicies}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}><AlertTriangle /></div>
          <div className="metrics-info">
            <h3>Pending Claims</h3>
            <p>{data?.pendingClaims}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}><CreditCard /></div>
          <div className="metrics-info">
            <h3>Premium Collections</h3>
            <p>₹{data?.totalPremiumCollection?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Operational Efficiency Grid Row */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', color: 'var(--text-muted)' }}>Operational Efficiency & Auditing</h3>
      <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
        <div className="glass-card metrics-card" style={{ borderLeft: '3px solid var(--info)' }}>
          <div className="metrics-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)' }}><Calendar /></div>
          <div className="metrics-info">
            <h3>Avg Settlement Time</h3>
            <p>{data?.avgClaimProcessingTimeHours?.toFixed(1)} hrs</p>
          </div>
        </div>

        <div className="glass-card metrics-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="metrics-icon" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)' }}><TrendingUp /></div>
          <div className="metrics-info">
            <h3>Loss Ratio</h3>
            <p>{data?.lossRatio?.toFixed(1)}%</p>
          </div>
        </div>

        <div className="glass-card metrics-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="metrics-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}><Shield /></div>
          <div className="metrics-info">
            <h3>Policy Retention</h3>
            <p>{data?.retentionRate?.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>Premium Collection Revenue Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data?.revenueChart || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Agent Registration Requests */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#06b6d4" />
            Agent Registration Requests
          </h3>
          <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>{pendingAgents.length} Pending</span>
        </div>

        {pendingAgents.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No pending agent registration requests at this time.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requested ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAgents.map(agent => (
                  <tr key={agent.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#818cf8', fontWeight: '600' }}>#{agent.userId}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{agent.name}</td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{agent.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-active" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>{agent.role}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleApproveAgent(agent.userId)}>
                          Approve Access
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={() => handleRejectAgent(agent.userId)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Approved Agents Directory */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#10b981" />
            Approved Active Agents Directory
          </h3>
          <span className="badge badge-active" style={{ fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>{approvedAgents.length} Active</span>
        </div>

        {approvedAgents.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No active approved agents registered in the directory.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedAgents.map(agent => (
                  <tr key={agent.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#818cf8', fontWeight: '600' }}>#{agent.userId}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{agent.name}</td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{agent.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>Active</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }} onClick={() => handleRevokeAgent(agent.userId)}>
                          Suspend Access
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent Operational Activity Audit Logs */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '30px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#818cf8" />
          Agent Activity Audit Logs
        </h3>

        {auditLogs.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No agent activities logged in the audit ledger.</p>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Category</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.auditLogId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.85rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#fff' }}>{log.agentName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(129, 140, 248, 0.3)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.88rem' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// AGENT DASHBOARD
// ==========================================
function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/agent-dashboard')
      .then(res => { setData(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading Agent Console...</div>;

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '25px' }}>Agent Operations Desk</h2>

      <div className="dashboard-grid">
        <div className="glass-card metrics-card">
          <div className="metrics-icon"><Users /></div>
          <div className="metrics-info">
            <h3>My Assigned Clients</h3>
            <p>{data?.customersAssigned}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}><FileText /></div>
          <div className="metrics-info">
            <h3>Policies Sold</h3>
            <p>{data?.policiesSold}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}><Calendar /></div>
          <div className="metrics-info">
            <h3>Pending Renewals</h3>
            <p>{data?.pendingRenewals}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)' }}><AlertTriangle /></div>
          <div className="metrics-info">
            <h3>Claims for Review</h3>
            <p>{data?.claimsAssigned}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/customers?add=true" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Plus size={18} /> Register New Customer</Link>
            <Link to="/policies?add=true" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><Plus size={18} /> Create Insurance Policy</Link>
            <Link to="/claims" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}><AlertTriangle size={18} /> Review Claims Queue</Link>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <Shield size={64} color="#06b6d4" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.3))' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '5px' }}>Compliance Assured</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '300px' }}>Verify customer Aadhaar/PAN documents before approving claims or policy renewals.</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CUSTOMER DASHBOARD
// ==========================================
function CustomerDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Profile Form State
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  useEffect(() => {
    // 1. First, check if the customer has created their profile yet
    api.get(`/customer/user/${user.userId}`)
      .then(() => {
        // They have a profile! Load dashboard metrics
        api.get('/reports/customer-dashboard')
          .then(res => { setData(res.data); })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setNeedsProfile(true);
        } else {
          console.error(err);
        }
        setLoading(false);
      });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      alert('Customer must be 18 years of age or older to register.');
      return;
    }
    try {
      await api.post('/customer', {
        userId: user.userId,
        dob, gender, phone, address, aadhaar, nomineeName, nomineeRelationship
      });
      alert('Profile completed successfully!');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('Associated user not found')) {
        alert('Your user session has expired or the user account was deleted. Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
      } else {
        alert(msg || 'Error saving profile.');
      }
    }
  };

  if (loading) return <div>Loading Secure Dashboard...</div>;

  if (needsProfile) {
    return (
      <div className="animate-fade-in glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '25px' }}>
          <Shield size={48} color="#06b6d4" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Welcome! Complete Your Profile</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '10px' }}>Before you can purchase policies or file claims, we require mandatory KYC verification details.</p>
        </div>
        
        {/* Form Begins */}

        <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Phone Number</label>
            <input type="text" required className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-0199" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Residential Address</label>
            <input type="text" required className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City" />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Aadhaar / SSN</label>
            <input type="text" required className="form-input" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="12-digit Government ID" />
          </div>
          <div className="form-group">
            <label className="form-label">Nominee Name</label>
            <input type="text" required className="form-input" value={nomineeName} onChange={e => setNomineeName(e.target.value)} placeholder="Full Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Relationship</label>
            <input type="text" required className="form-input" value={nomineeRelationship} onChange={e => setNomineeRelationship(e.target.value)} placeholder="e.g. Spouse" />
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Complete Onboarding</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '25px' }}>Secure Customer Cabinet</h2>

      <div className="dashboard-grid">
        <div className="glass-card metrics-card">
          <div className="metrics-icon"><CheckCircle2 /></div>
          <div className="metrics-info">
            <h3>Active Policies</h3>
            <p>{data?.activePolicies}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)' }}><CreditCard /></div>
          <div className="metrics-info">
            <h3>Due Premium</h3>
            <p>₹{data?.duePremium?.toFixed(2)}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)' }}><AlertTriangle /></div>
          <div className="metrics-info">
            <h3>My Filed Claims</h3>
            <p>{data?.pendingClaims}</p>
          </div>
        </div>

        <div className="glass-card metrics-card">
          <div className="metrics-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)' }}><Calendar /></div>
          <div className="metrics-info">
            <h3>Next Renewal Date</h3>
            <p>{data?.nextRenewalDate ? new Date(data.nextRenewalDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {data?.duePremium > 0 && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.08)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle color="#f59e0b" size={28} />
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Premium Premium Pending Payment</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>You have policies awaiting activation payment. Make a payment now to stay covered.</p>
            </div>
          </div>
          <Link to="/payments" className="btn btn-primary">Pay Premium Due</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>Support & Claims</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px' }}>In the event of an accident or medical emergency, you can file an immediate insurance claim directly through our online office. Our verifiers will check details and settle the claim within 48 business hours.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/claims" className="btn btn-primary"><AlertTriangle size={18} /> File a New Claim</Link>
            <Link to="/policies" className="btn btn-secondary">Browse My Policies</Link>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Shield size={50} color="#10b981" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontWeight: '700' }}>Active Coverage</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '5px' }}>Your records are encrypted with standard JWT schemas and protected by active firewall triggers.</p>
        </div>
      </div>
      
    </div>
  );
}

// ==========================================
// CUSTOMER CHATBOT WIDGET
// ==========================================
function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am Aura, your virtual assistant. You can ask me about our insurance policies, claims, or premium payments!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    const lowerInput = userText.toLowerCase();
    let botReply = '';

    // Smart Rule-Based Engine
    setTimeout(async () => {
      try {
        if (lowerInput.includes('my policy') || lowerInput.includes('my policies') || lowerInput.includes('registered') || lowerInput.includes('my plan') || lowerInput.includes('status') || lowerInput.includes('detail') || lowerInput.includes('info')) {
          // Fetch customer's own policies from the backend
          const res = await api.get('/policy');
          const myPolicies = res.data;

          // Fetch claims to link them!
          const claimRes = await api.get('/claim');
          const myClaims = claimRes.data;

          if (myPolicies.length === 0) {
            botReply = 'You do not have any registered policies yet. You can browse and purchase a new plan in the **Policies** section on the left sidebar!';
          } else {
            // Check if they asked about a specific policy number or plan name!
            let filteredPolicies = myPolicies;
            let isSpecificQuery = false;

            // Search for policy ID match (e.g. policy 1, policy id 2, policy #3)
            const polIdMatch = userText.match(/(?:policy\s+id\s+|policy\s+#|policy\s+)(\d+)/i);
            // Search for policy number match (e.g., POL-12345)
            const polNumMatch = userText.match(/POL-\d+/i);

            if (polIdMatch) {
              const matchedId = parseInt(polIdMatch[1]);
              filteredPolicies = myPolicies.filter(p => p.policyId === matchedId);
              isSpecificQuery = true;
            } else if (polNumMatch) {
              const matchedNum = polNumMatch[0].toUpperCase();
              filteredPolicies = myPolicies.filter(p => p.policyNumber.toUpperCase() === matchedNum);
              isSpecificQuery = true;
            } else {
              // Search for plan type keywords
              const keywords = ['life', 'health', 'motor', 'property', 'term', 'vehicle', 'guard'];
              for (const kw of keywords) {
                if (lowerInput.includes(kw)) {
                  filteredPolicies = myPolicies.filter(p => p.policyName.toLowerCase().includes(kw));
                  isSpecificQuery = true;
                  break;
                }
              }
            }

            if (filteredPolicies.length === 0) {
              botReply = `You have registered policies, but I couldn't find one matching your query. Here is a list of your policies:\n\n` + 
                myPolicies.map(p => `• **${p.policyName}** (${p.policyNumber})`).join('\n') + 
                `\n\nAsk me for details on one of these plans!`;
            } else {
              const countText = isSpecificQuery ? "Matching Policy Details:" : `You have **${myPolicies.length}** registered policy(ies). Detailed Overview:`;

              botReply = `${countText}\n\n` + 
                filteredPolicies.map(p => {
                  const start = new Date(p.startDate);
                  const end = new Date(p.endDate);
                  const now = new Date();
                  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                  const percentElapsed = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

                  // Find claims for this policy
                  const policyClaims = myClaims.filter(c => c.policyNumber === p.policyNumber);
                  let claimsText = '';
                  if (policyClaims.length === 0) {
                    claimsText = '❌ *No claims filed against this policy yet.*';
                  } else {
                    claimsText = `⚠️ **Claims History (${policyClaims.length})**:\n` + 
                      policyClaims.map(c => `  • Claim #${c.claimId}: **${c.status}** - ₹${c.claimAmount?.toLocaleString()} (${c.description.substring(0, 40)}...)`).join('\n');
                  }

                  return `📋 **Policy Number**: \`${p.policyNumber}\`
🔹 Plan Name: **${p.policyName}**
🟢 Status: **${p.status}**
💰 Premium Payment: **₹${p.premium?.toFixed(2)}**
🛡️ Sum Assured Limit: **₹${p.sumAssured?.toLocaleString()}**
📅 Coverage Term: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}
⏳ Validity: **${daysLeft} days remaining** (${percentElapsed}% elapsed)
${claimsText}`;
                }).join('\n\n====================\n\n');
            }
          }
        } 
        else if (lowerInput.includes('polic') || lowerInput.includes('plan')) {
          // Fetch all policy types (detailed)
          const res = await api.get('/policy/types');
          const types = res.data;
          botReply = 'We offer several comprehensive, premium insurance plans:\n\n' + 
            types.map(t => `🔹 **${t.policyName}**\n  *Description*: ${t.description}\n  *Coverage Limit*: ₹${t.coverage?.toLocaleString()}\n  *Premium Rate*: ${(t.premiumRate * 100).toFixed(2)}% of sum assured`).join('\n\n');
        } 
        else if (lowerInput.includes('claim')) {
          botReply = 'To file a claim, you can navigate to the **Support & Claims** section on your dashboard and click "File a New Claim". Our team processes most claims within 48 hours!';
        } 
        else if (lowerInput.includes('pay') || lowerInput.includes('premium')) {
          botReply = 'You can pay your pending premiums securely via the **Payments** tab on the left sidebar. We support Credit Cards, UPI, and Net Banking.';
        } 
        else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
          botReply = 'Hi there! How can I assist you with your insurance needs today?';
        } 
        else {
          botReply = 'I am still learning! For specific inquiries, I can help you with information on our **Policies**, filing **Claims**, or making **Premium** payments. Just type a keyword!';
        }
      } catch (err) {
        botReply = 'Sorry, I am having trouble connecting to the knowledge base right now.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '15px',
          right: '15px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <XCircle size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card" style={{
          position: 'fixed',
          bottom: '85px',
          right: '15px',
          width: '350px',
          height: '500px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', margin: 0 }}>Aura Assistant</h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div> Online
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                  color: msg.sender === 'user' ? '#ffffff' : '#f8fafc',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', fontSize: '0.9rem', color: '#94a3b8' }}>
                  Aura is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '16px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(11, 15, 25, 0.4)'
          }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Type a message..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px' }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: input.trim() && !loading ? '#6366f1' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ==========================================
// CUSTOMER DIRECTORY (ADMIN/AGENT ONLY)
// ==========================================
function CustomerManager({ user }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchParams] = useSearchParams();

  // Create/Edit Form State
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  const [error, setError] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);

  const fetchCustomers = () => {
    api.get(`/customer?search=${search}`)
      .then(res => { setCustomers(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
    if (searchParams.get('add') === 'true') {
      setShowAddForm(true);
    }
  }, [search]);

  const handleEditClick = (c) => {
    setEditingCustomer(c);
    setUserId(c.userId || '');
    setName(c.name || '');
    setEmail(c.email || '');
    setDob(c.dob ? c.dob.split('T')[0] : '');
    setGender(c.gender || 'Male');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setAadhaar(c.aadhaar || '');
    setNomineeName(c.nomineeName || '');
    setNomineeRelationship(c.nomineeRelationship || '');
    setShowAddForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
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
      if (editingCustomer) {
        await api.put(`/customer/${editingCustomer.customerId}`, {
          dob,
          gender,
          phone,
          address,
          aadhaar,
          nomineeName,
          nomineeRelationship
        });
        alert('Customer profile updated successfully.');
      } else {
        await api.post('/customer', {
          name,
          email,
          dob,
          gender,
          phone,
          address,
          aadhaar,
          nomineeName,
          nomineeRelationship
        });
        alert('Customer profile created successfully.');
      }
      setShowAddForm(false);
      setEditingCustomer(null);
      fetchCustomers();
      // Clear inputs
      setUserId(''); setName(''); setEmail(''); setDob(''); setPhone(''); setAddress(''); setAadhaar(''); setNomineeName(''); setNomineeRelationship('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing request. Check inputs.');
    }
  };

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer profile? This will remove the linked details but keep the user account.')) return;
    try {
      await api.delete(`/customer/${customerId}`);
      alert('Customer profile deleted successfully.');
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting customer profile.');
    }
  };

  if (loading) return <div>Loading Customer Directory...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Customer Profiles Directory</h2>
        <button className="btn btn-primary" onClick={() => {
          setEditingCustomer(null);
          setUserId(''); setName(''); setEmail(''); setDob(''); setPhone(''); setAddress(''); setAadhaar(''); setNomineeName(''); setNomineeRelationship('');
          setShowAddForm(!showAddForm);
        }}>
          <Plus size={18} /> {showAddForm ? 'View Directory' : 'Create Profile'}
        </button>
      </div>

      {showAddForm ? (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: '600' }}>{editingCustomer ? 'Edit Customer Profile' : 'Create Customer Profile'}</h3>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {!editingCustomer ? (
              <>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input type="text" required className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" required className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@example.com" />
                </div>
              </>
            ) : (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Editing Profile For:</div>
                  <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{editingCustomer.name} ({editingCustomer.email})</strong>
                </div>
              </div>
            )}
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
              <label className="form-label">Address</label>
              <input type="text" required className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City" />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar Card Number</label>
              <input type="text" required className="form-input" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="12-digit UIDAI number" />
            </div>
            <div className="form-group">
              <label className="form-label">Nominee Name</label>
              <input type="text" required className="form-input" value={nomineeName} onChange={e => setNomineeName(e.target.value)} placeholder="Nominee Full Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Nominee Relationship</label>
              <input type="text" required className="form-input" value={nomineeRelationship} onChange={e => setNomineeRelationship(e.target.value)} placeholder="e.g. Spouse, Son, Mother" />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowAddForm(false);
                setEditingCustomer(null);
              }}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Customer Profile</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0px' }}>
          <div style={{ padding: '20px', display: 'flex', gap: '15px' }}>
            <div style={{ flex: '1', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input type="text" className="form-input" style={{ paddingLeft: '48px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers by name, email, phone..." />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cust ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Aadhaar</th>
                  <th>Nominee (Rel)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No customer profiles found.</td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.customerId}>
                      <td>{c.customerId}</td>
                      <td style={{ fontWeight: '600' }}>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.gender}</td>
                      <td>{c.aadhaar}</td>
                      <td>{c.nomineeName} ({c.nomineeRelationship})</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEditClick(c)}>Edit</button>
                          {user?.role === 'Admin' && (
                            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(c.customerId)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// POLICY DESK MANAGEMENT
// ==========================================
function PolicyManager({ user }) {
  const [policies, setPolicies] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Create policy state
  const [customerId, setCustomerId] = useState('');
  const [policyTypeId, setPolicyTypeId] = useState('');
  const [sumAssured, setSumAssured] = useState('');

  // Premium calculation widget states
  const [calcPlanId, setCalcPlanId] = useState('');
  const [calcAmount, setCalcAmount] = useState('');

  const calculateEstimatedPremium = () => {
    if (!calcPlanId || !calcAmount) return '0.00';
    const plan = policyTypes.find(p => p.policyTypeId === parseInt(calcPlanId));
    if (!plan) return '0.00';
    return (parseFloat(calcAmount) * plan.premiumRate).toFixed(2);
  };

  const fetchPolicies = () => {
    api.get('/policy')
      .then(res => { setPolicies(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchExtraData = () => {
    api.get('/policy/types').then(res => setPolicyTypes(res.data)).catch(err => console.error(err));
    api.get('/policy/reminders').then(res => setReminders(res.data)).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPolicies();
    fetchExtraData();
    if (searchParams.get('add') === 'true') {
      setShowAddForm(true);
    }
    if (user?.role === 'Customer') {
      api.get(`/customer/user/${user.userId}`)
         .then(res => setCustomerId(res.data.customerId))
         .catch(e => console.error("Could not fetch customer profile", e));
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/policy', {
        customerId: parseInt(customerId),
        policyTypeId: parseInt(policyTypeId),
        sumAssured: parseFloat(sumAssured)
      });
      setShowAddForm(false);
      fetchPolicies();
      if (user?.role !== 'Customer') setCustomerId('');
      setPolicyTypeId(''); setSumAssured('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error issuing policy.');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this policy?')) return;
    try {
      await api.post(`/policy/${id}/cancel`);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed.');
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.post(`/policy/${id}/renew`);
      alert('Policy renewal initiated. Please pay the premium invoice.');
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed.');
    }
  };

  if (loading) return <div>Loading Policy Desk...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Insurance Policies Desk</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} /> {showAddForm ? 'View Policies' : (user?.role === 'Customer' ? 'Purchase New Policy' : 'Issue Policy')}
        </button>
      </div>

      {/* Quick Premium Estimation Tool */}
      <div className="glass-card animate-fade-in" style={{ marginBottom: '25px', padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#06b6d4' }}>Instant Premium Calculator</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }} className="form-group">
            <label className="form-label">Select Coverage Plan</label>
            <select className="form-select" value={calcPlanId} onChange={e => setCalcPlanId(e.target.value)}>
              <option value="">-- Choose a Plan --</option>
              {policyTypes.map(pt => (
                <option key={pt.policyTypeId} value={pt.policyTypeId}>{pt.policyName} ({pt.premiumRate * 100}%)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }} className="form-group">
            <label className="form-label">Desired Sum Assured (₹)</label>
            <input type="number" className="form-input" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} placeholder="e.g. 100000" />
          </div>
          <div style={{ flex: '1', minWidth: '200px', paddingBottom: '2px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Est. Annual Premium:</span>
              <strong style={{ fontSize: '1.25rem', color: '#06b6d4' }}>₹{calculateEstimatedPremium()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Reminders (expiring soon) */}
      {reminders.length > 0 && (
        <div className="glass-card animate-fade-in" style={{ borderLeft: '4px solid var(--info)', background: 'rgba(59, 130, 246, 0.08)', marginBottom: '25px' }}>
          <h4 style={{ fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="#3b82f6" /> Policy Expiration Alerts (Expiring within 30 days)
          </h4>
          <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
            {reminders.map(rem => (
              <li key={rem.policyId} style={{ marginBottom: '5px' }}>
                Policy <span style={{ color: '#fff', fontWeight: '600' }}>{rem.policyNumber}</span> ({rem.policyName}) belonging to <span style={{ color: '#fff' }}>{rem.customerName}</span> expires in <span style={{ color: '#ef4444', fontWeight: '600' }}>{rem.daysRemaining} days</span> (on {new Date(rem.endDate).toLocaleDateString()}).
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAddForm ? (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: '600' }}>{user?.role === 'Customer' ? 'Purchase New Insurance Policy' : 'Issue New Insurance Policy'}</h3>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            {user?.role !== 'Customer' && (
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input type="number" required className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="e.g. 1" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Policy Plan / Type</label>
              <select className="form-select" required value={policyTypeId} onChange={e => setPolicyTypeId(e.target.value)}>
                <option value="">Select Plan...</option>
                {policyTypes.map(t => (
                  <option key={t.policyTypeId} value={t.policyTypeId}>{t.policyName} (Rate: {t.premiumRate * 100}%)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sum Assured / Coverage Amount (₹)</label>
              <input type="number" required className="form-input" value={sumAssured} onChange={e => setSumAssured(e.target.value)} placeholder="e.g. 50000" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Policy Invoice</button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {/* Policy Types Listing */}
          <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
            {policyTypes.map(t => (
              <div key={t.policyTypeId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--accent-secondary)' }}>
                <h4 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '8px' }}>{t.policyName}</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', flex: '1', marginBottom: '15px' }}>{t.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Premium Rate: <strong>{t.premiumRate * 100}%</strong></span>
                  <span>Coverage: <strong>₹{t.coverage?.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Policies Table */}
          <div className="glass-card" style={{ padding: '0px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Active & Registered Policies</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Policy ID</th>
                    <th>Policy No</th>
                    <th>Plan</th>
                    <th>Holder Name</th>
                    <th>Premium</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No policies issued.</td>
                    </tr>
                  ) : (
                    policies.map(p => (
                      <tr key={p.policyId}>
                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{p.policyId}</td>
                        <td style={{ fontWeight: '700', color: '#06b6d4' }}>{p.policyNumber}</td>
                        <td>{p.policyName}</td>
                        <td>{p.customerName}</td>
                        <td>₹{p.premium?.toFixed(2)}</td>
                        <td>
                          {(() => {
                            const start = new Date(p.startDate);
                            const end = new Date(p.endDate);
                            const now = new Date();
                            const totalTime = end - start;
                            const elapsedTime = now - start;
                            const percentElapsed = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
                            const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                            const isExpiringSoon = p.status === 'Active' && daysRemaining <= 30;

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '160px' }}>
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{start.toLocaleDateString()}</span>
                                  <span>{end.toLocaleDateString()}</span>
                                </div>
                                {p.status === 'Active' && (
                                  <>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${percentElapsed}%`, background: isExpiringSoon ? 'var(--danger)' : 'var(--accent-secondary)', borderRadius: '2px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: isExpiringSoon ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isExpiringSoon ? '700' : 'normal' }}>
                                      {daysRemaining} days remaining {isExpiringSoon && '(Renew soon!)'}
                                    </span>
                                  </>
                                )}
                                {p.status === 'Pending' && <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: '600' }}>Awaiting Initial Premium</span>}
                                {p.status === 'Cancelled' && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Cancelled</span>}
                                {p.status === 'Expired' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expired</span>}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={`badge badge-${p.status?.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {p.status === 'Pending' && user?.role === 'Customer' && (
                              <Link to={`/payments?policyId=${p.policyId}&amount=${p.premium}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Pay Now</Link>
                            )}
                            {p.status === 'Active' && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleRenew(p.policyId)}>Renew</button>
                            )}
                            {p.status !== 'Cancelled' && (
                              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleCancel(p.policyId)}>Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PAYMENT OFFICE MANAGEMENT
// ==========================================
function PaymentManager({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Make payment form state
  const [policyId, setPolicyId] = useState(searchParams.get('policyId') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [mode, setMode] = useState('Credit Card');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [error, setError] = useState('');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Security screen state to obstruct screenshots on focus loss
  const [isBlurred, setIsBlurred] = useState(false);

  const fetchPayments = () => {
    api.get('/payment/history')
      .then(res => { setPayments(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard contents instantly
        alert('PrintScreen shortcut is restricted on the secure Billing Desk.');
        e.preventDefault();
      }
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        alert('Diagnostics inspection is restricted on the secure Billing Desk.');
        e.preventDefault();
      }
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessReceipt(null);
    try {
      const response = await api.post('/payment', {
        policyId: parseInt(policyId),
        amount: parseFloat(amount),
        paymentMode: mode
      });
      setSuccessReceipt(response.data.receipt);
      fetchPayments();
      // Reset form
      setPolicyId(''); setAmount('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing transaction.');
    }
  };

  const handleViewReceipt = async (id) => {
    try {
      const response = await api.get(`/payment/${id}/receipt`);
      setActiveReceipt(response.data);
    } catch (err) {
      alert('Failed to retrieve receipt details.');
    }
  };

  const handleDownloadTextReceipt = (r) => {
    const textContent = `
===================================================
             AURAGUARD INSURANCE RECEIPT           
===================================================
Status: PAYMENT SUCCESSFUL
Transaction ID: ${r.transactionId}
Payment Date:   ${new Date(r.paymentDate).toLocaleString()}
Payment Method: ${r.paymentMode}
Deposited By:   ${r.payerName || 'Customer'}
---------------------------------------------------
Policy Number:  ${r.policyNumber}
Policy Plan:    ${r.policyName}
Customer Name:  ${r.customerName}
Customer Email: ${r.customerEmail}
---------------------------------------------------
AMOUNT PAID:    ₹${r.amount?.toFixed(2)}
===================================================
Thank you for choosing AuraGuard Security.
`;
    const element = document.createElement("a");
    const file = new Blob([textContent.trim()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Receipt-${r.transactionId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return <div>Loading Payments Desk...</div>;

  return (
    <div className="animate-fade-in" style={{ position: 'relative', filter: isBlurred ? 'blur(15px)' : 'none', transition: 'filter 0.2s', userSelect: 'none' }}>
      {isBlurred && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.97)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--border-glass)', textAlign: 'center', padding: '20px' }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '15px' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Secure Session Shield</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px', maxWidth: '320px' }}>Focus lost. Access blurred to protect credit card ledger and transaction parameters from external capture utilities.</p>
        </div>
      )}

      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '25px' }}>Premium Payments & Billing</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Pay Form */}
        <div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>Pay Insurance Invoice</h3>
            
            {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}
            {successReceipt && (
              <div className="glass-card animate-fade-in" style={{ border: '1px dashed var(--success)', background: 'rgba(16, 185, 129, 0.05)', marginBottom: '20px', padding: '16px' }}>
                <h4 style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={18} /> Payment Success</h4>
                <div style={{ fontSize: '0.85rem', marginTop: '10px', color: '#94a3b8' }}>
                  <div>Receipt: <strong>{successReceipt.transactionId}</strong></div>
                  <div>Policy: <strong>{successReceipt.policyNumber}</strong></div>
                  <div>Paid: <strong>₹{successReceipt.amount?.toFixed(2)}</strong></div>
                  <div>Date: <strong>{new Date(successReceipt.paymentDate).toLocaleDateString()}</strong></div>
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '10px' }} onClick={() => handleViewReceipt(successReceipt.paymentId)}>
                    View Detailed Receipt
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePay}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label className="form-label">Policy ID</label>
                </div>
                <input type="number" required className="form-input" value={policyId} onChange={e => setPolicyId(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Premium Amount (₹)</label>
                <input type="number" step="0.01" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 450.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Channel</label>
                <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash Ledger</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>Authorize Premium Payment</button>
            </form>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card" style={{ padding: '0px' }}>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Premium Transaction Ledger</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Policy No</th>
                  <th>Client</th>
                  <th>Paid Amount</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No payments logged.</td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.paymentId}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#6366f1' }}>{p.transactionId}</td>
                      <td style={{ fontWeight: '700' }}>{p.policyNumber}</td>
                      <td>{p.customerName}</td>
                      <td style={{ fontWeight: '600', color: '#10b981' }}>₹{p.amount?.toFixed(2)}</td>
                      <td>{p.paymentMode}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#06b6d4', color: '#06b6d4' }} onClick={() => handleViewReceipt(p.paymentId)}>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Glassmorphic Receipt Modal */}
      {activeReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setActiveReceipt(null)}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '20px' }}>
              <Shield size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px' }}>AURAGUARD RECEIPT</h3>
              <span className="badge badge-active" style={{ marginTop: '5px' }}>Payment Successful</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Transaction ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{activeReceipt.transactionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Payment Date:</span>
                <strong>{new Date(activeReceipt.paymentDate).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Payment Method:</span>
                <strong>{activeReceipt.paymentMode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Policy Number:</span>
                <strong>{activeReceipt.policyNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Policy Plan:</span>
                <strong>{activeReceipt.policyName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: '#94a3b8' }}>Customer Name:</span>
                <strong>{activeReceipt.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Email Address:</span>
                <strong>{activeReceipt.customerEmail}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: '#94a3b8' }}>Deposited By:</span>
                <strong style={{ color: activeReceipt.payerRole === 'Agent' ? '#f59e0b' : activeReceipt.payerRole === 'Admin' ? '#818cf8' : '#3b82f6' }}>{activeReceipt.payerName || 'Customer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '15px', marginTop: '10px', fontSize: '1.2rem' }}>
                <span>Amount Paid:</span>
                <strong style={{ color: '#10b981' }}>₹{activeReceipt.amount?.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleDownloadTextReceipt(activeReceipt)}>
                <Download size={16} /> Save as TXT
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                Print Receipt
              </button>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '15px', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setActiveReceipt(null)}>
              Close & Return to Payments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CLAIMS PROCESSING OFFICE
// ==========================================
function ClaimManager({ user }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [settledClaim, setSettledClaim] = useState(null);

  // File Claim form state
  const [policyId, setPolicyId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [description, setDescription] = useState('');
  const [claimFile, setClaimFile] = useState(null);

  // Expanded panel state
  const [expandedClaimId, setExpandedClaimId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentPrivate, setIsCommentPrivate] = useState(false);
  const [claimDocs, setClaimDocs] = useState([]);

  const fetchClaims = () => {
    api.get('/claim')
      .then(res => { setClaims(res.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    if (!expandedClaimId) {
      setComments([]);
      setClaimDocs([]);
      return;
    }
    
    // Fetch comments
    api.get(`/claim/${expandedClaimId}/comments`)
      .then(res => setComments(res.data))
      .catch(err => console.error("Error fetching comments:", err));

    // Fetch documents linked to claim
    api.get(`/document/claim/${expandedClaimId}`)
      .then(res => setClaimDocs(res.data))
      .catch(err => console.error("Error fetching claim documents:", err));
  }, [expandedClaimId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/claim', {
        policyId: parseInt(policyId),
        customerId: parseInt(customerId),
        incidentDate,
        claimAmount: parseFloat(claimAmount),
        description
      });
      
      const createdClaim = response.data;

      // Upload supporting document if selected
      if (claimFile) {
        const formData = new FormData();
        formData.append('policyId', policyId);
        formData.append('documentType', 'Accident Report');
        formData.append('claimId', createdClaim.claimId);
        formData.append('file', claimFile);

        await api.post('/document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowAddForm(false);
      fetchClaims();
      // Reset form
      setPolicyId(''); setCustomerId(''); setIncidentDate(''); setClaimAmount(''); setDescription(''); setClaimFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error filing claim. Ensure Policy is active.');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/claim/${id}/status`, { status: newStatus });
      if (newStatus === 'Settled') {
        const targetClaim = claims.find(c => c.claimId === id);
        if (targetClaim) {
          setSettledClaim({ ...targetClaim, status: 'Settled' });
        }
      }
      fetchClaims();
      // Refresh expanded state if expanded
      if (expandedClaimId === id) {
        setExpandedClaimId(null);
        setTimeout(() => setExpandedClaimId(id), 100);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/claim/${expandedClaimId}/comments`, { 
        message: newComment,
        isPrivate: isCommentPrivate
      });
      setComments([...comments, res.data]);
      setNewComment('');
      setIsCommentPrivate(false);
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  const handleVerifyDoc = async (docId, newStatus) => {
    const comment = prompt(`Enter audit/verification notes for ${newStatus} status (optional):`);
    try {
      await api.put(`/document/${docId}/verify`, { status: newStatus, reviewComment: comment });
      // Refresh claim documents
      const res = await api.get(`/document/claim/${expandedClaimId}`);
      setClaimDocs(res.data);
    } catch (err) {
      alert("Failed to update document status.");
    }
  };

  const handleDownloadTextReceipt = (c) => {
    const textContent = `
===================================================
             AURAGUARD CLAIM SETTLEMENT           
===================================================
Status: FUNDS SETTLED
Claim ID:       ${c.claimId}
Date Filed:     ${new Date(c.claimDate).toLocaleString()}
---------------------------------------------------
Policy Number:  ${c.policyNumber}
Customer Name:  ${c.customerName}
Incident Cause: ${c.description}
---------------------------------------------------
SETTLEMENT AMT: ₹${c.claimAmount?.toFixed(2)}
===================================================
Thank you for choosing AuraGuard Security.
`;
    const element = document.createElement("a");
    const file = new Blob([textContent.trim()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Settlement-Claim-${c.claimId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return <div>Loading Claim Office...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Claims Clearance Office</h2>
        {user?.role === 'Customer' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> {showAddForm ? 'View My Claims' : 'File Accident/Medical Claim'}
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontWeight: '600' }}>File Insurance Claim</h3>
          </div>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            <div className="form-group">
              <label className="form-label">Policy ID</label>
              <input type="number" required className="form-input" value={policyId} onChange={e => setPolicyId(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div className="form-group">
              <label className="form-label">Customer ID</label>
              <input type="number" required className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Incident</label>
              <input type="date" required className="form-input" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Claim Settlement Amount (₹)</label>
              <input type="number" required className="form-input" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="e.g. 1500" />
            </div>
            <div className="form-group">
              <label className="form-label">Incident Description / Cause</label>
              <textarea required className="form-input" rows="4" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the accident or damage details..." style={{ resize: 'none' }}></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Supporting Verification File (Accident Report, Medical Bills, Invoices - Optional)</label>
              <input type="file" className="form-input" onChange={e => setClaimFile(e.target.files[0])} style={{ padding: '10px' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">File Secure Claim</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0px' }}>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Claims Processing Queue</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>💡 Click any row to expand details, view automated rules check, upload verification files, or chat.</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Policy No</th>
                  <th>Client Name</th>
                  <th>Filed Date</th>
                  <th>Claim Amount</th>
                  <th>Incident Cause</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No claims recorded in queue.</td>
                  </tr>
                ) : (
                  claims.map(c => (
                    <React.Fragment key={c.claimId}>
                      <tr onClick={() => setExpandedClaimId(expandedClaimId === c.claimId ? null : c.claimId)} style={{ cursor: 'pointer', background: expandedClaimId === c.claimId ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{c.claimId}</td>
                        <td style={{ fontWeight: '700' }}>{c.policyNumber}</td>
                        <td>{c.customerName}</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(c.claimDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '600', color: '#ef4444' }}>₹{c.claimAmount?.toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.description}>{c.description}</td>
                        <td>
                          <span className={`badge badge-${c.status?.toLowerCase()?.replace(' ', '-')}`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {(user?.role === 'Admin' || user?.role === 'Agent') && (
                              <>
                                {c.status === 'Pending' && (
                                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(c.claimId, 'Under Review'); }}>Review</button>
                                )}
                                {(c.status === 'Pending' || c.status === 'Under Review') && (
                                  <>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(c.claimId, 'Approved'); }}>Approve</button>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(c.claimId, 'Rejected'); }}>Reject</button>
                                  </>
                                )}
                                {c.status === 'Approved' && (
                                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: user?.role === 'Agent' ? '#f59e0b' : '#6366f1' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(c.claimId, user?.role === 'Agent' ? 'Pending Settlement' : 'Settled'); }}>
                                    {user?.role === 'Agent' ? 'Request Settlement' : 'Settle Funds'}
                                  </button>
                                )}
                                {c.status === 'Pending Settlement' && user?.role === 'Admin' && (
                                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10b981' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(c.claimId, 'Settled'); }}>
                                    Approve Settlement
                                  </button>
                                )}
                                {c.status === 'Pending Settlement' && user?.role === 'Agent' && (
                                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px', fontWeight: '600' }}>
                                    Pending Admin Settle
                                  </span>
                                )}
                              </>
                            )}
                            {c.status === 'Settled' && (
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981' }} onClick={(e) => { e.stopPropagation(); setSettledClaim(c); }}>View Receipt</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedClaimId === c.claimId && (
                        <tr>
                          <td colSpan="8" style={{ background: 'var(--bg-secondary)', padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
                            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                              
                              {/* Left Side: Rules check, Stepper, and Documents */}
                              <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Automated Verification Check</h4>
                                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Rules Engine Result:</span>
                                    <span className={`badge badge-${c.rulesCheckResult?.toLowerCase()}`}>
                                      {c.rulesCheckResult}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{c.rulesCheckReason}</p>
                                </div>

                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '15px', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Claim Processing Timeline</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 10px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                                  <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '0.75rem', fontWeight: '700' }}>1</div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Filing</span>
                                  </div>
                                  <div style={{ height: '2px', background: c.rulesCheckResult === 'FAIL' ? 'var(--danger)' : 'var(--success)', flex: '0.5', marginBottom: '18px' }} />
                                  
                                  <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.rulesCheckResult === 'FAIL' ? 'var(--danger)' : c.rulesCheckResult === 'WARNING' ? 'var(--warning)' : 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '0.75rem', fontWeight: '700' }}>2</div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Auto Check</span>
                                  </div>
                                  <div style={{ height: '2px', background: ['Approved', 'Rejected', 'Settled', 'Pending Settlement'].includes(c.status) ? (c.status === 'Rejected' ? 'var(--danger)' : 'var(--success)') : 'rgba(255,255,255,0.1)', flex: '0.5', marginBottom: '18px' }} />

                                  <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['Approved', 'Rejected', 'Settled', 'Pending Settlement'].includes(c.status) ? (c.status === 'Rejected' ? 'var(--danger)' : 'var(--success)') : 'var(--info)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '0.75rem', fontWeight: '700' }}>3</div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Officer Review</span>
                                  </div>
                                  <div style={{ height: '2px', background: ['Settled', 'Pending Settlement'].includes(c.status) ? 'var(--success)' : 'rgba(255,255,255,0.1)', flex: '0.5', marginBottom: '18px' }} />

                                  <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.status === 'Settled' ? 'var(--success)' : c.status === 'Rejected' ? 'var(--danger)' : c.status === 'Pending Settlement' ? 'var(--warning)' : 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '0.75rem', fontWeight: '700' }}>4</div>
                                    <span style={{ fontSize: '0.7rem', color: c.status === 'Pending Settlement' ? 'var(--warning)' : '#94a3b8' }}>{c.status === 'Pending Settlement' ? 'Awaiting Settle' : 'Settled'}</span>
                                  </div>
                                </div>

                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Invoices & Reports</h4>
                                {claimDocs.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No verification documents attached to this claim.</p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {claimDocs.map(d => (
                                      <div key={d.documentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                        <div>
                                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{d.fileName}</div>
                                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            Type: {d.documentType} | Verification: <strong style={{ color: d.status === 'Verified' ? 'var(--success)' : d.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)' }}>{d.status}</strong>
                                            {d.uploadedByName && (
                                              <span> | Uploaded By: <strong>{d.uploadedByName}</strong> ({d.uploadedByRole})</span>
                                            )}
                                          </div>
                                          {d.reviewComment && <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '2px', fontStyle: 'italic' }}>Audit note: "{d.reviewComment}"</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <a href={`http://localhost:5000${d.downloadUrl}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: '#06b6d4', color: '#06b6d4' }}>Download</a>
                                          {(user?.role === 'Admin' || user?.role === 'Agent') && d.status === 'Pending' && (
                                            <>
                                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleVerifyDoc(d.documentId, 'Verified')}>Verify</button>
                                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleVerifyDoc(d.documentId, 'Rejected')}>Reject</button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right Side: Communication Logs */}
                              <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '15px', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Conversation logs</h4>
                                <div style={{ height: '220px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '15px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {(() => {
                                    const displayedComments = comments.filter(cc => {
                                      if (user?.role === 'Customer') {
                                        return !cc.isPrivate && !cc.IsPrivate;
                                      }
                                      return true;
                                    });
                                    if (displayedComments.length === 0) {
                                      return <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: 'auto' }}>No messages logged. Request information or coordinate below.</p>;
                                    }
                                    return displayedComments.map(cc => {
                                      const isMe = cc.userId?.toString() === user?.userId?.toString();
                                      return (
                                        <div key={cc.claimCommentId} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '8px 12px', borderRadius: '12px', background: isMe ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', gap: '15px', marginBottom: '2px' }}>
                                            <span style={{ fontWeight: '700', color: isMe ? '#06b6d4' : '#fff' }}>{cc.authorName} ({cc.authorRole})</span>
                                            <span>{new Date(cc.commentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          <p style={{ fontSize: '0.8rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>{cc.message}</p>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Suggestions:</span>
                                  {user?.role === 'Customer' ? (
                                    <>
                                      <button type="button" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', cursor: 'pointer' }} onClick={() => setNewComment('Please review the newly uploaded medical invoice in the vault.')}>Invoice Uploaded</button>
                                      <button type="button" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', cursor: 'pointer' }} onClick={() => setNewComment('Hi, when can I expect the claims settlement payout?')}>Payout Status</button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', cursor: 'pointer' }} onClick={() => setNewComment('Verification successful. Settle funds initiated.')}>Approved & Settling</button>
                                      <button type="button" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', cursor: 'pointer' }} onClick={() => setNewComment('Please upload a clear copy of your doctor prescription report.')}>Need Prescription</button>
                                    </>
                                  )}
                                </div>
                                <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" className="form-input" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type a message, answer requests, or detail updates..." style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }} />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}><Send size={16} /></button>
                                  </div>
                                  {(user?.role === 'Admin' || user?.role === 'Agent') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                      <input type="checkbox" id="private-comment" checked={isCommentPrivate} onChange={e => setIsCommentPrivate(e.target.checked)} style={{ cursor: 'pointer' }} />
                                      <label htmlFor="private-comment" style={{ cursor: 'pointer', userSelect: 'none' }}>Internal staff note (hidden from Customer)</label>
                                    </div>
                                  )}
                                </form>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claim Settlement Receipt Modal */}
      {settledClaim && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSettledClaim(null)}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '20px' }}>
              <Shield size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px' }}>CLAIM SETTLEMENT RECEIPT</h3>
              <span className="badge badge-active" style={{ marginTop: '5px' }}>Funds Transferred Successfully</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Claim ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>#{settledClaim.claimId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Filed Date:</span>
                <strong>{new Date(settledClaim.claimDate).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Policy Number:</span>
                <strong>{settledClaim.policyNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: '#94a3b8' }}>Customer Name:</span>
                <strong>{settledClaim.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Incident Detail:</span>
                <strong style={{ maxWidth: '250px', textAlign: 'right' }}>{settledClaim.description}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-glass)', paddingTop: '15px', marginTop: '10px', fontSize: '1.2rem' }}>
                <span>Settlement Amount:</span>
                <strong style={{ color: '#10b981' }}>₹{settledClaim.claimAmount?.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleDownloadTextReceipt(settledClaim)}>
                <Download size={16} /> Save as TXT
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                Print Receipt
              </button>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '15px', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setSettledClaim(null)}>
              Close & Return to Claims
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DOCUMENT VAULT (UPLOAD / DOWNLOAD / VIEW)
// ==========================================
function DocumentVault({ user }) {
  const [documents, setDocuments] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload State
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [documentType, setDocumentType] = useState('Aadhaar');
  const [file, setFile] = useState(null);

  const fetchDocumentsForPolicy = (polId) => {
    if (!polId) return;
    api.get(`/document/policy/${polId}`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    api.get('/policy')
      .then(res => {
        setPolicies(res.data);
        if (res.data.length > 0) {
          setSelectedPolicyId(res.data[0].policyId);
          fetchDocumentsForPolicy(res.data[0].policyId);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePolicyChange = (e) => {
    const polId = e.target.value;
    setSelectedPolicyId(polId);
    if (polId) {
      fetchDocumentsForPolicy(polId);
    } else {
      setDocuments([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('policyId', selectedPolicyId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    try {
      await api.post('/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Document uploaded successfully.');
      fetchDocumentsForPolicy(selectedPolicyId);
      // Clear file input
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading document.');
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await api.delete(`/document/${docId}`);
      fetchDocumentsForPolicy(selectedPolicyId);
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  if (loading) return <div>Opening Document Vault...</div>;

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '25px' }}>Secure Document Vault</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Upload Form */}
        <div>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Upload Compliance File</h3>
            </div>
            
            {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Select Associated Policy</label>
                <select className="form-select" required value={selectedPolicyId} onChange={handlePolicyChange}>
                  {policies.map(p => (
                    <option key={p.policyId} value={p.policyId}>{p.policyNumber} ({p.policyName})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Verification Type</label>
                <select className="form-select" value={documentType} onChange={e => setDocumentType(e.target.value)}>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport File</option>
                  <option value="Medical Report">Medical Clearance Certificate</option>
                  <option value="Accident Report">Police Accident Report</option>
                  <option value="Policy Document">Policy Contract Copy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select File (PDF, PNG, JPG)</label>
                <input type="file" required={!file} className="form-input" onChange={e => setFile(e.target.files[0])} style={{ padding: '10px' }} />
                {file && <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '5px' }}>Loaded: <strong>{file.name}</strong></div>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}><Upload size={18} /> Upload Document</button>
            </form>
          </div>
        </div>

        {/* Documents List */}
        <div className="glass-card" style={{ padding: '0px' }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Compliance Files Vault</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Filter Policy:</span>
              <select className="form-select" style={{ width: '160px', padding: '6px 12px' }} value={selectedPolicyId} onChange={handlePolicyChange}>
                {policies.map(p => (
                  <option key={p.policyId} value={p.policyId}>{p.policyNumber}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Doc ID</th>
                  <th>Verification Type</th>
                  <th>File Name</th>
                  <th>Upload Date</th>
                  <th>Uploaded By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No documents uploaded for this policy.</td>
                  </tr>
                ) : (
                  documents.map(d => (
                    <tr key={d.documentId}>
                      <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{d.documentId}</td>
                      <td style={{ fontWeight: '600' }}>{d.documentType}</td>
                      <td style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{d.fileName}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(d.uploadDate).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {d.uploadedByName ? (
                          <span>
                            <strong>{d.uploadedByName}</strong>{' '}
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              ({d.uploadedByRole})
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>System/Seeded</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <a href={`http://localhost:5000${d.downloadUrl}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#06b6d4', borderColor: '#06b6d4' }}>
                            <Download size={14} /> Download
                          </a>
                          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(d.documentId)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================
function UserProfile({ user }) {
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

function PublicLandingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calculator state
  const [calcPlanId, setCalcPlanId] = useState('');
  const [calcSumAssured, setCalcSumAssured] = useState(250000);
  const [calcAge, setCalcAge] = useState(30);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/policy/types')
      .then(res => {
        setPlans(res.data);
        if (res.data.length > 0) {
          setCalcPlanId(res.data[0].policyTypeId.toString());
        }
      })
      .catch(err => {
        console.error("Error loading public plans:", err);
        // Fallback static plans in case backend is offline
        setPlans([
          { policyTypeId: 1, policyName: 'Life Secure Term Plan', description: 'Comprehensive life cover protecting your family.', coverage: 1000000, premiumRate: 0.005 },
          { policyTypeId: 2, policyName: 'Health Guard Premium', description: 'Premium medical insurance with zero copay.', coverage: 500000, premiumRate: 0.02 },
          { policyTypeId: 3, policyName: 'Motor Vehicle Policy', description: 'Third-party and comprehensive vehicle cover.', coverage: 300000, premiumRate: 0.015 },
          { policyTypeId: 4, policyName: 'Property Protection Plan', description: 'Insurance cover for residential properties.', coverage: 2500000, premiumRate: 0.003 }
        ]);
        setCalcPlanId('1');
      })
      .finally(() => setLoading(false));
  }, []);

  const calculatePremium = () => {
    if (!calcPlanId) return { annual: '0.00', monthly: '0.00' };
    const plan = plans.find(p => p.policyTypeId === parseInt(calcPlanId));
    if (!plan) return { annual: '0.00', monthly: '0.00' };
    
    let rate = plan.premiumRate;
    let base = calcSumAssured * rate;
    
    // Age factors
    if (calcAge > 50) base *= 1.35;
    else if (calcAge > 40) base *= 1.15;
    else if (calcAge < 25) base *= 0.90;

    return {
      annual: base.toFixed(2),
      monthly: (base / 12).toFixed(2)
    };
  };

  const quotes = calculatePremium();

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-main)', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      {/* Public Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border-glass)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #4f46e5, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AuraGuard</span>
        </div>
        <nav style={{ display: 'flex', gap: '30px', fontSize: '0.95rem' }}>
          <a href="#plans" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>Our Plans</a>
          <a href="#calculator" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>Quote Calculator</a>
          <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>Technology</a>
          <a href="#reviews" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>Reviews</a>
        </nav>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => navigate('/register')}>Register</button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '50px', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', fontSize: '0.8rem', color: '#818cf8', fontWeight: '600', marginBottom: '25px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8' }}></span>
            NEXT-GEN WEB INSURANCE
          </div>
          <h1 style={{ fontSize: '3.2rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '20px' }}>
            Securing Your Tomorrow, <span style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Today.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '35px', maxWidth: '520px' }}>
            Experience paperless coverage with zero-latency verification. Backed by automated rules engine checks and cryptographic document cabinets to settle claims within hours.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/register')}>
              Get Instant Quote
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={() => navigate('/login')}>
              Go to Cabinet Portal
            </button>
          </div>
        </div>

        {/* Right side graphic card */}
        <div style={{ position: 'relative' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '30px', borderLeft: '4px solid #4f46e5', background: 'var(--bg-card)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Policy Clearance Ticket</div>
              <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>Active Cover</div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Health Guard Premium</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Policy #POL-564846</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Sum Assured Coverage</span>
                <strong style={{ fontSize: '1.2rem', color: '#06b6d4' }}>₹3,00,000.00</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Rule Check SLA</span>
                <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>PASS (Passed)</strong>
              </div>
            </div>

            {/* Stepper Mock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Filed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Checked</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Audited</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payout</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust statistics row */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', padding: '30px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '150px' }}>
            <h4 style={{ fontSize: '2rem', fontWeight: '800', color: '#6366f1', margin: 0 }}>99.8%</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Claims Settled</span>
          </div>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '150px' }}>
            <h4 style={{ fontSize: '2rem', fontWeight: '800', color: '#06b6d4', margin: 0 }}>&lt; 24 Hrs</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average Settle SLA</span>
          </div>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '150px' }}>
            <h4 style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', margin: 0 }}>₹4.5Cr+</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assured Coverage</span>
          </div>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '150px' }}>
            <h4 style={{ fontSize: '2rem', fontWeight: '800', color: '#3b82f6', margin: 0 }}>100%</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Digital Document Vault</span>
          </div>
        </div>
      </section>

      {/* Plan list Section */}
      <section id="plans" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>Choose Your Coverage Plan</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', marginBottom: '50px' }}>Explore detailed specifications of our premium digital insurance plans.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading plans...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px' }}>
            {plans.map(p => {
              const iconsMap = {
                1: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                2: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                3: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
                4: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              };

              const borderGlowMap = {
                1: 'rgba(99, 102, 241, 0.15)',
                2: 'rgba(6, 182, 212, 0.15)',
                3: 'rgba(16, 185, 129, 0.15)',
                4: 'rgba(59, 130, 246, 0.15)'
              };

              const accentMap = {
                1: '#6366f1',
                2: '#06b6d4',
                3: '#10b981',
                4: '#3b82f6'
              };

              return (
                <div key={p.policyTypeId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderTop: `4px solid ${accentMap[p.policyTypeId] || '#6366f1'}`, background: borderGlowMap[p.policyTypeId] || 'rgba(30, 41, 59, 0.4)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: accentMap[p.policyTypeId] || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    {iconsMap[p.policyTypeId] || iconsMap[1]}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px' }}>{p.policyName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>{p.description}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Max Coverage:</span>
                      <strong style={{ color: 'var(--text-main)' }}>₹{p.coverage?.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Premium Rate:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{(p.premiumRate * 100).toFixed(2)}%</strong>
                    </div>
                  </div>
                  
                  <button className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.85rem', marginTop: '20px', width: '100%', background: accentMap[p.policyTypeId] }} onClick={() => { setCalcPlanId(p.policyTypeId.toString()); document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' }); }}>
                    Estimate Quote
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quote Calculator Section */}
      <section id="calculator" style={{ padding: '80px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>Instant Quote Calculator</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', marginBottom: '50px' }}>Find out your annual and monthly premium quotes in seconds.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div className="glass-card" style={{ padding: '30px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Select Coverage Plan</label>
                <select className="form-select" value={calcPlanId} onChange={e => setCalcPlanId(e.target.value)}>
                  {plans.map(p => (
                    <option key={p.policyTypeId} value={p.policyTypeId}>{p.policyName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Sum Assured Coverage (₹)</label>
                  <strong style={{ color: '#06b6d4' }}>₹{calcSumAssured.toLocaleString()}</strong>
                </div>
                <input type="range" min="10000" max="1000000" step="5000" value={calcSumAssured} onChange={e => setCalcSumAssured(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#6366f1', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>₹10,000</span>
                  <span>₹10,00,000</span>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Client Age (Years)</label>
                  <strong style={{ color: '#06b6d4' }}>{calcAge} Yrs</strong>
                </div>
                <input type="range" min="18" max="75" value={calcAge} onChange={e => setCalcAge(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#6366f1', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>18 Years</span>
                  <span>75 Years</span>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="glass-card" style={{ padding: '30px', borderLeft: '4px solid #06b6d4', background: 'rgba(6, 182, 212, 0.03)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', color: '#06b6d4' }}>Quote Breakdown</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monthly Premium Quote:</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--text-main)' }}>₹{quotes.monthly}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Annual Premium Quote:</span>
                  <strong style={{ fontSize: '1.5rem', color: '#06b6d4' }}>₹{quotes.annual}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '25px' }}>
                *Quote estimate calculated with age risk modifiers. Taxes and compliance verification fees are included. Settle claim processing is guaranteed within 24 hours.
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => navigate('/register')}>
                Purchase Coverage Now
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Technology / Features Highlights */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>Professional Automation Engine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', marginBottom: '50px' }}>Built with state-of-the-art Web technologies to resolve traditional inefficiencies.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ color: '#6366f1' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Automated Verification Check</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Our rules engine audits claims in real-time. It cross-checks policy status, filing windows, and coverage limits instantly.</p>
            </div>
          </div>
          <div className="glass-card" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ color: '#06b6d4' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/></svg></div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Advanced Analytics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Track premium collections, retention rates, and average settlement times on a high-fidelity visual dashboard.</p>
            </div>
          </div>
          <div className="glass-card" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ color: '#10b981' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Document Audit Vault</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Compliance documents and accident invoices are linked directly to policies and audited through quick verify/reject tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews/Testimonials section */}
      <section id="reviews" style={{ padding: '80px 40px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>Praised by Our Clients</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', marginBottom: '50px' }}>Read actual reviews from customers using the AuraGuard digital platform.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="glass-card" style={{ position: 'relative' }}>
              <div style={{ color: '#eab308', display: 'flex', gap: '4px', marginBottom: '15px' }}>
                {[...Array(5)].map((_, i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '20px', fontStyle: 'italic' }}>
                "My auto claim was verified by the engine in seconds, and my medical clearance documents were reviewed by the agent in under 2 hours. Settle payout arrived next morning. AuraGuard is absolutely seamless!"
              </p>
              <div style={{ fontSize: '0.85rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Praveen</strong>
                <span style={{ color: 'var(--text-muted)' }}>Client since 2025</span>
              </div>
            </div>

            <div className="glass-card" style={{ position: 'relative' }}>
              <div style={{ color: '#eab308', display: 'flex', gap: '4px', marginBottom: '15px' }}>
                {[...Array(5)].map((_, i) => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '20px', fontStyle: 'italic' }}>
                "Completing KYC onboarding took just a single minute, and buying my first Property Protection policy was entirely digital. The support chat thread inside my claims cabinet is also extremely convenient."
              </p>
              <div style={{ fontSize: '0.85rem' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Vignesh</strong>
                <span style={{ color: 'var(--text-muted)' }}>Client since 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', padding: '50px 40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>AuraGuard</span>
            </div>
            <p style={{ maxWidth: '280px', lineHeight: '1.5' }}>Advanced automated web underwriting and client cabinet for digital-first insurance products.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: '700', marginBottom: '15px' }}>Policy Products</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>Life Secure Plan</span>
              <span>Health Guard Premium</span>
              <span>Motor Vehicle Coverage</span>
              <span>Property Protection</span>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main)', fontWeight: '700', marginBottom: '15px' }}>Security & Compliance</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>SSL Secure Encryption</span>
              <span>JWT Signed Tokens</span>
              <span>HIPAA Compliant Vault</span>
              <span>SOOC-2 Certified</span>
            </div>
          </div>
        </div>
        <div style={{ width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', maxWidth: '1200px', margin: '0 auto' }}>
          <span>© 2026 AuraGuard Insurance. All rights reserved.</span>
          <span>Designed with high-fidelity glassmorphism themes.</span>
        </div>
      </footer>
    </div>
  );
}
