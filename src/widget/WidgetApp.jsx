import { useState, useRef, useEffect } from "react";
import { PET_TYPES, STARTER_BUTTONS, STATUS_CONFIG } from "../lib/constants";
import { callAI, parseMeta, mergeCard, checkServerKey, setCurrentPetType } from "./lib/api";
import AnimalSVG from "../components/AnimalSVG";
import StatusBar from "../components/StatusBar";
import PatientCard from "../components/PatientCard";
import ChatMessage from "../components/ChatMessage";
import SuggestionButtons from "../components/SuggestionButtons";
import WidgetAppointmentModal from "./WidgetAppointmentModal";
import "../index.css";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("ai-vet-theme") || "dark"; } catch { return "dark"; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ai-vet-theme", theme); } catch { }
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

export default function WidgetApp() {
  const isMobile = useIsMobile();
  const { theme, toggle: toggleTheme } = useTheme();
  const [pets, setPets] = useState([]);
  const [activePetId, setActivePetId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [hoveredPet, setHoveredPet] = useState(null);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showMobileCard, setShowMobileCard] = useState(false);
  const [serverReady, setServerReady] = useState(true);
  const [clinicConfig, setClinicConfig] = useState(null);
  const chatEndRef = useRef(null);
  const activePet = pets.find((p) => p.id === activePetId);

  useEffect(() => {
    checkServerKey().then((config) => {
      setServerReady(!!config);
      if (config) {
        setClinicConfig(config);
        const root = document.documentElement;
        if (config.primaryColor) root.style.setProperty('--w-primary', config.primaryColor);
        if (config.bgColor) root.style.setProperty('--w-bg', config.bgColor);
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePet?.messages]);

  const selectPet = (id) => {
    setActivePetId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const createPet = async (petType) => {
    if (!serverReady) return;
    setCurrentPetType(petType.name);
    const id = Date.now().toString();
    const initMsg = `Вид питомца: ${petType.name}. Начало диалога.`;
    const newPet = {
      id, emoji: petType.emoji, name: petType.name, svg: petType.svg,
      status: "consultation", card: { species: petType.name }, suggestions: [],
      messages: [{ role: "user", content: initMsg, displayText: `${petType.emoji} ${petType.name} — новый диалог`, hidden: true }],
    };
    setPets((prev) => [...prev, newPet]);
    setActivePetId(id);
    setLoading(true);
    const reply = await callAI([{ role: "user", content: initMsg }], undefined, id);
    const { meta, visibleText } = parseMeta(reply);
    setPets((prev) => prev.map((p) => p.id === id ? {
      ...p, status: meta.status || "consultation", card: { ...p.card, ...meta.card },
      suggestions: meta.suggestions || [],
      messages: [...p.messages, { role: "assistant", content: reply, displayText: visibleText }],
    } : p));
    setLoading(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !activePetId || loading) return;
    setInput("");
    const userMsg = { role: "user", content: text, displayText: text };
    const currentPet = pets.find((p) => p.id === activePetId);
    if (currentPet) setCurrentPetType(currentPet.name);
    const updatedMessages = [...(currentPet?.messages || []), userMsg];
    setPets((prev) => prev.map((p) => p.id === activePetId ? { ...p, messages: updatedMessages, suggestions: [] } : p));
    setLoading(true);
    const reply = await callAI(updatedMessages.map((m) => ({ role: m.role, content: m.content })), undefined, activePetId);
    const { meta, visibleText } = parseMeta(reply);
    setPets((prev) => prev.map((p) => p.id === activePetId ? {
      ...p, status: meta.status || p.status, card: mergeCard(p.card, meta.card),
      suggestions: meta.suggestions || [],
      messages: [...updatedMessages, { role: "assistant", content: reply, displayText: visibleText }],
    } : p));
    setLoading(false);
  };

  const visibleMessages = activePet?.messages?.filter((m) => !m.hidden && m.displayText) || [];
  const isStartOfDialog = visibleMessages.filter((m) => m.role === "user").length === 0;
  const hasEnoughDialog = visibleMessages.length >= 2;

  // ═══════════════════════════════════════
  // SCREEN 1: HOME
  // ═══════════════════════════════════════
  if (!activePetId) {
    return (
      <div className="home-container" style={{
        height: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif", color: "var(--text-primary)",
        padding: "clamp(16px, 3vh, 40px) 20px", position: "relative",
      }}>
        <button onClick={toggleTheme} className="theme-toggle" style={{ position: "absolute", top: 14, right: 14 }}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div style={{ textAlign: "center", marginBottom: "clamp(16px, 4vh, 48px)" }}>
          {clinicConfig?.logoUrl ? (
            <img src={clinicConfig.logoUrl} alt={clinicConfig.name} style={{ maxHeight: 64, maxWidth: 200, objectFit: "contain", marginBottom: "clamp(8px, 2vh, 20px)" }} />
          ) : (
            <>
              <div className="home-subtitle-top" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "clamp(6px, 1.5vh, 14px)", fontFamily: "'JetBrains Mono', monospace" }}>AI-ВЕТЕРИНАР</div>
              <h1 className="home-title" style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, margin: 0, letterSpacing: -1, lineHeight: 1.1, position: "relative", display: "inline-block" }}>
                <span style={{ background: "linear-gradient(135deg, #7C4DFF 0%, #536DFE 40%, #448AFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-ВЕТЕРИНАР</span>
                <span style={{ position: "absolute", top: -6, right: -20, fontSize: 24, color: "#FFD740", WebkitTextFillColor: "#FFD740" }}>⁺</span>
              </h1>
            </>
          )}
          {clinicConfig?.welcomeMessage ? (
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: "clamp(8px, 1.5vh, 18px)", maxWidth: 420, margin: "clamp(8px, 1.5vh, 18px) auto 0" }}>{clinicConfig.welcomeMessage}</div>
          ) : (
            <div className="home-subtitle-bottom" style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "var(--text-muted)", marginTop: "clamp(8px, 1.5vh, 18px)", fontFamily: "'JetBrains Mono', monospace" }}>Профессиональная поддержка 24/7</div>
          )}
        </div>

        {!serverReady && (
          <div style={{
            marginBottom: 20, padding: "12px 20px", borderRadius: 14,
            background: "var(--warn-bg)", border: "1px solid var(--warn-border)",
            color: "#FFD740", fontSize: 13, textAlign: "center", maxWidth: 500,
          }}>
            Виджет временно недоступен. Обратитесь в клинику по телефону.
          </div>
        )}

        <div className="pet-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(10px, 1.5vh, 18px)", maxWidth: 640, width: "100%" }}>
          {PET_TYPES.map((pet) => {
            const SvgComp = AnimalSVG[pet.svg];
            const hovered = hoveredPet === pet.name;
            return (
              <button key={pet.name} className="pet-card" onClick={() => createPet(pet)}
                onMouseEnter={() => setHoveredPet(pet.name)} onMouseLeave={() => setHoveredPet(null)}
                style={{
                  padding: "clamp(16px, 3vh, 36px) 16px clamp(12px, 2vh, 28px)", borderRadius: 16,
                  border: `1px solid ${hovered ? "rgba(124,77,255,0.3)" : "var(--border-light)"}`,
                  background: hovered ? "var(--bg-surface-hover)" : "var(--bg-surface)",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "clamp(8px, 1.5vh, 20px)", transition: "all 0.3s ease",
                  transform: hovered ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: hovered ? "0 12px 40px rgba(124,77,255,0.1)" : "none",
                }}>
                <div className="pet-svg" style={{ transition: "transform 0.3s ease", transform: hovered ? "scale(1.1)" : "scale(1)" }}><SvgComp /></div>
                <span className="pet-label" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: hovered ? "#B388FF" : "var(--text-muted2)", transition: "color 0.3s" }}>{pet.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // SCREEN 2: CHAT
  // ═══════════════════════════════════════
  return (
    <div style={{
      display: "flex", height: "100vh", background: "var(--bg-primary)",
      fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
      color: "var(--text-primary)", overflow: "hidden",
    }}>
      {showAppointment && <WidgetAppointmentModal pet={activePet} messages={activePet?.messages || []} onClose={() => setShowAppointment(false)} />}

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`sidebar ${!sidebarOpen ? "closed" : ""}`} style={{
        width: sidebarOpen ? 274 : 0, minWidth: sidebarOpen ? 274 : 0,
        background: "var(--bg-secondary)", borderRight: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🐾</span>
          <span style={{ fontWeight: 800, fontSize: 15, background: "linear-gradient(90deg, #7C4DFF, #448AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI-Ветеринар</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {pets.map((pet) => {
            const isActive = pet.id === activePetId;
            return (
              <div key={pet.id}>
                <button onClick={() => selectPet(pet.id)} className="sidebar-pet-btn" style={{
                  width: "100%", padding: "10px 12px", borderRadius: 12,
                  border: isActive ? "1px solid var(--accent-active-border)" : "1px solid transparent",
                  background: isActive ? "var(--accent-active-bg)" : "transparent",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 2, transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 22 }}>{pet.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{pet.card?.name || pet.name}</div>
                    <div style={{ fontSize: 10, color: STATUS_CONFIG[pet.status]?.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
                      {STATUS_CONFIG[pet.status]?.text?.replace(/^[^\s]+\s/, "")}
                    </div>
                  </div>
                </button>
                {isActive && <PatientCard card={pet.card} />}
              </div>
            );
          })}
        </div>

        {hasEnoughDialog && (
          <button onClick={() => setShowAppointment(true)} className="appointment-btn" style={{
            margin: "0 10px 6px", padding: "13px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00C853, #00E676)", color: "#0B0E18",
            cursor: "pointer", fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
            transition: "all 0.3s ease", fontFamily: "inherit",
            boxShadow: "0 4px 20px rgba(0,200,83,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🏥</span> Записаться на приём
          </button>
        )}

        <button onClick={() => { setActivePetId(null); if (isMobile) setSidebarOpen(false); }} className="add-pet-btn" style={{
          margin: 10, padding: 12, borderRadius: 12, border: "1px solid var(--border-light)",
          background: "var(--bg-input)", color: "var(--text-muted2)", cursor: "pointer", fontSize: 13,
          fontWeight: 600, transition: "all 0.2s", fontFamily: "inherit",
        }}>➕ Добавить питомца</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", padding: "10px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-topbar)", gap: 12,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 4 }}>
            {sidebarOpen && !isMobile ? "◀" : "☰"}
          </button>
          <span style={{ fontSize: 22 }}>{activePet?.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{activePet?.card?.name || activePet?.name}</span>

          {hasEnoughDialog && (
            <button onClick={() => setShowAppointment(true)} className="topbar-appointment-btn" style={{
              marginLeft: "auto", padding: "8px 18px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #00C853, #00E676)", color: "#0B0E18",
              cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 0.5,
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 2px 12px rgba(0,200,83,0.2)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>🏥</span> <span className="topbar-appt-text">ЗАПИСАТЬСЯ</span>
            </button>
          )}

          {!hasEnoughDialog && (
            <div style={{ marginLeft: "auto", fontSize: 10, color: STATUS_CONFIG[activePet?.status]?.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>
              {activePet?.status === "red" ? "ЭКСТРЕННО" : activePet?.status === "yellow" ? "ВНИМАНИЕ" : activePet?.status === "green" ? "СТАБИЛЬНО" : activePet?.status === "blocked" ? "ЗАЩИТА" : "КОНСУЛЬТАЦИЯ"}
            </div>
          )}

          <button onClick={toggleTheme} className="theme-toggle" style={{ marginLeft: hasEnoughDialog ? 8 : "auto" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <StatusBar status={activePet?.status} />

        {isMobile && activePet?.card && (
          <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <button onClick={() => setShowMobileCard(!showMobileCard)} style={{
              width: "100%", padding: "8px 14px", background: "var(--mobile-card-bg)",
              border: "none", color: "#7C4DFF", fontSize: 11, fontWeight: 700,
              letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>📋</span> Карточка пациента {showMobileCard ? "▲" : "▼"}
            </button>
            {showMobileCard && (
              <div style={{ padding: "0 12px 10px" }}>
                <PatientCard card={activePet.card} />
              </div>
            )}
          </div>
        )}

        <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {visibleMessages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", marginRight: 10, background: "linear-gradient(135deg, #7C4DFF, #536DFE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🐾</div>
              <div style={{ padding: "14px 20px", borderRadius: "18px 18px 18px 4px", background: "var(--typing-bg)", border: "1px solid var(--typing-border)", color: "var(--text-muted)", fontSize: 18, letterSpacing: 3 }}>
                <span className="typing-dots">•••</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {!loading && (
          <SuggestionButtons
            suggestions={isStartOfDialog && !activePet?.suggestions?.length ? STARTER_BUTTONS : activePet?.suggestions}
            onSend={sendMessage} isStarter={isStartOfDialog && !activePet?.suggestions?.length}
          />
        )}

        {isMobile && hasEnoughDialog && (
          <button onClick={() => setShowAppointment(true)} style={{
            margin: "0 14px", padding: "10px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00C853, #00E676)", color: "#0B0E18",
            cursor: "pointer", fontSize: 13, fontWeight: 800,
            boxShadow: "0 4px 20px rgba(0,200,83,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            <span>🏥</span> Записаться на приём
          </button>
        )}

        <div className="chat-input-area" style={{ padding: "14px 18px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-topbar)", display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Опишите, что случилось с питомцем..." disabled={loading}
            style={{
              flex: 1, padding: "13px 18px", borderRadius: 14, border: "1px solid var(--border-light)",
              background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14, outline: "none",
              transition: "border-color 0.25s", fontFamily: "inherit",
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(124,77,255,0.3)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
            padding: "13px 22px", borderRadius: 14, border: "none",
            background: loading || !input.trim() ? "var(--btn-disabled-bg)" : "linear-gradient(135deg, #7C4DFF, #536DFE)",
            color: loading || !input.trim() ? "var(--text-placeholder)" : "#fff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: 16, fontWeight: 700, transition: "all 0.25s",
          }}>➤</button>
        </div>
      </div>
    </div>
  );
}
