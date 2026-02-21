export default function PatientCard({ card }) {
  if (!card || Object.values(card).every((v) => !v || (Array.isArray(v) && v.length === 0))) return null;
  const fields = [
    { label: "Имя", value: card.name }, { label: "Вид", value: card.species },
    { label: "Порода", value: card.breed }, { label: "Возраст", value: card.age },
    { label: "Вес", value: card.weight },
  ].filter((f) => f.value);
  return (
    <div style={{ padding: 12, background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--card-border)", marginTop: 8, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#7C4DFF", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>Карточка пациента</div>
      {fields.map((f) => (
        <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-muted)" }}>{f.label}</span><span>{f.value}</span>
        </div>
      ))}
      {card.symptoms?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Симптомы</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {card.symptoms.map((s, i) => (
              <span key={i} style={{ background: "var(--symptom-bg)", color: "#FF8A80", padding: "2px 8px", borderRadius: 20, fontSize: 11, border: "1px solid var(--symptom-border)" }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {card.notes && <div style={{ marginTop: 6, color: "var(--suggestion-text)", fontSize: 11, fontStyle: "italic" }}>{card.notes}</div>}
    </div>
  );
}
