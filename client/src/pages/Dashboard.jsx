// client/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { fmtRs, fmtDate, TAX_LABELS } from '../utils/tax';
import { Icons } from '../components/Icons';

const BRANCH_CLS = { Prime: 'badge-prime', Marino: 'badge-marino', Liberty: 'badge-liberty' };
const STATUS_CLS  = { DRAFT: 'badge-draft', SENT: 'badge-sent', VIEWED: 'badge-viewed' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    api.get('/quotations/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const branchCount = b => stats?.byBranch?.find(x => x.branch === b)?._count ?? 0;
  const branchTotal = b => stats?.byBranch?.find(x => x.branch === b)?._sum?.total ?? 0;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of all quotations</div>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/new')}>
          <Icons.Plus /> New Quotation
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total quotations</div>
          <div className="stat-value">{loading ? '—' : (stats?.total ?? 0)}</div>
          <div className="stat-sub">All branches</div>
        </div>
        {[['Prime','#7c3aed'],['Marino','#15803d'],['Liberty','#1d4ed8']].map(([b,c]) => (
          <div className="stat-card" key={b}>
            <div className="stat-label" style={{color:c}}>{b}</div>
            <div className="stat-value">{loading ? '—' : branchCount(b)}</div>
            <div className="stat-sub">{loading ? '' : fmtRs(branchTotal(b))}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:0}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600}}>
          Recent quotations
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Client</th><th>Branch</th><th>Manager</th><th>Tax type</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Loading…</td></tr>}
              {!loading && !stats?.recent?.length && (
                <tr><td colSpan={9}><div className="empty-state"><Icons.File /><p>No quotations yet — create your first one.</p></div></td></tr>
              )}
              {stats?.recent?.map(q => (
                <tr key={q.id} style={{cursor:'pointer'}} onClick={() => nav(`/quotations/${q.id}`)}>
                  <td style={{fontWeight:600}}>#{q.globalNum}</td>
                  <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.clientName}</td>
                  <td><span className={`badge ${BRANCH_CLS[q.branch]}`}>{q.branch}</span></td>
                  <td style={{color:'var(--text2)'}}>{q.manager?.name}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{TAX_LABELS[q.taxMode]}</td>
                  <td style={{fontWeight:600}}>{fmtRs(q.total)}</td>
                  <td><span className={`badge ${STATUS_CLS[q.status]}`}>{q.status.toLowerCase()}</span></td>
                  <td style={{color:'var(--text3)',fontSize:12}}>{fmtDate(q.createdAt)}</td>
                  <td><button className="btn btn-icon" onClick={e=>{e.stopPropagation();nav(`/quotations/${q.id}`);}}><Icons.Eye /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (stats?.total ?? 0) > 8 && (
          <div style={{padding:'10px 20px',borderTop:'1px solid var(--border)',textAlign:'right'}}>
            <button className="btn btn-sm" onClick={() => nav('/quotations')}>View all →</button>
          </div>
        )}
      </div>
    </div>
  );
}
