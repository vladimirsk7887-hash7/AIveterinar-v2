const AnimalSVG = {
  dog: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <ellipse cx="34" cy="38" rx="14" ry="22" fill="#D4A820" transform="rotate(-15 34 38)" />
      <ellipse cx="86" cy="38" rx="14" ry="22" fill="#D4A820" transform="rotate(15 86 38)" />
      <ellipse cx="60" cy="68" rx="32" ry="36" fill="#E8C840" />
      <ellipse cx="60" cy="62" rx="26" ry="28" fill="#E8C840" />
      <circle cx="48" cy="56" r="4.5" fill="#2a2a3a" />
      <circle cx="72" cy="56" r="4.5" fill="#2a2a3a" />
      <circle cx="49.5" cy="54.5" r="1.5" fill="#fff" />
      <circle cx="73.5" cy="54.5" r="1.5" fill="#fff" />
      <ellipse cx="60" cy="67" rx="5" ry="3.5" fill="#2a2a3a" />
      <path d="M55 71 Q60 76 65 71" fill="none" stroke="#2a2a3a" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="44" y="88" width="32" height="6" rx="3" fill="#5B9BD5" />
      <circle cx="60" cy="91" r="3" fill="#FFD700" />
    </svg>
  ),
  cat: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <polygon points="32,22 22,52 46,46" fill="#9E9E9E" />
      <polygon points="88,22 98,52 74,46" fill="#9E9E9E" />
      <polygon points="34,28 27,48 44,44" fill="#F48FB1" />
      <polygon points="86,28 93,48 76,44" fill="#F48FB1" />
      <ellipse cx="60" cy="72" rx="30" ry="34" fill="#9E9E9E" />
      <ellipse cx="60" cy="64" rx="28" ry="26" fill="#AFAFAF" />
      <ellipse cx="46" cy="58" rx="5" ry="5.5" fill="#4CAF50" />
      <ellipse cx="74" cy="58" rx="5" ry="5.5" fill="#4CAF50" />
      <ellipse cx="46" cy="58" rx="2.5" ry="5.5" fill="#2a2a3a" />
      <ellipse cx="74" cy="58" rx="2.5" ry="5.5" fill="#2a2a3a" />
      <circle cx="44.5" cy="56" r="1.2" fill="#fff" />
      <circle cx="72.5" cy="56" r="1.2" fill="#fff" />
      <polygon points="57,67 63,67 60,70" fill="#F48FB1" />
      <path d="M54 72 Q57 75 60 72 Q63 75 66 72" fill="none" stroke="#777" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="28" y1="64" x2="44" y2="66" stroke="#777" strokeWidth="1" />
      <line x1="28" y1="70" x2="44" y2="70" stroke="#777" strokeWidth="1" />
      <line x1="76" y1="66" x2="92" y2="64" stroke="#777" strokeWidth="1" />
      <line x1="76" y1="70" x2="92" y2="70" stroke="#777" strokeWidth="1" />
    </svg>
  ),
  rodent: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <circle cx="38" cy="32" r="16" fill="#E8985E" />
      <circle cx="82" cy="32" r="16" fill="#E8985E" />
      <circle cx="38" cy="32" r="10" fill="#F4C09E" />
      <circle cx="82" cy="32" r="10" fill="#F4C09E" />
      <ellipse cx="60" cy="70" rx="30" ry="34" fill="#E8985E" />
      <ellipse cx="60" cy="64" rx="26" ry="24" fill="#F0A868" />
      <circle cx="48" cy="56" r="5" fill="#2a2a3a" />
      <circle cx="72" cy="56" r="5" fill="#2a2a3a" />
      <circle cx="50" cy="54" r="2" fill="#fff" />
      <circle cx="74" cy="54" r="2" fill="#fff" />
      <circle cx="60" cy="67" r="4" fill="#2a2a3a" />
      <circle cx="61.5" cy="65.5" r="1.2" fill="#555" />
      <circle cx="40" cy="68" r="6" fill="#F4C09E" opacity="0.6" />
      <circle cx="80" cy="68" r="6" fill="#F4C09E" opacity="0.6" />
      <path d="M56 73 Q60 77 64 73" fill="none" stroke="#2a2a3a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  bird: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <ellipse cx="32" cy="78" rx="14" ry="8" fill="#C62828" transform="rotate(-30 32 78)" />
      <ellipse cx="60" cy="68" rx="28" ry="30" fill="#E53935" />
      <ellipse cx="46" cy="70" rx="16" ry="20" fill="#C62828" transform="rotate(10 46 70)" />
      <circle cx="72" cy="46" r="18" fill="#E53935" />
      <circle cx="78" cy="42" r="5" fill="#fff" />
      <circle cx="79.5" cy="41.5" r="3" fill="#2a2a3a" />
      <circle cx="80.5" cy="40.5" r="1" fill="#fff" />
      <polygon points="90,46 102,50 90,54" fill="#FF8F00" />
      <ellipse cx="66" cy="30" rx="4" ry="10" fill="#C62828" transform="rotate(-20 66 30)" />
      <line x1="52" y1="96" x2="48" y2="108" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="68" y1="96" x2="72" y2="108" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="108" x2="52" y2="108" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="68" y1="108" x2="76" y2="108" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  reptile: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <rect x="28" y="76" width="12" height="20" rx="6" fill="#4CAF50" transform="rotate(-20 34 86)" />
      <rect x="80" y="76" width="12" height="20" rx="6" fill="#4CAF50" transform="rotate(20 86 86)" />
      <ellipse cx="60" cy="66" rx="24" ry="28" fill="#66BB6A" />
      <ellipse cx="60" cy="72" rx="16" ry="18" fill="#A5D6A7" />
      <rect x="24" y="54" width="14" height="10" rx="5" fill="#4CAF50" transform="rotate(-30 31 59)" />
      <rect x="82" y="54" width="14" height="10" rx="5" fill="#4CAF50" transform="rotate(30 89 59)" />
      <ellipse cx="60" cy="40" rx="20" ry="18" fill="#66BB6A" />
      <circle cx="50" cy="36" r="6" fill="#fff" />
      <circle cx="70" cy="36" r="6" fill="#fff" />
      <circle cx="51" cy="36" r="3.5" fill="#2a2a3a" />
      <circle cx="71" cy="36" r="3.5" fill="#2a2a3a" />
      <circle cx="52" cy="35" r="1.2" fill="#fff" />
      <circle cx="72" cy="35" r="1.2" fill="#fff" />
      <path d="M48 48 Q60 54 72 48" fill="none" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="52" cy="62" r="2.5" fill="#4CAF50" />
      <circle cx="68" cy="58" r="2" fill="#4CAF50" />
      <circle cx="60" cy="76" r="2" fill="#4CAF50" />
    </svg>
  ),
  other: () => (
    <svg viewBox="0 0 120 120" width="90" height="90">
      <ellipse cx="60" cy="74" rx="20" ry="16" fill="#E8985E" />
      <circle cx="40" cy="50" r="10" fill="#E8985E" />
      <circle cx="56" cy="42" r="10" fill="#E8985E" />
      <circle cx="72" cy="44" r="10" fill="#E8985E" />
      <circle cx="84" cy="54" r="10" fill="#E8985E" />
      <ellipse cx="60" cy="76" rx="12" ry="9" fill="#D4804A" />
      <circle cx="40" cy="50" r="6" fill="#D4804A" />
      <circle cx="56" cy="42" r="6" fill="#D4804A" />
      <circle cx="72" cy="44" r="6" fill="#D4804A" />
      <circle cx="84" cy="54" r="6" fill="#D4804A" />
    </svg>
  ),
};

export default AnimalSVG;
