import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function ClinicsList({ token, onViewClinic, onCreateClinic }) {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi.getClinics(token)
      .then((data) => setClinics(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <span className="icon">&#127973;</span> Клиники ({clinics.length})
        </div>
        <button className="btn btn-primary" onClick={onCreateClinic}>
          &#10133; Создать клинику
        </button>
      </div>

      {clinics.length === 0 ? (
        <div className="empty-state"><div className="icon">🏥</div>Нет зарегистрированных клиник</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Slug</th>
                <th>Тариф</th>
                <th>Баланс</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#90CAF9' }}>/{c.slug}</td>
                  <td><span className="badge badge-blue">{c.plan_id}</span></td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {c.balance_rub ?? 0} ₽
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>
                      {c.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => onViewClinic?.(c.id)}>
                      Подробнее
                    </button>
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
