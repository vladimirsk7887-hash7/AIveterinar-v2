import { useState } from 'react';
import ClinicsList from './pages/ClinicsList.jsx';
import ClinicDetail from './pages/ClinicDetail.jsx';
import CreateClinic from './pages/CreateClinic.jsx';
import Stats from './pages/Stats.jsx';
import EventsLog from './pages/EventsLog.jsx';
import Payments from './pages/Payments.jsx';

const PAGES = {
  clinics: { label: 'Клиники', icon: '🏥', component: ClinicsList },
  stats: { label: 'Статистика', icon: '📊', component: Stats },
  payments: { label: 'Платежи', icon: '💰', component: Payments },
  events: { label: 'События', icon: '📜', component: EventsLog },
};

export default function SuperAdminApp() {
  const [token, setToken] = useState(localStorage.getItem('sa_token'));
  const [page, setPage] = useState('clinics');
  const [selectedClinic, setSelectedClinic] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem('sa_token', data.access_token);
          setToken(data.access_token);
        }
      })
      .catch(() => {});
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 16 }}>⚙️</div>
          <div className="auth-title">Суперадмин</div>
          <div className="auth-subtitle">Доступ только для администратора платформы</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" name="email" required />
            </div>
            <div className="form-group">
              <label className="label">Пароль</label>
              <input className="input" type="password" name="password" required />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  const logout = () => { localStorage.removeItem('sa_token'); setToken(null); };

  if (page === 'clinic-detail' && selectedClinic) {
    return (
      <div className="admin-layout">
        <Sidebar page="clinics" setPage={setPage} onLogout={logout} />
        <main className="admin-main">
          <ClinicDetail id={selectedClinic} onBack={() => { setPage('clinics'); setSelectedClinic(null); }} token={token} />
        </main>
      </div>
    );
  }

  if (page === 'create-clinic') {
    return (
      <div className="admin-layout">
        <Sidebar page="clinics" setPage={setPage} onLogout={logout} />
        <main className="admin-main">
          <CreateClinic token={token} onBack={() => setPage('clinics')} />
        </main>
      </div>
    );
  }

  const PageComponent = PAGES[page]?.component || ClinicsList;

  return (
    <div className="admin-layout">
      <Sidebar page={page} setPage={setPage} onLogout={logout} />
      <main className="admin-main">
        <PageComponent
          token={token}
          onViewClinic={(id) => { setSelectedClinic(id); setPage('clinic-detail'); }}
          onCreateClinic={() => setPage('create-clinic')}
        />
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="logo">
        <span>⚙️</span> Суперадмин
      </div>
      <nav>
        {Object.entries(PAGES).map(([key, { label, icon }]) => (
          <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => setPage(key)}>
            <span className="icon">{icon}</span>{label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '0 8px', marginTop: 'auto' }}>
        <button className="nav-item" onClick={onLogout}>
          <span className="icon">🚪</span> Выйти
        </button>
      </div>
    </aside>
  );
}
