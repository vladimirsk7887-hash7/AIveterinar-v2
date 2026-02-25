import { createLogger } from '../logger.js';

const logger = createLogger();

/**
 * PostgreSQL FSM storage (production).
 * State is stored in conversations.fsm_state + conversations.fsm_data.
 * Requires a Supabase client (per-request or admin).
 */
export function createPostgresStore(supabase) {
  return {
    async get(conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('fsm_state, fsm_data')
        .eq('id', conversationId)
        .single();

      if (error) {
        logger.error({ conversationId, error: error.message }, 'FSM PG get error');
        return { state: 'idle', data: {} };
      }

      return {
        state: data?.fsm_state || 'idle',
        data: data?.fsm_data || {},
      };
    },

    async set(conversationId, state, fsmData) {
      const { error } = await supabase
        .from('conversations')
        .update({ fsm_state: state, fsm_data: fsmData, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error({ conversationId, state, error: error.message }, 'FSM PG set error');
      }
    },

    async delete(conversationId) {
      const { error } = await supabase
        .from('conversations')
        .update({ fsm_state: 'idle', fsm_data: {}, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        logger.error({ conversationId, error: error.message }, 'FSM PG delete error');
      }
    },
  };
}
