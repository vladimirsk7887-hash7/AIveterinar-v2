import { PET_TYPES } from '../../lib/constants';

export default function PetSelect({ onSelect }) {
  return (
    <div className="tg-pet-select">
      <div className="tg-header">
        <div className="tg-header-label">AI-ВЕТЕРИНАР</div>
        <h1 className="tg-header-title">Выберите питомца</h1>
        <div className="tg-header-sub">Профессиональная поддержка 24/7</div>
      </div>

      <div className="tg-pet-grid">
        {PET_TYPES.map((pet) => (
          <button
            key={pet.name}
            className="tg-pet-card"
            onClick={() => onSelect(pet)}
          >
            <span className="tg-pet-emoji">{pet.emoji}</span>
            <span className="tg-pet-name">{pet.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
