// client/src/pages/Quotations.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { fmtRs, fmtDate, TAX_LABELS, calcTax } from '../utils/tax';
import { useToast } from '../hooks/useToast';
import { Icons } from '../components/Icons';

const BRANCH_CLS = { Prime:'badge-prime', Marino:'badge-marino', Liberty:'badge-liberty' };
const STATUS_CLS  = { DRAFT:'badge-draft', SENT:'badge-sent', VIEWED:'badge-viewed' };

export function QuotationsList({ branchFilter }) {
  const [data, setData] = useState({ quotations:[], total:0, pages:1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (branchFilter) params.set('branch', branchFilter);
    api.get(`/quotations?${params}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, branchFilter]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div className="page-title">{branchFilter ? `${branchFilter} — Quotations` : 'All Quotations'}</div>
          <div className="page-subtitle">{data.total} total</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/new')}><Icons.Plus /> New</button>
      </div>
      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Client</th><th>Branch</th><th>Tax type</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--text3)' }}>Loading…</td></tr>}
              {!loading && !data.quotations.length && (
                <tr><td colSpan={8}><div className="empty-state"><Icons.File /><p>No quotations found.</p></div></td></tr>
              )}
              {data.quotations.map(q => (
                <tr key={q.id} style={{ cursor:'pointer' }} onClick={() => nav(`/quotations/${q.id}`)}>
                  <td style={{ fontWeight:600 }}>#{q.globalNum}</td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.clientName}</td>
                  <td><span className={`badge ${BRANCH_CLS[q.branch]}`}>{q.branch}</span></td>
                  <td style={{ color:'var(--text2)', fontSize:12 }}>{TAX_LABELS[q.taxMode]}</td>
                  <td style={{ fontWeight:600 }}>{fmtRs(q.total)}</td>
                  <td><span className={`badge ${STATUS_CLS[q.status]}`}>{q.status.toLowerCase()}</span></td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{fmtDate(q.createdAt)}</td>
                  <td><button className="btn btn-icon"><Icons.Eye /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center' }}>
            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
            <span style={{ fontSize:12, color:'var(--text3)' }}>Page {page} of {data.pages}</span>
            <button className="btn btn-sm" disabled={page === data.pages} onClick={() => setPage(p => p+1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuotationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/quotations/${id}`)
      .then(r => setQ(r.data))
      .catch(() => nav('/quotations'))
      .finally(() => setLoading(false));
  }, [id]);

  const sendEmail = async () => {
    setSending(true);
    try {
      const { data } = await api.post(`/quotations/${id}/send`);
      setDownloadUrl(data.downloadUrl);
      setQ(prev => ({ ...prev, status: 'SENT', emailSentAt: new Date().toISOString() }));
      toast('Email sent successfully!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to send email', 'error');
    } finally { setSending(false); }
  };

  const deleteQuotation = async () => {
    if (!window.confirm(`Delete Quotation #${q.globalNum}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/quotations/${id}`);
      toast('Quotation deleted');
      nav('/quotations');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
      setDeleting(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quotations/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iDealz-Quotation-${q?.globalNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast('PDF downloaded!', 'success');
    } catch {
      toast('PDF generation failed', 'error');
    }
  };

  const copyLink = () => {
    const url = downloadUrl || `${window.location.origin}/download/${q?.downloadToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast('Link copied!');
    });
  };

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Loading…</div>;
  if (!q) return null;

  const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;
  const { sscl, vat } = calcTax(q.subTotal, q.taxMode);
  const dlUrl = downloadUrl || `${window.location.origin}/download/${q.downloadToken}`;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <button className="btn btn-sm" style={{ marginBottom:10 }} onClick={() => nav('/quotations')}>← Back</button>
          <div className="page-title">Quotation #{q.globalNum}</div>
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <span className={`badge ${BRANCH_CLS[q.branch]}`}>{q.branch}</span>
            <span className={`badge ${STATUS_CLS[q.status]}`}>{q.status.toLowerCase()}</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>{TAX_LABELS[q.taxMode]}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={downloadPDF}>
            <Icons.Download /> PDF
          </button>
          <button className="btn btn-primary" onClick={sendEmail} disabled={sending}>
            <Icons.Mail /> {sending ? 'Sending…' : q.status === 'DRAFT' ? 'Send email' : 'Resend email'}
          </button>
          <button className="btn btn-danger" onClick={deleteQuotation} disabled={deleting}>
            <Icons.Trash /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {q.status !== 'DRAFT' && (
        <div className="alert alert-info" style={{ marginBottom:16 }}>
          <strong>Download link</strong> — share with your client:
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <input className="form-input" value={dlUrl} readOnly style={{ flex:1, fontFamily:'monospace', fontSize:12 }} />
            <button className="btn" onClick={copyLink}>
              {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy</>}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="card card-sm">
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Bill to</div>
          <div style={{ fontWeight:700, fontSize:14 }}>{q.clientName}</div>
          {q.clientAddr && <div style={{ color:'var(--text2)', fontSize:13, marginTop:2 }}>{q.clientAddr}</div>}
          {q.clientPhone && <div style={{ color:'var(--text2)', fontSize:13 }}>P: {q.clientPhone}</div>}
          <div style={{ color:'var(--text2)', fontSize:13 }}>E: {q.clientEmail}</div>
        </div>
        <div className="card card-sm">
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Quotation details</div>
          <table style={{ fontSize:13, width:'100%' }}>
            <tbody>
              {[
                ['Quotation #', `#${q.globalNum}`],
                ['Date', fmtDate(q.createdAt)],
                ['Branch', `iDealz ${q.branch}`],
                ['Manager', q.manager?.name],
                ['Tax type', TAX_LABELS[q.taxMode]],
                q.emailSentAt ? ['Email sent', fmtDate(q.emailSentAt)] : null
              ].filter(Boolean).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color:'var(--text3)', paddingBottom:4, width:'45%' }}>{k}</td>
                  <td style={{ fontWeight:500 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding:0, marginBottom:16 }}>
        <table className="data-table">
          <thead><tr><th style={{ width:50 }}>Qty</th><th>Description</th><th style={{ textAlign:'right' }}>Unit price</th><th style={{ textAlign:'right' }}>Total</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>{it.qty}</td><td>{it.desc}</td>
                <td style={{ textAlign:'right' }}>{fmtRs(it.price)}</td>
                <td style={{ textAlign:'right', fontWeight:600 }}>{fmtRs(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <div className="totals-box">
          <div className="total-line"><span>Sub total</span><span>{fmtRs(q.subTotal)}</span></div>
          {q.taxMode === 'VAT18_SSCL25' && <div className="total-line"><span>SSCL 2.5%</span><span>{fmtRs(q.ssclAmount)}</span></div>}
          {(q.taxMode === 'VAT18' || q.taxMode === 'VAT18_SSCL25') && <div className="total-line"><span>VAT 18%</span><span>{fmtRs(q.vatAmount)}</span></div>}
          {q.taxMode === 'FLAT205' && <div className="total-line"><span>Tax 20.5%</span><span>{fmtRs(q.total - q.subTotal)}</span></div>}
          {q.taxMode === 'VAT_INCLUSIVE' && <div className="total-line"><span>Incl. VAT</span><span>{fmtRs(q.vatAmount)}</span></div>}
          <div className="total-line grand"><span>Grand total</span><span>{fmtRs(q.total)}</span></div>
        </div>
      </div>

      {q.notes && (
        <div className="card card-sm">
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Notes</div>
          <div style={{ fontSize:13 }}>{q.notes}</div>
        </div>
      )}
    </div>
  );
}
