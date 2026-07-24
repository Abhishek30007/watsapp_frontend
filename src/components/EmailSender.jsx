import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Send, CheckCircle, AlertCircle, X, Loader } from 'lucide-react';

import { API_BASE } from '../config';

const INITIAL_STATE = {
  recipientEmail: '',
  subject: '',
  message: '',
};

export default function EmailSender({ addToast }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [sendState, setSendState] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error on edit
    if (sendState === 'error') setSendState('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!form.recipientEmail.trim()) return setErrorMsg('Recipient email is required.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.recipientEmail.trim())) return setErrorMsg('Enter a valid email address.');
    if (!form.subject.trim()) return setErrorMsg('Subject is required.');
    if (!form.message.trim()) return setErrorMsg('Message body is required.');

    setSendState('loading');

    try {
      const res = await axios.post(`${API_BASE}/email/send-custom-email`, {
        recipientEmail: form.recipientEmail.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      if (res.data.success) {
        setSendState('success');
        addToast(`📧 Email sent to ${form.recipientEmail}!`, 'success');
        // Reset form after 3 seconds
        setTimeout(() => {
          setForm(INITIAL_STATE);
          setSendState('idle');
        }, 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send email. Check your Gmail credentials in .env.';
      setErrorMsg(msg);
      setSendState('error');
      addToast(`Email failed: ${msg}`, 'error');
    }
  };

  const handleReset = () => {
    setForm(INITIAL_STATE);
    setSendState('idle');
    setErrorMsg('');
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      {/* Panel Header */}
      <h3 className="form-title" style={{ marginBottom: '1.25rem' }}>
        <Mail size={20} style={{ color: 'var(--accent-pink)' }} />
        <span>Send Email Reminder</span>
        {(sendState !== 'idle') && (
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-icon-only btn-ghost-danger"
            style={{ marginLeft: 'auto', padding: '0.25rem' }}
            title="Reset"
          >
            <X size={15} />
          </button>
        )}
      </h3>

      {/* Success State */}
      {sendState === 'success' ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          gap: '0.75rem',
          animation: 'slideIn 0.4s ease',
        }}>
          <CheckCircle size={48} style={{ color: 'var(--accent-emerald)' }} />
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Email Dispatched!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Your message was delivered to <strong style={{ color: 'var(--accent-emerald)' }}>{form.recipientEmail || 'the recipient'}</strong> via Gmail.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244,63,94,0.10)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.1rem',
              fontSize: '0.85rem',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          {/* Recipient Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-recipient">Recipient Email</label>
            <input
              id="email-recipient"
              type="email"
              name="recipientEmail"
              value={form.recipientEmail}
              onChange={handleChange}
              placeholder="e.g. friend@gmail.com"
              className="form-control"
              disabled={sendState === 'loading'}
              autoComplete="email"
            />
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g. Happy Birthday! 🎂"
              className="form-control"
              disabled={sendState === 'loading'}
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-message">Message</label>
            <textarea
              id="email-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Write your celebration message here..."
              className="form-control"
              rows={5}
              disabled={sendState === 'loading'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sendState === 'loading'}
            className="btn btn-block"
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #ec4899, #9333ea)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(236,72,153,0.3)',
              transition: 'all 0.3s ease',
              opacity: sendState === 'loading' ? 0.7 : 1,
              cursor: sendState === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {sendState === 'loading' ? (
              <>
                <Loader size={16} style={{ animation: 'rotate 1s linear infinite' }} />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Email</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
