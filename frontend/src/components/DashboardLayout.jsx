import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, User, TrendingUp, Users, FileText, CreditCard, 
  AlertTriangle, FileUp, LogOut, Calendar, Moon, Sun, Bell, ShieldCheck,
  Volume2, VolumeX
} from 'lucide-react';
import api from '../api';
import SidebarLink from './SidebarLink';
import ChatbotWidget from './ChatbotWidget';
import { sfx } from '../utils/soundEffects';

export default function DashboardLayout({ user, onLogout, theme, toggleTheme, children }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(sfx.enabled);
  const navigate = useNavigate();

  const handleToggleSound = () => {
    const newState = sfx.toggle();
    setSoundEnabled(newState);
  };

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

          {user?.role === 'Admin' && (
            <SidebarLink to="/audit-logs" icon={<ShieldCheck size={18} />} label="Security & Audit" />
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <div className="badge badge-active">System Online</div>

            {/* Audio Effects Toggle */}
            <button 
              onClick={handleToggleSound} 
              style={{ background: 'none', border: 'none', color: soundEnabled ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', transition: 'background 0.2s, color 0.2s' }}
              title={`Audio Effects: ${soundEnabled ? 'Enabled (Click to mute)' : 'Muted (Click to enable)'}`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={() => { sfx.playPop(); toggleTheme(); }} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'none';
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer', padding: '4px' }} onClick={() => { sfx.playPop(); setShowNotif(!showNotif); }}>
              <Bell size={20} color={notifications.length > 0 ? '#f59e0b' : '#94a3b8'} style={{ transition: 'color 0.2s' }} />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444' }}></span>
              )}
            </div>

            {showNotif && (
              <div className="glass-card animate-fade-in" style={{ position: 'absolute', top: '45px', right: '0', width: '340px', maxHeight: '420px', overflowY: 'auto', zIndex: 1100, padding: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', transformOrigin: 'top right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>System Notifications</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{notifications.length} alerts</span>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {['all', 'policy', 'claim'].map(f => (
                    <button
                      key={f}
                      onClick={() => { setNotifFilter(f); sfx.playPop(); }}
                      style={{
                        background: notifFilter === f ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: notifFilter === f ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                        color: notifFilter === f ? '#6366f1' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {(() => {
                  const filtered = notifications.filter(n => notifFilter === 'all' || n.type === notifFilter);
                  if (filtered.length === 0) {
                    return <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No notifications in this view.</p>;
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filtered.map(n => (
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
                  );
                })()}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: '1', padding: '30px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Floating Chatbot Widget for Customers */}
      {user?.role === 'Customer' && <ChatbotWidget user={user} />}
    </div>
  );
}
