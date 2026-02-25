import cron from 'node-cron';
import { supabaseAdmin } from '../db/supabase.js';
import { createLogger } from './logger.js';

const logger = createLogger();

export function startGarbageCollection(config) {
  const gcConfig = config?.logging?.gc;
  if (!gcConfig?.enabled) {
    logger.info('Garbage collection disabled');
    return null;
  }

  const retentionDays = config.logging.events.retention_days || 90;
  const cronExpression = gcConfig.cron || '0 3 * * *';

  const task = cron.schedule(cronExpression, async () => {
    try {
      if (!supabaseAdmin) {
        logger.warn('GC skipped: Supabase not configured');
        return;
      }

      const { data, error } = await supabaseAdmin.rpc('gc_events', {
        p_retention_days: retentionDays,
      });

      if (error) {
        logger.error({ error: error.message }, 'GC failed');
        return;
      }

      logger.info({ deleted: data, retentionDays }, 'GC completed');
    } catch (err) {
      logger.error({ error: err.message }, 'GC error');
    }
  });

  logger.info({ cron: cronExpression, retentionDays }, 'GC scheduled');
  return task;
}
