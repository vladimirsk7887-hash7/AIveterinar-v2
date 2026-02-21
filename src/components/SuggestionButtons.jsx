export default function SuggestionButtons({ suggestions, onSend, isStarter }) {
  if (!suggestions?.length) return null;
  return (
    <div className="suggestions-bar" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 20px", justifyContent: "center" }}>
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSend(s)} className="suggestion-btn" style={{
          padding: isStarter ? "10px 18px" : "8px 16px", borderRadius: 24,
          border: "1px solid var(--suggestion-border)", background: "var(--suggestion-bg)",
          color: "var(--suggestion-text)", cursor: "pointer", fontSize: isStarter ? 14 : 13,
          transition: "all 0.25s ease", fontFamily: "inherit",
        }}>{s}</button>
      ))}
    </div>
  );
}
