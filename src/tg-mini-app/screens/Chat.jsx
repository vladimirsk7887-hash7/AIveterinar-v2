import { useState, useRef, useEffect, useCallback } from 'react';
import { STARTER_BUTTONS, STATUS_CONFIG } from '../../lib/constants';
import { callAI, parseMeta, mergeCard } from '../../lib/ai';
import { useTelegram } from '../hooks/useTelegram';

export default function Chat({ petType, userName, onAppointment, chatState, onChatStateChange }) {
  const { showMainButton, hideMainButton, haptic, hapticNotification } = useTelegram();
  const chatEndRef = useRef(null);

  // Restore or initialize state
  const [messages, setMessages] = useState(chatState?.messages || []);
  const [status, setStatus] = useState(chatState?.status || 'consultation');
  const [card, setCard] = useState(chatState?.card || { species: petType?.name });
  const [suggestions, setSuggestions] = useState(chatState?.suggestions || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const prevStatusRef = useRef(status);

  // Save state for parent
  useEffect(() => {
    onChatStateChange({ messages, status, card, suggestions });
  }, [messages, status, card, suggestions, onChatStateChange]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Haptic on status change
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      if (status === 'red') hapticNotification('error');
      else if (status === 'yellow') hapticNotification('warning');
      else haptic('light');
      prevStatusRef.current = status;
    }
  }, [status, haptic, hapticNotification]);

  // MainButton for appointment after 2+ visible messages
  const visibleMessages = messages.filter((m) => !m.hidden && m.displayText);
  const hasEnoughDialog = visibleMessages.length >= 2;

  useEffect(() => {
    if (hasEnoughDialog) {
      showMainButton('🏥 Записаться на приём', onAppointment);
    } else {
      hideMainButton();
    }
    return () => hideMainButton();
  }, [hasEnoughDialog, showMainButton, hideMainButton, onAppointment]);

  // Initial AI greeting
  useEffect(() => {
    if (messages.length > 0 || !petType) return;
    const initMsg = `Вид питомца: ${petType.name}. Начало диалога.`;
    const userMsg = {
      role: 'user',
      content: initMsg,
      displayText: `${petType.emoji} ${petType.name} — новый диалог`,
      hidden: true,
    };
    setMessages([userMsg]);
    setLoading(true);

    callAI([{ role: 'user', content: initMsg }]).then((reply) => {
      const { meta, visibleText } = parseMeta(reply);
      setMessages([userMsg, { role: 'assistant', content: reply, displayText: visibleText }]);
      setStatus(meta.status || 'consultation');
      setCard((prev) => mergeCard(prev, meta.card));
      setSuggestions(meta.suggestions || []);
      setLoading(false);
    });
  }, [petType, messages.length]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: text, displayText: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setSuggestions([]);
    setLoading(true);
    haptic('light');

    const reply = await callAI(updated.map((m) => ({ role: m.role, content: m.content })));
    const { meta, visibleText } = parseMeta(reply);
    setMessages([...updated, { role: 'assistant', content: reply, displayText: visibleText }]);
    setStatus(meta.status || status);
    setCard((prev) => mergeCard(prev, meta.card));
    setSuggestions(meta.suggestions || []);
    setLoading(false);
  }, [messages, loading, status, haptic]);

  const isStartOfDialog = visibleMessages.filter((m) => m.role === 'user').length === 0;
  const currentSuggestions = isStartOfDialog && !suggestions.length ? STARTER_BUTTONS : suggestions;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.consultation;

  const cardFields = [
    card.name && ['Имя', card.name],
    card.species && ['Вид', card.species],
    card.breed && ['Порода', card.breed],
    card.age && ['Возраст', card.age],
    card.weight && ['Вес', card.weight],
  ].filter(Boolean);

  const hasCardData = cardFields.length > 0 || (card.symptoms?.length > 0);

  return (
    <div className="tg-chat">
      {/* Status bar */}
      <div className="tg-status-bar" style={{
        background: statusCfg.bg,
        borderBottom: `1px solid ${statusCfg.border}`,
      }}>
        <span className={`tg-status-dot ${statusCfg.pulse ? 'pulse' : ''}`} style={{ background: statusCfg.color }} />
        <span className="tg-status-text" style={{ color: statusCfg.color }}>{statusCfg.text}</span>
      </div>

      {/* Patient card accordion */}
      {hasCardData && (
        <div className="tg-card-section">
          <button className="tg-card-toggle" onClick={() => { setCardOpen(!cardOpen); haptic('light'); }}>
            <span>📋 Карточка пациента</span>
            <span>{cardOpen ? '▲' : '▼'}</span>
          </button>
          {cardOpen && (
            <div className="tg-card-body">
              {cardFields.map(([label, value]) => (
                <div key={label} className="tg-card-row">
                  <span className="tg-card-label">{label}</span>
                  <span className="tg-card-value">{value}</span>
                </div>
              ))}
              {card.symptoms?.length > 0 && (
                <div className="tg-card-row">
                  <span className="tg-card-label">Симптомы</span>
                  <div className="tg-symptoms">
                    {card.symptoms.map((s, i) => (
                      <span key={i} className="tg-symptom-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {card.notes && (
                <div className="tg-card-row">
                  <span className="tg-card-label">Заметки</span>
                  <span className="tg-card-value">{card.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="tg-messages">
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`tg-msg ${msg.role}`}>
            {msg.role === 'assistant' && <div className="tg-msg-avatar">🐾</div>}
            <div className={`tg-msg-bubble ${msg.role}`}>
              {msg.displayText}
            </div>
          </div>
        ))}
        {loading && (
          <div className="tg-msg assistant">
            <div className="tg-msg-avatar">🐾</div>
            <div className="tg-msg-bubble assistant tg-typing">•••</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {!loading && currentSuggestions?.length > 0 && (
        <div className="tg-suggestions">
          {currentSuggestions.map((s, i) => (
            <button key={i} className="tg-suggestion-btn" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="tg-input-area">
        <input
          className="tg-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Опишите, что случилось..."
          disabled={loading}
        />
        <button
          className="tg-send-btn"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
