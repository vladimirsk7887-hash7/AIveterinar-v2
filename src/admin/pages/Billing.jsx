import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const PLAN_NAMES = {
  trial: 'Пробный (7 дней)',
  start: 'Старт',
  business: 'Бизнес',
  pro: 'Про',
};

export default function Billing() {
  const [clinic, setClinic] = useState(null);
  const [balance, setBalance] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planMsg, setPlanMsg] = useState('');

  useEffect(() => {
    Promise.all([api.getClinic(), api.getBalance(), api.getUsage()])
      .then(([c, b, u]) => { setClinic(c); setBalance(b); setUsage(u); })
      .catch((err) => setError(err.message || 'Ошибка загрузки данных'))
      .finally(() => setLoading(false));
  }, []);

  const refreshBalance = () => {
    api.getBalance().then(setBalance).catch(() => {});
  };

  const handleSelectPlan = async (planId) => {
    setPlanMsg('');
    try {
      const result = await api.createPayment(planId, 'yookassa');
      if (result.payment_url) {
        window.open(result.payment_url, '_blank');
      } else {
        setPlanMsg('Заявка принята. Тариф будет обновлён после подтверждения.');
      }
    } catch (err) {
      setPlanMsg(`Ошибка: ${err.message}`);
    }
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div>Загрузка...</div>;
  if (error) return <div className="empty-state"><div className="icon">❌</div>{error}</div>;

  const plan = clinic?.plan_id || 'trial';

  return (
    <div>
      <div className="page-title"><span className="icon">💳</span> Биллинг</div>

      {/* Current Plan */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.08), rgba(68,138,255,0.05))', border: '1px solid rgba(124,77,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#546E7A', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>Текущий тариф</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{PLAN_NAMES[plan] || plan}</div>
          </div>
          <span className={`badge ${clinic?.is_active ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 12, padding: '5px 14px' }}>
            {clinic?.is_active ? 'Активна' : 'Неактивна'}
          </span>
        </div>
        {plan === 'trial' && clinic?.trial_ends_at && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#FFD740' }}>
            Пробный период до: {new Date(clinic.trial_ends_at).toLocaleDateString('ru-RU')}
          </div>
        )}
      </div>

      {/* Balance + Usage Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: (balance?.balance_rub ?? 0) > 0 ? '#00E676' : '#FF5252' }}>
            {balance?.balance_rub ?? 0} ₽
          </div>
          <div className="stat-label">Баланс</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {usage?.conversations_this_month ?? 0}
          </div>
          <div className="stat-label">Диалогов в этом месяце</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 20 }}>
            {usage?.cost_rub ? `${usage.cost_rub.toFixed(0)} ₽` : '—'}
          </div>
          <div className="stat-label">Расходы на AI</div>
        </div>
      </div>

      {/* Top Up */}
      <TopUpCard onRefreshBalance={refreshBalance} />

      {/* Plans */}
      <div className="card">
        <div className="card-title">Тарифные планы</div>
        {planMsg && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: planMsg.startsWith('Ошибка') ? 'rgba(255,82,82,0.12)' : 'rgba(0,230,118,0.12)', color: planMsg.startsWith('Ошибка') ? '#FF5252' : '#00E676', fontSize: 13 }}>
            {planMsg}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <PlanCard name="Старт" price="1 990 ₽/мес" features={['300 диалогов', 'Виджет для сайта', 'Telegram уведомления', 'Кастомный брендинг', 'Базовая аналитика']} current={plan === 'start'} onSelect={() => handleSelectPlan('start')} />
          <PlanCard name="Бизнес" price="4 990 ₽/мес" features={['1000 диалогов', 'Кастомный брендинг', 'Кастомный промпт AI', 'Расширенная аналитика']} current={plan === 'business'} popular onSelect={() => handleSelectPlan('business')} />
          <PlanCard name="Про" price="9 990 ₽/мес" features={['до 2 000 диалогов', 'Свой TG бот', '10 виджетов и TG-каналов']} current={plan === 'pro'} onSelect={() => handleSelectPlan('pro')} />
        </div>
      </div>
    </div>
  );
}

function TopUpCard({ onRefreshBalance }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showRefresh, setShowRefresh] = useState(false);

  const handleTopup = async () => {
    if (!amount || Number(amount) < 100) {
      setMsg('Минимальная сумма 100 ₽');
      return;
    }
    setLoading(true);
    setMsg('');
    setShowRefresh(false);
    try {
      const result = await api.topup(Number(amount), 'yookassa');
      if (result.payment_url) {
        window.open(result.payment_url, '_blank');
        setMsg('Ссылка на оплату открыта. После завершения оплаты обновите баланс.');
        setShowRefresh(true);
      } else {
        setMsg('Платёж создан. Проверьте статус позже.');
      }
    } catch (err) {
      setMsg(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Пополнить баланс</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="label">Сумма (₽)</label>
          <input
            className="input"
            type="number"
            min="100"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
          />
        </div>
        <button className="btn btn-primary" onClick={handleTopup} disabled={loading} style={{ height: 42 }}>
          {loading ? 'Создание...' : 'Пополнить'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {[500, 1000, 3000, 5000].map((v) => (
          <button key={v} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setAmount(String(v))}>
            {v} ₽
          </button>
        ))}
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.startsWith('Ошибка') ? '#FF5252' : '#00E676' }}>{msg}</div>}
      {showRefresh && (
        <button
          className="btn btn-outline"
          style={{ marginTop: 8, fontSize: 12 }}
          onClick={() => { onRefreshBalance(); setShowRefresh(false); setMsg(''); }}
        >
          🔄 Обновить баланс
        </button>
      )}
    </div>
  );
}

function PlanCard({ name, price, features, current, popular, onSelect }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 14,
      border: `1px solid ${current ? 'rgba(124,77,255,0.4)' : popular ? 'rgba(68,138,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
      background: current ? 'rgba(124,77,255,0.08)' : popular ? 'rgba(68,138,255,0.05)' : 'transparent',
      position: 'relative',
    }}>
      {popular && (
        <div style={{ position: 'absolute', top: -10, right: 16, background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>
          Популярный
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{name}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: '#7C4DFF', marginBottom: 16 }}>{price}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f) => (
          <div key={f} style={{ fontSize: 12, color: '#B0BEC5' }}>✓ {f}</div>
        ))}
      </div>
      {current ? (
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#00E676', fontWeight: 600 }}>Текущий план</div>
      ) : (
        <button className="btn btn-outline" onClick={onSelect} style={{ width: '100%', marginTop: 16, justifyContent: 'center', fontSize: 12 }}>
          Выбрать
        </button>
      )}
    </div>
  );
}
