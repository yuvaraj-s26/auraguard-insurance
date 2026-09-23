import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Info } from 'lucide-react';
import api from '../api';

export default function PolicyManager({ user }) {
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
                              <Link to={`/payments?policyId=${p.policyId}&amount=${p.premium}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Pay Invoice
                              </Link>
                            )}
                            {p.status === 'Active' && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#f59e0b', color: '#f59e0b' }} onClick={() => handleRenew(p.policyId)}>
                                1-Click Renew
                              </button>
                            )}
                            {p.status !== 'Cancelled' && (
                              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleCancel(p.policyId)}>
                                Cancel
                              </button>
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
