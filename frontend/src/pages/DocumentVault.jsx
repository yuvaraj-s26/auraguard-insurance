import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2 } from 'lucide-react';
import api, { API_BASE_URL } from '../api';

export default function DocumentVault({ user }) {
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
                          <a href={`${API_BASE_URL}${d.downloadUrl}`} download target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#06b6d4', borderColor: '#06b6d4' }}>
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
