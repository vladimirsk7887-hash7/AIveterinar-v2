/** In-memory FSM storage (dev/tests only, lost on restart) */
const store = new Map();

export const memoryStore = {
  async get(conversationId) {
    return store.get(conversationId) || { state: 'idle', data: {} };
  },

  async set(conversationId, state, data) {
    store.set(conversationId, { state, data });
  },

  async delete(conversationId) {
    store.delete(conversationId);
  },
};
