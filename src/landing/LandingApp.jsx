const PLANS = [
  { name: 'Start', price: '1 990', conversations: '300', features: ['Виджет для сайта', 'Telegram-уведомления', 'Базовая аналитика', 'Кастомный промпт'] },
  { name: 'Business', price: '4 990', conversations: '1 000', features: ['Всё из Start', 'Кастомный брендинг', 'Расширенная аналитика', 'Приоритетная поддержка'], popular: true },
  { name: 'Pro', price: '9 990', conversations: '∞', features: ['Всё из Business', 'Свой Telegram-бот', 'API доступ', 'Персональный менеджер'] },
];

const FEATURES = [
  { icon: '🤖', title: 'AI-триаж 24/7', desc: 'Автоматическая оценка срочности обращения. Красный / жёлтый / зелёный — моментально.' },
  { icon: '📋', title: 'Запись на приём', desc: 'Бот собирает анамнез и записывает клиента. Уведомление — в Telegram клиники.' },
  { icon: '🎨', title: 'Ваш бренд', desc: 'Логотип, цвета, промпт — виджет выглядит как часть вашего сайта.' },
  { icon: '📊', title: 'Аналитика', desc: 'Сколько обращений, конверсия в записи, расходы на AI — всё в одном дашборде.' },
  { icon: '🔌', title: 'Установка за 2 минуты', desc: 'Одна строка кода на сайт. Никаких настроек серверов, SSL-сертификатов.' },
  { icon: '🔒', title: 'Безопасность', desc: 'Изоляция данных каждой клиники. Шифрование токенов. HTTPS everywhere.' },
];

export default function LandingApp() {
  return (
    <div style={{ background: '#0B0E18', color: '#E0E0E0', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18 }}>
          <span style={{ fontSize: 24 }}>🐾</span>
          <span style={{ color: '#7C4DFF' }}>AI-Ветеринар</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 14, color: '#B0BEC5' }}>Возможности</a>
          <a href="#pricing" style={{ fontSize: 14, color: '#B0BEC5' }}>Тарифы</a>
          <a href="/admin" style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', color: '#fff', fontWeight: 600, fontSize: 13 }}>Войти</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 20px 80px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(124,77,255,0.12)', color: '#B388FF', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
          SaaS для ветеринарных клиник
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
          AI-ассистент для вашей{' '}
          <span style={{ background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ветклиники
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#B0BEC5', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
          Автоматический триаж обращений, сбор анамнеза, запись на приём — всё работает 24/7 без участия администратора.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/admin" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 32px rgba(124,77,255,0.3)' }}>
            Попробовать бесплатно
          </a>
          <a href="#features" style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#B0BEC5', fontWeight: 600, fontSize: 16 }}>
            Узнать больше
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#546E7A' }}>7 дней бесплатно · Без карты · Установка за 2 минуты</p>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Что получает ваша клиника</h2>
          <p style={{ color: '#546E7A', fontSize: 14 }}>Всё необходимое для автоматизации первичных обращений</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ padding: 28, borderRadius: 16, background: '#111629', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#B0BEC5', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 20px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Как это работает</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            { n: 1, title: 'Регистрация', desc: 'Создаёте аккаунт и указываете данные клиники. Получаете 7 дней бесплатного доступа.' },
            { n: 2, title: 'Настройка', desc: 'Загружаете логотип, выбираете цвета, настраиваете промпт и Telegram-уведомления.' },
            { n: 3, title: 'Установка виджета', desc: 'Копируете одну строку кода и вставляете на свой сайт. Готово!' },
            { n: 4, title: 'Работает 24/7', desc: 'AI-бот принимает обращения, оценивает срочность, собирает анамнез и записывает на приём.' },
          ].map((step) => (
            <div key={step.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C4DFF, #448AFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, flexShrink: 0,
              }}>
                {step.n}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#B0BEC5', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Тарифы</h2>
          <p style={{ color: '#546E7A', fontSize: 14 }}>Все расходы на AI включены в стоимость тарифа</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              padding: 32, borderRadius: 20,
              background: plan.popular ? 'linear-gradient(135deg, rgba(124,77,255,0.1), rgba(68,138,255,0.06))' : '#111629',
              border: `1px solid ${plan.popular ? 'rgba(124,77,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', fontSize: 11, fontWeight: 700 }}>
                  Популярный
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{plan.price}</span>
                <span style={{ color: '#546E7A', fontSize: 14 }}> ₽/мес</span>
              </div>
              <div style={{ fontSize: 12, color: '#90CAF9', marginBottom: 24 }}>до {plan.conversations} диалогов/мес</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ fontSize: 13, color: '#B0BEC5' }}>✓ {f}</div>
                ))}
              </div>
              <a href="/admin" style={{
                display: 'block', textAlign: 'center', padding: '12px 24px', borderRadius: 12,
                background: plan.popular ? 'linear-gradient(135deg, #7C4DFF, #448AFF)' : 'transparent',
                border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: plan.popular ? '#fff' : '#B0BEC5',
                fontWeight: 600, fontSize: 14,
              }}>
                Начать
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 48, borderRadius: 24, background: 'linear-gradient(135deg, rgba(124,77,255,0.12), rgba(68,138,255,0.08))', border: '1px solid rgba(124,77,255,0.2)' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🐾</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Готовы автоматизировать приём?</h2>
          <p style={{ color: '#B0BEC5', fontSize: 14, marginBottom: 28 }}>Начните бесплатный 14-дневный период прямо сейчас</p>
          <a href="/admin" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(135deg, #7C4DFF, #448AFF)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 32px rgba(124,77,255,0.3)' }}>
            Зарегистрироваться
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ color: '#546E7A', fontSize: 12 }}>
          © {new Date().getFullYear()} AI-Ветеринар · SaaS-платформа для ветклиник
        </div>
      </footer>
    </div>
  );
}
