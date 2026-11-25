import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, RotateCcw, Inbox, CheckCircle, AlertCircle, Clock, Trash2, MessageCircle } from 'lucide-react';
import { API_BASE } from '../config';

const STATUS_META = {
  Sent:    { label: 'Sent',    icon: CheckCircle, bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
  Failed:  { label: 'Failed',  icon: AlertCircle, bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   color: '#f87171' },
  Pending: { label: 'Pending', icon: Clock,       bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24' },
};

export default function HistoryLogs({ addToast }) {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');   // All | Sent | Failed | Pending
  const [channel, setChannel]     = useState('All');   // All | SMS | Email | Voice
  const [retrying, setRetrying]   = useState(null);
  const [clearing, setClearing]   = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filter  !== 'All') params.set('status',  filter);
      if (channel !== 'All') params.set('channel', channel);
      const res = await axios.get(`${API_BASE}/logs?${params}`);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      addToast('Failed to load message history logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, channel]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchLogs, 30000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const handleRetry = async (log) => {
    setRetrying(log._id);
    try {
      const res = await axios.post(`${API_BASE}/logs/${log._id}/retry`);
      addToast(res.data.message, res.data.success ? 'success' : 'error');
      fetchLogs();
    } catch (err) {
      addToast(`Retry failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setRetrying(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear ALL audit logs? This cannot be undone.')) return;
    setClearing(true);
    try {
      await axios.delete(`${API_BASE}/logs`);
      setLogs([]); setTotal(0);
      addToast('All message logs cleared successfully.', 'success');
    } catch {
      addToast('Failed to clear logs.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const counts = {
    All:     total,
    Sent:    logs.filter(l => l.status === 'Sent').length,
    Failed:  logs.filter(l => l.status === 'Failed').length,
    Pending: logs.filter(l => l.status === 'Pending').length,
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>History & Logs Audit Trail</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{total} total records · auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchLogs} title="Refresh Logs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={handleClearAll} disabled={clearing || !logs.length} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: '#f87171', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Status filters */}
        {['All', 'Sent', 'Failed', 'Pending'].map(s => {
          const meta = s === 'All' ? null : STATUS_META[s];
          return (
            <button
              key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer', border: '1px solid',
                background: filter === s ? (meta ? meta.bg : 'rgba(147,51,234,0.15)') : 'rgba(255,255,255,0.03)',
                borderColor: filter === s ? (meta ? meta.border : 'rgba(147,51,234,0.4)') : 'rgba(255,255,255,0.08)',
                color: filter === s ? (meta ? meta.color : '#c084fc') : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {s} {counts[s] !== undefined && <span style={{ opacity: 0.7 }}>({counts[s]})</span>}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        {/* Channel filters */}
        {['All', 'WhatsApp'].map(c => (
          <button
            key={c} onClick={() => setChannel(c)}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              background: channel === c ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
              borderColor: channel === c ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)',
              color: channel === c ? '#34d399' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {c === 'WhatsApp' && <MessageCircle size={11} style={{ display: 'inline', marginRight: '4px' }} />}
            {c}
          </button>
        ))}
      </div>

      {/* Log Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'rotate 1s linear infinite', marginBottom: '1rem', color: 'var(--accent-purple)' }} />
          <p>Loading history...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} />
          <h3>No delivery records yet</h3>
          <p>Audit records will appear here after scheduling/dispatching wishes and reminders.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map(log => {
            const meta = STATUS_META[log.status] || STATUS_META.Pending;
            const StatusIcon = meta.icon;
            const isRetrying = retrying === log._id;
            return (
              <div
                key={log._id}
                className="glass-card"
                style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
              >
                {/* Status chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '95px', background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '999px', padding: '4px 10px' }}>
                  <StatusIcon size={13} style={{ color: meta.color }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>{log.status}</span>
                </div>

                {/* Channel badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.78rem', fontWeight: 600, minWidth: '70px' }}>
                  <MessageCircle size={13} />
                  {log.channel || 'WhatsApp'}
                </div>

                {/* Dispatch Type Badge */}
                <span className={`badge ${log.dispatchType === 'Automated Cron' ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {log.dispatchType || 'Manual Test'}
                </span>

                {/* Name + destination */}
                <div style={{ flex: 1.5, minWidth: '160px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.recipient}</div>
                </div>

                {/* Message preview */}
                <div style={{ flex: 2, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '160px', maxWidth: '280px' }} title={log.message}>
                  {log.message}
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', minWidth: '120px', textAlign: 'right' }}>
                  {formatDate(log.timestamp)}
                </div>

                {/* Retry button */}
                {(log.status === 'Failed' || log.status === 'Pending') && (
                  <button
                    onClick={() => handleRetry(log)}
                    disabled={isRetrying}
                    style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '8px', padding: '6px 12px', cursor: isRetrying ? 'not-allowed' : 'pointer',
                      color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '4px', opacity: isRetrying ? 0.6 : 1,
                    }}
                  >
                    <RotateCcw size={12} style={isRetrying ? { animation: 'rotate 1s linear infinite' } : {}} />
                    {isRetrying ? 'Retrying...' : 'Retry'}
                  </button>
                )}

                {/* Error details row */}
                {log.status === 'Failed' && log.errorDetails && (
                  <div style={{ width: '100%', fontSize: '0.72rem', color: '#f87171', borderTop: '1px solid rgba(244,63,94,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                    <AlertCircle size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    <span>Error details: {log.errorDetails}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
