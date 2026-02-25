/**
 * Widget API adapter — same interface as src/lib/ai.js + src/lib/telegram.js
 * but routes through /api/widget/:slug/* endpoints.
 */
import { SYSTEM_PROMPT } from '../../lib/constants';

// Extract slug from URL: /widget/:slug
const slug = window.location.pathname.split('/widget/')[1]?.split('/')[0] || '';
const API = `/api/widget/${slug}`;

// Re-export helpers that don't change
export { parseMeta, mergeCard } from '../../lib/ai';

// Current pet type (set by WidgetApp when user selects a pet)
let _currentPetType = 'Другое';
export function setCurrentPetType(name) { _currentPetType = name; }

// Conversation ID — persisted per pet session, keyed by local petId
const _conversationIds = {};
export function setConversationId(petId, convId) {
  if (petId && convId) _conversationIds[petId] = convId;
}
export function getConversationId(petId) {
  return _conversationIds[petId] || null;
}

/**
 * Check if widget is properly configured (clinic exists and is active).
 */
export async function checkServerKey() {
  if (!slug) return false;
  try {
    const res = await fetch(`${API}/config`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Call AI through widget API.
 * Same signature as src/lib/ai.js callAI(messages, systemOverride)
 * + optional petId for conversation tracking.
 */
export async function callAI(messages, systemOverride, petId) {
  try {
    const response = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemOverride || SYSTEM_PROMPT,
        petType: _currentPetType,
        sessionId: getSessionId(),
        conversationId: getConversationId(petId),
      }),
    });
    const data = await response.json();

    // Store conversationId from server
    if (data.conversationId && petId) {
      setConversationId(petId, data.conversationId);
    }

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
 * Send appointment through widget API (replaces sendToTelegram).
 */
export async function sendToTelegram(text, { ownerName, contactMethod, contactValue, petCard, petId } = {}) {
  try {
    const response = await fetch(`${API}/appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: getConversationId(petId),
        ownerName: ownerName || 'Не указано',
        contactMethod: contactMethod || 'phone',
        contactValue: contactValue || 'Не указано',
        petCard: petCard || null,
        summary: text,
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
