import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Smartphone, Calendar, Clock,
  ChevronRight, ChevronLeft, Sparkles, Send,
  Trash2, Edit, CheckSquare, Square, Check, Wand2, MessageCircle
} from 'lucide-react';
import { API_BASE } from '../config';

const CATEGORIES = ['Birthday', 'Anniversary', 'Graduation', 'Wedding', 'Promotion', 'Farewell', 'New Year', 'Festival'];
const RELATIONSHIPS = ['Best Friend', 'Parent', 'Sibling', 'Partner', 'Colleague', 'Professional', 'Mentor', 'Child'];
const TONES = ['Emotional', 'Funny', 'Professional', 'Short'];

export default function WishesScheduler({ wishes, loading, onAddOrUpdate, onDelete, addToast }) {
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('Birthday');
  
  // AI fields
  const [relationship, setRelationship] = useState('Best Friend');
  const [tone, setTone] = useState('Emotional');
  const [generating, setGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');

  // Schedule fields
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  // Channels
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Quick states for test buttons
  const [testingId, setTestingId] = useState(null);

  // Load details if editing
  const startEdit = (wish) => {
    setEditingId(wish._id);
    setContactName(wish.contactName);
    setPhoneNumber(wish.phoneNumber);
    setCategory(wish.category || 'Birthday');
    setGeneratedMessage(wish.generatedMessage);
    
    // Parse date for input (YYYY-MM-DD)
    if (wish.scheduledDate) {
      const d = new Date(wish.scheduledDate);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      setScheduledDate(`${year}-${month}-${day}`);
    } else {
      setScheduledDate('');
    }
    
    setScheduledTime(wish.scheduledTime || '09:00');
    setWhatsappEnabled(true);
    
    setStep(1); // start at step 1 but loaded
    addToast(`Editing scheduled wish for ${wish.contactName}`, 'success');
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setContactName('');
    setPhoneNumber('');
    setCategory('Birthday');
    setRelationship('Best Friend');
    setTone('Emotional');
    setGeneratedMessage('');
    setScheduledDate('');
    setScheduledTime('09:00');
    setWhatsappEnabled(true);
    setStep(1);
  };

  const handleGenerateAI = async () => {
    if (!contactName.trim()) {
      addToast('Please enter the recipient\'s name in Step 1 first.', 'error');
      setStep(1);
      return;
    }
    setGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-wish`, {
        name: contactName,
        eventType: category,
        relationship,
        tone
      });
      setGeneratedMessage(res.data.wish);
      addToast('✨ Custom AI wish generated!', 'success');
    } catch (err) {
      addToast('Failed to generate wish with AI.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!contactName.trim()) return 'Recipient name is required.';
      if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) return 'Please provide a valid E.164 phone number (e.g. +919876543210).';
    }
    if (s === 2) {
      if (!generatedMessage.trim()) return 'Please generate or write a greeting message.';
    }
    if (s === 3) {
      if (!scheduledDate) return 'Please pick a scheduled date.';
      if (!scheduledTime) return 'Please pick a scheduled time.';
    }
    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      addToast(errorMsg, 'error');
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorMsg = validateStep(1) || validateStep(2) || validateStep(3);
    if (errorMsg) {
      addToast(errorMsg, 'error');
      return;
    }

    const payload = {
      contactName,
      phoneNumber,
      category,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      generatedMessage,
      channels: {
        whatsapp: true
      },
      status: 'PENDING'
    };

    if (editingId) {
      payload._id = editingId;
    }

    onAddOrUpdate(payload);
    resetForm();
    setEditingId(null);
  };

  const handleQuickTest = async (wishId) => {
    setTestingId(wishId);
    addToast('Triggering manual WhatsApp test...', 'success');
    try {
      const res = await axios.post(`${API_BASE}/wishes/${wishId}/test-whatsapp`);
      if (res.data.success) {
        addToast('✅ WhatsApp test successfully delivered!', 'success');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      addToast(`Failed to send test: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FIRED':
        return <span className="badge badge-emerald">Fired</span>;
      case 'FAILED':
        return <span className="badge badge-pink">Failed</span>;
      default:
        return <span className="badge badge-blue">Pending</span>;
    }
  };

  return (
    <main className="main-grid">
      {/* ── LEFT: Form Wizard Card ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Wand2 size={20} style={{ color: 'var(--accent-purple)' }} />
            <span>{editingId ? 'Edit Scheduled Wish' : 'Schedule New Wish'}</span>
          </h3>

          {/* Wizard Steps Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
            {[1, 2, 3, 4].map(num => (
              <div 
                key={num} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  color: step === num ? 'var(--accent-purple)' : step > num ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontWeight: step === num ? 700 : 500, fontSize: '0.78rem'
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step === num ? 'var(--accent-purple-glow)' : step > num ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${step === num ? 'var(--accent-purple)' : step > num ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)'}`,
                  color: step === num ? '#fff' : step > num ? '#34d399' : 'var(--text-muted)',
                  fontSize: '0.7rem'
                }}>
                  {step > num ? <Check size={10} /> : num}
                </div>
                <span>Step {num}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Details */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label"><User size={12} style={{ marginRight: '4px' }} /> Recipient Name</label>
                  <input
                    type="text" placeholder="e.g. Priya Saw" className="form-control"
                    value={contactName} onChange={e => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Smartphone size={12} style={{ marginRight: '4px' }} /> E.164 Phone Number</label>
                  <input
                    type="text" placeholder="e.g. +919876543210" className="form-control"
                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    required
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Include country code prefix for WhatsApp dispatch.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Event Category</label>
                  <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: AI Generation */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Relationship</label>
                    <select className="form-control" value={relationship} onChange={e => setRelationship(e.target.value)}>
                      {RELATIONSHIPS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tone</label>
                    <select className="form-control" value={tone} onChange={e => setTone(e.target.value)}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.65rem' }}
                >
                  <Sparkles size={14} />
                  {generating ? 'Generating Custom Message...' : 'Generate Wish with Gemini'}
                </button>

                <div className="form-group">
                  <label className="form-label">Wishes Greeting Message</label>
                  <textarea
                    rows={4}
                    placeholder="Wishes greeting text will appear here..."
                    className="form-control"
                    value={generatedMessage}
                    onChange={e => setGeneratedMessage(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Date & Time pickers */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label"><Calendar size={12} style={{ marginRight: '4px' }} /> Scheduled Date</label>
                  <input
                    type="date" className="form-control"
                    value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Clock size={12} style={{ marginRight: '4px' }} /> Scheduled Time</label>
                  <input
                    type="time" className="form-control"
                    value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 4: Channels */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="form-label">Dispatch Channel</label>
                
                {/* WhatsApp Primary */}
                <div 
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.85rem 1rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px', justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageCircle size={18} style={{ color: 'var(--accent-emerald)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp Notification</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automated delivery via Twilio & Wappfly gateway</div>
                    </div>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Active</span>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', gap: '8px' }}>
              {step > 1 && (
                <button type="button" className="btn" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', background: 'var(--grad-primary)' }}>
                  <Send size={14} /> {editingId ? 'Update Wish' : 'Schedule Wish'}
                </button>
              )}
              {editingId && (
                <button type="button" className="btn" onClick={cancelEdit} style={{ background: 'rgba(244,63,94,0.08)', color: '#f87171', border: '1px solid rgba(244,63,94,0.15)' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ── RIGHT: Schedulers card list ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-purple)' }} />
            <span>Scheduled Wish Dispatches</span>
          </h3>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}>
              <svg className="spinner" viewBox="0 0 24 24" fill="none" style={{ width: '40px', height: '40px', color: 'var(--accent-purple)' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" strokeLinecap="round" />
              </svg>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading event schedulers...</p>
            </div>
          ) : wishes.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No event alerts active</h3>
              <p>Fill out the scheduling panel on the left to activate your first automatic WhatsApp celebration scheduler.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {wishes.map(wish => {
                const isTesting = testingId?.id === wish._id;
                return (
                  <div key={wish._id} className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{wish.contactName}</h3>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span>{wish.phoneNumber}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {getStatusBadge(wish.status)}
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{wish.category}</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                      {wish.generatedMessage}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Active Channel */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>WhatsApp</span>
                      </div>

                      {/* Scheduled Date/Time */}
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                        <Calendar size={12} />
                        <span>{new Date(wish.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                        <Clock size={12} style={{ marginLeft: '4px' }} />
                        <span>{wish.scheduledTime}</span>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.75rem', justifyContent: 'space-between' }}>
                      {/* Quick Test Trigger */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn"
                          onClick={() => handleQuickTest(wish._id)}
                          disabled={isTesting}
                          style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
                        >
                          {isTesting ? 'Sending...' : 'Test WhatsApp'}
                        </button>
                      </div>

                      {/* CRUD Edit/Delete */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => startEdit(wish)} className="btn" style={{ padding: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Edit size={12} />
                        </button>
                        <button onClick={() => onDelete(wish._id)} className="btn" style={{ padding: '6px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f87171' }}>
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
