// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img
            src="/logo.png"
            alt="iDealz"
            style={{ height: 44, width: 'auto' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }}
          />
          <div style={{ display: 'none', fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>iDealz</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Quotation System
          </div>
        </div>

        <form onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@idealz.lk"
              autoFocus
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg2)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
          iDealz — The future's bright
        </div>
      </div>
    </div>
  );
}
