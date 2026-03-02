import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

const PLAN_NAMES = { trial: 'Пробный', start: 'Старт', business: 'Бизнес', pro: 'Про' };

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('ru-RU');
}

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

      {/* Top row: main KPIs */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-value">{fmt(stats.clinics?.total)}</div>
          <div className="stat-label">Всего клиник</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-value">{fmt(stats.new_clinics_today)}</div>
          <div className="stat-label">Новых сегодня</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#00E676' }}>₽</div>
          <div className="stat-value" style={{ color: '#00E676' }}>{fmt(stats.total_revenue)}</div>
          <div className="stat-label">Общий доход</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#FF5252' }}>₽</div>
          <div className="stat-value" style={{ color: '#FF5252' }}>{fmt(stats.total_costs)}</div>
          <div className="stat-label">Затраты AI</div>
        </div>
      </div>

      {/* Stats for period */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 55%', minWidth: 280 }}>
          <div className="card-title">Статистика за период</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'space-around', padding: '12px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#448AFF' }}>{fmt(stats.new_clinics_week)}</div>
              <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4 }}>Новых за неделю</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#00E676' }}>{fmt(stats.revenue_month)} ₽</div>
              <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4 }}>Доход за месяц</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7C4DFF' }}>{fmt(stats.conversations)}</div>
              <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4 }}>Всего диалогов</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 35%', minWidth: 220 }}>
          <div className="card-title">Ключевые метрики</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#90A4AE', fontSize: 13 }}>Активных клиник</span>
              <span style={{ fontWeight: 700 }}>{fmt(stats.clinics?.active)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#90A4AE', fontSize: 13 }}>Записей на приём</span>
              <span style={{ fontWeight: 700 }}>{fmt(stats.appointments)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#90A4AE', fontSize: 13 }}>MRR</span>
              <span style={{ fontWeight: 700, color: '#00E676' }}>{fmt(stats.mrr)} ₽</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan distribution */}
      {stats.plan_distribution && Object.keys(stats.plan_distribution).length > 0 && (
        <div className="card">
          <div className="card-title">Распределение по тарифам</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(stats.plan_distribution).map(([plan, count]) => (
              <div key={plan} style={{ padding: '14px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 800 }}>{count}</div>
                <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', marginTop: 4 }}>{PLAN_NAMES[plan] || plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
