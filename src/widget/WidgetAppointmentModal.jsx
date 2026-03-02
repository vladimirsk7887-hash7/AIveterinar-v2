import { useState, useRef } from 'react';
import { callAI, sendToTelegram, parseMeta } from './lib/api';
import { SUMMARY_PROMPT } from '../lib/constants';

export default function WidgetAppointmentModal({ pet, messages, onClose }) {
  const [step, setStep] = useState("contact");
  const [contactMethod, setContactMethod] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [hoverMethod, setHoverMethod] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const summaryRef = useRef(null);

  const contactMethods = [
    { id: "telegram", icon: "✈️", label: "Telegram", placeholder: "@username или номер" },
    { id: "max", icon: "💬", label: "Max", placeholder: "@username в Max" },
    { id: "phone", icon: "📞", label: "Телефон", placeholder: "+7 (999) 123-45-67" },
  ];

  const handleSubmit = async () => {
    if (!contactValue.trim() || !ownerName.trim()) return;
    setStep("sending");

    const dialogHistory = messages
      .filter((m) => m.displayText && !m.hidden)
      .map((m) => `${m.role === "user" ? "Владелец" : "AI-Ветеринар"}: ${m.displayText}`)
      .join("\n");

    let summary = "";
    try {
      summary = await callAI(
        [{ role: "user", content: `${SUMMARY_PROMPT}\n\nИСТОРИЯ ДИАЛОГА:\n${dialogHistory}` }],
        "Ты помощник ветеринара. Составь краткое саммари обращения на русском языке."
      );
      // Strip <meta> blocks from AI response, then validate
      const { visibleText } = parseMeta(summary || '');
      summary = visibleText?.trim() || '';
      if (!summary || summary.startsWith("Ошибка") || summary.startsWith("{")) summary = "Саммари недоступно";
    } catch {
      summary = "Саммари недоступно";
    }

    const card = pet?.card || {};
    const cardLines = [
      card.name && `Имя: ${card.name}`,
      card.species && `Вид: ${card.species}`,
      card.breed && `Порода: ${card.breed}`,
      card.age && `Возраст: ${card.age}`,
      card.weight && `Вес: ${card.weight}`,
      card.symptoms?.length && `Симптомы: ${card.symptoms.join(", ")}`,
      card.notes && `Заметки: ${card.notes}`,
    ].filter(Boolean).join("\n");

    const statusLabel = {
      red: "🔴 ЭКСТРЕННО", yellow: "🟡 Требует внимания",
      green: "🟢 Стабильное", consultation: "🔵 Консультация", blocked: "⚫ Защита",
    }[pet?.status] || "Неизвестно";

    const selectedMethod = contactMethods.find((m) => m.id === contactMethod);

    const fullMessage =
      `🏥 НОВАЯ ЗАПИСЬ НА ПРИЁМ\n\n` +
      `👤 Владелец: ${ownerName}\n` +
      `📱 Связь (${selectedMethod?.label}): ${contactValue}\n` +
      `⚡ Статус: ${statusLabel}\n\n` +
      `─────────────────\n` +
      `🐾 КАРТОЧКА ПАЦИЕНТА\n${cardLines || "Нет данных"}\n\n` +
      `─────────────────\n` +
      `${summary}\n\n` +
      `─────────────────\n` +
      `🕐 Отправлено через AI-Ветеринар`;

    setSummaryText(fullMessage);

    // Send via widget appointment API (pass only AI summary, not the full formatted message)
    const sent = await sendToTelegram(summary, {
      ownerName,
      contactMethod,
      contactValue,
      petCard: card,
      petId: pet?.id,
      status: pet?.status,
    });
    if (sent) {
      setStep("success");
    } else {
      setStep("ready");
    }
  };

  const canSubmit = contactValue.trim() && ownerName.trim() && contactMethod;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--modal-overlay)", backdropFilter: "blur(12px)", animation: "fadeIn 0.25s ease",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 440, maxWidth: "92vw", background: "var(--modal-bg)", borderRadius: 20,
        border: "1px solid rgba(124,77,255,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,77,255,0.08)",
        overflow: "hidden", animation: "modalSlide 0.35s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light)",
          background: "var(--modal-header-bg)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, #7C4DFF, #448AFF)", fontSize: 20,
                }}>📋</span>
                Записаться на приём
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
                {pet?.emoji} {pet?.card?.name || pet?.name}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "var(--close-btn-bg)", border: "1px solid var(--close-btn-border)",
              color: "var(--text-muted)", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: "24px 28px", maxHeight: "70vh", overflowY: "auto" }}>
          {step === "contact" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, color: "#7C4DFF", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Ваше имя</label>
                <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Как к вам обращаться?"
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border-medium)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124,77,255,0.35)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border-medium)"}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, color: "#7C4DFF", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>Способ связи</label>
                <div className="contact-methods">
                  {contactMethods.map((m) => {
                    const selected = contactMethod === m.id;
                    const hovered = hoverMethod === m.id;
                    return (
                      <button key={m.id} onClick={() => setContactMethod(m.id)}
                        onMouseEnter={() => setHoverMethod(m.id)} onMouseLeave={() => setHoverMethod(null)}
                        style={{
                          flex: 1, padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                          border: `1px solid ${selected ? "rgba(124,77,255,0.4)" : hovered ? "rgba(124,77,255,0.2)" : "var(--border-light)"}`,
                          background: selected ? "var(--accent-active-bg)" : hovered ? "var(--accent-hover-bg)" : "var(--bg-input)",
                          color: selected ? "#B388FF" : "var(--text-secondary)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          transition: "all 0.25s ease", transform: selected ? "scale(1.03)" : "scale(1)", fontFamily: "inherit",
                        }}>
                        <span style={{ fontSize: 22 }}>{m.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {contactMethod && (
                <div style={{ marginBottom: 24, animation: "fadeIn 0.3s ease" }}>
                  <label style={{ display: "block", fontSize: 11, color: "#7C4DFF", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>Контакт</label>
                  <input value={contactValue} onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactMethods.find((m) => m.id === contactMethod)?.placeholder}
                    style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border-medium)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,77,255,0.35)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border-medium)"}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  />
                </div>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit} className="appointment-submit-btn"
                style={{
                  width: "100%", padding: "15px", borderRadius: 14, border: "none", fontFamily: "inherit",
                  background: canSubmit ? "linear-gradient(135deg, #7C4DFF, #536DFE, #448AFF)" : "var(--btn-disabled-bg)",
                  color: canSubmit ? "#fff" : "var(--text-placeholder)", cursor: canSubmit ? "pointer" : "not-allowed",
                  fontSize: 15, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.3s ease",
                  boxShadow: canSubmit ? "0 4px 24px rgba(124,77,255,0.3)" : "none",
                }}>Отправить заявку ➤</button>
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--text-placeholder)", fontFamily: "'JetBrains Mono', monospace" }}>
                Саммари диалога и карточка питомца будут отправлены ветеринару
              </div>
            </>
          )}

          {step === "sending" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16, animation: "pulse 1s ease-in-out infinite" }}>📡</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>Отправляем заявку...</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>Генерируем саммари и отправляем ветеринару</div>
            </div>
          )}

          {step === "ready" && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ fontSize: 12, color: "#FFD740", fontWeight: 600, marginBottom: 10, textAlign: "center" }}>
                Автоматическая отправка не удалась. Скопируйте текст и отправьте вручную:
              </div>
              <textarea ref={summaryRef} readOnly value={summaryText} onFocus={(e) => e.target.select()}
                style={{
                  width: "100%", height: 200, resize: "none",
                  background: "var(--textarea-bg)", border: "1px solid var(--border-medium)",
                  borderRadius: 12, padding: 14, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7,
                  fontFamily: "'JetBrains Mono', monospace", outline: "none",
                }}
              />
              <button onClick={onClose} style={{
                width: "100%", marginTop: 12, padding: "11px", borderRadius: 12,
                border: "1px solid var(--border-light)", background: "transparent",
                color: "var(--text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              }}>Закрыть</button>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeIn 0.4s ease" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 18px",
                background: "var(--success-bg)",
                border: "2px solid var(--success-border)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 34,
              }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#00e676", marginBottom: 8 }}>Заявка отправлена!</div>
              <div style={{ fontSize: 13, color: "var(--suggestion-text)", lineHeight: 1.6 }}>
                Ветеринар получил саммари диалога,<br />карточку пациента и ваши контакты.<br />Ожидайте обратную связь.
              </div>
              <button onClick={onClose} style={{
                marginTop: 24, padding: "12px 36px", borderRadius: 12, border: "1px solid rgba(0,230,118,0.25)",
                background: "rgba(0,230,118,0.08)", color: "#00e676", cursor: "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              }}>Отлично</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
