import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bell, Sparkles, MessageCircle, AlertCircle,
  LayoutDashboard, History, Wand2
} from 'lucide-react';
import WishesScheduler from './components/WishesScheduler';
import AdminAlerts    from './components/AdminAlerts';
import AIWishGenerator from './components/AIWishGenerator';
import HistoryLogs     from './components/HistoryLogs';
import { API_BASE }    from './config';

const TABS = [
  { id: 'wishes',    label: 'Wishes Scheduler', Icon: LayoutDashboard },
  { id: 'reminders', label: 'Admin Alerts',     Icon: Bell },
  { id: 'ai',        label: 'AI Wishes',        Icon: Wand2 },
  { id: 'history',   label: 'History',          Icon: History },
];

export default function App() {
  const [wishes, setWishes]         = useState([]);
  const [loadingWishes, setLoadingWishes] = useState(true);
  const [toasts, setToasts]         = useState([]);
  const [gatewayOnline, setGatewayOnline] = useState(false);
  const [activeTab, setActiveTab]   = useState('wishes');

  const [adminAlerts, setAdminAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const fetchWishes = useCallback(async () => {
    try {
      setLoadingWishes(true);
      const res = await axios.get(`${API_BASE}/wishes`);
      setWishes(res.data);
      setLoadingWishes(false);
    } catch (err) {
      addToast('Failed to load wishes from database server.', 'error');
      setLoadingWishes(false);
    }
  }, []);

  const fetchAdminAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);
      const res = await axios.get(`${API_BASE}/admin-alerts`);
      setAdminAlerts(res.data);
      setLoadingAlerts(false);
    } catch (err) {
      addToast('Failed to load admin alerts from server.', 'error');
      setLoadingAlerts(false);
    }
  }, []);

  const checkGatewayHealth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/health`);
      setGatewayOnline(res.data.status === 'healthy');
    } catch {
      setGatewayOnline(false);
    }
  };

  useEffect(() => {
    fetchWishes();
    fetchAdminAlerts();
    checkGatewayHealth();
    const interval = setInterval(checkGatewayHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchWishes, fetchAdminAlerts]);

  const handleWishSubmit = async (formData) => {
    try {
      if (formData._id) {
        // Update existing wish
        const res = await axios.put(`${API_BASE}/wishes/${formData._id}`, formData);
        setWishes(prev => prev.map(w => w._id === formData._id ? res.data : w));
        addToast(`Successfully updated scheduled wish for ${formData.contactName}.`, 'success');
      } else {
        // Create new wish
        const res = await axios.post(`${API_BASE}/wishes`, formData);
        setWishes(prev => [...prev, res.data].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
        addToast(`Successfully scheduled new wish alert for ${formData.contactName}!`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving scheduled wish.', 'error');
    }
  };

  const handleDeleteWish = async (id) => {
    if (!window.confirm('Delete this scheduled wish reminder?')) return;
    try {
      await axios.delete(`${API_BASE}/wishes/${id}`);
      setWishes(prev => prev.filter(w => w._id !== id));
      addToast('Scheduled wish reminder deleted.', 'success');
    } catch {
      addToast('Failed to delete scheduled wish.', 'error');
    }
  };

  const handleAdminAlertSubmit = async (formData) => {
    try {
      if (formData._id) {
        // Update existing alert
        const res = await axios.put(`${API_BASE}/admin-alerts/${formData._id}`, formData);
        setAdminAlerts(prev => prev.map(a => a._id === formData._id ? res.data : a));
        addToast(`Updated Admin Alert reminder: ${formData.title}.`, 'success');
      } else {
        // Create new alert
        const res = await axios.post(`${API_BASE}/admin-alerts`, formData);
        setAdminAlerts(prev => [...prev, res.data].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
        addToast(`Admin Alert scheduled: ${formData.title}!`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving admin alert.', 'error');
    }
  };

  const handleDeleteAdminAlert = async (id) => {
    if (!window.confirm('Delete this admin alert reminder?')) return;
    try {
      await axios.delete(`${API_BASE}/admin-alerts/${id}`);
      setAdminAlerts(prev => prev.filter(a => a._id !== id));
      addToast('Admin alert deleted.', 'success');
    } catch {
      addToast('Failed to delete admin alert.', 'error');
    }
  };

  const getStats = () => {
    const now = new Date();
    const countTodayWishes = wishes.filter(w => {
      const e = new Date(w.scheduledDate);
      return e.getUTCMonth() === now.getUTCMonth() && e.getUTCDate() === now.getUTCDate();
    }).length;
    
    const countTodayAlerts = adminAlerts.filter(a => {
      const e = new Date(a.scheduledDate);
      return e.getUTCMonth() === now.getUTCMonth() && e.getUTCDate() === now.getUTCDate() && a.status === 'PENDING';
    }).length;

    return { 
      totalWishes: wishes.length, 
      todayWishes: countTodayWishes,
      totalAlerts: adminAlerts.length,
      todayAlerts: countTodayAlerts
    };
  };

  const stats = getStats();

  return (
    <div className="container">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon"><MessageCircle size={20} /></div>
          <div>
            <h1 className="logo-text">CelebrateMate</h1>
            <p className="subtitle">WhatsApp-First Reminders · Gemini AI Prompts · Intelligent Schedulers</p>
          </div>
        </div>
        <span
          className={`badge ${gatewayOnline ? 'badge-emerald' : 'badge-pink'}`}
          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: gatewayOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            boxShadow: gatewayOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
          }} />
          Wappfly Gateway: {gatewayOnline ? 'Online' : 'Offline'}
        </span>
      </header>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="stats-container">
        <div className="stat-box glass-card">
          <div className="stat-value">{stats.totalWishes}</div>
          <div className="stat-label">Wishes Scheduled</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-value">{stats.totalAlerts}</div>
          <div className="stat-label">Admin Alerts</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-value">{stats.todayWishes + stats.todayAlerts}</div>
          <div className="stat-label">Events Due Today</div>
        </div>
        <div className="stat-box glass-card">
          <div className="stat-value" style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>WhatsApp Engine</div>
          <div className="stat-label">Primary Gateway</div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <nav className="tab-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── WISHES SCHEDULER TAB ────────────────────────────────────────── */}
      {activeTab === 'wishes' && (
        <WishesScheduler
          wishes={wishes}
          loading={loadingWishes}
          onAddOrUpdate={handleWishSubmit}
          onDelete={handleDeleteWish}
          addToast={addToast}
        />
      )}

      {/* ── ADMIN ALERTS TAB ────────────────────────────────────────────── */}
      {activeTab === 'reminders' && (
        <AdminAlerts
          adminAlerts={adminAlerts}
          loading={loadingAlerts}
          onAddOrUpdate={handleAdminAlertSubmit}
          onDelete={handleDeleteAdminAlert}
          addToast={addToast}
        />
      )}

      {/* ── AI WISHES TAB ──────────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <AIWishGenerator addToast={addToast} />
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <HistoryLogs addToast={addToast} />
      )}

      {/* ── Toast Stack ────────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success'
              ? <Sparkles size={16} style={{ color: 'var(--accent-emerald)' }} />
              : <AlertCircle size={16} style={{ color: 'var(--accent-rose)' }} />
            }
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
