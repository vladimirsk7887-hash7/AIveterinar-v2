import { useState } from 'react';
import { saApi } from '../lib/api.js';

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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export default function CreateClinic({ token, onBack }) {
  const [form, setForm] = useState({
    clinicName: '',
    email: '',
    phone: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const slug = transliterate(form.clinicName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (slug.length < 3) {
      setError('Название слишком короткое');
      return;
    }
    setLoading(true);
    try {
      const data = await saApi.createClinic(token, form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  // Success screen
  if (result) {
    const widgetUrl = `https://vetai24.ru/widget/${result.clinic.slug}`;
    const adminUrl = 'https://vetai24.ru/admin';
    const credText = [
      `Клиника: ${result.clinic.name}`,
      `Email: ${result.email}`,
      `Ссылка для входа: ${result.setup_url || adminUrl}`,
      `Виджет: ${widgetUrl}`,
    ].join('\n');

    return (
      <div>
        <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 20 }}>
          &#8592; К списку клиник
        </button>

        <div className="page-title"><span className="icon">&#9989;</span> Клиника создана!</div>

        <div className="card">
          <div className="card-title">Данные для ветеринара</div>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(68,138,255,0.08)', border: '1px solid rgba(68,138,255,0.2)', fontSize: 12, color: '#90CAF9', marginBottom: 16 }}>
            Отправьте ветеринару ссылку для входа — она одноразовая и действует 24 часа. После входа пароль можно сменить через «Забыли пароль» на странице входа.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CopyField label="Клиника" value={result.clinic.name} onCopy={copyToClipboard} copied={copied} />
            <CopyField label="Slug" value={result.clinic.slug} onCopy={copyToClipboard} copied={copied} />
            <CopyField label="Email" value={result.email} onCopy={copyToClipboard} copied={copied} />
            <CopyField label="Виджет" value={widgetUrl} onCopy={copyToClipboard} copied={copied} />
          </div>
          {result.setup_url && (
            <div style={{ marginTop: 16 }}>
              <CopyField label="Ссылка для входа (одноразовая)" value={result.setup_url} onCopy={copyToClipboard} copied={copied} />
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => copyToClipboard(credText, 'all')}>
              {copied === 'all' ? 'Скопировано!' : 'Скопировать всё'}
            </button>
            <button className="btn btn-outline" onClick={onBack}>
              Готово
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>/{result.clinic.slug}</div>
            <div className="stat-label">Slug</div>
          </div>
          <div className="stat-card">
            <div className="stat-value"><span className="badge badge-blue">{result.clinic.plan_id}</span></div>
            <div className="stat-label">Тариф</div>
          </div>
        </div>
      </div>
    );
  }

  // Form screen
  return (
    <div>
      <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: 20 }}>
        &#8592; К списку клиник
      </button>

      <div className="page-title"><span className="icon">&#10133;</span> Создать клинику</div>

      <div className="card">
        <div className="card-title">Консьерж-регистрация</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Название клиники *</label>
            <input className="input" value={form.clinicName} onChange={update('clinicName')} placeholder="Ветклиника Лапки" required />
            {slug && (
              <div style={{ fontSize: 11, color: '#546E7A', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Slug:</span>
                <span style={{ color: '#7C4DFF', fontFamily: "'JetBrains Mono', monospace" }}>/{slug}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={update('email')} placeholder="clinic@example.com" required />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Телефон</label>
              <input className="input" value={form.phone} onChange={update('phone')} placeholder="+7..." />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label">Город</label>
              <input className="input" value={form.city} onChange={update('city')} placeholder="Москва" />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            {loading ? 'Создание...' : 'Создать клинику'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CopyField({ label, value, onCopy, copied }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
      <div
        style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onCopy(value, label)}
        title="Нажмите, чтобы скопировать"
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{value}</span>
        <span style={{ fontSize: 11, color: copied === label ? '#00E676' : '#546E7A' }}>
          {copied === label ? '&#10003;' : '&#128203;'}
        </span>
      </div>
    </div>
  );
}
