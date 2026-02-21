import { useState } from 'react';
import { getApiKey, setApiKey } from '../lib/ai';

export default function SettingsModal({ onClose, onSaved }) {
  const [key, setKey] = useState(getApiKey());
  const [visible, setVisible] = useState(false);

  const handleSave = () => {
    setApiKey(key.trim());
    onSaved?.();
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", animation: "fadeIn 0.25s ease",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 420, maxWidth: "92vw", background: "#12162A", borderRadius: 20,
        border: "1px solid rgba(124,77,255,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        overflow: "hidden", animation: "modalSlide 0.35s ease",
      }}>
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(135deg, rgba(124,77,255,0.08), rgba(68,138,255,0.05))",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #7C4DFF, #448AFF)", fontSize: 20,
              }}>⚙️</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#E0E0E0" }}>Настройки</div>
                <div style={{ color: "#546E7A", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>API-ключ OpenAI</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#546E7A", width: 36, height: 36, borderRadius: 10, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          <div style={{ marginBottom: 8, fontSize: 11, color: "#7C4DFF", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            OPENAI API KEY
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              type={visible ? "text" : "password"}
              placeholder="sk-..."
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", color: "#E0E0E0", fontSize: 13, outline: "none",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onFocus={(e) => e.target.style.borderColor = "rgba(124,77,255,0.35)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <button onClick={() => setVisible(!visible)} style={{
              padding: "0 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)", color: "#78909C", cursor: "pointer", fontSize: 16,
            }}>{visible ? "🙈" : "👁"}</button>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: "#546E7A", lineHeight: 1.6 }}>
            Ключ хранится только в вашем браузере (sessionStorage) и исчезает при закрытии вкладки.
            Получить ключ: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "#7C4DFF" }}>platform.openai.com</a>
          </div>

          <button onClick={handleSave} style={{
            width: "100%", marginTop: 20, padding: "14px", borderRadius: 14, border: "none",
            background: key.trim() ? "linear-gradient(135deg, #7C4DFF, #536DFE, #448AFF)" : "rgba(255,255,255,0.04)",
            color: key.trim() ? "#fff" : "#37474F",
            cursor: key.trim() ? "pointer" : "not-allowed",
            fontSize: 15, fontWeight: 700, fontFamily: "inherit",
            boxShadow: key.trim() ? "0 4px 24px rgba(124,77,255,0.3)" : "none",
          }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
