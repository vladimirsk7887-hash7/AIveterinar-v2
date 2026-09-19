import { callAI } from '../providers/ai/router.js';
import { reserveTokens, rollbackReservation, commitUsage } from './usage.js';
import { loadConfig } from '../config/loader.js';
import { createLogger } from './logger.js';
import { cloakMessages, uncloak } from './piiCloak.js';

// Фиче-флаг: маскировать PII клиента перед отправкой в облачный LLM (ФЗ-152).
// Включается PII_CLOAK=1. По умолчанию выключено — поведение не меняется.
const PII_CLOAK_ON = process.env.PII_CLOAK === '1';

const logger = createLogger();

// Max expected tokens per request (conservative estimate for reservation)
const MAX_EXPECTED_TOKENS = 4000;

/**
 * Full AI call with Token Reservation Pattern:
 * 1. Reserve tokens (atomic)
 * 2. Call AI provider (with failover)
 * 3. Commit actual usage (compensate reservation)
 *
 * @param {Object} supabase - Per-request Supabase client (with Custom JWT)
 * @param {Object} clinic - Clinic object from req.clinic
 * @param {Object} opts - { messages, system }
 * @returns {Promise<{text, tokensInput, tokensOutput, latencyMs, provider, model, costRub}>}
 */
export async function processAIChat(supabase, clinic, { messages, system }) {
  const config = loadConfig();
  const providerId = clinic.ai_provider || null;
  const modelId = clinic.ai_model || null;
  const maxTokens = config.ai.max_completion_tokens;

  // Step 1: Atomic reservation
  const reserved = await reserveTokens(supabase, clinic, MAX_EXPECTED_TOKENS);
  if (!reserved) {
    logger.warn({ clinicId: clinic.id, planId: clinic.plan_id }, 'Token reservation failed — limit reached');
    return { error: 'limit_reached', text: null };
  }

  // PII-маскировка: заменяем персональные данные клиента синтетикой ДО отправки в облако.
  // vault остаётся локально; в LLM уходит только замаскированный текст.
  let piiVault = null;
  let outMessages = messages;
  if (PII_CLOAK_ON) {
    const masked = cloakMessages(messages);
    outMessages = masked.messages;
    piiVault = masked.vault;
  }

  // Step 2: Call AI with failover
  let result;
  try {
    result = await callAI({ messages: outMessages, system, providerId, modelId, maxTokens });
  } catch (err) {
    // Rollback reservation on error
    await rollbackReservation(supabase, clinic.id, MAX_EXPECTED_TOKENS);
    logger.error({ clinicId: clinic.id, error: err.message }, 'AI call failed, reservation rolled back');
    throw err;
  }

  // Восстанавливаем оригиналы в ответе модели перед возвратом клиенту.
  if (PII_CLOAK_ON && piiVault && result && typeof result.text === 'string') {
    result.text = uncloak(result.text, piiVault);
  }

  // Step 3: Commit actual usage
  await commitUsage(supabase, clinic, MAX_EXPECTED_TOKENS, {
    tokensInput: result.tokensInput,
    tokensOutput: result.tokensOutput,
    costRub: result.costRub,
  });

  return result;
}
