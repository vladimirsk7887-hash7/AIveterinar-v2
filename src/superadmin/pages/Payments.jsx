import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

const STATUS_BADGE = {
  pending: 'badge-yellow',
  succeeded: 'badge-green',
  failed: 'badge-red',
  cancelled: 'badge-red',
};

export default function Payments({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi.getPayments(token)
      .then((data) => setPayments(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  const total = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + (p.amount_rub || 0), 0);

  return (
    <div>
      <div className="page-title"><span className="icon">💰</span> Платежи</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Всего платежей</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#00E676' }}>{total} ₽</div>
          <div className="stat-label">Успешных</div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state"><div className="icon">💰</div>Нет платежей</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Клиника</th>
                <th>Тип</th>
                <th>Сумма</th>
                <th>Провайдер</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#90CAF9' }}>
                    {new Date(p.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td>{p.clinic_name || p.clinic_id?.substring(0, 8) || '—'}</td>
                  <td style={{ fontSize: 12 }}>{p.type === 'topup' ? 'Пополнение' : p.type === 'subscription' ? 'Подписка' : p.type || '—'}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{p.amount_rub} ₽</td>
                  <td style={{ fontSize: 11, color: '#546E7A' }}>{p.provider || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[p.status] || 'badge-blue'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
