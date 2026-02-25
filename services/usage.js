import { createLogger } from './logger.js';
import { getTariff } from '../config/loader.js';

const logger = createLogger();

/**
 * Get current month as DATE for api_usage table.
 * @returns {string} e.g. '2026-02-01'
 */
export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Reserve tokens BEFORE AI call (Token Reservation Pattern).
 * Returns true if reservation succeeded, false if limits exceeded.
 */
export async function reserveTokens(supabase, clinic, maxExpected) {
  const tariff = getTariff(clinic.plan_id);
  if (!tariff) {
    logger.error({ planId: clinic.plan_id }, 'Unknown tariff');
    return false;
  }

  const { data, error } = await supabase.rpc('reserve_tokens', {
    p_clinic_id: clinic.id,
    p_month: currentMonth(),
    p_max_expected: maxExpected,
    p_plan_dialogs_limit: tariff.limits.dialogs_per_month,
    p_hard_cap_rub: tariff.limits.hard_cap_rub || null,
    p_overage: tariff.limits.overage,
    p_tokens_included: tariff.limits.tokens_included,
  });

  if (error) {
    logger.error({ error: error.message, clinicId: clinic.id }, 'reserve_tokens RPC error');
    return false;
  }

  return data === true;
}

/**
 * Rollback reservation on AI error.
 */
export async function rollbackReservation(supabase, clinicId, maxExpected) {
  const { error } = await supabase.rpc('rollback_reservation', {
    p_clinic_id: clinicId,
    p_month: currentMonth(),
    p_max_expected: maxExpected,
  });

  if (error) {
    logger.error({ error: error.message, clinicId }, 'rollback_reservation RPC error');
  }
}

/**
 * Commit actual AI usage + deduct overage from balance.
 */
export async function commitUsage(supabase, clinic, maxExpected, actual) {
  const tariff = getTariff(clinic.plan_id);

  // Calculate overage cost (only for 'charge' tariffs)
  let overageCostRub = 0;
  if (tariff?.limits.overage === 'charge' && actual.costRub > 0) {
    // Check if we're over the included tokens
    // The overage is handled by commit_ai_usage RPC which deducts from balance
    const costPer1k = tariff.limits.overage_cost_per_1k_rub || 0;
    const totalTokens = actual.tokensInput + actual.tokensOutput;
    overageCostRub = Math.ceil((totalTokens / 1000) * costPer1k);
  }

  const { error } = await supabase.rpc('commit_ai_usage', {
    p_clinic_id: clinic.id,
    p_month: currentMonth(),
    p_max_expected: maxExpected,
    p_actual_input: actual.tokensInput,
    p_actual_output: actual.tokensOutput,
    p_actual_cost_rub: actual.costRub,
    p_overage_cost_rub: overageCostRub,
  });

  if (error) {
    logger.error({ error: error.message, clinicId: clinic.id }, 'commit_ai_usage RPC error');
  }
}
