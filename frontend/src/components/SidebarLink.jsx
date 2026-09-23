import React from 'react';
import { Link } from 'react-router-dom';

export default function SidebarLink({ to, icon, label }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: '8px', fontWeight: '500', transition: 'var(--transition-smooth)' }} 
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
