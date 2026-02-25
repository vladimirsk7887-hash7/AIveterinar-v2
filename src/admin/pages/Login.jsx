import { useState } from 'react';
import { api } from '../lib/api.js';

export default function Login({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 16 }}>🐾</div>
        <div className="auth-title">Вход в панель</div>
        <div className="auth-subtitle">AI-Ветеринар — управление клиникой</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="clinic@example.com" required />
          </div>
          <div className="form-group">
            <label className="label">Пароль</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#7C4DFF', cursor: 'pointer', fontSize: 13 }}>
            Нет аккаунта? Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}
