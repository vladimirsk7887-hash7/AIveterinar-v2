import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const [clinic, setClinic] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getClinic(), api.getAnalytics()])
      .then(([c, a]) => { setClinic(c); setAnalytics(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">📊</span> Дашборд</div>

      {clinic && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.08), rgba(68,138,255,0.05))', border: '1px solid rgba(124,77,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{clinic.name}</div>
              <div style={{ color: '#546E7A', fontSize: 12, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                /{clinic.slug} · Тариф: {clinic.plan_id}
              </div>
            </div>
            <span className={`badge ${clinic.is_active ? 'badge-green' : 'badge-red'}`}>
              {clinic.is_active ? 'Активна' : 'Неактивна'}
            </span>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{analytics?.conversations ?? '—'}</div>
          <div className="stat-label">Диалогов за месяц</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.appointments ?? '—'}</div>
          <div className="stat-label">Записей на приём</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.conversionRate ?? 0}%</div>
          <div className="stat-label">Конверсия</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {analytics?.usage ? `${Math.round((analytics.usage.tokens_input + analytics.usage.tokens_output) / 1000)}K` : '—'}
          </div>
          <div className="stat-label">Токенов использовано</div>
        </div>
      </div>

      {analytics?.statusBreakdown && Object.keys(analytics.statusBreakdown).length > 0 && (
        <div className="card">
          <div className="card-title">Статусы диалогов</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <span key={status} className={`badge badge-${status === 'red' ? 'red' : status === 'yellow' ? 'yellow' : 'green'}`}>
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
