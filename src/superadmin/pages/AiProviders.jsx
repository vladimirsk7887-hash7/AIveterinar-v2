import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function AiProviders({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});

  const load = () => {
    setLoading(true);
    saApi.getAiProviders(token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const testProvider = async (providerId, modelId) => {
    const key = `${providerId}/${modelId}`;
    setTesting(t => ({ ...t, [key]: { loading: true } }));
    try {
      const result = await saApi.testAiProvider(token, providerId, modelId);
      setTesting(t => ({ ...t, [key]: result }));
    } catch (err) {
      setTesting(t => ({ ...t, [key]: { ok: false, error: err.message } }));
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (!data) return <div className="empty-state"><div className="icon">❌</div>Не удалось загрузить</div>;

  return (
    <div>
      <div className="page-title">🤖 AI Провайдеры</div>

      <DefaultSettings token={token} data={data} onSaved={load} />

      {data.providers.map(provider => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          testing={testing}
          token={token}
          onTest={testProvider}
          onKeySaved={load}
        />
      ))}
    </div>
  );
}

function DefaultSettings({ token, data, onSaved }) {
  const [provider, setProvider] = useState(data.default_provider);
  const [model, setModel] = useState(data.default_model);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const currentModels = data.providers.find(p => p.id === provider)?.models || [];

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saApi.updateAiSettings(token, { default_provider: provider, default_model: model });
      setMsg({ ok: true, text: 'Сохранено' });
      onSaved();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Провайдер и модель по умолчанию
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 4 }}>Провайдер</div>
          <select
            value={provider}
            onChange={e => { setProvider(e.target.value); setModel(''); }}
            className="input"
            style={{ minWidth: 160 }}
          >
            {data.providers.map(p => (
              <option key={p.id} value={p.id}>{PROVIDER_NAME[p.id] || p.id}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 4 }}>Модель</div>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="input"
            style={{ width: '100%' }}
          >
            {currentModels.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={saving}
            style={{ whiteSpace: 'nowrap', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          {msg && (
            <span style={{ fontSize: 12, color: msg.ok ? '#00E676' : '#FF5252' }}>{msg.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ provider, testing, token, onTest, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState(null);

  const statusDot = provider.enabled && provider.has_key
    ? { color: '#00E676', label: 'Активен' }
    : !provider.has_key
      ? { color: '#FF5252', label: 'Нет ключа' }
      : { color: '#546E7A', label: 'Отключён' };

  const SOURCE_LABEL = { db: 'из БД', env: 'из env' };

  const saveKey = async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    setKeyMsg(null);
    try {
      await saApi.updateProviderKey(token, provider.id, keyInput.trim());
      setKeyMsg({ ok: true, text: 'Ключ сохранён' });
      setKeyInput('');
      onKeySaved();
    } catch (err) {
      setKeyMsg({ ok: false, text: err.message });
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 20 }}>{PROVIDER_ICON[provider.id] || '🔌'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{PROVIDER_NAME[provider.id] || provider.id}</div>
            <div style={{ fontSize: 11, color: '#546E7A', fontFamily: 'monospace' }}>{provider.base_url}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot.color, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: statusDot.color }}>{statusDot.label}</span>
        </div>
      </div>

      {/* API Key */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 6 }}>
          API KEY ({provider.env_var})
          {provider.key_source && (
            <span style={{ marginLeft: 8, color: '#78909C' }}>
              [{SOURCE_LABEL[provider.key_source] || provider.key_source}]
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 8, color: provider.has_key ? '#B0BEC5' : '#FF5252', marginBottom: 8 }}>
          {provider.has_key ? provider.masked_key : '⚠ Не задан — добавьте ключ ниже или переменную окружения в Coolify'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Новый ключ..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
          />
          <button
            className="btn btn-outline"
            onClick={saveKey}
            disabled={savingKey || !keyInput.trim()}
            style={{ whiteSpace: 'nowrap', opacity: savingKey ? 0.6 : 1 }}
          >
            {savingKey ? '...' : 'Обновить'}
          </button>
          {keyMsg && (
            <span style={{ fontSize: 12, color: keyMsg.ok ? '#00E676' : '#FF5252' }}>{keyMsg.text}</span>
          )}
        </div>
      </div>

      {provider.models.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Модели</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {provider.models.map(model => {
              const key = `${provider.id}/${model.id}`;
              const testResult = testing[key];
              return (
                <div key={model.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{model.name}</div>
                    <div style={{ fontSize: 11, color: '#546E7A', fontFamily: 'monospace' }}>{model.id}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#546E7A', textAlign: 'right', minWidth: 100 }}>
                    {model.input_cost_rub != null
                      ? `${model.input_cost_rub} / ${model.output_cost_rub} ₽/M`
                      : model.input_cost_usd != null
                        ? `$${model.input_cost_usd} / $${model.output_cost_usd} /M`
                        : ''}
                  </div>
                  <div style={{ minWidth: 120, textAlign: 'right' }}>
                    {testResult?.loading ? (
                      <span style={{ fontSize: 11, color: '#546E7A' }}>Тестирование...</span>
                    ) : testResult ? (
                      <span style={{ fontSize: 11, color: testResult.ok ? '#00E676' : '#FF5252' }}>
                        {testResult.ok ? `✓ ${testResult.latencyMs}ms` : `✗ ${testResult.error?.slice(0, 30)}`}
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '4px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => onTest(provider.id, model.id)}
                    disabled={!provider.has_key || testResult?.loading}
                  >
                    Тест
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const PROVIDER_NAME = {
  routerai: 'RouterAI (RU)',
  openrouter: 'OpenRouter',
  openai: 'OpenAI (Direct)',
};

const PROVIDER_ICON = {
  routerai: '🇷🇺',
  openrouter: '🌐',
  openai: '🟢',
};
