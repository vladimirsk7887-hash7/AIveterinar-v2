import { useState } from 'react';
import { api } from '../lib/api.js';

export default function Onboarding({ clinic, onComplete }) {
  const [mode, setMode] = useState(null); // null | 'request'
  const [form, setForm] = useState({ phone: '', preferredTime: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSelf = async () => {
    setLoading(true);
    try {
      await api.updateClinic({ settings: { ...clinic.settings, onboarding: 'self' } });
      onComplete('self');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) { setError('Укажите телефон'); return; }
    setError('');
    setLoading(true);
    try {
      await api.requestSetup(form);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>&#9989;</div>
          <div className="auth-title">Заявка отправлена!</div>
          <div className="auth-subtitle" style={{ marginBottom: 24 }}>
            Мы свяжемся с вами и настроим всё за 5 минут
          </div>
          <button className="btn btn-primary" onClick={() => onComplete('requested')} style={{ width: '100%', justifyContent: 'center' }}>
            Перейти в кабинет
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'request') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 16 }}>&#128222;</div>
          <div className="auth-title">Настроим за вас</div>
          <div className="auth-subtitle" style={{ marginBottom: 24 }}>
            Оставьте контакт — мы всё подключим за 5 минут
          </div>
          <form onSubmit={handleRequest}>
            <div className="form-group">
              <label className="label">Телефон *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (999) 123-45-67" required />
            </div>
            <div className="form-group">
              <label className="label">Удобное время для звонка</label>
              <input className="input" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} placeholder="с 10 до 18, будни" />
            </div>
            <div className="form-group">
              <label className="label">Комментарий</label>
              <textarea className="input" rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Есть сайт, нужен виджет + Telegram..." style={{ resize: 'vertical', minHeight: 60 }} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#7C4DFF', cursor: 'pointer', fontSize: 13 }}>
              &#8592; Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Choice screen
  return (
    <div className="auth-page">
      <div style={{ maxWidth: 640, width: '100%', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#128075;</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            {clinic.name} — добро пожаловать!
          </div>
          <div style={{ color: '#B0BEC5', fontSize: 14 }}>
            Как хотите начать?
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button
            onClick={handleSelf}
            disabled={loading}
            style={{
              padding: 32,
              borderRadius: 16,
              background: '#111629',
              border: '1px solid rgba(124,77,255,0.2)',
              cursor: 'pointer',
              textAlign: 'center',
              color: '#E0E0E0',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124,77,255,0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(124,77,255,0.2)'}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>&#9997;&#65039;</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Настрою сам</div>
            <div style={{ fontSize: 12, color: '#B0BEC5', lineHeight: 1.5 }}>
              Telegram, виджет, промпт — всё в настройках кабинета
            </div>
          </button>

          <button
            onClick={() => setMode('request')}
            style={{
              padding: 32,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(124,77,255,0.08), rgba(68,138,255,0.05))',
              border: '1px solid rgba(124,77,255,0.3)',
              cursor: 'pointer',
              textAlign: 'center',
              color: '#E0E0E0',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124,77,255,0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(124,77,255,0.3)'}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>&#129309;</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Помогите настроить</div>
            <div style={{ fontSize: 12, color: '#B0BEC5', lineHeight: 1.5 }}>
              Оставьте телефон — мы всё сделаем за 5 минут
            </div>
          </button>
        </div>

        {error && <div className="form-error" style={{ marginTop: 16, textAlign: 'center' }}>{error}</div>}
      </div>
    </div>
  );
}
