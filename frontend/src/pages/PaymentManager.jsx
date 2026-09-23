import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Shield, Download, CreditCard, QrCode, Building2, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import api, { API_BASE_URL } from '../api';

export default function PaymentManager({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Payment form state
  const [policyId, setPolicyId] = useState(searchParams.get('policyId') || '');
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [mode, setMode] = useState('UPI');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [error, setError] = useState('');

  // Interactive Checkout Gateway Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutTab, setCheckoutTab] = useState('upi'); // upi, card, netbanking
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('4532 8921 7842 1093');
  const [cardExpiry, setCardExpiry] = useState('10/28');
  const [cardCvv, setCardCvv] = useState('842');
  const [upiId, setUpiId] = useState(`${user?.email?.split('@')[0] || 'user'}@okhdfcbank`);
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [gatewayStepText, setGatewayStepText] = useState('');

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
        navigator.clipboard.writeText('');
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

  const handleOpenCheckout = (e) => {
    e.preventDefault();
    if (!policyId || !amount || parseFloat(amount) <= 0) {
      setError('Please provide a valid Policy ID and Amount.');
      return;
    }
    setError('');
    setShowCheckoutModal(true);
  };

  const handleExecutePayment = async () => {
    setIsProcessingGateway(true);
    setGatewayStepText('Connecting to Secure Gateway...');
    
    await new Promise(r => setTimeout(r, 700));
    setGatewayStepText('Verifying 3D Secure / UPI Authorization...');
    
    await new Promise(r => setTimeout(r, 800));
    setGatewayStepText('Finalizing Settlement...');

    try {
      const channel = checkoutTab === 'upi' ? 'UPI' : checkoutTab === 'card' ? 'Credit Card' : 'Net Banking';
      const response = await api.post('/payment', {
        policyId: parseInt(policyId),
        amount: parseFloat(amount),
        paymentMode: channel
      });

      setShowCheckoutModal(false);
      setIsProcessingGateway(false);
      setSuccessReceipt(response.data.receipt);
      fetchPayments();
      setPolicyId('');
      setAmount('');
    } catch (err) {
      setIsProcessingGateway(false);
      setShowCheckoutModal(false);
      setError(err.response?.data?.message || 'Transaction authorization failed.');
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Premium Payments & Billing Gateway</h2>
        <a href={`${API_BASE_URL}/api/reports/export/payments`} download className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Download size={16} /> Export Transaction Ledger
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Pay Form */}
        <div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#10b981" /> Pay Insurance Invoice
            </h3>
            
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

            <form onSubmit={handleOpenCheckout}>
              <div className="form-group">
                <label className="form-label">Policy ID</label>
                <input type="number" required className="form-input" value={policyId} onChange={e => setPolicyId(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Premium Amount (₹)</label>
                <input type="number" step="0.01" required className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 450.00" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CreditCard size={18} /> Launch Checkout Gateway
              </button>
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
                      <td>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)' }}>
                          {p.paymentMode}
                        </span>
                      </td>
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

      {/* Interactive Checkout Modal */}
      {showCheckoutModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, color: '#818cf8', fontWeight: '700' }}>AuraGuard Checkout</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.3rem', fontWeight: '800' }}>Pay Premium ₹{parseFloat(amount || 0).toLocaleString()}</h3>
              </div>
              <button onClick={() => !isProcessingGateway && setShowCheckoutModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                &times;
              </button>
            </div>

            {/* Payment Channel Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
              <button type="button" onClick={() => setCheckoutTab('upi')} style={{ padding: '14px', background: checkoutTab === 'upi' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: 'none', borderBottom: checkoutTab === 'upi' ? '2px solid #6366f1' : '2px solid transparent', color: checkoutTab === 'upi' ? '#818cf8' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <QrCode size={16} /> UPI & QR
              </button>
              <button type="button" onClick={() => setCheckoutTab('card')} style={{ padding: '14px', background: checkoutTab === 'card' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: 'none', borderBottom: checkoutTab === 'card' ? '2px solid #6366f1' : '2px solid transparent', color: checkoutTab === 'card' ? '#818cf8' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CreditCard size={16} /> Cards
              </button>
              <button type="button" onClick={() => setCheckoutTab('netbanking')} style={{ padding: '14px', background: checkoutTab === 'netbanking' ? 'rgba(99, 102, 241, 0.15)' : 'transparent', border: 'none', borderBottom: checkoutTab === 'netbanking' ? '2px solid #6366f1' : '2px solid transparent', color: checkoutTab === 'netbanking' ? '#818cf8' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Building2 size={16} /> NetBanking
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '24px' }}>
              {checkoutTab === 'upi' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '150px', height: '150px', background: '#fff', borderRadius: '12px', padding: '10px', margin: '0 auto 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #6366f1' }}>
                    <QrCode size={110} color="#1e1b4b" />
                    <span style={{ fontSize: '0.65rem', color: '#1e1b4b', fontWeight: '800' }}>SCAN TO PAY ₹{amount}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '15px' }}>Scan with GPay, PhonePe, Paytm or enter UPI VPA below:</p>
                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '15px' }}>
                    <label className="form-label">Virtual Payment Address (VPA)</label>
                    <input type="text" className="form-input" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" />
                  </div>
                </div>
              )}

              {checkoutTab === 'card' && (
                <div>
                  {/* Virtual Card Representation */}
                  <div style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', borderRadius: '12px', padding: '18px 20px', color: '#fff', marginBottom: '20px', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.9 }}>
                      <span>AuraGuard Protected</span>
                      <strong style={{ letterSpacing: '1px' }}>VISA / RUPAY</strong>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', letterSpacing: '2px', margin: '18px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, display: 'block' }}>CARDHOLDER</span>
                        <strong style={{ textTransform: 'uppercase' }}>{cardName || 'YOUR NAME'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, display: 'block' }}>EXPIRES</span>
                        <strong>{cardExpiry || 'MM/YY'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Cardholder Name</label>
                    <input type="text" className="form-input" value={cardName} onChange={e => setCardName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Card Number</label>
                    <input type="text" className="form-input" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4532 8921 7842 1093" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Valid Thru</label>
                      <input type="text" className="form-input" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input type="password" maxLength="4" className="form-input" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="•••" />
                    </div>
                  </div>
                </div>
              )}

              {checkoutTab === 'netbanking' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>Choose your banking institution for 1-click gateway authorization:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                      <button key={bank} type="button" onClick={() => setSelectedBank(bank)} style={{ padding: '12px', borderRadius: '8px', border: selectedBank === bank ? '2px solid #6366f1' : '1px solid var(--border-glass)', background: selectedBank === bank ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)', color: selectedBank === bank ? '#818cf8' : '#e2e8f0', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button & Status */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '18px', marginTop: '15px' }}>
                <button type="button" disabled={isProcessingGateway} onClick={handleExecutePayment} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: isProcessingGateway ? '#4338ca' : '#6366f1' }}>
                  {isProcessingGateway ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> {gatewayStepText}
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Authorize & Pay ₹{parseFloat(amount || 0).toLocaleString()}
                    </>
                  )}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
                  <Shield size={14} color="#10b981" /> 256-Bit Encrypted Secure Payment Channel
                </div>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Glassmorphic Receipt Modal */}
      {activeReceipt && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, padding: '20px', overflowY: 'auto' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', margin: '40px 0' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setActiveReceipt(null)}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '20px' }}>
              <Shield size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px' }}>AURAGUARD RECEIPT</h3>
              <span className="badge badge-active" style={{ marginTop: '5px' }}>Payment Successful</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{activeReceipt.transactionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Date:</span>
                <strong>{new Date(activeReceipt.paymentDate).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <strong>{activeReceipt.paymentMode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Policy Number:</span>
                <strong>{activeReceipt.policyNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Policy Plan:</span>
                <strong>{activeReceipt.policyName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <strong>{activeReceipt.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                <strong>{activeReceipt.customerEmail}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Deposited By:</span>
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
        </div>,
        document.body
      )}
    </div>
  );
}
