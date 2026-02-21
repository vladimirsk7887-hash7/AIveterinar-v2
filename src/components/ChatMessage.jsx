export default function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeIn 0.35s ease" }}>
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", marginRight: 10, marginTop: 2, flexShrink: 0, background: "linear-gradient(135deg, #7C4DFF, #536DFE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🐾</div>
      )}
      <div className="chat-bubble" style={{
        maxWidth: "75%", padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "var(--bubble-user-bg)" : "var(--bubble-ai-bg)",
        border: isUser ? "1px solid var(--bubble-user-border)" : "1px solid var(--bubble-ai-border)",
        color: isUser ? "#fff" : "var(--text-primary)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap",
      }}>{msg.displayText || msg.content}</div>
    </div>
  );
}
