import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE } from '../config';

export default function IntegrationStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/health`);
      setData(res.data);
      setError(false);
    } catch (err) {
      console.error('[Health fetch error]:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'rotate 1s linear infinite' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading integration health status...</span>
      </div>
    );
  }

  const integrations = data?.integrations || {
    twilio: { configured: false, phoneNumber: 'Not set' },
    wappfly: { configured: false, token: 'Not set' }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Integration & API Status</span>
        </h4>
        <button 
          onClick={fetchStatus} 
          disabled={loading}
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Refresh Integration Health"
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Twilio WhatsApp */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', 
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px'
        }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: integrations.twilio?.configured ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            color: integrations.twilio?.configured ? '#34d399' : '#f87171'
          }}>
            <MessageCircle size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Twilio WhatsApp Service</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sender: {integrations.twilio?.phoneNumber}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: integrations.twilio?.configured ? '#34d399' : '#f87171' }}>
            {integrations.twilio?.configured ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            <span>{integrations.twilio?.configured ? 'Ready' : 'Not Configured'}</span>
          </div>
        </div>

        {/* Wappfly Gateway */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', 
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px'
        }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: integrations.wappfly?.configured ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            color: integrations.wappfly?.configured ? '#34d399' : '#f87171'
          }}>
            <MessageCircle size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Wappfly WhatsApp Gateway</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Token: {integrations.wappfly?.token}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: integrations.wappfly?.configured ? '#34d399' : '#f87171' }}>
            {integrations.wappfly?.configured ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            <span>{integrations.wappfly?.configured ? 'Ready' : 'Not Configured'}</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
          <AlertCircle size={12} />
          <span>Error pinging API backend health service.</span>
        </div>
      )}
    </div>
  );
}
