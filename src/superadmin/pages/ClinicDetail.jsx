import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function ClinicDetail({ id, onBack, token }) {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saApi.getClinic(token, id)
      .then(setClinic)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const toggleActive = async () => {
    try {
      await saApi.updateClinic(token, id, { is_active: !clinic.is_active });
      setClinic({ ...clinic, is_active: !clinic.is_active });
    } catch {}
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (!clinic) return <div className="empty-state"><div className="icon">❌</div>Клиника не найдена</div>;

  return (
    <div>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 20 }}>← Назад</button>

      <div className="page-title"><span className="icon">🏥</span> {clinic.name}</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 14 }}>{clinic.slug}</div>
          <div className="stat-label">Slug</div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><span className="badge badge-blue">{clinic.plan_id}</span></div>
          <div className="stat-label">Тариф</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{clinic.balance_rub ?? 0} ₽</div>
          <div className="stat-label">Баланс</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            <span className={`badge ${clinic.is_active ? 'badge-green' : 'badge-red'}`}>
              {clinic.is_active ? 'Активна' : 'Неактивна'}
            </span>
          </div>
          <div className="stat-label">Статус</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Информация</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Email" value={clinic.owner_email || '—'} />
          <Field label="Телефон" value={clinic.phone || '—'} />
          <Field label="Город" value={clinic.city || '—'} />
          <Field label="Адрес" value={clinic.address || '—'} />
          <Field label="Создана" value={clinic.created_at ? new Date(clinic.created_at).toLocaleDateString('ru-RU') : '—'} />
          <Field label="TG Chat ID" value={clinic.tg_chat_id || '—'} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className={`btn ${clinic.is_active ? 'btn-outline' : 'btn-primary'}`} onClick={toggleActive}>
          {clinic.is_active ? 'Деактивировать' : 'Активировать'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}
