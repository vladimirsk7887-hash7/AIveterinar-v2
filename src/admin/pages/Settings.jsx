import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Settings() {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    api.getClinic()
      .then(setClinic)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (data, endpoint = 'profile') => {
    setSaving(true);
    setMsg('');
    try {
      if (endpoint === 'branding') {
        await api.updateBranding(data);
      } else {
        await api.updateClinic(data);
      }
      setMsg('Сохранено!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(`Ошибка: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (!clinic) return <div className="empty-state"><div className="icon">❌</div>Не удалось загрузить данные</div>;

  return (
    <div>
      <div className="page-title"><span className="icon">⚙️</span> Настройки</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['profile', 'Профиль'], ['branding', 'Брендинг'], ['telegram', 'Telegram']].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 10, marginBottom: 16, background: msg.startsWith('Ошибка') ? 'rgba(255,82,82,0.12)' : 'rgba(0,230,118,0.12)', color: msg.startsWith('Ошибка') ? '#FF5252' : '#00E676', fontSize: 13 }}>
          {msg}
        </div>
      )}

      {tab === 'profile' && <ProfileTab clinic={clinic} setClinic={setClinic} onSave={save} saving={saving} />}
      {tab === 'branding' && <BrandingTab clinic={clinic} setClinic={setClinic} onSave={save} saving={saving} />}
      {tab === 'telegram' && <TelegramTab clinic={clinic} setClinic={setClinic} onSave={save} saving={saving} />}
    </div>
  );
}

function ProfileTab({ clinic, setClinic, onSave, saving }) {
  const update = (field) => (e) => setClinic({ ...clinic, [field]: e.target.value });

  return (
    <div className="card">
      <div className="card-title">Профиль клиники</div>
      <div className="form-group">
        <label className="label">Название</label>
        <input className="input" value={clinic.name || ''} onChange={update('name')} />
      </div>
      <div className="form-group">
        <label className="label">Slug (URL)</label>
        <input className="input" value={clinic.slug || ''} onChange={update('slug')} pattern="[a-z0-9-]{3,50}" />
        <div style={{ fontSize: 11, color: '#546E7A', marginTop: 4 }}>vetai24.ru/widget/<b>{clinic.slug}</b></div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="label">Телефон</label>
          <input className="input" value={clinic.phone || ''} onChange={update('phone')} />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="label">Город</label>
          <input className="input" value={clinic.city || ''} onChange={update('city')} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Адрес</label>
        <input className="input" value={clinic.address || ''} onChange={update('address')} />
      </div>
      <button className="btn btn-primary" onClick={() => onSave({ name: clinic.name, slug: clinic.slug, phone: clinic.phone, city: clinic.city, address: clinic.address })} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}

function BrandingTab({ clinic, setClinic, onSave, saving }) {
  const branding = clinic.branding || {};
  const updateBranding = (field) => (e) => setClinic({ ...clinic, branding: { ...branding, [field]: e.target.value } });

  return (
    <div className="card">
      <div className="card-title">Брендинг виджета</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="label">Основной цвет</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={branding.primary_color || '#7C4DFF'} onChange={updateBranding('primary_color')} style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
            <input className="input" value={branding.primary_color || '#7C4DFF'} onChange={updateBranding('primary_color')} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
          </div>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="label">Фоновый цвет</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={branding.bg_color || '#0B0E18'} onChange={updateBranding('bg_color')} style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
            <input className="input" value={branding.bg_color || '#0B0E18'} onChange={updateBranding('bg_color')} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="label">Приветственное сообщение</label>
        <input className="input" value={branding.welcome_message || ''} onChange={updateBranding('welcome_message')} placeholder="Здравствуйте! Опишите, что случилось с вашим питомцем." />
      </div>
      <div className="form-group">
        <label className="label">Системный промпт (дополнение)</label>
        <textarea className="input" rows={4} value={branding.system_prompt || ''} onChange={updateBranding('system_prompt')} placeholder="Дополнительные инструкции для AI... Например: Мы специализируемся на кошках." style={{ resize: 'vertical', minHeight: 80 }} />
      </div>
      <div className="form-group">
        <label className="label">URL логотипа</label>
        <input className="input" value={branding.logo_url || ''} onChange={updateBranding('logo_url')} placeholder="https://..." />
      </div>
      <button className="btn btn-primary" onClick={() => onSave(clinic.branding || {}, 'branding')} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить брендинг'}
      </button>
    </div>
  );
}

function TelegramTab({ clinic, setClinic, onSave, saving }) {
  const update = (field) => (e) => setClinic({ ...clinic, [field]: e.target.value });

  return (
    <div className="card">
      <div className="card-title">Telegram-интеграция</div>
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(68,138,255,0.08)', border: '1px solid rgba(68,138,255,0.2)', fontSize: 12, color: '#90CAF9', marginBottom: 20 }}>
        Уведомления о записях на приём отправляются в Telegram. Укажите токен бота и ID чата.
      </div>
      <div className="form-group">
        <label className="label">Bot Token</label>
        <input className="input" value={clinic.tg_bot_token || ''} onChange={update('tg_bot_token')} placeholder="123456:ABC-DEF..." type="password" />
      </div>
      <div className="form-group">
        <label className="label">Chat ID</label>
        <input className="input" value={clinic.tg_chat_id || ''} onChange={update('tg_chat_id')} placeholder="-1001234567890" />
      </div>
      <button className="btn btn-primary" onClick={() => onSave({ tg_bot_token: clinic.tg_bot_token, tg_chat_id: clinic.tg_chat_id })} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить Telegram'}
      </button>
    </div>
  );
}
