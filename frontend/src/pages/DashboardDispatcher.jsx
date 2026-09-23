import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, AlertTriangle, CreditCard, Calendar, 
  TrendingUp, Shield, Download, Plus, CheckCircle2,
  Sparkles, Cpu, BarChart3, FileSpreadsheet, Layers, ArrowRight,
  Heart, Car, Home, Activity, Check, X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import api, { API_BASE_URL } from '../api';
import { sfx } from '../utils/soundEffects';

export default function DashboardDispatcher({ user }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Administrative Intelligence Center</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <FileSpreadsheet size={16} color="#06b6d4" /> Summary CSV
          </button>
          <a href={`${API_BASE_URL}/api/reports/export/payments`} download className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Download size={16} color="#10b981" /> Payments Ledger
          </a>
          <a href={`${API_BASE_URL}/api/reports/export/claims`} download className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Download size={16} color="#f59e0b" /> Claims Audit CSV
          </a>
        </div>
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

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#6366f1" /> Historical Collection Trend
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Past 6 Months</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data?.revenueChart || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#10b981" /> 6-Month Projected Growth
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
              +3% MoM Organic
            </span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={data?.projectionChart || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }} />
                <Line type="monotone" dataKey="projectedRevenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedAgents.map(agent => (
                  <tr key={agent.userId} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#818cf8', fontWeight: '600' }}>#{agent.userId}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-main)' }}>{agent.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{agent.email}</td>
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
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Category</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.auditLogId} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-main)' }}>{log.agentName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(129, 140, 248, 0.3)' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{log.details}</td>
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
  const [aiRecs, setAiRecs] = useState([]);
  const [myPolicies, setMyPolicies] = useState([]);

  // Profile Form State
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  useEffect(() => {
    api.get(`/customer/user/${user.userId}`)
      .then(() => {
        api.get('/reports/customer-dashboard')
          .then(res => { setData(res.data); })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));

        api.get('/ai/recommendations')
          .then(res => setAiRecs(res.data?.recommendations || []))
          .catch(err => console.error("Error fetching AI recommendations:", err));

        api.get('/policy')
          .then(res => setMyPolicies(res.data || []))
          .catch(err => console.error("Error fetching customer policies:", err));
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

  // Compute 4-Pillar Health Score
  const activePols = myPolicies.filter(p => p.status === 'Active');
  const hasLife = activePols.some(p => p.policyName?.toLowerCase().includes('life') || p.policyType?.policyName?.toLowerCase().includes('life'));
  const hasHealth = activePols.some(p => p.policyName?.toLowerCase().includes('health') || p.policyType?.policyName?.toLowerCase().includes('health'));
  const hasMotor = activePols.some(p => p.policyName?.toLowerCase().includes('motor') || p.policyName?.toLowerCase().includes('vehicle'));
  const hasProperty = activePols.some(p => p.policyName?.toLowerCase().includes('property') || p.policyName?.toLowerCase().includes('home'));

  const pillarsCoveredCount = (hasLife ? 1 : 0) + (hasHealth ? 1 : 0) + (hasMotor ? 1 : 0) + (hasProperty ? 1 : 0);
  const healthScore = Math.round((pillarsCoveredCount / 4) * 100);
  const scoreColor = healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444';

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
              <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Premium Pending Payment</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>You have policies awaiting activation payment. Make a payment now to stay covered.</p>
            </div>
          </div>
          <Link to="/payments" className="btn btn-primary" onClick={() => sfx.playPop()}>Pay Premium Due</Link>
        </div>
      )}

      {/* 4-Pillar Protection Health Radar */}
      <div className="glass-card ambient-glow-mesh" style={{ padding: '24px', marginBottom: '25px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Activity size={20} color="#10b981" /> 360° Protection Health Radar
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
              Live evaluation of your household risk defense across the 4 foundational insurance pillars.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: scoreColor, background: `${scoreColor}15`, padding: '4px 12px', borderRadius: '12px', border: `1px solid ${scoreColor}40` }}>
              Protection Score: {healthScore}%
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Pillar 1: Health */}
          <div style={{ padding: '16px', borderRadius: '12px', background: hasHealth ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${hasHealth ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={18} color={hasHealth ? '#10b981' : '#ef4444'} />
                <strong style={{ fontSize: '0.9rem' }}>Health Shield</strong>
              </div>
              <span className={`badge badge-${hasHealth ? 'active' : 'cancelled'}`} style={{ fontSize: '0.65rem' }}>
                {hasHealth ? 'Active' : 'Uncovered'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {hasHealth ? 'Medical hospitalization & zero-copay protection enabled.' : 'Missing medical protection. Hospitalization costs at risk.'}
            </p>
            {!hasHealth && (
              <Link to="/policies?add=true" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.4)' }} onClick={() => sfx.playPop()}>
                + Add Health Shield
              </Link>
            )}
          </div>

          {/* Pillar 2: Life */}
          <div style={{ padding: '16px', borderRadius: '12px', background: hasLife ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${hasLife ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color={hasLife ? '#10b981' : '#ef4444'} />
                <strong style={{ fontSize: '0.9rem' }}>Life Term</strong>
              </div>
              <span className={`badge badge-${hasLife ? 'active' : 'cancelled'}`} style={{ fontSize: '0.65rem' }}>
                {hasLife ? 'Active' : 'Uncovered'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {hasLife ? 'Family financial security & nominee cover activated.' : 'No term life policy linked. Nominee protection gap.'}
            </p>
            {!hasLife && (
              <Link to="/policies?add=true" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.4)' }} onClick={() => sfx.playPop()}>
                + Add Life Cover
              </Link>
            )}
          </div>

          {/* Pillar 3: Motor */}
          <div style={{ padding: '16px', borderRadius: '12px', background: hasMotor ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${hasMotor ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color={hasMotor ? '#10b981' : '#ef4444'} />
                <strong style={{ fontSize: '0.9rem' }}>Motor Vehicle</strong>
              </div>
              <span className={`badge badge-${hasMotor ? 'active' : 'cancelled'}`} style={{ fontSize: '0.65rem' }}>
                {hasMotor ? 'Active' : 'Uncovered'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {hasMotor ? 'Accidental damage & third-party liability covered.' : 'Vehicles uninsured against road collisions or theft.'}
            </p>
            {!hasMotor && (
              <Link to="/policies?add=true" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.4)' }} onClick={() => sfx.playPop()}>
                + Add Motor Shield
              </Link>
            )}
          </div>

          {/* Pillar 4: Property */}
          <div style={{ padding: '16px', borderRadius: '12px', background: hasProperty ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${hasProperty ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={18} color={hasProperty ? '#10b981' : '#ef4444'} />
                <strong style={{ fontSize: '0.9rem' }}>Home & Property</strong>
              </div>
              <span className={`badge badge-${hasProperty ? 'active' : 'cancelled'}`} style={{ fontSize: '0.65rem' }}>
                {hasProperty ? 'Active' : 'Uncovered'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {hasProperty ? 'Structural & residential asset indemnity secured.' : 'Residential property exposed to natural perils or fire.'}
            </p>
            {!hasProperty && (
              <Link to="/policies?add=true" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.4)' }} onClick={() => sfx.playPop()}>
                + Add Property Cover
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* AI Personalized Recommendations Carousel */}
      {aiRecs.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Sparkles size={20} color="#6366f1" /> AI Intelligent Coverage Recommendations
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
                Tailored policy shields computed using your profile age, nominee beneficiaries, and historical safety indices.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
              Dynamic AI Match
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {aiRecs.map(rec => (
              <div key={rec.policyTypeId} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: rec.matchScore >= 85 ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{rec.policyName}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: rec.matchScore >= 85 ? '#10b981' : '#6366f1', background: rec.matchScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                      {rec.matchScore}% Match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '12px' }}>
                    {rec.rationale}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Estimated Premium</span>
                    <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>₹{rec.estimatedMonthlyPremium?.toLocaleString()}/mo</strong>
                  </div>
                  <Link to="/policies?add=true" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {rec.isOwned ? 'Upgrade' : 'Get Policy'} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
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
