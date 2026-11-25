import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield, Save, Clock,
  Calendar, Trash2, Edit, Send, Sparkles, MessageCircle
} from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminAlerts({ adminAlerts, loading, onAddOrUpdate, onDelete, addToast }) {
  // Config state (defaults to localStorage values or verified trial config)
  const [adminName, setAdminName] = useState(localStorage.getItem('adminName') || 'Admin');
  const [adminPhoneNumber, setAdminPhoneNumber] = useState(localStorage.getItem('adminPhoneNumber') || '+13186108740');
  
  // Alert scheduling states
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [polishing, setPolishing] = useState(false);

  // Quick testing state
  const [testingId, setTestingId] = useState(null);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    if (!adminName.trim()) { addToast('Name is required.', 'error'); return; }
    if (!/^\+[1-9]\d{1,14}$/.test(adminPhoneNumber)) {
      addToast('Please provide a valid E.164 phone number (e.g. +13186108740).', 'error');
      return;
    }

    localStorage.setItem('adminName', adminName);
    localStorage.setItem('adminPhoneNumber', adminPhoneNumber);

    addToast('Admin notification preferences saved locally!', 'success');
  };

  const handleAIPolish = async () => {
    if (!title.trim()) {
      addToast('Please enter an alert title first.', 'error');
      return;
    }
    setPolishing(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-alert-context`, { title, notes });
      if (res.data.success) {
        const separator = notes.trim() ? '\n\n' : '';
        setNotes(prev => `${prev}${separator}🤖 AI Context Checklist:\n${res.data.context}`);
        addToast('✨ Added AI context tips to notes!', 'success');
      }
    } catch (err) {
      addToast('Failed to generate notes context with AI.', 'error');
    } finally {
      setPolishing(false);
    }
  };

  const startEdit = (alert) => {
    setEditingId(alert._id);
    setTitle(alert.title);
    setNotes(alert.notes || '');
    setScheduledTime(alert.scheduledTime || '09:00');
    
    if (alert.scheduledDate) {
      const d = new Date(alert.scheduledDate);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      setScheduledDate(`${year}-${month}-${day}`);
    } else {
      setScheduledDate('');
    }
    addToast(`Editing Admin Alert: ${alert.title}`, 'success');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setNotes('');
    setScheduledDate('');
    setScheduledTime('09:00');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { addToast('Alert title is required.', 'error'); return; }
    if (!scheduledDate) { addToast('Alert date is required.', 'error'); return; }
    if (!scheduledTime) { addToast('Alert time is required.', 'error'); return; }

    const payload = {
      adminName,
      adminPhoneNumber,
      title,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      notes,
      channels: {
        whatsapp: true
      },
      status: 'PENDING'
    };

    if (editingId) {
      payload._id = editingId;
    }

    onAddOrUpdate(payload);
    
    // Reset scheduling fields
    setTitle('');
    setNotes('');
    setScheduledDate('');
    setScheduledTime('09:00');
    setEditingId(null);
  };

  const handleTestAlert = async (alertId) => {
    setTestingId(alertId);
    addToast('Placing manual WhatsApp test alert...', 'success');
    try {
      const res = await axios.post(`${API_BASE}/admin-alerts/${alertId}/test-whatsapp`, { phone: adminPhoneNumber });
      if (res.data.success) {
        addToast('✅ Admin test WhatsApp delivered successfully!', 'success');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      addToast(`Failed to trigger admin test: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'FIRED': return 'badge-emerald';
      case 'FAILED': return 'badge-pink';
      default: return 'badge-blue';
    }
  };

  return (
    <main className="main-grid">
      {/* ── LEFT: Settings & Scheduler Form ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Admin Configuration Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Shield size={20} style={{ color: 'var(--accent-purple)' }} />
            <span>Admin Alerts Settings</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
            Configure your personal contact information and delivery preferences.
          </p>

          <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Admin Name</label>
              <input
                type="text" className="form-control"
                value={adminName} onChange={e => setAdminName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Personal Phone Number (E.164)</label>
              <input
                type="text" className="form-control"
                value={adminPhoneNumber} onChange={e => setAdminPhoneNumber(e.target.value)}
                required
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            {/* Channels preferences toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              
              {/* WhatsApp Admin Alerts Indicator */}
              <div 
                style={{
                  display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px', justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageCircle size={16} style={{ color: 'var(--accent-emerald)' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp Alerts</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Primary admin notification path via Twilio/Wappfly</div>
                  </div>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Enabled</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.65rem' }}>
              <Save size={14} />
              Save Notification Preferences
            </button>
          </form>
        </div>

        {/* Schedule Admin Alert Form */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent-purple)' }} />
            <span>{editingId ? 'Edit Personal Alert' : 'Schedule Admin Alert'}</span>
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Alert Title</label>
              <input
                type="text" placeholder="e.g. Server Review or Meeting Reminder" className="form-control"
                value={title} onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Alert Date</label>
                <input
                  type="date" className="form-control"
                  value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alert Time</label>
                <input
                  type="time" className="form-control"
                  value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notes & Context</span>
                <button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={polishing}
                  style={{
                    background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '0.72rem',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                  }}
                >
                  <Sparkles size={11} /> Polish with AI Helper
                </button>
              </label>
              <textarea
                rows={4}
                placeholder="Details of the reminder task..."
                className="form-control"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--grad-primary)' }}>
                <Send size={14} /> {editingId ? 'Update Alert' : 'Schedule Alert'}
              </button>
              {editingId && (
                <button type="button" className="btn" onClick={cancelEdit} style={{ background: 'rgba(244,63,94,0.08)', color: '#f87171', border: '1px solid rgba(244,63,94,0.15)' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

      </section>

      {/* ── RIGHT: Scheduled Reminders cards ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-purple)' }} />
            <span>Personal Reminders Overview</span>
          </h3>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
              <svg className="spinner" viewBox="0 0 24 24" fill="none" style={{ width: '40px', height: '40px', color: 'var(--accent-purple)' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" strokeLinecap="round" />
              </svg>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading personal alerts...</p>
            </div>
          ) : adminAlerts.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} />
              <h3>No personal alerts scheduled</h3>
              <p>Configure preferences and add a new admin task reminder on the left to see it listed here.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {adminAlerts.map(alert => {
                const isTesting = testingId?.id === alert._id;
                return (
                  <div key={alert._id} className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{alert.title}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span>For: {alert.adminName || 'Admin'}</span>
                        </div>
                      </div>
                      <span className={`badge ${getStatusClass(alert.status)}`}>
                        {alert.status || 'PENDING'}
                      </span>
                    </div>

                    {alert.notes && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                        {alert.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Active Channel */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>WhatsApp</span>
                      </div>

                      {/* Scheduled Date/Time */}
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                        <Calendar size={12} />
                        <span>{new Date(alert.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                        <Clock size={12} style={{ marginLeft: '4px' }} />
                        <span>{alert.scheduledTime}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.75rem', justifyContent: 'space-between' }}>
                      {/* Quick Test Trigger */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn"
                          onClick={() => handleTestAlert(alert._id)}
                          disabled={isTesting}
                          style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
                        >
                          {isTesting ? 'Sending...' : 'Test WhatsApp'}
                        </button>
                      </div>

                      {/* CRUD Edit/Delete */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => startEdit(alert)} className="btn" style={{ padding: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Edit size={12} />
                        </button>
                        <button onClick={() => onDelete(alert._id)} className="btn" style={{ padding: '6px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f87171' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
