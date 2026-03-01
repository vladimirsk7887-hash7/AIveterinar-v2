import { useState } from 'react';
import { api } from '../lib/api.js';

/** Transliterate Russian to Latin for URL slug */
function transliterate(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
    'ь':'','э':'e','ю':'yu','я':'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')  // non-alphanumeric → hyphen
    .replace(/^-|-$/g, '')         // trim hyphens
    .slice(0, 50);
}

export default function Register({ onSwitch, onLogin }) {
  const [form, setForm] = useState({ email: '', password: '', clinicName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const slug = transliterate(form.clinicName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (slug.length < 3) {
      setError('Название слишком короткое (минимум 3 символа)');
      return;
    }

    setLoading(true);

    // Step 1: Register
    try {
      await api.register({ ...form, slug });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Step 2: Auto-login (registration already succeeded)
    try {
      const data = await api.login(form.email, form.password);
      onLogin(data.access_token);
    } catch {
      // Registration OK but login failed — ask user to log in manually
      setError('Аккаунт создан! Войдите с вашим email и паролем.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 16 }}>🏥</div>
        <div className="auth-title">Регистрация</div>
        <div className="auth-subtitle">7 дней бесплатно — без карты</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Название клиники</label>
            <input className="input" value={form.clinicName} onChange={update('clinicName')} placeholder="Ветклиника Лапки" required />
            {slug.length >= 3 && (
              <div style={{ fontSize: 11, color: '#546E7A', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Адрес виджета:</span>
                <span style={{ color: '#7C4DFF', fontFamily: "'JetBrains Mono', monospace" }}>
                  vetai24.ru/widget/<b>{slug}</b>
                </span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={update('email')} placeholder="clinic@example.com" required />
          </div>
          <div className="form-group">
            <label className="label">Пароль</label>
            <input className="input" type="password" value={form.password} onChange={update('password')} placeholder="Минимум 8 символов" minLength={8} required />
          </div>
          {error && (
            <div className="form-error">
              {error}
              {error.startsWith('Аккаунт создан') && (
                <button
                  type="button"
                  onClick={onSwitch}
                  style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#7C4DFF', cursor: 'pointer', fontSize: 13 }}
                >
                  Перейти к входу
                </button>
              )}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            {loading ? 'Создание...' : 'Начать бесплатно'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#7C4DFF', cursor: 'pointer', fontSize: 13 }}>
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>
    </div>
  );
}
