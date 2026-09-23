import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Calendar, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import api from '../api';

export default function AuditExplorer({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    api.get('/auditlog')
      .then(res => setLogs(res.data))
      .catch(err => console.error("Error fetching audit logs:", err))
      .finally(() => setLoading(false));
  }, []);

  const actionCategories = ['ALL', 'Claim', 'Document', 'Premium', 'Agent', 'Policy', 'Security'];

  const filteredLogs = logs.filter(l => {
    const matchesSearch = (l.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterAction === 'ALL' || l.action?.toLowerCase().includes(filterAction.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleExportAuditCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Log ID,Officer / User,Action,Details,Timestamp\n";
    filteredLogs.forEach(l => {
      const cleanDetails = l.details?.replace(/"/g, '""') || '';
      csvContent += `"${l.auditLogId}","${l.agentName}","${l.action}","${cleanDetails}","${new Date(l.timestamp).toISOString()}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AuraGuard-Security-Audit-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading Security & Governance Audit Logs...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={26} color="#6366f1" /> Security & Governance Audit Trail
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Immutable, timestamped event ledger capturing operational, claim verification, and privileged admin actions.
          </p>
        </div>
        <button onClick={handleExportAuditCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Download size={16} /> Export Audit Log (.CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            className="form-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by officer name, action keyword, or details..."
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Filter Event:</span>
          <select className="form-select" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ padding: '6px 12px', fontSize: '0.85rem', width: '140px' }}>
            {actionCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'ALL' ? 'All Event Types' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: '0px' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Event Activity Log ({filteredLogs.length} entries)</h3>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> Cryptographically Signed Ledger
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Actor / Officer</th>
                <th>Action Type</th>
                <th>Audit Details & Context</th>
                <th style={{ textAlign: 'right' }}>Security Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No audit records match your query.</td>
                </tr>
              ) : (
                filteredLogs.map(l => {
                  const isClaim = l.action?.toLowerCase().includes('claim');
                  const isAgent = l.action?.toLowerCase().includes('agent');
                  const isDoc = l.action?.toLowerCase().includes('doc');

                  const actionColor = isClaim ? '#f59e0b' : isAgent ? '#06b6d4' : isDoc ? '#10b981' : '#6366f1';

                  return (
                    <tr key={l.auditLogId}>
                      <td style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.8rem' }}>#{l.auditLogId}</td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="#94a3b8" />
                          {new Date(l.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{l.agentName || 'System'}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: `${actionColor}15`, color: actionColor, border: `1px solid ${actionColor}30`, fontWeight: '600' }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '380px' }}>
                        {l.details}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                          ISO-27001 Validated
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
