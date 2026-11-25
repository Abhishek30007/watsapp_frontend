import React, { useState, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertCircle, Download, X, Users, Sparkles } from 'lucide-react';
import { API_BASE } from '../config';

export default function BulkImport({ addToast, onImportComplete }) {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState([]);
  const [headers, setHeaders]     = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);

  const processFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) {
      addToast('Only .csv files are supported.', 'error');
      return;
    }
    setFile(f);
    setResult(null);

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        setHeaders(meta.fields || []);
        setPreview(data.slice(0, 8)); // preview up to 8 rows
      },
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    processFile(f);
  }, []);

  const onFileInput = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/import/csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.imported > 0) {
        addToast(`✅ Successfully imported and scheduled ${res.data.imported} contact(s)!`, 'success');
        onImportComplete?.();
      } else {
        addToast(`Import finished with 0 contacts added. Check errors below.`, 'error');
      }
    } catch (err) {
      const data = err.response?.data;
      setResult(data || { success: false, message: err.message, imported: 0, skipped: 0, errors: [] });
      addToast(`Import failed: ${data?.message || err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setResult(null);
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 className="form-title" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: 'var(--accent-emerald)' }} />
            <span>Bulk CSV Contact Importer</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Upload contacts in bulk. All events are automatically parsed and queued into BullMQ for automated WhatsApp delivery.
          </p>
        </div>
        {file && (
          <button onClick={handleReset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '14px',
            padding: '2.5rem 1rem',
            textAlign: 'center',
            background: dragging ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('csv-file-input').click()}
        >
          <Upload size={36} style={{ color: dragging ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
            {dragging ? 'Drop your CSV file here!' : 'Drag & drop your contacts .csv file here'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            or click to browse from your computer
          </p>
          <input id="csv-file-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileInput} />
        </div>
      )}

      {/* File Selected + Preview */}
      {file && !result && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 0.9rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', marginBottom: '1rem' }}>
            <FileText size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>{file.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{preview.length}+ rows previewed</span>
          </div>

          {/* Preview Table */}
          {preview.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {headers.map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {headers.map(h => (
                        <td key={h} style={{ padding: '7px 10px', color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="btn btn-primary btn-block"
            style={{
              padding: '0.75rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
              cursor: importing ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} />
            {importing ? 'Importing & Scheduling...' : `Import & Auto-Schedule Contacts`}
          </button>
        </>
      )}

      {/* Result Cards */}
      {result && (
        <div style={{ animation: 'slideIn 0.3s ease' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: result.imported > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${result.imported > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
          }}>
            {result.imported > 0
              ? <CheckCircle size={22} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
              : <AlertCircle size={22} style={{ color: '#f87171', flexShrink: 0 }} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: result.imported > 0 ? 'var(--accent-emerald)' : '#f87171' }}>
                {result.imported > 0 ? `${result.imported} contact(s) successfully scheduled in BullMQ!` : 'Import failed'}
              </div>
              {result.skipped > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {result.skipped} row(s) skipped due to missing or invalid fields.
                </div>
              )}
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#fca5a5', maxHeight: '130px', overflowY: 'auto' }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ marginBottom: '3px' }}>• {e}</div>
              ))}
            </div>
          )}

          <button onClick={handleReset} className="btn btn-block" style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Import Another CSV File
          </button>
        </div>
      )}

      {/* Sample CSV Download Link */}
      <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
        <a
          href={`${API_BASE}/import/sample`}
          download="celebratemate-bulk-contacts.csv"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)', textDecoration: 'none', fontWeight: 600 }}
        >
          <Download size={14} /> Download Sample CSV Template
        </a>
      </div>
    </div>
  );
}
