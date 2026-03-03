import { useState, useCallback } from 'react';
import { SUMMARY_PROMPT } from '../../lib/constants';
import { callAI, sendToTelegram, parseMeta } from '../lib/api';
import { useMax } from '../hooks/useMax';

export default function Appointment({ chatState, userName, onBack }) {
  const { hapticNotification, close } = useMax();
  const [step, setStep] = useState('form'); // form | sending | success | error
  const [name, setName] = useState(userName || '');
  const [contactType, setContactType] = useState('max');
  const [contact, setContact] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !contact.trim()) return;
    setStep('sending');

    try {
      const historyText = chatState?.messages
        ?.map((m) => `${m.role === 'user' ? 'Владелец' : 'AI-Ветеринар'}: ${m.displayText || m.content}`)
        .join('\n') || '';

      const summaryResult = await callAI(
        [{ role: 'user', content: historyText }],
        SUMMARY_PROMPT,
      );
      const { visibleText } = parseMeta(summaryResult?.text || '');
      let summary = visibleText?.trim() || '';
      if (!summary || summary.startsWith('Ошибка') || summary.startsWith('{')) summary = 'Саммари недоступно';

      const statusEmoji = chatState?.status === 'red' ? '🔴'
        : chatState?.status === 'yellow' ? '🟡'
          : chatState?.status === 'green' ? '🟢' : '🔵';

      const card = chatState?.card || {};
      const cardText = [
        card.species && `Вид: ${card.species}`,
        card.breed && `Порода: ${card.breed}`,
        card.age && `Возраст: ${card.age}`,
        card.weight && `Вес: ${card.weight}`,
        card.symptoms?.length && `Симптомы: ${card.symptoms.join(', ')}`,
      ].filter(Boolean).join('\n');

      const contactLabel = contactType === 'max' ? 'Max'
        : contactType === 'telegram' ? 'Telegram' : 'Телефон';

      const message = [
        `${statusEmoji} <b>НОВАЯ ЗАПИСЬ НА ПРИЁМ</b>`,
        '',
        `👤 <b>Владелец:</b> ${name}`,
        `📱 <b>${contactLabel}:</b> ${contact}`,
        '',
        cardText && `🐾 <b>Пациент:</b>\n${cardText}`,
        '',
        summary,
        '',
        '📍 <i>Источник: Max Mini App</i>',
      ].filter(Boolean).join('\n');

      const sent = await sendToTelegram(message, {
        ownerName: name,
        contactMethod: contactType,
        contactValue: contact,
        petCard: card,
      });

      if (sent) {
        setStep('success');
        hapticNotification('success');
      } else {
        setStep('error');
        hapticNotification('error');
      }
    } catch {
      setStep('error');
      hapticNotification('error');
    }
  }, [name, contact, contactType, chatState, hapticNotification]);

  if (step === 'sending') {
    return (
      <div className="tg-appointment tg-center">
        <div className="tg-spinner">⏳</div>
        <p>Отправляем заявку...</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="tg-appointment tg-center">
        <div className="tg-success-icon">✅</div>
        <h2>Заявка отправлена!</h2>
        <p>Ветеринарная клиника свяжется с вами в ближайшее время.</p>
        <button className="tg-retry-btn" onClick={close} style={{ marginTop: 16 }}>
          Закрыть
        </button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="tg-appointment tg-center">
        <div className="tg-error-icon">❌</div>
        <h2>Ошибка отправки</h2>
        <p>Не удалось отправить заявку. Попробуйте позже.</p>
        <button className="tg-retry-btn" onClick={() => setStep('form')}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="tg-appointment">
      <div className="tg-form-header">
        <h2>🏥 Запись на приём</h2>
        <p>Заполните данные для связи</p>
      </div>

      <div className="tg-form">
        <label className="tg-label">Ваше имя</label>
        <input
          className="tg-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться?"
        />

        <label className="tg-label">Способ связи</label>
        <div className="tg-contact-types">
          {[
            { key: 'max', label: 'Max', icon: '💬' },
            { key: 'telegram', label: 'Telegram', icon: '✈️' },
            { key: 'phone', label: 'Телефон', icon: '📞' },
          ].map((ct) => (
            <button
              key={ct.key}
              className={`tg-contact-type ${contactType === ct.key ? 'active' : ''}`}
              onClick={() => setContactType(ct.key)}
            >
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>

        <label className="tg-label">
          {contactType === 'max' ? 'Имя пользователя Max'
            : contactType === 'telegram' ? 'Telegram username или номер'
              : 'Номер телефона'}
        </label>
        <input
          className="tg-input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={contactType === 'max' ? '@username' : contactType === 'telegram' ? '@username' : '+7 ...'}
        />

        <button
          className="tg-appoint-btn"
          onClick={handleSubmit}
          disabled={!name.trim() || !contact.trim()}
          style={{ marginTop: 16 }}
        >
          Отправить заявку
        </button>
      </div>
    </div>
  );
}
