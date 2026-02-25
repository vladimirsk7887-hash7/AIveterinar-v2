import { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import Conversations from './pages/Conversations.jsx';
import ConversationDetail from './pages/ConversationDetail.jsx';
import Appointments from './pages/Appointments.jsx';
import WidgetSetup from './pages/WidgetSetup.jsx';
import Billing from './pages/Billing.jsx';
import EventLog from './pages/EventLog.jsx';
import { api } from './lib/api.js';

const PAGES = {
  dashboard: { label: 'Дашборд', icon: '📊', component: Dashboard },
  conversations: { label: 'Диалоги', icon: '💬', component: Conversations },
  appointments: { label: 'Записи', icon: '📋', component: Appointments },
  widget: { label: 'Виджет', icon: '🔌', component: WidgetSetup },
  settings: { label: 'Настройки', icon: '⚙️', component: Settings },
  billing: { label: 'Биллинг', icon: '💳', component: Billing },
  events: { label: 'Лог событий', icon: '📜', component: EventLog },
};

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');
  const [selectedId, setSelectedId] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [clinicLoading, setClinicLoading] = useState(false);

  const handleLogin = (accessToken) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setClinic(null);
  };

  // Load clinic data to check onboarding status
  useEffect(() => {
    if (!token) return;
    setClinicLoading(true);
    api.getClinic()
      .then(setClinic)
      .catch(() => {})
      .finally(() => setClinicLoading(false));
  }, [token]);

  if (!token) {
    if (authPage === 'register') {
      return <Register onSwitch={() => setAuthPage('login')} onLogin={handleLogin} />;
    }
    return <Login onSwitch={() => setAuthPage('register')} onLogin={handleLogin} />;
  }

  // Show loading while checking clinic
  if (clinicLoading) {
    return <div className="auth-page"><div className="empty-state"><div className="icon">&#9203;</div>Загрузка...</div></div>;
  }

  // Show onboarding for new clinics (no onboarding choice made yet)
  if (clinic && !clinic.settings?.onboarding) {
    return (
      <Onboarding
        clinic={clinic}
        onComplete={(choice) => {
          setClinic({ ...clinic, settings: { ...clinic.settings, onboarding: choice } });
        }}
      />
    );
  }

  // Conversation detail view
  if (page === 'conversation-detail' && selectedId) {
    return (
      <div className="admin-layout">
        <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
        <main className="admin-main">
          <ConversationDetail
            id={selectedId}
            onBack={() => { setPage('conversations'); setSelectedId(null); }}
          />
        </main>
      </div>
    );
  }

  const PageComponent = PAGES[page]?.component || Dashboard;

  return (
    <div className="admin-layout">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="admin-main">
        <PageComponent
          onViewConversation={(id) => { setSelectedId(id); setPage('conversation-detail'); }}
        />
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="logo">
        <span>🐾</span> AI-Ветеринар
      </div>
      <nav>
        {Object.entries(PAGES).map(([key, { label, icon }]) => (
          <button
            key={key}
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => setPage(key)}
          >
            <span className="icon">{icon}</span>
            {label}
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
