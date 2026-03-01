/**
 * Max Mini-App API adapter — same interface as src/widget/lib/api.js
 * Routes through /api/widget/:slug/* endpoints (shared with widget).
 * Slug is extracted from /max/:slug URL path.
 */

// Extract slug from URL: /max/:slug
const slug = window.location.pathname.split('/max/')[1]?.split('/')[0] || '';
const API = `/api/widget/${slug}`;

// Re-export helpers that don't change
export { parseMeta, mergeCard } from '../../lib/ai';

// Current pet type (set by MaxApp when user selects a pet)
let _currentPetType = 'Другое';
export function setCurrentPetType(name) { _currentPetType = name; }

// Conversation ID — persisted per session
let _conversationId = null;
export function setConversationId(convId) {
  if (convId) _conversationId = convId;
}
export function getConversationId() {
  return _conversationId;
}

/**
 * Check if mini-app is properly configured (clinic exists and is active).
 * Returns clinic config: { primaryColor, bgColor, logoUrl, welcomeMessage }
 */
export async function checkServerKey() {
  if (!slug) return null;
  try {
    const res = await fetch(`${API}/config`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Call AI through widget API — saves conversation to Supabase.
 */
export async function callAI(messages, _systemOverride) {
  try {
    const response = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        petType: _currentPetType,
        sessionId: getSessionId(),
        conversationId: getConversationId(),
        source: 'max',
      }),
    });
    const data = await response.json();

    if (data.conversationId) setConversationId(data.conversationId);

    if (data.error === 'limit_reached') {
      return 'Лимит обращений исчерпан. Пожалуйста, позвоните клинике напрямую.';
    }
    if (!response.ok) {
      return `Ошибка API (${response.status}): ${data.error || 'Неизвестная ошибка'}`;
    }
    return data.text || 'Произошла ошибка.';
  } catch {
    return 'Ошибка соединения. Проверьте интернет.';
  }
}

/**
 * Send appointment through widget API.
 */
export async function sendToTelegram(text, { ownerName, contactMethod, contactValue, petCard } = {}) {
  try {
    const response = await fetch(`${API}/appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: getConversationId(),
        ownerName: ownerName || 'Не указано',
        contactMethod: contactMethod || 'phone',
        contactValue: contactValue || 'Не указано',
        petCard: petCard || null,
        summary: text,
        source: 'max',
      }),
    });
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

// Session ID (one per browser tab)
let _sessionId = null;
function getSessionId() {
  if (!_sessionId) _sessionId = crypto.randomUUID();
  return _sessionId;
}
