import { createLogger } from '../../services/logger.js';

const logger = createLogger();

export async function callRouterAI({ messages, system, model, maxTokens, apiKey, baseUrl }) {
  const url = `${baseUrl}/chat/completions`;
  const startTime = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(5000),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data.error?.message || `RouterAI error ${response.status}`;
    logger.error({ status: response.status, model, error: msg }, 'RouterAI call failed');
    throw Object.assign(new Error(msg), { status: response.status });
  }

  const latencyMs = Date.now() - startTime;
  const usage = data.usage || {};

  return {
    text: data.choices?.[0]?.message?.content || '',
    tokensInput: usage.prompt_tokens || 0,
    tokensOutput: usage.completion_tokens || 0,
    latencyMs,
    provider: 'routerai',
    model,
  };
}
