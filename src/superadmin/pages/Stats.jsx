import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function Stats({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi.getStats(token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (!stats) return <div className="empty-state"><div className="icon">❌</div>Не удалось загрузить статистику</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">📊</span> Статистика платформы</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total_clinics ?? 0}</div>
          <div className="stat-label">Клиник всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active_clinics ?? 0}</div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_conversations ?? 0}</div>
          <div className="stat-label">Диалогов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_appointments ?? 0}</div>
          <div className="stat-label">Записей</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {stats.total_tokens ? `${Math.round(stats.total_tokens / 1000)}K` : '—'}
          </div>
          <div className="stat-label">Токенов всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {stats.total_revenue ? `${stats.total_revenue} ₽` : '—'}
          </div>
          <div className="stat-label">Выручка</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {stats.total_costs ? `${stats.total_costs} ₽` : '—'}
          </div>
          <div className="stat-label">Расходы на AI</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {stats.mrr ? `${stats.mrr} ₽` : '—'}
          </div>
          <div className="stat-label">MRR</div>
        </div>
      </div>

      {stats.plan_distribution && (
        <div className="card">
          <div className="card-title">Распределение по тарифам</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(stats.plan_distribution).map(([plan, count]) => (
              <div key={plan} style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800 }}>{count}</div>
                <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', marginTop: 4 }}>{plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
