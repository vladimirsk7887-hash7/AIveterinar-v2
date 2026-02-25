export const configDefaults = {
  platform: {
    name: 'AI-Ветеринар',
    url: 'https://vetai24.ru',
    support_email: 'support@vetai24.ru',
  },
  ai: {
    default_provider: 'routerai',
    default_model: 'gpt-5.2',
    max_completion_tokens: 1000,
    providers: {},
  },
  tariffs: [],
  payments: {
    tg_stars: { enabled: false, star_to_rub: 1.7 },
    yookassa: { enabled: false, webhook_path: '/api/webhooks/yookassa', return_url: '' },
    stripe: { enabled: false, webhook_path: '/api/webhooks/stripe' },
  },
  fsm: {
    storage: 'postgres',
    redis: { url: '' },
  },
  logging: {
    level: 'info',
    format: 'json',
    events: { log_to_db: true, retention_days: 90 },
    tracked_events: [],
    gc: { enabled: true, cron: '0 3 * * *' },
  },
  telegram: {
    message_max_length: 4000,
    parse_mode: 'HTML',
  },
};
