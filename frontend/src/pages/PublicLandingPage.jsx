import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Sparkles, Shield, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api';
import { sfx } from '../utils/soundEffects';

export default function PublicLandingPage({ theme, toggleTheme }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Customizer Sandbox State
  const [calcPlanId, setCalcPlanId] = useState('');
  const [calcSumAssured, setCalcSumAssured] = useState(500000);
  const [calcAge, setCalcAge] = useState(28);
  const [selectedRiders, setSelectedRiders] = useState({
    zeroDep: true,
    critical: false,
    roadside: true,
    travel: false
  });

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

  const calculateStudioPremium = () => {
    if (!calcPlanId) return { monthly: '0', annual: '0', baseMonthly: '0', riderMonthly: '0', gstMonthly: '0' };
    const plan = plans.find(p => p.policyTypeId === parseInt(calcPlanId));
    if (!plan) return { monthly: '0', annual: '0', baseMonthly: '0', riderMonthly: '0', gstMonthly: '0' };
    
    let rate = plan.premiumRate;
    let baseAnnual = calcSumAssured * rate;
    
    if (calcAge > 50) baseAnnual *= 1.35;
    else if (calcAge > 40) baseAnnual *= 1.15;
    else if (calcAge < 25) baseAnnual *= 0.90;

    const baseMonthly = baseAnnual / 12;

    // Compute riders
    let riderMonthly = 0;
    if (selectedRiders.zeroDep) riderMonthly += 450;
    if (selectedRiders.critical) riderMonthly += 750;
    if (selectedRiders.roadside) riderMonthly += 250;
    if (selectedRiders.travel) riderMonthly += 350;

    const subTotalMonthly = baseMonthly + riderMonthly;
    const gstMonthly = subTotalMonthly * 0.18;
    const totalMonthly = subTotalMonthly + gstMonthly;
    const totalAnnual = totalMonthly * 12;

    return {
      monthly: Math.round(totalMonthly).toLocaleString(),
      annual: Math.round(totalAnnual).toLocaleString(),
      baseMonthly: Math.round(baseMonthly).toLocaleString(),
      riderMonthly: Math.round(riderMonthly).toLocaleString(),
      gstMonthly: Math.round(gstMonthly).toLocaleString()
    };
  };

  const studioQuotes = calculateStudioPremium();

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
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
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
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '35px', maxWidth: '520px' }}>
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

      {/* Interactive Premium Customizer Studio Sandbox */}
      <section id="calculator" style={{ padding: '90px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', position: 'relative' }} className="ambient-glow-mesh">
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span className="badge badge-glow" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
              ⚡ Interactive Policy Sandbox Studio
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '12px', marginBottom: '10px' }}>Custom Premium Simulator</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '650px', margin: '0 auto' }}>Fine-tune your sum assured, policy tenure, deductibles, and optional riders with real-time premium updates.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '35px', alignItems: 'flex-start' }}>
            {/* Left Controls */}
            <div className="glass-card" style={{ padding: '30px' }}>
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--text-main)' }}>1. Select Core Insurance Plan</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '8px' }}>
                  {plans.map(p => (
                    <button 
                      key={p.policyTypeId} 
                      type="button" 
                      onClick={() => { setCalcPlanId(p.policyTypeId.toString()); sfx.playPop(); }}
                      style={{ 
                        padding: '12px 10px', 
                        borderRadius: '10px', 
                        border: calcPlanId === p.policyTypeId.toString() ? '2px solid #6366f1' : '1px solid var(--border-glass)', 
                        background: calcPlanId === p.policyTypeId.toString() ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-primary)',
                        color: calcPlanId === p.policyTypeId.toString() ? '#6366f1' : 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {p.policyName.split(' ')[0]} {p.policyName.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sum Assured Range */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>2. Sum Assured Coverage</label>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 10px', borderRadius: '8px' }}>
                    ₹{calcSumAssured.toLocaleString()}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="5000000" 
                  step="25000" 
                  value={calcSumAssured} 
                  onChange={e => { setCalcSumAssured(parseInt(e.target.value)); sfx.playPop(); }} 
                  className="slider-custom"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>₹50,000 (Starter)</span>
                  <span>₹25 Lakhs (Optimal)</span>
                  <span>₹50 Lakhs (Max)</span>
                </div>
              </div>

              {/* Age Slider */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>3. Proposer Age</label>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 10px', borderRadius: '8px' }}>
                    {calcAge} Years
                  </span>
                </div>
                <input 
                  type="range" 
                  min="18" 
                  max="70" 
                  value={calcAge} 
                  onChange={e => { setCalcAge(parseInt(e.target.value)); sfx.playPop(); }} 
                  className="slider-custom"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>18 Yrs</span>
                  <span>35 Yrs</span>
                  <span>70 Yrs</span>
                </div>
              </div>

              {/* Optional Add-on Riders */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '18px' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>
                  4. Add-on Protection Riders
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'zeroDep', label: 'Zero Depreciation', price: 450, icon: '🛡️' },
                    { id: 'critical', label: 'Critical Illness Shield', price: 750, icon: '❤️' },
                    { id: 'roadside', label: '24/7 Roadside Assist', price: 250, icon: '🚗' },
                    { id: 'travel', label: 'Global Travel Protect', price: 350, icon: '✈️' }
                  ].map(rider => {
                    const isChecked = selectedRiders[rider.id];
                    return (
                      <div 
                        key={rider.id}
                        onClick={() => {
                          setSelectedRiders(prev => ({ ...prev, [rider.id]: !prev[rider.id] }));
                          sfx.playPop();
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isChecked ? '1px solid #10b981' : '1px solid var(--border-glass)',
                          background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{rider.icon}</span>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>{rider.label}</div>
                            <div style={{ fontSize: '0.7rem', color: '#10b981' }}>+₹{rider.price}/mo</div>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} 
                          style={{ accentColor: '#10b981', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Live Cost Breakdown */}
            <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid #6366f1', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Quote Summary</h3>
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Guaranteed Rate</span>
              </div>

              {/* Monthly Rate Display */}
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '25px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Monthly Premium</span>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                  ₹{studioQuotes.monthly}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>✓ Includes GST (18%) & All Selected Riders</span>
              </div>

              {/* Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Plan Premium:</span>
                  <strong>₹{studioQuotes.baseMonthly}/mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Add-on Riders Total:</span>
                  <strong style={{ color: '#06b6d4' }}>+₹{studioQuotes.riderMonthly}/mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Applicable GST (18%):</span>
                  <strong>₹{studioQuotes.gstMonthly}/mo</strong>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: '700' }}>Annual Billed Total:</span>
                  <strong style={{ color: '#6366f1', fontWeight: '800' }}>₹{studioQuotes.annual}/yr</strong>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700', borderRadius: '10px' }} 
                onClick={() => { sfx.playSuccess(); navigate('/register'); }}
              >
                Apply & Lock Guaranteed Rate
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                🔒 30-Day Free Look Period • Instant Digital Policy Issuance
              </div>
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
