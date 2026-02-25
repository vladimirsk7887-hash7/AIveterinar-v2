import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const STATUS_MAP = {
  red: { label: '🔴 Экстренно', badge: 'badge-red' },
  yellow: { label: '🟡 Требует внимания', badge: 'badge-yellow' },
  green: { label: '🟢 Стабильное', badge: 'badge-green' },
  consultation: { label: '🔵 Консультация', badge: 'badge-blue' },
  blocked: { label: '⚫ Защита', badge: 'badge-gray' },
};

export default function ConversationDetail({ id, onBack }) {
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversation(id)
      .then(setConv)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (!conv) return <div className="empty-state"><div className="icon">❌</div>Диалог не найден</div>;

  const card = conv.card || {};
  const statusInfo = STATUS_MAP[conv.status] || STATUS_MAP.consultation;
  const messages = conv.messages || [];

  // Calculate total tokens from messages
  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens_input || 0) + (m.tokens_output || 0), 0);

  return (
    <div>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Назад к списку
      </button>

      <div className="page-title">
        <span className="icon">💬</span>
        {conv.pet_type || 'Диалог'} — {new Date(conv.created_at).toLocaleDateString('ru-RU')}
      </div>

      {/* Patient Card */}
      {Object.keys(card).length > 0 && (
        <div className="card">
          <div className="card-title">🐾 Карточка пациента</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {card.name && <Field label="Кличка" value={card.name} />}
            {card.species && <Field label="Вид" value={card.species} />}
            {card.breed && <Field label="Порода" value={card.breed} />}
            {card.age && <Field label="Возраст" value={card.age} />}
            {card.weight && <Field label="Вес" value={card.weight} />}
          </div>
          {card.symptoms?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Field label="Симптомы" value={Array.isArray(card.symptoms) ? card.symptoms.join(', ') : card.symptoms} />
            </div>
          )}
          {card.notes && (
            <div style={{ marginTop: 8 }}>
              <Field label="Заметки" value={card.notes} />
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">
            <span className={`badge ${statusInfo.badge}`} style={{ fontSize: 14, padding: '6px 16px' }}>
              {statusInfo.label}
            </span>
          </div>
          <div className="stat-label">Триаж</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{messages.length}</div>
          <div className="stat-label">Сообщений</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {totalTokens ? `${Math.round(totalTokens / 1000)}K` : '—'}
          </div>
          <div className="stat-label">Токенов</div>
        </div>
      </div>

      {/* Messages */}
      <div className="card">
        <div className="card-title">Переписка</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.filter(m => !isHiddenMessage(m)).map((m, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: m.role === 'assistant'
                ? 'rgba(124,77,255,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.role === 'assistant' ? 'rgba(124,77,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
            }}>
              <div style={{ fontSize: 10, color: '#546E7A', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.role === 'assistant' ? '🤖 AI-Ветеринар' : '👤 Владелец'}</span>
                <span>
                  {m.created_at && new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {m.role === 'assistant' && m.latency_ms ? ` · ${(m.latency_ms / 1000).toFixed(1)}s` : ''}
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {getDisplayText(m)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Get display text — prefer visible_text, fallback to stripping <meta> from content */
function getDisplayText(m) {
  if (m.visible_text) return m.visible_text;
  if (m.content) return m.content.replace(/<meta>[\s\S]*?<\/meta>/g, '').trim();
  return '';
}

/** Hide system-init messages like "Вид питомца: ... Начало диалога." */
function isHiddenMessage(m) {
  if (m.role === 'user' && m.content?.includes('Начало диалога.')) return true;
  return false;
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}
