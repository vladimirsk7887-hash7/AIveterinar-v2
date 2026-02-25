import { EventEmitter } from 'events';
import { supabaseAdmin } from '../db/supabase.js';
import { createLogger } from './logger.js';

const logger = createLogger();

class EventBus extends EventEmitter {
  emit(eventType, data = {}) {
    logger.debug({ eventType, clinicId: data.clinic_id }, 'Event emitted');

    // Wrap each listener in try-catch so one failure doesn't break others
    const listeners = this.listeners(eventType);
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(data))
        .catch((err) => {
          logger.error({ eventType, error: err.message }, 'Event listener error');
        });
    }

    return true;
  }
}

export const eventBus = new EventBus();

// Register default listeners
export function setupEventListeners(config) {
  const tracked = config?.logging?.tracked_events || [];

  // Log all tracked events to console AND save to DB
  for (const eventType of tracked) {
    eventBus.on(eventType, async (data) => {
      logger.info({ eventType, ...data }, 'Tracked event');

      // Save to events table in DB
      if (supabaseAdmin) {
        try {
          const { clinic_id, ...rest } = data;
          await supabaseAdmin.from('events').insert({
            clinic_id: clinic_id || null,
            event_type: eventType,
            data: rest,
          });
        } catch (err) {
          logger.error({ eventType, error: err.message }, 'Failed to save event to DB');
        }
      }
    });
  }

  logger.info({ count: tracked.length }, 'Event listeners registered');
}
