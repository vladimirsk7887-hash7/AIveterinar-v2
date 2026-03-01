import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const STATUS_MAP = {
  red: { label: '🔴 Срочно', badge: 'badge-red' },
  yellow: { label: '🟡 Внимание', badge: 'badge-yellow' },
  green: { label: '🟢 Стабильно', badge: 'badge-green' },
  consultation: { label: '🔵 Консультация', badge: 'badge-blue' },
  blocked: { label: '⚫ Защита', badge: 'badge-gray' },
};

const PET_EMOJI = {
  'Кошка': '🐱', 'Собака': '🐶', 'Птица': '🦜',
  'Грызун': '🐹', 'Рептилия': '🦎', 'Другое': '🐾',
  'Cat': '🐱', 'Dog': '🐶',
};

export default function Conversations({ onViewConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    setError('');
    api.getConversations(p, 20)
      .then((resp) => {
        const items = resp.data || resp.items || (Array.isArray(resp) ? resp : []);
        setConversations(items);
        setHasMore(items.length === 20);
        setPage(p);
      })
      .catch((err) => setError(err.message || 'Ошибка загрузки диалогов'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading && page === 1) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (error) return <div className="empty-state"><div className="icon">❌</div>{error}<button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => load(page)}>Повторить</button></div>;

  return (
    <div>
      <div className="page-title"><span className="icon">💬</span> Диалоги</div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💬</div>
          <div>{page > 1 ? 'Больше диалогов нет' : 'Пока нет диалогов'}</div>
          {page === 1 && <div style={{ fontSize: 12, marginTop: 8, color: '#546E7A' }}>Диалоги появятся, когда пользователи начнут общаться через виджет</div>}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Питомец</th>
                  <th>Проблема</th>
                  <th>Статус</th>
                  <th>Сообщ.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => {
                  const card = c.card || {};
                  const emoji = PET_EMOJI[c.pet_type] || '🐾';
                  const petLabel = card.name
                    ? `${card.name} (${c.pet_type || card.species || ''})`
                    : c.pet_type || card.species || '—';
                  const symptoms = Array.isArray(card.symptoms) ? card.symptoms.join(', ') : (card.notes || '');
                  const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.consultation;

                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => onViewConversation?.(c.id)}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#90CAF9', whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleDateString('ru-RU')}
                        <div style={{ fontSize: 10, color: '#546E7A' }}>
                          {new Date(c.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{petLabel}</div>
                            {card.breed && <div style={{ color: '#546E7A', fontSize: 11 }}>{card.breed}{card.age ? `, ${card.age}` : ''}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontSize: 12, color: '#B0BEC5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {symptoms || '—'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {c.message_count ?? '—'}
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 11 }}>
                          Открыть
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            Назад
          </button>
          <span style={{ color: '#546E7A', fontSize: 13, alignSelf: 'center' }}>Стр. {page}</span>
          <button className="btn btn-outline" disabled={!hasMore || loading} onClick={() => load(page + 1)}>
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
