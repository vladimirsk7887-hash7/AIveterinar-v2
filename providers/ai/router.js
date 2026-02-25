import { loadConfig, getAiProvider, getModelCost } from '../../config/loader.js';
import { createLogger } from '../../services/logger.js';
import { callRouterAI } from './routerai.js';
import { callOpenRouter } from './openrouter.js';
import { callOpenAI } from './openai.js';

const logger = createLogger();

const API_KEY_MAP = {
  routerai: 'AI__ROUTERAI_API_KEY',
  openrouter: 'AI__OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
};

const PROVIDER_FN = {
  routerai: callRouterAI,
  openrouter: callOpenRouter,
  openai: callOpenAI,
};

/**
 * Call AI with failover across providers.
 *
 * @param {Object} opts
 * @param {Array} opts.messages - Chat messages array
 * @param {string} opts.system - System prompt
 * @param {string} opts.providerId - Preferred provider (from clinic settings)
 * @param {string} opts.modelId - Preferred model
 * @param {number} [opts.maxTokens] - Max completion tokens
 * @returns {Promise<{text, tokensInput, tokensOutput, latencyMs, provider, model, costRub}>}
 */
export async function callAI({ messages, system, providerId, modelId, maxTokens }) {
  const config = loadConfig();
  maxTokens = maxTokens || config.ai.max_completion_tokens;

  // Build ordered list of providers to try (preferred first, then failover)
  const providerOrder = [providerId];
  for (const pid of Object.keys(config.ai.providers)) {
    if (pid !== providerId && config.ai.providers[pid].enabled) {
      providerOrder.push(pid);
    }
  }

  let lastError = null;

  for (const pid of providerOrder) {
    const providerConfig = getAiProvider(pid);
    if (!providerConfig?.enabled) continue;

    const apiKey = process.env[API_KEY_MAP[pid]];
    if (!apiKey) {
      logger.debug({ provider: pid }, 'Skipping provider: no API key');
      continue;
    }

    // For failover, use the provider's default model if not the preferred provider
    const currentModelId = pid === providerId ? modelId : providerConfig.models[0]?.id;
    if (!currentModelId) continue;

    const callFn = PROVIDER_FN[pid];
    if (!callFn) {
      logger.warn({ provider: pid }, 'Unknown provider');
      continue;
    }

    try {
      const result = await callFn({
        messages,
        system,
        model: currentModelId,
        maxTokens,
        apiKey,
        baseUrl: providerConfig.base_url,
        proxy: providerConfig.proxy,
      });

      // Calculate cost
      const modelCost = getModelCost(pid, currentModelId);
      let costRub = 0;
      if (modelCost) {
        if (modelCost.input_cost_rub != null) {
          costRub = (result.tokensInput / 1_000_000) * modelCost.input_cost_rub
                  + (result.tokensOutput / 1_000_000) * modelCost.output_cost_rub;
        } else if (modelCost.input_cost_usd != null) {
          // Convert USD to RUB (rough estimate, should be from config)
          const rate = 90;
          costRub = ((result.tokensInput / 1_000_000) * modelCost.input_cost_usd
                  + (result.tokensOutput / 1_000_000) * modelCost.output_cost_usd) * rate;
        }
      }

      logger.info({
        provider: pid,
        model: currentModelId,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        latencyMs: result.latencyMs,
        costRub: Math.round(costRub * 10000) / 10000,
      }, 'AI call success');

      return { ...result, costRub: Math.round(costRub * 10000) / 10000 };
    } catch (err) {
      lastError = err;
      logger.warn({ provider: pid, model: currentModelId, error: err.message, status: err.status }, 'AI provider failed, trying next');

      // Failover on 5xx, timeout, 429, 400 (model not found)
      // Only hard-fail on 401/403 (auth errors)
      if (err.status === 401 || err.status === 403) {
        throw err;
      }
    }
  }

  logger.error({ error: lastError?.message }, 'All AI providers failed');
  throw lastError || new Error('No AI providers available');
}
