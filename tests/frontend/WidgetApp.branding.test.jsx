/**
 * Компонентный тест: применение брендинга клиники в виджете.
 * Ловит баг "CSS-переменные задаются, но не те что используются".
 */
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Мокаем все дочерние компоненты
vi.mock('../../src/components/AnimalSVG', () => ({
  default: new Proxy({}, { get: () => () => null }),
}));
vi.mock('../../src/components/StatusBar', () => ({ default: () => null }));
vi.mock('../../src/components/PatientCard', () => ({ default: () => null }));
vi.mock('../../src/components/ChatMessage', () => ({ default: () => null }));
vi.mock('../../src/components/SuggestionButtons', () => ({ default: () => null }));
vi.mock('../../src/widget/WidgetAppointmentModal', () => ({ default: () => null }));

// Мокаем константы
vi.mock('../../src/lib/constants', () => ({
  PET_TYPES: [{ name: 'Кошка', emoji: '🐱', svg: 'Cat', label: 'КОШКА' }],
  STARTER_BUTTONS: [],
  STATUS_CONFIG: { consultation: { color: '#7C4DFF', text: '● Консультация' } },
  SYSTEM_PROMPT: 'test prompt',
}));

// Мокаем widget API — ключевой мок для этого теста
const { mockCheckServerKey } = vi.hoisted(() => ({
  mockCheckServerKey: vi.fn(),
}));

vi.mock('../../src/widget/lib/api', () => ({
  checkServerKey: mockCheckServerKey,
  callAI: vi.fn(),
  parseMeta: vi.fn(() => ({
    meta: { status: 'consultation', card: {}, suggestions: [] },
    visibleText: '',
  })),
  mergeCard: vi.fn((old) => old),
  setCurrentPetType: vi.fn(),
  getConversationId: vi.fn(() => null),
  setConversationId: vi.fn(),
}));

import WidgetApp from '../../src/widget/WidgetApp.jsx';

const CSS_VARS = ['--bg-primary', '--bg-secondary', '--bg-topbar', '--w-bg', '--w-primary', '--primary'];

describe('WidgetApp — брендинг клиники', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CSS_VARS.forEach((v) => document.documentElement.style.removeProperty(v));
  });

  it('устанавливает --bg-primary, --bg-secondary, --bg-topbar из bgColor', async () => {
    mockCheckServerKey.mockResolvedValue({
      name: 'Тест клиника',
      primaryColor: '#ff4d8b',
      bgColor: '#25db00',
      logoUrl: null,
      welcomeMessage: null,
    });

    render(<WidgetApp />);

    await waitFor(() => {
      const style = document.documentElement.style;
      expect(style.getPropertyValue('--bg-primary')).toBe('#25db00');
      expect(style.getPropertyValue('--bg-secondary')).toBe('#25db00');
      expect(style.getPropertyValue('--bg-topbar')).toBe('#25db00');
      expect(style.getPropertyValue('--w-bg')).toBe('#25db00');
    });
  });

  it('устанавливает --w-primary и --primary из primaryColor', async () => {
    mockCheckServerKey.mockResolvedValue({
      primaryColor: '#ff4d8b',
      bgColor: '#111',
    });

    render(<WidgetApp />);

    await waitFor(() => {
      const style = document.documentElement.style;
      expect(style.getPropertyValue('--w-primary')).toBe('#ff4d8b');
      expect(style.getPropertyValue('--primary')).toBe('#ff4d8b');
    });
  });

  it('не меняет CSS-переменные если bgColor не задан', async () => {
    mockCheckServerKey.mockResolvedValue({
      primaryColor: null,
      bgColor: null,
    });

    render(<WidgetApp />);

    await waitFor(() => {
      expect(mockCheckServerKey).toHaveBeenCalledOnce();
    });

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--bg-primary')).toBe('');
    expect(style.getPropertyValue('--w-bg')).toBe('');
  });

  it('показывает сообщение о недоступности если сервер не отвечает', async () => {
    mockCheckServerKey.mockResolvedValue(null);

    const { getByText } = render(<WidgetApp />);

    await waitFor(() => {
      expect(getByText(/Виджет временно недоступен/)).toBeTruthy();
    });
  });
});
