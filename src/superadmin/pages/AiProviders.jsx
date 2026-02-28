import { useState, useEffect } from 'react';
import { saApi } from '../lib/api.js';

export default function AiProviders({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({}); // { 'routerai/model': { ok, latencyMs, error } }

  useEffect(() => {
    saApi.getAiProviders(token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

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

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1 }}>Провайдер по умолчанию</div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>{data.default_provider}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1 }}>Модель по умолчанию</div>
            <div style={{ marginTop: 4, fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{data.default_model}</div>
          </div>
        </div>
      </div>

      {data.providers.map(provider => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          testing={testing}
          onTest={testProvider}
        />
      ))}
    </div>
  );
}

function ProviderCard({ provider, testing, onTest }) {
  const statusDot = provider.enabled && provider.has_key
    ? { color: '#00E676', label: 'Активен' }
    : !provider.has_key
      ? { color: '#FF5252', label: 'Нет ключа' }
      : { color: '#546E7A', label: 'Отключён' };

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

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 6 }}>API KEY ({provider.env_var})</div>
        <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 8, color: provider.has_key ? '#B0BEC5' : '#FF5252' }}>
          {provider.has_key ? provider.masked_key : '⚠ Не задан — добавьте переменную окружения в Coolify'}
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
