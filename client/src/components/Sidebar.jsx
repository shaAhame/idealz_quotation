// client/src/components/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icons } from './Icons';

const BRANCH_COLORS = { Prime: '#7c3aed', Marino: '#15803d', Liberty: '#1d4ed8' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const at = p => loc.pathname === p;
  const startsWith = p => loc.pathname.startsWith(p);

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">
          <img
            src="/logo.png"
            alt="iDealz"
            style={{ height: 28, width: 'auto' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }}
          />
          <span className="sb-logo-text" style={{ display: 'none' }}>iDealz</span>
        </div>
        <div className="sb-tag">Quotation System</div>
      </div>

      <div className="sb-nav">
        <div className="nav-section-label">Menu</div>

        <div className={`nav-item ${at('/') ? 'active' : ''}`} onClick={() => nav('/')}>
          <Icons.Dashboard /> Dashboard
        </div>
        <div className={`nav-item ${at('/new') ? 'active' : ''}`} onClick={() => nav('/new')}>
          <Icons.Plus /> New Quotation
        </div>
        <div className={`nav-item ${at('/quotations') ? 'active' : ''}`} onClick={() => nav('/quotations')}>
          <Icons.History /> All Sent
        </div>

        {user?.role === 'ADMIN' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Branches</div>
            {['Prime', 'Marino', 'Liberty'].map(b => (
              <div
                key={b}
                className={`nav-item ${at(`/branch/${b}`) ? 'active' : ''}`}
                onClick={() => nav(`/branch/${b}`)}>
                <span className="branch-dot" style={{ background: BRANCH_COLORS[b] }} />
                {b}
              </div>
            ))}
            <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
            <div className={`nav-item ${startsWith('/users') ? 'active' : ''}`} onClick={() => nav('/users')}>
              <Icons.Users /> Manage Users
            </div>
          </>
        )}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
        <div className={`nav-item ${at('/password') ? 'active' : ''}`} onClick={() => nav('/password')}>
          <Icons.Key /> Change Password
        </div>
        <div className="nav-item" onClick={logout} style={{ color: 'var(--text3)' }}>
          <Icons.LogOut /> Sign out
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
          {user?.branch} · {user?.role?.toLowerCase()}
        </div>
      </div>
    </div>
  );
}
