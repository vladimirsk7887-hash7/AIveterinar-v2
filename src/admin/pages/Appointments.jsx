import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const STATUSES = [
  { key: '', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'confirmed', label: 'Подтверждены' },
  { key: 'completed', label: 'Завершены' },
  { key: 'cancelled', label: 'Отменены' },
];

const STATUS_BADGE = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = (status) => {
    setLoading(true);
    api.getAppointments(status || undefined)
      .then((data) => setAppointments(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.updateAppointment(id, status);
      load(filter);
    } catch {}
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">📋</span> Записи на приём</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            className={`btn ${filter === key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(key)}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            {label}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div>Нет записей{filter && ` со статусом "${STATUSES.find(s => s.key === filter)?.label}"`}</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Владелец</th>
                <th>Контакт</th>
                <th>Питомец</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#90CAF9' }}>
                    {new Date(a.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td>{a.owner_name || '—'}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{a.contact_value || '—'}</div>
                    {a.contact_method && <div style={{ fontSize: 10, color: '#546E7A' }}>{a.contact_method}</div>}
                  </td>
                  <td>{a.summary ? a.summary.substring(0, 50) + (a.summary.length > 50 ? '...' : '') : '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[a.status] || 'badge-blue'}`}>
                      {a.status || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {a.status === 'pending' && (
                        <>
                          <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: 10 }} onClick={() => updateStatus(a.id, 'confirmed')}>
                            Подтвердить
                          </button>
                          <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: 10, borderColor: 'rgba(255,82,82,0.3)', color: '#FF5252' }} onClick={() => updateStatus(a.id, 'cancelled')}>
                            Отклонить
                          </button>
                        </>
                      )}
                      {a.status === 'confirmed' && (
                        <button className="btn btn-outline" style={{ padding: '3px 10px', fontSize: 10 }} onClick={() => updateStatus(a.id, 'completed')}>
                          Завершить
                        </button>
                      )}
                    </div>
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
