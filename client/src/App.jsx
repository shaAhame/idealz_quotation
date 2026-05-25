// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewQuotation from './pages/NewQuotation';
import { QuotationsList, QuotationDetail } from './pages/Quotations';
import { UsersPage, ChangePassword } from './pages/Users';

function BranchRoute() {
  const { branch } = useParams();
  return <QuotationsList branchFilter={branch} />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text3)', fontSize: 14 }}>
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewQuotation />} />
            <Route path="/quotations" element={<QuotationsList />} />
            <Route path="/quotations/:id" element={<QuotationDetail />} />
            <Route path="/branch/:branch" element={<BranchRoute />} />
            <Route path="/users" element={user.role === 'ADMIN' ? <UsersPage /> : <Navigate to="/" />} />
            <Route path="/password" element={<ChangePassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
