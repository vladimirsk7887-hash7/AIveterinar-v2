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
      } else if (endpoint === 'telegram') {
        await api.saveTelegram(data);
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['profile', 'Профиль'], ['branding', 'Брендинг'], ['telegram', 'Telegram'], ['max', 'Max']].map(([key, label]) => (
          <button
            key={key}
            className={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setTab(key); setMsg(''); }}
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
      {tab === 'max' && <MaxTab clinic={clinic} />}
    </div>
  );
}

function ProfileTab({ clinic, setClinic, onSave, saving }) {
  const [slugError, setSlugError] = useState('');
  const update = (field) => (e) => {
    setClinic({ ...clinic, [field]: e.target.value });
    if (field === 'slug') setSlugError('');
  };

  const handleSave = () => {
    const slug = (clinic.slug || '').trim();
    if (slug.length < 3) { setSlugError('Минимум 3 символа'); return; }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) { setSlugError('Только латиница, цифры и дефис. Без пробелов.'); return; }
    onSave({ name: clinic.name, slug, phone: clinic.phone, city: clinic.city, address: clinic.address });
  };

  return (
    <div className="card">
      <div className="card-title">Профиль клиники</div>
      <div className="form-group">
        <label className="label">Название</label>
        <input className="input" value={clinic.name || ''} onChange={update('name')} />
      </div>
      <div className="form-group">
        <label className="label">Slug (URL)</label>
        <input className="input" value={clinic.slug || ''} onChange={update('slug')} />
        <div style={{ fontSize: 11, color: '#546E7A', marginTop: 4 }}>vetai24.ru/widget/<b>{clinic.slug}</b></div>
        {slugError && <div style={{ fontSize: 12, color: '#FF5252', marginTop: 4 }}>{slugError}</div>}
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
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}

function BrandingTab({ clinic, setClinic, onSave, saving }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const branding = clinic.settings?.branding || {};
  const updateBranding = (field) => (e) => setClinic({
    ...clinic,
    settings: { ...(clinic.settings || {}), branding: { ...branding, [field]: e.target.value } },
  });

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { url } = await api.uploadLogo(file);
      setClinic({ ...clinic, settings: { ...(clinic.settings || {}), branding: { ...branding, logo_url: url } } });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={branding.logo_url || ''} onChange={updateBranding('logo_url')} placeholder="https://..." style={{ flex: 1 }} />
          <label className="btn btn-outline" style={{ whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {uploading ? 'Загрузка...' : 'Загрузить файл'}
            <input type="file" accept="image/*" onChange={handleLogoFile} disabled={uploading} style={{ display: 'none' }} />
          </label>
        </div>
        {uploadError && <div style={{ fontSize: 12, color: '#FF5252', marginTop: 4 }}>{uploadError}</div>}
        {branding.logo_url && (
          <img src={branding.logo_url} alt="Логотип" style={{ marginTop: 8, maxHeight: 48, maxWidth: 200, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.05)', padding: 4 }} />
        )}
      </div>
      <button className="btn btn-primary" onClick={() => onSave(clinic.settings?.branding || {}, 'branding')} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить брендинг'}
      </button>
    </div>
  );
}

function MaxTab({ clinic }) {
  const [copied, setCopied] = useState(false);
  const url = `https://vetai24.ru/max/${clinic.slug || ''}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card">
      <div className="card-title">Max — мессенджер</div>
      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', fontSize: 12, color: '#69F0AE', marginBottom: 20 }}>
        Max Mini-App подключается без токенов — достаточно указать ссылку ниже при настройке бота.
        Уведомления о записях отправляются через Telegram-интеграцию (вкладка Telegram).
      </div>
      <div className="form-group">
        <label className="label">URL мини-аппа</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={url}
            readOnly
            style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
          />
          <button className="btn btn-outline" onClick={copy} style={{ whiteSpace: 'nowrap' }}>
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#546E7A', marginTop: 6 }}>
          Укажите эту ссылку в настройках вашего бота в мессенджере Max в поле «Web App URL».
        </div>
      </div>
      <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Как подключить</div>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: '#90A4AE' }}>
          <li>Зайдите в настройки вашего бота в Max</li>
          <li>В поле <b style={{ color: '#CFD8DC' }}>Web App URL</b> вставьте ссылку выше</li>
          <li>Сохраните — кнопка запуска мини-аппа появится в чате бота</li>
        </ol>
      </div>
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
      <button className="btn btn-primary" onClick={() => onSave({ tg_bot_token: clinic.tg_bot_token, tg_chat_id: clinic.tg_chat_id }, 'telegram')} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить Telegram'}
      </button>
    </div>
  );
}
