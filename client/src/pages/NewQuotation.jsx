// client/src/pages/NewQuotation.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { TAX_MODES, calcTax, fmtRs } from '../utils/tax';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { Icons } from '../components/Icons';

export default function NewQuotation() {
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState({
    clientName: '', clientAddr: '', clientEmail: '',
    clientPhone: '', taxMode: 'VAT18', notes: '',
    quotationType: 'COMMON',
    branch: user?.branch || 'Prime',
  });
  const [items, setItems] = useState([{ id: 1, qty: 1, desc: '', price: '' }]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addItem = () => setItems(i => [...i, { id: Date.now(), qty: 1, desc: '', price: '' }]);
  const removeItem = id => setItems(i => i.filter(x => x.id !== id));
  const updateItem = (id, k, v) => setItems(i => i.map(x => x.id === id ? { ...x, [k]: v } : x));

  const validItems = items.filter(i => i.qty && i.desc && i.price && +i.price > 0);
  const sub = validItems.reduce((s, i) => s + (+i.qty * +i.price), 0);
  const { sscl, vat, total } = calcTax(sub, form.taxMode);

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Required';
    if (!form.clientEmail.trim()) e.clientEmail = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.clientEmail)) e.clientEmail = 'Invalid email';
    if (!validItems.length) e.items = 'Add at least one item with description and price';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const doSave = async () => {
    if (!validate()) return null;
    setSaving(true);
    try {
      const { data } = await api.post('/quotations', {
        ...form,
        items: validItems.map(i => ({
          qty: +i.qty, desc: i.desc, price: +i.price, total: +i.qty * +i.price
        }))
      });
      setSavedId(data.id);
      return data.id;
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const id = await doSave();
    if (id) { toast('Quotation saved!', 'success'); nav(`/quotations/${id}`); }
  };

  const handleSend = async () => {
    let id = savedId;
    if (!id) id = await doSave();
    if (!id) return;
    setSending(true);
    try {
      const { data } = await api.post(`/quotations/${id}/send`);
      setDownloadUrl(data.downloadUrl);
      setEmailSent(true);
      toast('Email sent successfully!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  const handlePDF = async () => {
    let id = savedId;
    if (!id) id = await doSave();
    if (!id) return;
    setDownloading(true);
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
      a.download = `iDealz-Quotation-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast('PDF downloaded!', 'success');
    } catch {
      toast('PDF generation failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(downloadUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const taxInfo = TAX_MODES.find(t => t.id === form.taxMode);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div className="page-title">New Quotation</div>
          <div className="page-subtitle">Fill in client details, select tax format, add items</div>
        </div>
      </div>

      {emailSent && (
        <div className="alert alert-success" style={{ marginBottom:16 }}>
          <strong>✓ Email sent to {form.clientEmail}</strong>
          <div style={{ marginTop:8 }}>Share this download link with your client:</div>
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <input className="form-input" value={downloadUrl} readOnly
              style={{ flex:1, fontFamily:'monospace', fontSize:12 }} />
            <button className="btn" onClick={copyLink}>
              {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy</>}
            </button>
          </div>
        </div>
      )}

      {/* Admin Branch Selector — only visible to admin */}
      {isAdmin && (
        <div className="card" style={{ marginBottom:16, border:'1.5px solid var(--border)', background:'var(--bg2)' }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>
            Send as Branch
            <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400, marginLeft:8 }}>Admin only</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {['Prime','Marino','Liberty'].map(b => (
              <div key={b}
                className={`tax-opt${form.branch === b ? ' selected' : ''}`}
                onClick={() => setF('branch', b)}
                style={{ padding:'12px 16px', textAlign:'center', cursor:'pointer' }}>
                <div className="t-name" style={{ fontSize:13 }}>iDealz {b}</div>
                <div className="t-pct" style={{ marginTop:4 }}>
                  {{ Prime:'Galle Road, Colombo 04', Marino:'Marino Mall, Colombo 03', Liberty:'Liberty Plaza, Colombo 03' }[b]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Details */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Client Details</div>
        <div className="form-grid">
          <div className="full">
            <label className="form-label">Company / Client name *</label>
            <input className="form-input" value={form.clientName}
              onChange={e => setF('clientName', e.target.value)}
              placeholder="e.g. Jay Kay Marketing Services (Pvt) Ltd" />
            {errors.clientName && <div className="form-error">{errors.clientName}</div>}
          </div>
          <div className="full">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.clientAddr}
              onChange={e => setF('clientAddr', e.target.value)}
              placeholder="Street, city" />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.clientEmail}
              onChange={e => setF('clientEmail', e.target.value)}
              placeholder="client@company.com" />
            {errors.clientEmail && <div className="form-error">{errors.clientEmail}</div>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.clientPhone}
              onChange={e => setF('clientPhone', e.target.value)}
              placeholder="+94 77 XXX XXXX" />
          </div>
        </div>
      </div>

      {/* Tax Format */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Tax / Price Format</div>
        <div className="tax-grid">
          {TAX_MODES.map(t => (
            <div key={t.id}
              className={`tax-opt${form.taxMode === t.id ? ' selected' : ''}`}
              onClick={() => setF('taxMode', t.id)}>
              <div className="t-name">{t.label}</div>
              <div className="t-pct">{t.pct}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:12, color:'var(--text3)', background:'var(--bg2)', padding:'8px 12px', borderRadius:6 }}>
          {taxInfo?.desc}
        </div>
      </div>

      {/* Quotation Type */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Quotation Type</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div className={`tax-opt${form.quotationType === 'COMMON' ? ' selected' : ''}`}
            onClick={() => setF('quotationType', 'COMMON')}
            style={{ padding:'12px 16px', textAlign:'left' }}>
            <div className="t-name" style={{ fontSize:13 }}>🌐 Common</div>
            <div className="t-pct" style={{ marginTop:4 }}>Shows all 3 branch addresses in footer</div>
          </div>
          <div className={`tax-opt${form.quotationType === 'BRANCH' ? ' selected' : ''}`}
            onClick={() => setF('quotationType', 'BRANCH')}
            style={{ padding:'12px 16px', textAlign:'left' }}>
            <div className="t-name" style={{ fontSize:13 }}>🏪 Branch only</div>
            <div className="t-pct" style={{ marginTop:4 }}>Shows only this branch address in footer</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:600, fontSize:13 }}>Items</div>
          <button className="btn btn-sm" onClick={addItem}><Icons.Plus /> Add item</button>
        </div>
        {errors.items && <div className="alert alert-error" style={{ marginBottom:10 }}>{errors.items}</div>}
        <div className="table-wrap">
          <table className="items-table" style={{ marginBottom:14 }}>
            <thead>
              <tr>
                <th>Qty</th><th>Description</th>
                <th style={{ textAlign:'right' }}>Unit price (Rs.)</th>
                <th style={{ textAlign:'right' }}>Total (Rs.)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id,'qty',e.target.value)} style={{ width:40, textAlign:'center' }} /></td>
                  <td><input type="text" value={item.desc} onChange={e => updateItem(item.id,'desc',e.target.value)} placeholder="Item description" /></td>
                  <td><input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id,'price',e.target.value)} placeholder="0.00" style={{ textAlign:'right' }} /></td>
                  <td style={{ fontWeight:600, fontSize:13, textAlign:'right', paddingRight:12 }}>
                    {item.qty && item.price ? fmtRs(+item.qty * +item.price) : '—'}
                  </td>
                  <td><button className="btn btn-icon" style={{ color:'var(--danger)' }} onClick={() => removeItem(item.id)}><Icons.Trash /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <div className="totals-box">
            <div className="total-line"><span>Sub total</span><span>{fmtRs(sub)}</span></div>
            {form.taxMode === 'VAT18_SSCL25' && <div className="total-line"><span>SSCL 2.5%</span><span>{fmtRs(sscl)}</span></div>}
            {(form.taxMode === 'VAT18' || form.taxMode === 'VAT18_SSCL25') && <div className="total-line"><span>VAT 18%</span><span>{fmtRs(vat)}</span></div>}
            {form.taxMode === 'FLAT205' && <div className="total-line"><span>Tax 20.5%</span><span>{fmtRs(total - sub)}</span></div>}
            {form.taxMode === 'VAT_INCLUSIVE' && <div className="total-line"><span>Incl. VAT</span><span>{fmtRs(vat)}</span></div>}
            <div className="total-line grand"><span>Grand total</span><span>{fmtRs(total)}</span></div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom:24 }}>
        <label className="form-label">Notes / Additional terms (optional)</label>
        <textarea className="form-input" value={form.notes} onChange={e => setF('notes', e.target.value)}
          rows={2} placeholder="e.g. 06 month seller warranty included" />
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn" onClick={handlePDF} disabled={saving||sending||downloading}>
          <Icons.Download /> {downloading ? 'Generating…' : 'Download PDF'}
        </button>
        <button className="btn" onClick={handleSave} disabled={saving||sending}>
          <Icons.File /> {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button className="btn btn-primary" onClick={handleSend} disabled={saving||sending}>
          <Icons.Mail /> {sending ? 'Sending…' : 'Send via email'}
        </button>
      </div>
    </div>
  );
}
