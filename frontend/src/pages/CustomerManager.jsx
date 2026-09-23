import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../api';

export default function CustomerManager({ user }) {
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
