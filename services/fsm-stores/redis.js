import { createLogger } from '../logger.js';

const logger = createLogger();

/**
 * Redis FSM storage (scale, cache over PG).
 * Requires ioredis client.
 */
export function createRedisStore(redisClient) {
  const prefix = 'fsm:';

  return {
    async get(conversationId) {
      try {
        const raw = await redisClient.get(`${prefix}${conversationId}`);
        if (!raw) return { state: 'idle', data: {} };
        return JSON.parse(raw);
      } catch (err) {
        logger.error({ conversationId, error: err.message }, 'FSM Redis get error');
        return { state: 'idle', data: {} };
      }
    },

    async set(conversationId, state, data) {
      try {
        await redisClient.set(
          `${prefix}${conversationId}`,
          JSON.stringify({ state, data }),
          'EX',
          86400 // 24h TTL
        );
      } catch (err) {
        logger.error({ conversationId, error: err.message }, 'FSM Redis set error');
      }
    },

    async delete(conversationId) {
      try {
        await redisClient.del(`${prefix}${conversationId}`);
      } catch (err) {
        logger.error({ conversationId, error: err.message }, 'FSM Redis delete error');
      }
    },
  };
}
