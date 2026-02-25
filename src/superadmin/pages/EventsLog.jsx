import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function EventsLog({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi.getEvents(token, 200)
      .then((data) => setEvents(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">📜</span> Все события платформы</div>

      {events.length === 0 ? (
        <div className="empty-state"><div className="icon">📜</div>Нет событий</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Клиника</th>
                <th>Событие</th>
                <th>Данные</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#90CAF9' }}>
                    {ev.clinic_slug || ev.clinic_id?.substring(0, 8) || '—'}
                  </td>
                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#B388FF' }}>
                      {ev.event_type}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    {ev.data ? (
                      <div style={{ fontSize: 11, color: '#90CAF9', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                        {typeof ev.data === 'string' ? ev.data : JSON.stringify(ev.data)}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>
                    {new Date(ev.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
