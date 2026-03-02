import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const EVENT_CONFIG = {
  'conversation.started': {
    icon: '💬', label: 'Новый диалог',
    describe: (d) => d.pet_type ? `${d.pet_type} · ${d.source || 'виджет'}` : null,
  },
  'conversation.completed': {
    icon: '✅', label: 'Диалог завершён',
    describe: () => null,
  },
  'message.sent': {
    icon: '📨', label: 'Сообщение AI',
    describe: (d) => {
      const parts = [];
      if (d.model) parts.push(d.model);
      return parts.join(' · ') || null;
    },
  },
  'message.received': {
    icon: '📩', label: 'Сообщение пользователя',
    describe: () => null,
  },
  'appointment.created': {
    icon: '📋', label: 'Новая запись на приём',
    describe: (d) => {
      const parts = [];
      if (d.owner_name) parts.push(d.owner_name);
      if (d.contact_method) parts.push(d.contact_method);
      return parts.join(' · ') || null;
    },
  },
  'appointment.status_changed': {
    icon: '📋', label: 'Статус записи изменён',
    describe: (d) => d.status || null,
  },
  'limit.reached': {
    icon: '⚠️', label: 'Лимит исчерпан',
    describe: () => 'Достигнут лимит тарифа',
  },
  'clinic.registered': {
    icon: '🏥', label: 'Клиника зарегистрирована',
    describe: () => null,
  },
  'clinic.settings_updated': {
    icon: '⚙️', label: 'Настройки обновлены',
    describe: () => null,
  },
  'payment.initiated': {
    icon: '💳', label: 'Оплата инициирована',
    describe: (d) => d.amount ? `${d.amount} ₽` : null,
  },
  'payment.completed': {
    icon: '💰', label: 'Оплата получена',
    describe: (d) => d.amount ? `${d.amount} ₽` : null,
  },
  'payment.failed': {
    icon: '❌', label: 'Ошибка оплаты',
    describe: (d) => d.error || null,
  },
  'widget.loaded': {
    icon: '🌐', label: 'Виджет загружен',
    describe: () => null,
  },
  'widget.chat_opened': {
    icon: '💬', label: 'Чат открыт',
    describe: () => null,
  },
  'error.ai_provider': {
    icon: '🔴', label: 'Ошибка AI',
    describe: (d) => d.error || null,
  },
  'error.telegram': {
    icon: '🔴', label: 'Ошибка Telegram',
    describe: (d) => d.error || null,
  },
  'error.payment': {
    icon: '🔴', label: 'Ошибка платежа',
    describe: (d) => d.error || null,
  },
  'setup.requested': {
    icon: '🔔', label: 'Заявка на настройку',
    describe: (d) => d.phone || null,
  },
};

export default function EventLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents(100)
      .then((data) => setEvents(data.items || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">📜</span> Активность</div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📜</div>
          <div>Нет событий</div>
          <div style={{ fontSize: 12, marginTop: 8, color: '#546E7A' }}>События появятся по мере работы виджета</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Событие</th>
                <th>Детали</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const cfg = EVENT_CONFIG[ev.event_type] || { icon: '📌', label: ev.event_type, describe: () => null };
                const evData = ev.data || {};
                const details = cfg.describe(evData);

                return (
                  <tr key={ev.id}>
                    <td style={{ textAlign: 'center', fontSize: 16 }}>
                      {cfg.icon}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
                        {cfg.label}
                      </div>
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      {details ? (
                        <div style={{ fontSize: 12, color: '#90CAF9', fontFamily: "'JetBrains Mono', monospace" }}>
                          {details}
                        </div>
                      ) : (
                        <span style={{ color: '#546E7A', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>
                      {new Date(ev.created_at).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
