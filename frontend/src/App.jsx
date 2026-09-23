import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

// Components
import DashboardLayout from './components/DashboardLayout';

// Pages
import PublicLandingPage from './pages/PublicLandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardDispatcher from './pages/DashboardDispatcher';
import CustomerManager from './pages/CustomerManager';
import PolicyManager from './pages/PolicyManager';
import PaymentManager from './pages/PaymentManager';
import ClaimManager from './pages/ClaimManager';
import DocumentVault from './pages/DocumentVault';
import UserProfile from './pages/UserProfile';
import AuditExplorer from './pages/AuditExplorer';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const validateSession = async () => {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        try {
          const res = await api.get('/auth/me');
          const updatedUser = {
            token: activeToken,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            userId: res.data.userId,
            customerId: res.data.customerId
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (err) {
          console.warn("Session validation failed, logging out:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
    };

    validateSession();

    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  
  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {token ? (
          <DashboardLayout user={user} onLogout={logout} theme={theme} toggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<DashboardDispatcher user={user} />} />
              <Route path="/customers" element={<CustomerManager user={user} />} />
              <Route path="/policies" element={<PolicyManager user={user} />} />
              <Route path="/payments" element={<PaymentManager user={user} />} />
              <Route path="/claims" element={<ClaimManager user={user} />} />
              <Route path="/documents" element={<DocumentVault user={user} />} />
              <Route path="/audit-logs" element={<AuditExplorer user={user} />} />
              <Route path="/profile" element={<UserProfile user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        ) : (
          <Routes>
            <Route path="/" element={<PublicLandingPage theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}
