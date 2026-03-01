import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { widgetRateLimit } from '../middleware/rateLimit.js';
import { processAIChat } from '../services/ai.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';
import { DEFAULT_SYSTEM_PROMPT } from '../config/prompts.js';

const logger = createLogger();
const router = Router();

// All widget routes require tenant resolution
router.use('/:slug', widgetRateLimit);
router.use('/:slug', tenantMiddleware);

/**
 * GET /api/widget/:slug/config
 * Public: returns clinic branding for widget initialization.
 */
router.get('/:slug/config', (req, res) => {
  const clinic = req.clinic;
  const branding = clinic.settings?.branding || {};
  res.json({
    name: clinic.name || '',
    primaryColor: branding.primary_color || null,
    bgColor: branding.bg_color || null,
    welcomeMessage: branding.welcome_message || null,
    logoUrl: branding.logo_url || null,
    systemPrompt: branding.system_prompt || null,
  });
});

/**
 * Parse <meta>...</meta> from AI response (server-side version of parseMeta).
 */
function parseMeta(text) {
  const metaMatch = text.match(/<meta>([\s\S]*?)<\/meta>/);
  let meta = { status: 'consultation', card: {}, suggestions: [] };
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch {
      try {
        const cleaned = metaMatch[1].replace(/[\n\r]/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        meta = JSON.parse(cleaned);
      } catch { /* ignore */ }
    }
  }
  const visibleText = text.replace(/<meta>[\s\S]*?<\/meta>/, '').trim();
  return { meta, visibleText };
}

/**
 * Merge patient card data (accumulative).
 */
function mergeCard(old, newC) {
  if (!newC) return old;
  const merged = { ...old };
  for (const [k, v] of Object.entries(newC)) {
    if (v && (!Array.isArray(v) || v.length > 0)) {
      if (k === 'symptoms' && Array.isArray(old?.symptoms)) {
        merged.symptoms = [...new Set([...(old.symptoms || []), ...v])];
      } else {
        merged[k] = v;
      }
    }
  }
  return merged;
}

/**
 * POST /api/widget/:slug/chat
 * The critical path: Create/find conversation → Save user msg → AI Call → Save assistant msg → Update conversation.
 */
router.post('/:slug/chat', async (req, res) => {
  const { messages, petType, sessionId, externalUserId, conversationId, source } = req.body;

  if (!messages?.length || !petType) {
    return res.status(400).json({ error: 'Missing messages or petType' });
  }

  const clinic = req.clinic;
  const supabase = req.supabase;

  try {
    // ── 1. Get or create conversation ──
    let convId = conversationId || null;

    if (!convId) {
      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          clinic_id: clinic.id,
          session_id: sessionId || null,
          external_user_id: externalUserId || null,
          pet_type: petType,
          source: source || 'widget',
          status: 'consultation',
          card: {},
          message_count: 0,
        })
        .select('id')
        .single();

      if (convError) {
        logger.error({ error: convError.message }, 'Failed to create conversation');
        return res.status(500).json({ error: 'Failed to create conversation' });
      }
      convId = conv.id;

      // Track event
      eventBus.emit('conversation.started', {
        clinic_id: clinic.id,
        conversation_id: convId,
        pet_type: petType,
        source: source || 'widget',
      });
    }

    // ── 2. Save user message (last message in the array) ──
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === 'user') {
      await supabase.from('messages').insert({
        conversation_id: convId,
        clinic_id: clinic.id,
        role: 'user',
        content: lastUserMsg.content,
      });
    }

    // ── 3. AI call with Token Reservation Pattern ──
    const systemPrompt = clinic.custom_prompt
      ? `${clinic.custom_prompt}\n\n${DEFAULT_SYSTEM_PROMPT}`
      : DEFAULT_SYSTEM_PROMPT;

    const aiResult = await processAIChat(supabase, clinic, {
      messages,
      system: systemPrompt,
    });

    if (aiResult.error === 'limit_reached') {
      eventBus.emit('limit.reached', { clinic_id: clinic.id });
      return res.status(429).json({
        error: 'limit_reached',
        message: 'Лимит исчерпан. Позвоните нам напрямую.',
        conversationId: convId,
      });
    }

    // ── 4. Parse meta from AI response ──
    const { meta, visibleText } = parseMeta(aiResult.text);

    // ── 5. Save assistant message ──
    await supabase.from('messages').insert({
      conversation_id: convId,
      clinic_id: clinic.id,
      role: 'assistant',
      content: aiResult.text,
      visible_text: visibleText,
      meta: meta || null,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      tokens_input: aiResult.tokensInput,
      tokens_output: aiResult.tokensOutput,
      cost_rub: aiResult.costRub,
      latency_ms: aiResult.latencyMs,
    });

    // ── 6. Update conversation metadata ──
    // Get current conversation to merge card
    const { data: currentConv } = await supabase
      .from('conversations')
      .select('card, message_count')
      .eq('id', convId)
      .single();

    const updatedCard = mergeCard(currentConv?.card || {}, meta.card);
    const newMessageCount = (currentConv?.message_count || 0) + (lastUserMsg?.role === 'user' ? 2 : 1);

    await supabase
      .from('conversations')
      .update({
        status: meta.status || 'consultation',
        card: updatedCard,
        pet_name: updatedCard.name || null,
        message_count: newMessageCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', convId);

    // ── 7. Async events ──
    eventBus.emit('message.sent', {
      clinic_id: clinic.id,
      conversation_id: convId,
      provider: aiResult.provider,
      model: aiResult.model,
      tokens: aiResult.tokensInput + aiResult.tokensOutput,
      costRub: aiResult.costRub,
    });

    res.json({
      text: aiResult.text,
      conversationId: convId,
      provider: aiResult.provider,
      model: aiResult.model,
      latencyMs: aiResult.latencyMs,
    });
  } catch (err) {
    logger.error({ clinicId: clinic.id, error: err.message }, 'Widget chat error');
    eventBus.emit('error.ai_provider', { clinic_id: clinic.id, error: err.message });
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

/**
 * POST /api/widget/:slug/appointment
 * Create an appointment and notify clinic via TG.
 */
router.post('/:slug/appointment', async (req, res) => {
  const { conversationId, ownerName, contactMethod, contactValue, petCard, summary, source } = req.body;

  if (!ownerName || !contactMethod || !contactValue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clinic = req.clinic;
  const supabase = req.supabase;

  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        conversation_id: conversationId || null,
        clinic_id: clinic.id,
        owner_name: ownerName,
        contact_method: contactMethod,
        contact_value: contactValue,
        pet_card: petCard || null,
        summary: summary || null,
        source: source || 'widget',
      })
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message }, 'Failed to create appointment');
      return res.status(500).json({ error: 'Failed to create appointment' });
    }

    // Notify clinic via TG (async, don't block)
    eventBus.emit('appointment.created', {
      clinic_id: clinic.id,
      appointment_id: appointment.id,
      owner_name: ownerName,
      contact_method: contactMethod,
      tg_chat_ids: clinic.tg_chat_ids,
      summary,
    });

    res.json({ success: true, appointmentId: appointment.id });
  } catch (err) {
    logger.error({ clinicId: clinic.id, error: err.message }, 'Appointment creation error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
