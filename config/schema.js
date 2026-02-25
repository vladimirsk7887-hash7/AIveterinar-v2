import { z } from 'zod';

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  input_cost_rub: z.number().optional(),
  output_cost_rub: z.number().optional(),
  input_cost_usd: z.number().optional(),
  output_cost_usd: z.number().optional(),
});

const providerSchema = z.object({
  enabled: z.boolean(),
  base_url: z.string().url(),
  proxy: z.string().optional(),
  models: z.array(modelSchema).min(1),
});

const limitsSchema = z.object({
  dialogs_per_month: z.number().int().positive(),
  messages_per_dialog: z.number().int().positive(),
  tokens_included: z.number().int().positive(),
  overage: z.enum(['block', 'charge']),
  overage_cost_per_1k_rub: z.number().optional(),
  hard_cap_rub: z.number().optional(),
  tg_chats: z.number().int().positive(),
  widgets: z.number().int().positive(),
});

const featuresSchema = z.object({
  custom_branding: z.boolean(),
  custom_prompt: z.boolean(),
  analytics: z.enum(['basic', 'extended']),
  choose_provider: z.boolean(),
  own_tg_bot: z.boolean().optional(),
});

const tariffSchema = z.object({
  id: z.string(),
  name: z.string(),
  price_monthly_rub: z.number().int().nonnegative(),
  duration_days: z.number().int().positive().optional(),
  limits: limitsSchema,
  features: featuresSchema,
});

export const configSchema = z.object({
  platform: z.object({
    name: z.string(),
    url: z.string().url(),
    support_email: z.string().email(),
  }),
  ai: z.object({
    default_provider: z.string(),
    default_model: z.string(),
    max_completion_tokens: z.number().int().positive(),
    providers: z.record(z.string(), providerSchema),
  }),
  tariffs: z.array(tariffSchema).min(1),
  payments: z.object({
    tg_stars: z.object({ enabled: z.boolean(), star_to_rub: z.number() }),
    yookassa: z.object({ enabled: z.boolean(), webhook_path: z.string(), return_url: z.string() }),
    stripe: z.object({ enabled: z.boolean(), webhook_path: z.string() }),
  }),
  fsm: z.object({
    storage: z.enum(['memory', 'postgres', 'redis']),
    redis: z.object({ url: z.string() }),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
    format: z.enum(['json', 'pretty']),
    events: z.object({
      log_to_db: z.boolean(),
      retention_days: z.number().int().positive(),
    }),
    tracked_events: z.array(z.string()),
    gc: z.object({
      enabled: z.boolean(),
      cron: z.string(),
    }),
  }),
  telegram: z.object({
    message_max_length: z.number().int().positive(),
    parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']),
  }),
});
