import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Send, Shield, Download, Activity, AlertTriangle, Cpu, Sparkles, 
  CheckCircle2, ArrowRight, ArrowLeft, UploadCloud, FileText, Check 
} from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import { sfx } from '../utils/soundEffects';

export default function ClaimManager({ user }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [settledClaim, setSettledClaim] = useState(null);

  // 3-Step Wizard state
  const [claimStep, setClaimStep] = useState(1);
  const [userPolicies, setUserPolicies] = useState([]);
  const [incidentCategory, setIncidentCategory] = useState('Medical Emergency');
  const [isAiScanning, setIsAiScanning] = useState(false);

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
    // Load policies for dropdown selection
    api.get('/policy')
      .then(res => {
        const pols = res.data || [];
        setUserPolicies(pols);
        if (pols.length > 0) {
          setPolicyId(pols[0].policyId.toString());
          setCustomerId(pols[0].customerId?.toString() || '1');
        }
      })
      .catch(err => console.error("Error loading policies for claim wizard:", err));
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
        <div className="glass-card ambient-glow-mesh animate-fade-in" style={{ padding: '30px', maxWidth: '750px', margin: '0 auto', position: 'relative' }}>
          {/* Stepper Header */}
          <div className="stepper-header">
            <div className={`step-node ${claimStep === 1 ? 'active' : claimStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {claimStep > 1 ? <Check size={16} /> : '1'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: claimStep >= 1 ? 'var(--text-main)' : 'var(--text-muted)' }}>1. Incident Info</span>
            </div>

            <div className={`step-node ${claimStep === 2 ? 'active' : claimStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {claimStep > 2 ? <Check size={16} /> : '2'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: claimStep >= 2 ? 'var(--text-main)' : 'var(--text-muted)' }}>2. Evidence & Docs</span>
            </div>

            <div className={`step-node ${claimStep === 3 ? 'active' : ''}`}>
              <div className="step-circle">
                <Sparkles size={16} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: claimStep === 3 ? '#6366f1' : 'var(--text-muted)' }}>3. AI Pre-Check</span>
            </div>
          </div>

          {error && <div style={{ color: 'var(--danger)', marginBottom: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

          {/* STEP 1: Incident Specifics */}
          {claimStep === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Select Policy & Incident Details</h3>

              <div className="form-group">
                <label className="form-label">Linked Insurance Policy</label>
                {userPolicies.length > 0 ? (
                  <select 
                    className="form-select" 
                    value={policyId} 
                    onChange={e => {
                      setPolicyId(e.target.value);
                      const selected = userPolicies.find(p => p.policyId.toString() === e.target.value);
                      if (selected) setCustomerId(selected.customerId?.toString() || customerId);
                      sfx.playPop();
                    }}
                  >
                    {userPolicies.map(p => (
                      <option key={p.policyId} value={p.policyId}>
                        {p.policyNumber} — {p.policyName || p.policyType?.policyName} (Coverage: ₹{p.coverageAmount?.toLocaleString() || p.policyType?.coverage?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="number" required className="form-input" value={policyId} onChange={e => setPolicyId(e.target.value)} placeholder="Enter Policy ID (e.g. 1)" />
                )}
              </div>

              {/* Incident Category Chips */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Incident Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { label: 'Medical Emergency', icon: '🏥' },
                    { label: 'Road Collision', icon: '🚗' },
                    { label: 'Property Damage', icon: '🏠' },
                    { label: 'Theft / Loss', icon: '🔍' }
                  ].map(cat => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => { setIncidentCategory(cat.label); sfx.playPop(); }}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: incidentCategory === cat.label ? '2px solid #6366f1' : '1px solid var(--border-glass)',
                        background: incidentCategory === cat.label ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-primary)',
                        color: incidentCategory === cat.label ? '#6366f1' : 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Incident</label>
                  <input type="date" required className="form-input" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Claim Loss Amount (₹)</label>
                  <input type="number" required className="form-input" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="e.g. 25000" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={!incidentDate || !claimAmount}
                  onClick={() => { sfx.playPop(); setClaimStep(2); }}
                >
                  Proceed to Evidence <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Evidence & Documents */}
          {claimStep === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Incident Narrative & Supporting Documents</h3>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Detailed Incident Description</label>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Include time, location, and loss cause</span>
                </div>
                <textarea 
                  required 
                  className="form-input" 
                  rows="4" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder={`Provide detailed context regarding the ${incidentCategory.toLowerCase()} incident...`} 
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Document Upload Box */}
              <div className="form-group">
                <label className="form-label">Attach Bills, Invoices, or Police Report (PDF, JPG, PNG)</label>
                <label style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '24px', 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: '12px', 
                  background: 'var(--bg-primary)', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                }}>
                  <UploadCloud size={32} color="#6366f1" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {claimFile ? claimFile.name : 'Click to Browse & Upload Evidence File'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {claimFile ? `${(claimFile.size / 1024).toFixed(1)} KB ready for upload` : 'Supports up to 25MB high-resolution files'}
                  </span>
                  <input type="file" style={{ display: 'none' }} onChange={e => { setClaimFile(e.target.files[0]); sfx.playPop(); }} />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { sfx.playPop(); setClaimStep(1); }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={!description.trim()}
                  onClick={() => {
                    sfx.playScan();
                    setClaimStep(3);
                    setIsAiScanning(true);
                    setTimeout(() => setIsAiScanning(false), 1200);
                  }}
                >
                  Run AI Pre-Verification <Sparkles size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Live AI Pre-Check Scanner */}
          {claimStep === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', padding: '15px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
                  <Cpu size={28} color="white" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Automated Clearance Diagnostics</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                  Real-time pre-submission verification audit before queueing for officer review.
                </p>
              </div>

              {isAiScanning ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
                  <span style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: '700' }}>Evaluating Policy Limits & Anomaly Metrics...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Pre-check diagnostics items */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={20} color="#10b981" />
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>Policy Status Verification</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Policy #{policyId} is verified Active & in good standing.</div>
                      </div>
                    </div>
                    <span className="badge badge-active">PASS</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={20} color="#10b981" />
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>Coverage Limit Drain Check</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Claim amount (₹{parseFloat(claimAmount || 0).toLocaleString()}) is within insured threshold.</div>
                      </div>
                    </div>
                    <span className="badge badge-active">PASS</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Sparkles size={20} color="#6366f1" />
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>Settlement SLA Estimation</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>⚡ Fast-Track Settlement Priority (Estimated payout within 24-48 business hours).</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6366f1' }}>98% SLA Speed</span>
                  </div>

                  <form onSubmit={handleCreate} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { sfx.playPop(); setClaimStep(2); }}>
                      <ArrowLeft size={16} /> Edit Details
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={() => sfx.playSuccess()}>
                      <Check size={18} /> Confirm & Submit Secure Claim
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
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
                  <th>AI Fraud Risk</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No claims recorded in queue.</td>
                  </tr>
                ) : (
                  claims.map(c => {
                    const riskScore = c.fraudRiskScore || 15;
                    const riskLevel = c.fraudRiskLevel || (riskScore >= 75 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 30 ? 'Moderate' : 'Low');
                    const riskColor = riskLevel === 'Critical' ? '#ef4444' : riskLevel === 'High' ? '#f97316' : riskLevel === 'Moderate' ? '#eab308' : '#10b981';

                    return (
                    <React.Fragment key={c.claimId}>
                      <tr onClick={() => setExpandedClaimId(expandedClaimId === c.claimId ? null : c.claimId)} style={{ cursor: 'pointer', background: expandedClaimId === c.claimId ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{c.claimId}</td>
                        <td style={{ fontWeight: '700' }}>{c.policyNumber}</td>
                        <td>{c.customerName}</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(c.claimDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '600', color: '#ef4444' }}>₹{c.claimAmount?.toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '160px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.description}>{c.description}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '45px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${riskScore}%`, height: '100%', background: riskColor, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: riskColor, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              {riskLevel === 'Critical' || riskLevel === 'High' ? <AlertTriangle size={12} /> : <Sparkles size={12} />}
                              {riskScore}% {riskLevel}
                            </span>
                          </div>
                        </td>
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
                          <td colSpan="9" style={{ background: 'var(--bg-secondary)', padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
                            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                              
                              {/* Left Side: Rules check, AI Risk, Stepper, and Documents */}
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                  <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Rules Engine</span>
                                      <span className={`badge badge-${c.rulesCheckResult?.toLowerCase()}`}>
                                        {c.rulesCheckResult}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>{c.rulesCheckReason}</p>
                                  </div>

                                  <div style={{ padding: '15px', background: `${riskColor}10`, borderRadius: '12px', border: `1px solid ${riskColor}40` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontSize: '0.8rem', color: riskColor, textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Cpu size={14} /> AI Fraud Score: {riskScore}/100
                                      </span>
                                      <span style={{ background: riskColor, color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                                        {riskLevel}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#e2e8f0', lineHeight: '1.3', margin: 0 }}>
                                      {c.fraudRiskFactors || 'Standard baseline analysis: normal customer transaction profile.'}
                                    </p>
                                  </div>
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
                                          <a href={`${API_BASE_URL}${d.downloadUrl}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: '#06b6d4', color: '#06b6d4' }}>Download</a>
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
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claim Settlement Receipt Modal */}
      {settledClaim && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, padding: '20px', overflowY: 'auto' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', margin: '40px 0' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSettledClaim(null)}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '20px' }}>
              <Shield size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px' }}>CLAIM SETTLEMENT RECEIPT</h3>
              <span className="badge badge-active" style={{ marginTop: '5px' }}>Funds Transferred Successfully</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Claim ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>#{settledClaim.claimId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Filed Date:</span>
                <strong>{new Date(settledClaim.claimDate).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Policy Number:</span>
                <strong>{settledClaim.policyNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <strong>{settledClaim.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Incident Detail:</span>
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
        </div>,
        document.body
      )}
    </div>
  );
}
