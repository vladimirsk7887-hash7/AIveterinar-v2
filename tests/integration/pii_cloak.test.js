/**
 * Интеграция pii-cloak в processAIChat: PII клиента не должно уходить в провайдер,
 * ответ модели восстанавливается с оригиналами. Мокаем провайдер и usage.
 * Запуск: npx vitest run tests/pii_cloak.integration.test.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Захватываем, что реально ушло в провайдер
let captured = null;

vi.mock('../../providers/ai/router.js', () => ({
  callAI: vi.fn(async ({ messages }) => {
    captured = messages;
    // модель "отвечает", повторяя синтетическое имя из последнего сообщения
    const last = messages[messages.length - 1].content;
    const name = (last.match(/[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/) || ['клиент'])[0];
    return { text: `Здравствуйте, ${name}! Записал.`, tokensInput: 10, tokensOutput: 5, costRub: 0.1, provider: 'mock', model: 'mock' };
  }),
}));
vi.mock('../../services/usage.js', () => ({
  reserveTokens: vi.fn(async () => true),
  rollbackReservation: vi.fn(async () => {}),
  commitUsage: vi.fn(async () => {}),
}));
vi.mock('../../config/loader.js', () => ({
  loadConfig: () => ({ ai: { max_completion_tokens: 1000 } }),
}));

const clinic = { id: 'c1', ai_provider: null, ai_model: null, plan_id: 'p' };

describe('pii-cloak в processAIChat', () => {
  beforeEach(() => { captured = null; });

  it('PII_CLOAK=1: имя и телефон не уходят в провайдер, ответ восстановлен', async () => {
    process.env.PII_CLOAK = '1';
    const { processAIChat } = await import('../../services/ai.js');
    const messages = [{ role: 'user', content: 'Меня зовут Владимир Сачко, телефон +7 928 111-22-33, у собаки температура' }];
    const res = await processAIChat({}, clinic, { messages, system: 'ты ветеринар' });

    const sent = captured.map((m) => m.content).join(' ');
    expect(sent).not.toContain('Владимир Сачко');
    expect(sent).not.toContain('+7 928 111-22-33');
    // клиенту вернулось настоящее имя
    expect(res.text).toContain('Владимир Сачко');
  });
});
