import { callAI } from '../providers/ai/router.js';
import { reserveTokens, rollbackReservation, commitUsage } from './usage.js';
import { loadConfig } from '../config/loader.js';
import { createLogger } from './logger.js';

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

  // Step 2: Call AI with failover
  let result;
  try {
    result = await callAI({ messages, system, providerId, modelId, maxTokens });
  } catch (err) {
    // Rollback reservation on error
    await rollbackReservation(supabase, clinic.id, MAX_EXPECTED_TOKENS);
    logger.error({ clinicId: clinic.id, error: err.message }, 'AI call failed, reservation rolled back');
    throw err;
  }

  // Step 3: Commit actual usage
  await commitUsage(supabase, clinic, MAX_EXPECTED_TOKENS, {
    tokensInput: result.tokensInput,
    tokensOutput: result.tokensOutput,
    costRub: result.costRub,
  });

  return result;
}
