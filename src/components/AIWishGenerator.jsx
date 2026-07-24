import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, Copy, Check, ChevronDown, Loader, Wand2 } from 'lucide-react';

import { API_BASE } from '../config';

const RELATIONSHIPS = ['Best Friend', 'Parent', 'Sibling', 'Partner', 'Colleague', 'Professional', 'Mentor', 'Child'];
const EVENT_TYPES   = ['Birthday', 'Anniversary', 'Graduation', 'Wedding', 'Promotion', 'Farewell', 'New Year', 'Festival'];
const TONES = ['Emotional', 'Funny', 'Professional', 'Short'];

const TONE_META = {
  Emotional:    { color: '#ec4899', glow: 'rgba(236,72,153,0.3)',  emoji: '💖' },
  Funny:        { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  emoji: '😄' },
  Professional: { color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', emoji: '💼' },
  Short:        { color: '#10b981', glow: 'rgba(16,185,129,0.3)',  emoji: '⚡' },
};

export default function AIWishGenerator({ addToast }) {
  const [form, setForm]           = useState({ name: '', eventType: 'Birthday', relationship: 'Best Friend', tone: 'Emotional' });
  const [wish, setWish]           = useState('');
  const [displayedWish, setDisplayedWish] = useState('');
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState('');
  const typewriterRef             = useRef(null);

  // Typewriter animation
  useEffect(() => {
    if (!wish) return;
    setDisplayedWish('');
    let i = 0;
    clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      setDisplayedWish(wish.slice(0, i + 1));
      i++;
      if (i >= wish.length) clearInterval(typewriterRef.current);
    }, 18);
    return () => clearInterval(typewriterRef.current);
  }, [wish]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleGenerate = async () => {
    if (!form.name.trim()) { setError('Please enter the recipient\'s name.'); return; }
    setLoading(true); setError(''); setWish('');

    try {
      const res = await axios.post(`${API_BASE}/ai/generate-wish`, form);
      setWish(res.data.wish);
      addToast(`✨ AI wish generated for ${form.name}!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate wish. Check your GEMINI_API_KEY.';
      setError(msg);
      addToast(`AI Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!displayedWish) return;
    navigator.clipboard.writeText(displayedWish);
    setCopied(true);
    addToast('Wish copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const tm = TONE_META[form.tone];

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <h3 className="form-title" style={{ marginBottom: '1.25rem' }}>
        <Wand2 size={20} style={{ color: '#a78bfa' }} />
        <span>AI Wish Generator</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>Powered by Gemini</span>
      </h3>

      {/* Name + Event Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Recipient Name</label>
          <input
            type="text" placeholder="e.g. Priya" className="form-control"
            value={form.name} onChange={e => handleChange('name', e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Event Type</label>
          <div style={{ position: 'relative' }}>
            <select
              className="form-control" value={form.eventType}
              onChange={e => handleChange('eventType', e.target.value)}
              style={{ appearance: 'none', paddingRight: '2rem' }}
            >
              {EVENT_TYPES.map(e => <option key={e}>{e}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Relationship */}
      <div className="form-group">
        <label className="form-label">Relationship</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {RELATIONSHIPS.map(r => (
            <button
              key={r} type="button"
              onClick={() => handleChange('relationship', r)}
              style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: form.relationship === r ? 'rgba(147,51,234,0.25)' : 'rgba(255,255,255,0.04)',
                borderColor: form.relationship === r ? 'rgba(147,51,234,0.6)' : 'rgba(255,255,255,0.08)',
                color: form.relationship === r ? '#c084fc' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* Tone Selector */}
      <div className="form-group">
        <label className="form-label">Message Tone</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TONES.map(t => {
            const meta = TONE_META[t];
            const active = form.tone === t;
            return (
              <button
                key={t} type="button"
                onClick={() => handleChange('tone', t)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '10px', fontSize: '0.78rem',
                  fontWeight: 700, cursor: 'pointer', border: '1px solid', textAlign: 'center',
                  background: active ? `rgba(${meta.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.15)` : 'rgba(255,255,255,0.03)',
                  borderColor: active ? meta.color : 'rgba(255,255,255,0.08)',
                  color: active ? meta.color : 'var(--text-muted)',
                  boxShadow: active ? `0 0 12px ${meta.glow}` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '1.1rem' }}>{meta.emoji}</div>
                <div>{t}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.83rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate} disabled={loading}
        className="btn btn-block"
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
          color: 'white', boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
          opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading
          ? <><Loader size={16} style={{ animation: 'rotate 1s linear infinite' }} /><span>Generating...</span></>
          : <><Sparkles size={16} /><span>Generate AI Wish</span></>
        }
      </button>

      {/* Result Card */}
      {displayedWish && (
        <div style={{
          marginTop: '1.25rem',
          background: 'rgba(124,58,237,0.07)',
          border: `1px solid ${tm.color}40`,
          borderRadius: '12px', padding: '1.25rem',
          animation: 'slideIn 0.4s ease',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: tm.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {tm.emoji} {form.tone} · {form.eventType} · {form.relationship}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
                color: copied ? '#34d399' : 'var(--text-muted)', fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s',
              }}
            >
              {copied ? <Check size={13}/> : <Copy size={13}/>}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ color: '#f1f5f9', fontSize: '0.98rem', lineHeight: 1.75, margin: 0 }}>
            {displayedWish}
            {displayedWish.length < wish.length && (
              <span style={{ display: 'inline-block', width: '2px', height: '1em', background: tm.color, marginLeft: '2px', animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
            )}
          </p>
          {/* Card preview link */}
          <a
            href={`${API_BASE}/card/generate?name=${encodeURIComponent(form.name)}&eventType=${encodeURIComponent(form.eventType)}&message=${encodeURIComponent(displayedWish)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '0.85rem', fontSize: '0.8rem', color: '#a78bfa',
              textDecoration: 'none', borderBottom: '1px dashed rgba(167,139,250,0.4)',
              paddingBottom: '1px',
            }}
          >
            🎨 Preview Greeting Card PNG
          </a>
        </div>
      )}
    </div>
  );
}
