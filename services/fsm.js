import { loadConfig } from '../config/loader.js';
import { createLogger } from './logger.js';
import { memoryStore } from './fsm-stores/memory.js';
import { createPostgresStore } from './fsm-stores/postgres.js';

const logger = createLogger();

/**
 * FSM States:
 * idle → pet_selected → chatting → appointment_form → appointment_sent → completed
 */
const TRANSITIONS = {
  idle:              ['pet_selected'],
  pet_selected:      ['chatting'],
  chatting:          ['chatting', 'appointment_form', 'completed'],
  appointment_form:  ['appointment_sent', 'chatting'],
  appointment_sent:  ['completed', 'chatting'],
  completed:         ['idle'],
};

/**
 * Create an FSM instance for a conversation.
 * @param {Object} supabase - Supabase client (for postgres store)
 * @returns {Object} FSM engine
 */
export function createFSM(supabase) {
  const config = loadConfig();
  let store;

  if (config.fsm.storage === 'memory') {
    store = memoryStore;
  } else if (config.fsm.storage === 'redis') {
    // Redis: lazy-load to avoid import error when ioredis not installed
    logger.warn('Redis FSM store requested but not yet initialized — falling back to memory');
    store = memoryStore;
  } else {
    // Default: postgres
    store = createPostgresStore(supabase);
  }

  return {
    async getState(conversationId) {
      return store.get(conversationId);
    },

    async transition(conversationId, newState, data = {}) {
      const current = await store.get(conversationId);
      const allowed = TRANSITIONS[current.state];

      if (!allowed || !allowed.includes(newState)) {
        logger.warn({
          conversationId,
          from: current.state,
          to: newState,
        }, 'Invalid FSM transition');
        return false;
      }

      const merged = { ...current.data, ...data };
      await store.set(conversationId, newState, merged);

      logger.debug({
        conversationId,
        from: current.state,
        to: newState,
      }, 'FSM transition');

      return true;
    },

    async reset(conversationId) {
      await store.delete(conversationId);
    },
  };
}
