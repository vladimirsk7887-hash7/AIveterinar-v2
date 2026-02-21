import { STATUS_CONFIG } from '../lib/constants';

export default function StatusBar({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.consultation;
  return (
    <div style={{
      padding: "11px 20px", background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
      color: cfg.color, fontWeight: 700, fontSize: 12, textAlign: "center", letterSpacing: 2,
      animation: cfg.pulse ? "pulse 1.5s ease-in-out infinite" : "none",
      textTransform: "uppercase", backdropFilter: "blur(10px)",
      fontFamily: "'JetBrains Mono', monospace",
    }}>{cfg.text}</div>
  );
}
