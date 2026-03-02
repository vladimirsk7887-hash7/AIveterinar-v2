import { useState } from 'react';

const PLANS = [
  {
    name: 'Start',
    price: '1 990',
    conversations: 'до 300 диалогов/мес (включен базовый пакет токенов)',
    features: [
      'Быстрая AI-модель (сбор контактов и запись)',
      'Виджет для сайта',
      'Уведомления в Telegram и Max',
      'Кастомный брендинг виджета (логотип, цвета)',
      'При исчерпании пакета — безопасная блокировка AI (переход в режим формы)'
    ]
  },
  {
    name: 'Business',
    price: '4 990',
    conversations: 'до 1 000 диалогов/мес (включен расширенный пакет токенов)',
    features: [
      'Кастомный промпт и брендинг',
      'Подключение до 3 каналов: сайт, Telegram, Max',
      'Сверх лимита — прозрачная оплата с баланса клиники (3 ₽/1K токенов)'
    ],
    popular: true
  },
  {
    name: 'Pro',
    price: '9 990',
    conversations: 'Максимальный пакет токенов (~2 000 диалогов)',
    features: [
      'Подключение собственного бота (Telegram или Max)',
      'Защита от перерасхода: аварийный лимит (Hard Cap)',
      'Льготная стоимость дополнительных токенов (1.5 ₽/1K)'
    ]
  },
];

const CHANNELS = [
  {
    icon: '🌐',
    title: 'Виджет на сайте',
    desc: 'Одна строка кода — и AI-ассистент появляется на вашем сайте. Полный брендинг: логотип, цвета, промпт.',
    tag: 'Для сайта',
    tagColor: '#EFF6FF',
    tagText: '#2563EB',
  },
  {
    icon: '✈️',
    title: 'Telegram-бот',
    desc: 'Мини-апп прямо в Telegram. Клиенты открывают его из вашего бота — без скачивания приложений.',
    tag: 'Telegram',
    tagColor: '#F0FDF4',
    tagText: '#15803D',
  },
  {
    icon: '💬',
    title: 'Max мини-апп',
    desc: 'Полноценный AI-ассистент в мессенджере Max. Российская альтернатива Telegram с аудиторией 10+ млн.',
    tag: 'Max',
    tagColor: '#FFF7ED',
    tagText: '#C2410C',
    isNew: true,
  },
];

const FEATURES = [
  { icon: '🤖', title: 'AI-триаж 24/7', desc: 'Автоматическая оценка срочности обращения. Красный / жёлтый / зелёный — моментально.' },
  { icon: '📋', title: 'Запись на приём', desc: 'Бот собирает анамнез и записывает клиента. Уведомление — в Telegram или Max клиники.' },
  { icon: '🎨', title: 'Ваш бренд', desc: 'Логотип, цвета, промпт — виджет выглядит как часть вашего сайта.' },
  { icon: '📊', title: 'Аналитика', desc: 'Сколько обращений, конверсия в записи, расходы на AI — всё в одном дашборде.' },
  { icon: '🔌', title: 'Установка за 2 минуты', desc: 'Одна строка кода на сайт. Никаких настроек серверов, SSL-сертификатов.' },
  { icon: '🔒', title: 'Безопасность', desc: 'Изоляция данных каждой клиники. Шифрование токенов. HTTPS everywhere.' },
];

function RoiCalculator() {
  const [visits, setVisits] = useState(15);
  const [missed, setMissed] = useState(30);
  const [ticket, setTicket] = useState(2500);

  const lostPerMonth = Math.round(visits * 30 * (missed / 100) * ticket);
  const fmt = (n) => n.toLocaleString('ru-RU');

  const sliders = [
    { label: 'Обращений в день', value: visits, min: 5, max: 100, step: 5, set: setVisits, fmt: (v) => v },
    { label: 'Необработанных / Ночных (%)', value: missed, min: 5, max: 70, step: 5, set: setMissed, fmt: (v) => `${v}%` },
    { label: 'Средний чек (₽)', value: ticket, min: 500, max: 10000, step: 500, set: setTicket, fmt: (v) => `${fmt(v)} ₽` },
  ];

  return (
    <section id="calculator" style={{ padding: '80px 20px', background: '#0F172A' }}>
      <style>{`
        .roi-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.12); outline: none; cursor: pointer; }
        .roi-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #10B981; cursor: pointer; box-shadow: 0 0 0 4px rgba(16,185,129,0.2); transition: box-shadow 0.2s; }
        .roi-range::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(16,185,129,0.3); }
        .roi-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #10B981; cursor: pointer; border: none; }
        @media (max-width: 768px) { .roi-inner { flex-direction: column !important; } }
        @media (max-width: 640px) {
          .roi-sliders { padding: 24px 20px !important; }
          .roi-info-card { padding: 20px !important; }
          .roi-slider-row { flex-wrap: wrap !important; gap: 6px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.01em' }}>
            Сколько вы теряете сейчас?
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
            Двигайте ползунки, чтобы рассчитать упущенную выгоду от необработанных ночных заявок и загруженных линий.
          </p>
        </div>
        <div className="roi-inner" style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {/* Sliders */}
          <div className="roi-sliders" style={{ flex: '0 0 55%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {sliders.map((s) => (
                <div key={s.label}>
                  <div className="roi-slider-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 14, color: '#CBD5E1', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>{s.fmt(s.value)}</span>
                  </div>
                  <input
                    className="roi-range"
                    type="range"
                    min={s.min} max={s.max} step={s.step}
                    value={s.value}
                    onChange={(e) => s.set(Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Потенциальные потери в месяц:</div>
              <div style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {fmt(lostPerMonth)} ₽
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="roi-info-card" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>💰</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#10B981', marginBottom: 10 }}>Экономия на ФОТ</div>
              <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>
                Ночной администратор стоит от 40 000 ₽. AI-ветеринар работает 24/7 за долю этой суммы.
              </div>
            </div>
            <div className="roi-info-card" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>📈</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#3B82F6', marginBottom: 10 }}>Рост конверсии</div>
              <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>
                Мгновенный ответ повышает вероятность записи на 35%. Клиент не успевает уйти к конкуренту.
              </div>
            </div>
            <a href="/admin" style={{ display: 'block', textAlign: 'center', padding: '16px 24px', borderRadius: 12, background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: '0 8px 20px -6px rgba(249,115,22,0.4)' }}>
              Устранить потери →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingApp() {
  return (
    <div style={{ background: '#F8FAFC', color: '#1E293B', fontFamily: "'Figtree', 'Noto Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; transition: all 0.2s ease; }
        button { cursor: pointer; transition: all 0.2s ease; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(59, 130, 246, 0.15); }
        .pricing-btn:hover { background: #E2E8F0 !important; }
        .pricing-btn-popular:hover { background: #2563EB !important; }
        .landing-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 640px) {
          .landing-nav { padding: 14px 16px !important; flex-wrap: wrap; gap: 10px; }
          .landing-nav-links { gap: 12px !important; width: 100%; justify-content: space-between; }
          .nav-hide-mobile { display: none !important; }
          .landing-hero { padding: 40px 16px 36px !important; }
          .landing-hero-desc { font-size: 17px !important; }
          .landing-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .landing-hero-btns a { text-align: center; }
          .landing-grid { grid-template-columns: 1fr !important; }
          .landing-channels-grid { grid-template-columns: 1fr !important; }
          .landing-pricing-grid { grid-template-columns: 1fr !important; }
          .landing-cta-box { padding: 40px 24px !important; }
          .landing-cta-title { font-size: 24px !important; }
          .landing-hero-trust { flex-direction: column; gap: 6px !important; align-items: center; }
          .landing-hero-trust span[style*="CBD5E1"] { display: none !important; }
          .landing-section-h2 { font-size: 24px !important; }
          .pricing-card { padding: 28px 20px !important; }
          .landing-footer-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 12px !important; }
        }
        @media (max-width: 420px) {
          .landing-h1 { font-size: 32px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="landing-nav" style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, color: '#0F172A' }}>
          <span style={{ fontSize: 24 }}>🐾</span>
          <span style={{ color: '#3B82F6' }}>AI-Ветеринар</span>
        </div>
        <div className="landing-nav-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>Возможности</a>
          <a href="#channels" className="nav-hide-mobile" style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>Каналы</a>
          <a href="#calculator" className="nav-hide-mobile" style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>Калькулятор</a>
          <a href="#pricing" style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>Тарифы</a>
          <a href="/admin" style={{ padding: '12px 24px', borderRadius: 8, background: '#3B82F6', color: '#fff', fontWeight: 600, fontSize: 14 }}>
            Войти
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" style={{ textAlign: 'center', padding: '80px 20px 60px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: '#EFF6FF', color: '#2563EB', fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid #DBEAFE' }}>
          Интеллектуальный SaaS для ветеринарных клиник
        </div>
        <h1 className="landing-h1" style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 24, color: '#0F172A', letterSpacing: '-0.02em' }}>
          AI-ассистент для вашей{' '}
          <span style={{ color: '#3B82F6' }}>
            ветклиники
          </span>
        </h1>
        <p className="landing-hero-desc" style={{ fontSize: 20, color: '#475569', lineHeight: 1.6, maxWidth: 640, margin: '0 auto 40px', fontWeight: 400 }}>
          Автоматический триаж обращений, сбор анамнеза, запись на приём — круглосуточно и без участия администратора.
        </p>
        <div className="landing-hero-btns" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/admin" style={{ padding: '16px 36px', borderRadius: 10, background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px -6px rgba(249, 115, 22, 0.4)' }}>
            Попробовать бесплатно
          </a>
          <a href="#features" style={{ padding: '16px 36px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 16 }}>
            Узнать больше
          </a>
        </div>
        <p className="landing-hero-trust" style={{ marginTop: 24, fontSize: 13, color: '#64748B', display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <span>✓ 7 дней бесплатно</span>
          <span style={{color: '#CBD5E1'}}>•</span>
          <span>✓ Без привязки карты</span>
          <span style={{color: '#CBD5E1'}}>•</span>
          <span>✓ Установка за 2 минуты</span>
        </p>
      </section>

      {/* Channels */}
      <section id="channels" style={{ padding: '0 20px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.01em' }}>
            Работает там, где удобно клиенту
          </h2>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
            Один AI-ассистент — три канала. Подключите нужные или все сразу.
          </p>
        </div>
        <div className="landing-channels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {CHANNELS.map((ch) => (
            <div key={ch.title} className="card" style={{ padding: 28, borderRadius: 16, background: '#ffffff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
              {ch.isNew && (
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '2px 10px', borderRadius: 20, background: '#FFF7ED', color: '#C2410C', fontSize: 11, fontWeight: 700, border: '1px solid #FED7AA' }}>
                  НОВОЕ
                </div>
              )}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ch.tagColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                {ch.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#0F172A', marginBottom: 8 }}>{ch.title}</div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{ch.desc}</div>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: ch.tagColor, color: ch.tagText, fontSize: 12, fontWeight: 600 }}>
                {ch.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 className="landing-section-h2" style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: '#0F172A', letterSpacing: '-0.01em' }}>Что получает ваша клиника</h2>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>Всё необходимое для автоматизации первичных обращений и снижения нагрузки на администраторов.</p>
        </div>
        <div className="landing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: 32, borderRadius: 16, background: '#ffffff', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#0F172A' }}>{f.title}</div>
              <div style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 className="landing-section-h2" style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: '#0F172A', letterSpacing: '-0.01em' }}>Как это работает</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {[
              { n: 1, title: 'Регистрация', desc: 'Создаёте аккаунт и указываете данные клиники. Получаете 7 дней бесплатного доступа.' },
              { n: 2, title: 'Настройка', desc: 'Загружаете логотип, выбираете цвета, настраиваете промпт. Подключаете уведомления в Telegram и/или Max.' },
              { n: 3, title: 'Установка виджета', desc: 'Копируете одну строку кода и вставляете на свой сайт. Интеграция готова!' },
              { n: 4, title: 'Работает 24/7', desc: 'AI-бот принимает обращения, оценивает срочность, собирает анамнез и записывает на приём.' },
            ].map((step, index, arr) => (
              <div key={step.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
                {index !== arr.length - 1 && (
                  <div style={{ position: 'absolute', left: 24, top: 48, bottom: -40, width: 2, background: '#E2E8F0' }} />
                )}
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: '#EFF6FF', border: '2px solid #3B82F6', color: '#1D4ED8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, flexShrink: 0, zIndex: 1
                }}>
                  {step.n}
                </div>
                <div style={{ paddingTop: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#0F172A' }}>{step.title}</div>
                  <div style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <RoiCalculator />

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 className="landing-section-h2" style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: '#0F172A', letterSpacing: '-0.01em' }}>Тарифы</h2>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 640, margin: '0 auto' }}>
            Единая подписка для клиник любого размера. Расходы на базовый AI уже включены в пакет.
          </p>
        </div>
        <div className="landing-pricing-grid">
          {PLANS.map((plan) => (
             <div key={plan.name} className="pricing-card card" style={{
              padding: 40, borderRadius: 20,
              background: '#ffffff',
              border: `2px solid ${plan.popular ? '#3B82F6' : '#E2E8F0'}`,
              boxShadow: plan.popular ? '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '6px 20px', borderRadius: 20, background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Популярный
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#0F172A' }}>{plan.name}</div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{plan.price}</span>
                <span style={{ color: '#64748B', fontSize: 16, fontWeight: 500 }}> ₽/мес</span>
              </div>
              <div style={{ fontSize: 14, color: '#3B82F6', marginBottom: 32, fontWeight: 600 }}>{plan.conversations}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ fontSize: 15, color: '#475569', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                    <span style={{ lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/admin"
                className={plan.popular ? 'pricing-btn-popular' : 'pricing-btn'}
                style={{
                  display: 'block', textAlign: 'center', padding: '14px 24px', borderRadius: 10,
                  background: plan.popular ? '#3B82F6' : '#F1F5F9',
                  color: plan.popular ? '#fff' : '#0F172A',
                  fontWeight: 600, fontSize: 15,
                  marginTop: 'auto',
                  transition: 'background 0.2s',
                }}
              >
                Начать работу
              </a>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, fontSize: 13, color: '#94A3B8', lineHeight: 1.6, textAlign: 'left', maxWidth: 1100, borderTop: '1px solid #E2E8F0', paddingTop: 24 }}>
          * Один диалог рассчитывается как средняя сессия из 5 вопросов и ответов. Фактический учет ведется в токенах (слова и символы, обрабатываемые нейросетью). В тариф "Start" включено 2 млн токенов, "Business" — 10 млн токенов, "Pro" — 50 млн токенов. При исчерпании пакета на тарифах Business и Pro система автоматически переходит на оплату за сверхлимит с вашего авансового баланса. Платформа не предоставляет услуги в кредит.
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center', marginBottom: 40 }}>
        <div className="landing-cta-box" style={{ maxWidth: 700, margin: '0 auto', padding: '64px 40px', borderRadius: 24, background: '#0F172A', color: '#fff', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🐾</div>
          <h2 className="landing-cta-title" style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.01em' }}>Готовы автоматизировать приём?</h2>
          <p style={{ color: '#94A3B8', fontSize: 17, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Начните бесплатный 7-дневный период. Настройка займет не более 5 минут.
          </p>
          <a href="/admin" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 10, background: '#F97316', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px -6px rgba(249, 115, 22, 0.4)' }}>
            Зарегистрировать клинику
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid #E2E8F0', background: '#ffffff' }}>
        <div className="landing-footer-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: '#64748B', fontSize: 14, fontWeight: 500 }}>
            © {new Date().getFullYear()} AI-Ветеринар · Умная платформа для ветклиник
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="#features" style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Возможности</a>
            <a href="#pricing" style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>Тарифы</a>
            <a href="/admin" style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600 }}>Войти</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
