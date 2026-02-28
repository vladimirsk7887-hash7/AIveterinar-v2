import { supabaseAdmin } from '../db/supabase.js';
import { encrypt, decrypt } from './crypto.js';

// In-memory cache with TTL
let cache = { data: null, ts: 0 };
const TTL_MS = 30_000;

async function loadAll() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('key,value');
  if (error) {
    // Table may not exist yet — return empty, fall back to config.yaml / env
    return {};
  }
  return Object.fromEntries((data || []).map(r => [r.key, r.value]));
}

export async function getSettings() {
  if (cache.data && Date.now() - cache.ts < TTL_MS) return cache.data;
  cache = { data: await loadAll(), ts: Date.now() };
  return cache.data;
}

export function invalidateCache() {
  cache = { data: null, ts: 0 };
}

export async function setSetting(key, value) {
  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  invalidateCache();
}

/**
 * Get decrypted API key for a provider.
 * Returns null if not set or decryption fails.
 */
export async function getApiKey(providerId) {
  const settings = await getSettings();
  const encrypted = settings[`ai.key.${providerId}`];
  if (!encrypted) return null;
  try {
    return decrypt(encrypted);
  } catch {
    return null;
  }
}

/**
 * Encrypt and store an API key for a provider.
 */
export async function setApiKey(providerId, plainKey) {
  await setSetting(`ai.key.${providerId}`, encrypt(plainKey));
}
