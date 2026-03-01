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

function getInitialToken() {
  // Handle magic link / OAuth callback: Supabase puts access_token in URL hash
  const hash = window.location.hash;
  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.slice(1));
    const t = params.get('access_token');
    if (t) {
      localStorage.setItem('access_token', t);
      window.history.replaceState(null, '', window.location.pathname);
      return t;
    }
  }
  return localStorage.getItem('access_token');
}

export default function AdminApp() {
  const [token, setToken] = useState(getInitialToken);
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');
  const [selectedId, setSelectedId] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      .catch((err) => {
        // Expired or invalid token — redirect to login
        if (err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized')) {
          handleLogout();
        }
      })
      .finally(() => setClinicLoading(false));
  }, [token]);

  if (!token) {
    if (authPage === 'register') {
      return <Register onSwitch={() => setAuthPage('login')} onLogin={handleLogin} />;
    }
    return <Login onSwitch={() => setAuthPage('register')} onLogin={handleLogin} />;
  }

  // Show loading while checking clinic (with proper card wrapper)
  if (clinicLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="empty-state">
            <div className="icon">⏳</div>
            Загрузка...
          </div>
        </div>
      </div>
    );
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

  const navigate = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  // Conversation detail view
  if (page === 'conversation-detail' && selectedId) {
    return (
      <div className="admin-layout">
        <MobileTopbar onOpen={() => setSidebarOpen(true)} />
        {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
        <Sidebar page={page} navigate={navigate} onLogout={handleLogout} open={sidebarOpen} />
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
      <MobileTopbar onOpen={() => setSidebarOpen(true)} />
      {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
      <Sidebar page={page} navigate={navigate} onLogout={handleLogout} open={sidebarOpen} />
      <main className="admin-main">
        <PageComponent
          onViewConversation={(id) => { setSelectedId(id); setPage('conversation-detail'); }}
        />
      </main>
    </div>
  );
}

function MobileTopbar({ onOpen }) {
  return (
    <div className="mobile-topbar">
      <button className="hamburger" onClick={onOpen} aria-label="Открыть меню">
        <span /><span /><span />
      </button>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>🐾 AI-Ветеринар</div>
      <div style={{ width: 30 }} />
    </div>
  );
}

function Sidebar({ page, navigate, onLogout, open }) {
  return (
    <aside className={`admin-sidebar${open ? ' open' : ''}`}>
      <div className="logo">
        <span>🐾</span> AI-Ветеринар
      </div>
      <nav>
        {Object.entries(PAGES).map(([key, { label, icon }]) => (
          <button
            key={key}
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => navigate(key)}
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
