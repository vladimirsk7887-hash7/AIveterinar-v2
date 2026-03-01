import { useState, useEffect, useRef } from 'react';

// ─── Counter hook (runs when `started` becomes true) ──────────────────────────
function useCounter(target, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return value;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Start',
    price: '1 990',
    badge: null,
    desc: 'до 300 диалогов / мес',
    features: [
      'Быстрая AI-модель (сбор контактов и запись)',
      'Виджет для сайта',
      'Telegram и Max уведомления',
      'Кастомный брендинг виджета (логотип, цвета)',
      'Безопасная блокировка при исчерпании пакета',
    ],
  },
  {
    name: 'Business',
    price: '4 990',
    badge: 'Популярный',
    desc: 'до 1 000 диалогов / мес',
    features: [
      'Кастомный промпт и брендинг',
      'До 3 виджетов и TG/Max каналов',
      'Telegram-бот вашей клиники',
      'Max Mini-App для бота клиники',
      'Сверх лимита — прозрачная оплата (3 ₽/1K токенов)',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: '9 990',
    badge: null,
    desc: '~2 000 диалогов / мес',
    features: [
      'Максимальный пакет токенов',
      'Аварийный лимит (Hard Cap)',
      'Льготная стоимость токенов (1.5 ₽/1K)',
      'Приоритетная поддержка',
    ],
  },
];

const FEATURES = [
  { icon: '◈', title: 'AI-триаж 24/7', desc: 'Автоматическая оценка срочности обращения. Красный / жёлтый / зелёный — за 30 секунд.' },
  { icon: '◉', title: 'Запись на приём', desc: 'Бот собирает анамнез и записывает клиента. Уведомление сразу в Telegram и Max.' },
  { icon: '▣', title: 'Ваш бренд', desc: 'Логотип, цвета, кастомный промпт — виджет выглядит как часть вашего сайта.' },
  { icon: '◈', title: 'Аналитика', desc: 'Обращения, конверсия в записи, расходы на AI — всё в одном дашборде.' },
  { icon: '◉', title: 'Установка за 2 минуты', desc: 'Одна строка кода на сайт. Никаких настроек серверов, SSL-сертификатов.' },
  { icon: '▣', title: 'Безопасность', desc: 'Изоляция данных каждой клиники. Шифрование токенов. HTTPS everywhere.' },
];

const CHANNELS = [
  {
    name: 'Виджет на сайт',
    emoji: '🌐',
    desc: 'Встраиваемый чат-виджет. Одна строка кода — и AI-ассистент появляется на вашем сайте 24/7.',
    color: '#3B82F6',
    hint: '<script src="vetai24.ru/widget.js" …>',
  },
  {
    name: 'Telegram Bot',
    emoji: '✈️',
    desc: 'Клиенты пишут прямо в Telegram. Ваш бот — всегда онлайн, вежлив и мгновенно отвечает.',
    color: '#2AABEE',
    hint: 't.me/ваша-клиника-bot',
  },
  {
    name: 'Max Mini-App',
    emoji: '💬',
    desc: 'Mini-App в мессенджере Max. Полноценный интерфейс с выбором питомца, чатом и записью на приём.',
    color: '#00D97E',
    hint: 'max.ru/id…_bot?startapp',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingApp() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const [roiLeads, setRoiLeads] = useState(15);
  const [roiPercent, setRoiPercent] = useState(30);
  const [roiCheck, setRoiCheck] = useState(2500);

  const [formData, setFormData] = useState({ name: '', phone: '', clinic: '' });
  const [formStatus, setFormStatus] = useState('idle'); // idle | sending | success | error

  // Observe stats section for counter animation
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const lostRevenue = Math.round(roiLeads * (roiPercent / 100) * 30 * roiCheck);
  const lostLeads = Math.round(roiLeads * (roiPercent / 100) * 30);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    const text = `📩 <b>ЗАЯВКА С ЛЕНДИНГА</b>\n\n👤 <b>Имя:</b> ${formData.name}\n📱 <b>Контакт:</b> ${formData.phone}\n🏥 <b>Клиника:</b> ${formData.clinic}`;
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setFormStatus('success');
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  // Animated counters
  const cnt95 = useCounter(95, 1800, statsVisible);
  const cnt3 = useCounter(3, 1400, statsVisible);

  return (
    <div style={{
      background: '#060B18',
      color: '#F0F4FF',
      fontFamily: "'DM Sans', sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-padding-top: 80px; }
        a { color: inherit; text-decoration: none; transition: color 0.2s ease; }
        button { cursor: pointer; font-family: inherit; }
        label { display: block; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #060B18; }
        ::-webkit-scrollbar-thumb { background: #1E3A5F; border-radius: 3px; }

        /* Animations */
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(28px, -18px) scale(1.04); }
          75%       { transform: translate(-14px, 22px) scale(0.97); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          35%       { transform: translate(-22px, 16px) scale(1.03); }
          70%       { transform: translate(18px, -24px) scale(0.96); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        .orb-a { animation: floatA 14s ease-in-out infinite; }
        .orb-b { animation: floatB 18s ease-in-out infinite 3s; }
        .orb-c { animation: floatA 22s ease-in-out infinite 7s; }

        .hero-content { animation: heroFadeUp 0.9s ease 0.15s both; }

        .shimmer-text {
          background: linear-gradient(90deg, #00D97E 0%, #38BDF8 40%, #00D97E 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* Hover effects */
        .nav-link { transition: color 0.2s ease; }
        .nav-link:hover { color: #F0F4FF !important; }

        .hero-btn-primary { transition: transform 0.2s, box-shadow 0.2s; }
        .hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,217,126,0.4) !important; }

        .hero-btn-sec { transition: transform 0.2s, background 0.2s, border-color 0.2s; }
        .hero-btn-sec:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08) !important; }

        .channel-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .channel-card:hover { transform: translateY(-6px); }

        .feature-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .feature-card:hover { transform: translateY(-4px); }

        .plan-card { transition: transform 0.25s ease; }
        .plan-card:hover { transform: translateY(-6px); }

        .footer-link { transition: color 0.2s ease; }
        .footer-link:hover { color: #00D97E !important; }

        /* Range input */
        .roi-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: #1A2740;
          outline: none;
          cursor: pointer;
        }
        .roi-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00D97E;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0,217,126,0.2);
          transition: transform 0.15s;
        }
        .roi-range::-webkit-slider-thumb:hover { transform: scale(1.25); }

        /* Form input */
        .form-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #F0F4FF;
          padding: 13px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-field:focus {
          border-color: #00D97E;
          box-shadow: 0 0 0 3px rgba(0,217,126,0.12);
        }
        .form-field::placeholder { color: #3A4A62; }

        /* Responsive */
        @media (max-width: 768px) {
          .desktop-only  { display: none !important; }
          .mobile-only   { display: flex !important; }
          .hero-btns     { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns > * { text-align: center !important; }
          .hero-p        { font-size: 17px !important; }
          .trust-dot     { display: none !important; }
          .stats-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-num      { font-size: 40px !important; }
          .stat-suf      { font-size: 22px !important; }
          .channels-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .roi-grid      { grid-template-columns: 1fr !important; }
          .roi-result    { padding-top: 0 !important; }
          .plans-grid    { grid-template-columns: 1fr !important; }
          .cta-box       { padding: 36px 24px !important; }
          .form-field    { font-size: 16px !important; }
          .footer-cols   { grid-template-columns: 1fr !important; text-align: center !important; }
          .footer-cols .legal-links   { align-items: center !important; }
          .footer-cols .contact-links a { justify-content: center !important; }
        }

        @media (max-width: 420px) {
          .hero-h1 { font-size: 32px !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════ NAV */}
      <nav style={{
        position: 'fixed', top: 14, left: 14, right: 14, zIndex: 200,
        background: 'rgba(6,11,24,0.88)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px',
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🐾</span>
          <span style={{ color: '#00D97E' }}>AI</span><span style={{ color: '#F0F4FF' }}>-Ветеринар</span>
        </div>

        {/* Desktop links */}
        <div className="desktop-only" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#channels" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: '#6A80A0' }}>Каналы</a>
          <a href="#features" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: '#6A80A0' }}>Возможности</a>
          <a href="#pricing"  className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: '#6A80A0' }}>Тарифы</a>
          <a href="#contact"  className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: '#6A80A0' }}>Контакты</a>
          <a href="/admin" style={{
            padding: '9px 22px', borderRadius: 8,
            background: '#00D97E', color: '#060B18',
            fontWeight: 700, fontSize: 14,
          }}>
            Войти →
          </a>
        </div>

        {/* Mobile: just login */}
        <a href="/admin" className="mobile-only" style={{
          display: 'none', padding: '8px 18px', borderRadius: 8,
          background: '#00D97E', color: '#060B18', fontWeight: 700, fontSize: 14,
          minHeight: 44, alignItems: 'center',
        }}>
          Войти
        </a>
      </nav>

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '120px 20px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Floating glow orbs */}
        <div className="orb-a" style={{ position: 'absolute', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,126,0.07) 0%, transparent 70%)', top: '5%', left: '15%', pointerEvents: 'none' }} />
        <div className="orb-b" style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', bottom: '10%', right: '10%', pointerEvents: 'none' }} />
        <div className="orb-c" style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,126,0.05) 0%, transparent 70%)', top: '40%', right: '25%', pointerEvents: 'none' }} />

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />

        <div className="hero-content" style={{ maxWidth: 820, position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block', marginBottom: 32,
            padding: '6px 18px', borderRadius: 20,
            background: 'rgba(0,217,126,0.09)', border: '1px solid rgba(0,217,126,0.22)',
            color: '#00D97E', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            SaaS-платформа для ветеринарных клиник
          </div>

          {/* Headline */}
          <h1 className="hero-h1" style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(36px, 6.5vw, 72px)',
            fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 28,
          }}>
            AI-ассистент для{' '}
            <span className="shimmer-text">вашей ветклиники</span>
            <br />работает 24/7
          </h1>

          {/* Subtitle */}
          <p className="hero-p" style={{ fontSize: 20, color: '#6A80A0', lineHeight: 1.65, maxWidth: 620, margin: '0 auto 44px', fontWeight: 400 }}>
            Автоматический триаж обращений, сбор анамнеза, запись на приём&nbsp;—
            круглосуточно в виджете на сайте, в Telegram и в Max мессенджере.
          </p>

          {/* CTAs */}
          <div className="hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/admin" className="hero-btn-primary" style={{
              padding: '15px 36px', borderRadius: 10,
              background: '#00D97E', color: '#060B18',
              fontWeight: 700, fontSize: 16,
              boxShadow: '0 8px 28px rgba(0,217,126,0.28)',
            }}>
              Попробовать 7 дней бесплатно
            </a>
            <a href="#channels" className="hero-btn-sec" style={{
              padding: '15px 32px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.11)',
              background: 'rgba(255,255,255,0.04)',
              color: '#C8D8F0', fontWeight: 600, fontSize: 16,
            }}>
              Как подключить →
            </a>
          </div>

          {/* Trust badges */}
          <p style={{ marginTop: 28, fontSize: 13, color: '#3A4A62', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>✓ 7 дней бесплатно</span>
            <span className="trust-dot" style={{ color: '#12203A' }}>·</span>
            <span>✓ Без привязки карты</span>
            <span className="trust-dot" style={{ color: '#12203A' }}>·</span>
            <span>✓ Установка за 2 минуты</span>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ STATS */}
      <section ref={statsRef} style={{ padding: '0 20px 80px' }}>
        <div className="stats-grid" style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
        }}>
          {[
            { val: statsVisible ? '30' : '0', suf: 'сек', label: 'Среднее время триажа',    accent: '#00D97E' },
            { val: '24',                       suf: '/7',  label: 'Без выходных и перерывов', accent: '#38BDF8' },
            { val: statsVisible ? cnt95 : 0,   suf: '%',   label: 'Точность сортировки',      accent: '#00D97E' },
            { val: statsVisible ? cnt3 : 0,    suf: '×',   label: 'Рост ночных записей',       accent: '#38BDF8' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '30px 18px', borderRadius: 16, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.065)',
            }}>
              <div className="stat-num" style={{ fontFamily: "'Syne', sans-serif", fontSize: 50, fontWeight: 800, color: s.accent, lineHeight: 1 }}>
                {s.val}<span className="stat-suf" style={{ fontSize: 26, fontWeight: 700 }}>{s.suf}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: '#4A5A72', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CHANNELS */}
      <section id="channels" style={{
        padding: '80px 20px',
        borderTop: '1px solid rgba(255,255,255,0.045)',
        borderBottom: '1px solid rgba(255,255,255,0.045)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', marginBottom: 18,
              padding: '5px 16px', borderRadius: 20,
              background: 'rgba(59,130,246,0.09)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#60A5FA', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            }}>
              3 канала подключения
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 14 }}>
              Где хотят ваши клиенты — там и бот
            </h2>
            <p style={{ color: '#4A5A72', fontSize: 17, maxWidth: 560, margin: '0 auto' }}>
              Один сервис — три точки входа. Настройте любой канал или сразу все три.
            </p>
          </div>

          <div className="channels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="channel-card" style={{
                padding: '36px 32px', borderRadius: 20,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${ch.color}20`,
                boxShadow: `0 0 40px ${ch.color}07`,
              }}>
                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16, marginBottom: 24,
                  background: `${ch.color}14`, border: `1px solid ${ch.color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>
                  {ch.emoji}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 21, marginBottom: 12, color: '#F0F4FF' }}>
                  {ch.name}
                </div>
                <p style={{ fontSize: 15, color: '#4A5A72', lineHeight: 1.68, marginBottom: 24 }}>{ch.desc}</p>
                {/* Code hint */}
                <div style={{
                  padding: '9px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'monospace', fontSize: 13, color: ch.color,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ch.hint}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FEATURES */}
      <section id="features" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 14 }}>
              Что получает ваша клиника
            </h2>
            <p style={{ color: '#4A5A72', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
              Всё для автоматизации первичных обращений и снижения нагрузки на администраторов.
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card" style={{
                padding: '28px', borderRadius: 16,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.065)',
              }}>
                <div style={{ fontSize: 26, marginBottom: 16, color: i % 2 === 0 ? '#00D97E' : '#38BDF8' }}>
                  {f.icon}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10, color: '#F0F4FF' }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 14, color: '#4A5A72', lineHeight: 1.68 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ ROI CALCULATOR */}
      <section id="roi" style={{
        padding: '80px 20px',
        borderTop: '1px solid rgba(255,255,255,0.045)',
        borderBottom: '1px solid rgba(255,255,255,0.045)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="roi-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
            {/* Left: sliders */}
            <div>
              <div style={{
                display: 'inline-block', marginBottom: 20,
                padding: '5px 16px', borderRadius: 20,
                background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#F87171', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                ROI калькулятор
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 14 }}>
                Сколько вы теряете<br />прямо сейчас?
              </h2>
              <p style={{ color: '#4A5A72', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
                Двигайте ползунки — калькулятор покажет потенциальные потери от необработанных ночных заявок.
              </p>

              {[
                { label: 'Обращений в день',          value: roiLeads,   set: setRoiLeads,   min: 1,   max: 100,   step: 1,    display: roiLeads },
                { label: 'Необработанных / Ночных',    value: roiPercent, set: setRoiPercent, min: 0,   max: 100,   step: 5,    display: `${roiPercent}%` },
                { label: 'Средний чек (₽)',             value: roiCheck,   set: setRoiCheck,   min: 500, max: 15000, step: 100,  display: roiCheck.toLocaleString('ru-RU') },
              ].map((r) => (
                <div key={r.label} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                    <label style={{ fontSize: 14, color: '#6A80A0', fontWeight: 500 }}>{r.label}</label>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 10px', borderRadius: 6 }}>
                      {r.display}
                    </span>
                  </div>
                  <input
                    type="range"
                    className="roi-range"
                    min={r.min} max={r.max} step={r.step} value={r.value}
                    onChange={(e) => r.set(+e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Right: result */}
            <div className="roi-result" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 40 }}>
              {/* Loss card */}
              <div style={{
                padding: 36, borderRadius: 20, textAlign: 'center',
                background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)',
              }}>
                <div style={{ fontSize: 13, color: '#6A80A0', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Потенциальные потери / мес
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(44px, 5.5vw, 64px)', fontWeight: 800, color: '#F87171', lineHeight: 1 }}>
                  {lostRevenue.toLocaleString('ru-RU')} ₽
                </div>
                <div style={{ marginTop: 14, fontSize: 14, color: '#3A4A62' }}>
                  ≈ {lostLeads} заявок/мес остаются без ответа
                </div>
              </div>

              {/* Solution card */}
              <div style={{
                padding: 28, borderRadius: 16,
                background: 'rgba(0,217,126,0.05)', border: '1px solid rgba(0,217,126,0.15)',
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 19, color: '#00D97E', marginBottom: 6 }}>
                  Стоимость AI-Ветеринара
                </div>
                <div style={{ fontSize: 15, color: '#4A5A72', marginBottom: 18 }}>
                  от <span style={{ fontSize: 30, fontWeight: 800, color: '#00D97E', fontFamily: "'Syne', sans-serif" }}>1 990</span> ₽/мес
                </div>
                <a href="/admin" style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 24px', borderRadius: 10,
                  background: '#00D97E', color: '#060B18', fontWeight: 700, fontSize: 15,
                }}>
                  Начать и вернуть эти деньги →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ HOW IT WORKS */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
              Как это работает
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { n: '01', title: 'Регистрация',          desc: 'Создаёте аккаунт и указываете данные клиники. Получаете 7 дней бесплатного доступа.' },
              { n: '02', title: 'Настройка',             desc: 'Загружаете логотип, выбираете цвета, настраиваете промпт и уведомления в Telegram и Max.' },
              { n: '03', title: 'Подключение канала',    desc: 'Виджет на сайт — одна строка кода. TG/Max бот — получаете URL и вставляете в настройки бота.' },
              { n: '04', title: 'Работает 24/7',         desc: 'AI принимает обращения, оценивает срочность, собирает анамнез и записывает на приём.' },
            ].map((step, idx, arr) => (
              <div key={step.n} style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: idx < arr.length - 1 ? 36 : 0 }}>
                {idx < arr.length - 1 && (
                  <div style={{ position: 'absolute', left: 23, top: 50, bottom: 0, width: 1, background: 'linear-gradient(to bottom, rgba(0,217,126,0.3), rgba(0,217,126,0.04))' }} />
                )}
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0, zIndex: 1,
                  background: 'rgba(0,217,126,0.09)', border: '1px solid rgba(0,217,126,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: '#00D97E', letterSpacing: '0.04em',
                }}>
                  {step.n}
                </div>
                <div style={{ paddingTop: 9 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 19, marginBottom: 7, color: '#F0F4FF' }}>{step.title}</div>
                  <div style={{ fontSize: 15, color: '#4A5A72', lineHeight: 1.68 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ PRICING */}
      <section id="pricing" style={{
        padding: '80px 20px',
        borderTop: '1px solid rgba(255,255,255,0.045)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 14 }}>Тарифы</h2>
            <p style={{ color: '#4A5A72', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
              Единая подписка для клиник любого размера. Расходы на AI включены в пакет.
            </p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {PLANS.map((plan) => (
              <div key={plan.name} className="plan-card" style={{
                padding: '40px 32px', borderRadius: 20, position: 'relative',
                display: 'flex', flexDirection: 'column',
                background: plan.popular
                  ? 'linear-gradient(140deg, rgba(0,217,126,0.07) 0%, rgba(56,189,248,0.05) 100%)'
                  : 'rgba(255,255,255,0.025)',
                border: plan.popular ? '1px solid rgba(0,217,126,0.22)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.popular ? '0 0 60px rgba(0,217,126,0.09)' : 'none',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    padding: '5px 20px', borderRadius: 20,
                    background: '#00D97E', color: '#060B18',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#F0F4FF' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, color: '#F0F4FF', letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span style={{ color: '#4A5A72', fontSize: 15 }}> ₽/мес</span>
                </div>
                <div style={{ fontSize: 13, color: '#00D97E', fontWeight: 600, marginBottom: 30 }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1, marginBottom: 32 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ fontSize: 14, color: '#6A80A0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#00D97E', flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ lineHeight: 1.55 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="/admin" style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: plan.popular ? '#00D97E' : 'rgba(255,255,255,0.06)',
                  color: plan.popular ? '#060B18' : '#C8D8F0',
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.09)',
                }}>
                  Начать работу
                </a>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, fontSize: 12, color: '#4A5A72', lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 22 }}>
            * Один диалог = средняя сессия из 5 вопросов и ответов. Учёт ведётся в токенах. Start: 2 млн, Business: 10 млн, Pro: 50 млн токенов. При исчерпании пакета на тарифах Business и Pro система переходит на оплату за сверхлимит с авансового баланса. Платформа не предоставляет услуги в кредит.
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CTA BANNER */}
      <section style={{ padding: '80px 20px' }}>
        <div className="cta-box" style={{
          maxWidth: 800, margin: '0 auto',
          padding: '64px 48px', borderRadius: 24, textAlign: 'center', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(140deg, rgba(0,217,126,0.08) 0%, rgba(56,189,248,0.07) 100%)',
          border: '1px solid rgba(0,217,126,0.18)',
        }}>
          <div style={{ position: 'absolute', top: -120, left: -120, width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,217,126,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 44, marginBottom: 22 }}>🐾</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 14 }}>
            Готовы автоматизировать приём?
          </h2>
          <p style={{ color: '#4A5A72', fontSize: 18, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
            Начните бесплатный 7-дневный период. Настройка займёт не более 5 минут.
          </p>
          <a href="/admin" style={{
            display: 'inline-block', padding: '15px 44px', borderRadius: 10,
            background: '#00D97E', color: '#060B18', fontWeight: 700, fontSize: 16,
            boxShadow: '0 8px 28px rgba(0,217,126,0.3)',
          }}>
            Зарегистрировать клинику →
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ LEAD FORM */}
      <section id="contact" style={{
        padding: '80px 20px',
        borderTop: '1px solid rgba(255,255,255,0.045)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>
              Подключить клинику
            </h2>
            <p style={{ color: '#4A5A72', fontSize: 15 }}>
              Заполните форму — мы свяжемся для настройки пилотного доступа.
            </p>
          </div>

          {formStatus === 'success' ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: '#00D97E', marginBottom: 12 }}>Заявка отправлена!</div>
              <p style={{ color: '#4A5A72' }}>Мы свяжемся с вами в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Ваше имя',            key: 'name',   placeholder: 'Иван Иванов',              type: 'text', auto: 'name' },
                { label: 'Телефон или Telegram', key: 'phone',  placeholder: '+7 (999) … или @username',  type: 'tel',  auto: 'tel' },
                { label: 'Название клиники',     key: 'clinic', placeholder: 'ВетКлиника №1',            type: 'text', auto: 'organization' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: '#6A80A0', fontWeight: 500, marginBottom: 8 }}>{f.label}</label>
                  <input
                    className="form-field"
                    type={f.type}
                    placeholder={f.placeholder}
                    autoComplete={f.auto}
                    value={formData[f.key]}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}

              <p style={{ fontSize: 11, color: '#2A3A52', lineHeight: 1.65, margin: '2px 0' }}>
                Нажимая «Отправить», я даю согласие на обработку персональных данных
                в соответствии с ФЗ №152 на условиях{' '}
                <a href="https://km2b.ru/SPD.pdf" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4A5A72', textDecoration: 'underline', textDecorationColor: 'rgba(74,90,114,0.4)' }}>
                  Согласия на обработку ПДн
                </a>.
              </p>

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                style={{
                  padding: '14px 24px', borderRadius: 10, border: 'none',
                  background: formStatus === 'sending' ? '#0D1E14' : '#00D97E',
                  color: formStatus === 'sending' ? '#2A4A38' : '#060B18',
                  fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
                  cursor: formStatus === 'sending' ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {formStatus === 'sending' ? 'Отправка...' : 'Отправить заявку'}
              </button>

              {formStatus === 'error' && (
                <p style={{ color: '#F87171', fontSize: 14, textAlign: 'center' }}>
                  Ошибка отправки. Позвоните нам: <a href="tel:+79034312229" style={{ color: '#F87171', textDecoration: 'underline' }}>+7 903 431-22-29</a>
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FOOTER */}
      <footer style={{ padding: '56px 20px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Logo + CTA */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>
              <span style={{ color: '#00D97E' }}>AI</span><span style={{ color: '#F0F4FF' }}>-Ветеринар</span>
            </div>
            <a href="/admin" style={{
              display: 'inline-block', padding: '12px 36px', borderRadius: 10,
              background: '#00D97E', color: '#060B18', fontWeight: 700, fontSize: 15,
            }}>
              Попробовать бесплатно
            </a>
          </div>

          {/* Company · Contacts · Legal */}
          <div className="footer-cols" style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 36, alignItems: 'start',
          }}>
            {/* Company info */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6A80A0', marginBottom: 6 }}>ООО «KM2B»</div>
              <div style={{ fontSize: 13, color: '#2A3A52', marginBottom: 10 }}>ИНН: 6165234308</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(0,217,126,0.07)', border: '1px solid rgba(0,217,126,0.13)',
                color: '#00D97E', fontSize: 11, fontWeight: 600,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Аккредитованная ИТ-компания
              </div>
            </div>

            {/* Contacts */}
            <div className="contact-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <a href="tel:+79034312229" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#3A4A62', fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.23A2 2 0 0 1 3.1 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                +7 903 431-22-29
              </a>
              <a href="mailto:support@km2b.ru" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#3A4A62', fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                support@km2b.ru
              </a>
            </div>

            {/* Legal links */}
            <div className="legal-links" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <a href="https://km2b.ru/%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0-%D0%BE%D0%B1%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8-%D0%BF%D0%B5%D1%80%D1%81%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D1%85-%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85/" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: 13, color: '#2A3A52' }}>
                Политика конфиденциальности
              </a>
              <a href="https://km2b.ru/gallery/oferta_SSAI.pdf" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: 13, color: '#2A3A52' }}>
                Договор оферты
              </a>
              <a href="https://km2b.ru/SPD.pdf" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: 13, color: '#2A3A52' }}>
                Согласие на обработку ПДн
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#3A4A62' }}>
            © {new Date().getFullYear()} ООО «KM2B» · AI-Ветеринар · Все права защищены
          </div>
        </div>
      </footer>
    </div>
  );
}
