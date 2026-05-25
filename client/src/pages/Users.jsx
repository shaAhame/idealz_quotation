// client/src/pages/Users.jsx
import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';
import { Icons } from '../components/Icons';

const BRANCHES = ['Prime', 'Marino', 'Liberty'];

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', branch:'Prime', role:'MANAGER' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      toast('User created successfully', 'success');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', branch:'Prime', role:'MANAGER' });
      setErrors({});
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to create user', 'error');
    } finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast('User deleted');
      load();
    } catch { toast('Failed to delete user', 'error'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div className="page-title">Manage Users</div>
          <div className="page-subtitle">Branch managers and administrators</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setErrors({}); }}>
          <Icons.Plus /> Add user
        </button>
      </div>

      <div className="card" style={{ padding:0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Branch</th><th>Role</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {!users.length && (
              <tr><td colSpan={6}><div className="empty-state"><Icons.Users /><p>No users found.</p></div></td></tr>
            )}
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight:500 }}>{u.name}</td>
                <td style={{ color:'var(--text2)' }}>{u.email}</td>
                <td>{u.branch}</td>
                <td><span className="badge">{u.role}</span></td>
                <td style={{ color:'var(--text3)', fontSize:12 }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <button className="btn btn-icon" style={{ color:'var(--danger)' }}
                    onClick={() => remove(u.id, u.name)}>
                    <Icons.Trash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add new user</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}><Icons.X /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div>
                    <label className="form-label">Full name *</label>
                    <input className="form-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Kasun Perera" />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="kasun@idealz.lk" />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" value={form.password} onChange={e => setF('password', e.target.value)} placeholder="Minimum 6 characters" />
                    {errors.password && <div className="form-error">{errors.password}</div>}
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select className="form-input" value={form.branch} onChange={e => setF('branch', e.target.value)}>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="full">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={form.role} onChange={e => setF('role', e.target.value)}>
                      <option value="MANAGER">Manager — can create/send quotations for their branch</option>
                      <option value="ADMIN">Admin — full access to all branches and users</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Required';
    if (form.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
    if (form.newPassword !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) return setErrors(errs);
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast('Password changed successfully!', 'success');
      setSuccess(true);
      setForm({ currentPassword:'', newPassword:'', confirm:'' });
      setErrors({});
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth:420 }}>
      <div style={{ marginBottom:24 }}>
        <div className="page-title">Change Password</div>
        <div className="page-subtitle">Update your login password</div>
      </div>
      <div className="card">
        {success && <div className="alert alert-success" style={{ marginBottom:16 }}>Password changed successfully!</div>}
        <form onSubmit={submit}>
          {[
            ['currentPassword', 'Current password', 'Enter your current password'],
            ['newPassword', 'New password', 'Minimum 6 characters'],
            ['confirm', 'Confirm new password', 'Re-enter new password']
          ].map(([k, label, ph]) => (
            <div className="form-group" key={k}>
              <label className="form-label">{label}</label>
              <input className="form-input" type="password" value={form[k]}
                onChange={e => setF(k, e.target.value)} placeholder={ph} />
              {errors[k] && <div className="form-error">{errors[k]}</div>}
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop:4 }}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
