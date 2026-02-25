import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';
import { configSchema } from './schema.js';
import { configDefaults } from './defaults.js';

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

let _config = null;

export function loadConfig() {
  if (_config) return _config;

  const configPath = resolve(process.cwd(), 'config.yaml');
  const raw = readFileSync(configPath, 'utf-8');
  const parsed = parse(raw);
  const merged = deepMerge(configDefaults, parsed);

  const result = configSchema.safeParse(merged);
  if (!result.success) {
    console.error('Config validation errors:', result.error.format());
    throw new Error('Invalid config.yaml: ' + result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '));
  }

  _config = result.data;
  return _config;
}

// Helper to get tariff by ID
export function getTariff(tariffId) {
  const config = loadConfig();
  return config.tariffs.find(t => t.id === tariffId);
}

// Helper to get AI provider config
export function getAiProvider(providerId) {
  const config = loadConfig();
  return config.ai.providers[providerId];
}

// Helper to get model cost
export function getModelCost(providerId, modelId) {
  const provider = getAiProvider(providerId);
  if (!provider) return null;
  return provider.models.find(m => m.id === modelId);
}
