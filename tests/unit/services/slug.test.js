import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabaseAdmin before importing slug.js
vi.mock('../../../db/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { transliterate, findUniqueSlug } from '../../../services/slug.js';
import { supabaseAdmin } from '../../../db/supabase.js';

describe('transliterate()', () => {
  it('converts Russian to Latin', () => {
    expect(transliterate('Ветеринар')).toBe('veterinar');
  });

  it('replaces spaces and special chars with hyphens', () => {
    expect(transliterate('Добрый Кот')).toBe('dobryy-kot');
  });

  it('strips leading/trailing hyphens', () => {
    expect(transliterate('!привет!')).toBe('privet');
  });

  it('truncates to 50 chars', () => {
    const long = 'а'.repeat(60);
    expect(transliterate(long).length).toBeLessThanOrEqual(50);
  });

  it('passes through Latin+digits unchanged', () => {
    expect(transliterate('my-clinic-2')).toBe('my-clinic-2');
  });

  it('handles mixed Russian/Latin', () => {
    expect(transliterate('vet24')).toBe('vet24');
  });
});

describe('findUniqueSlug()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns base slug when not taken', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: () => ({ eq: () => ({ limit: () => ({ data: [] }) }) }),
    });
    expect(await findUniqueSlug('lapki')).toBe('lapki');
  });

  it('appends -2 when base slug is taken', async () => {
    let call = 0;
    supabaseAdmin.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          limit: () => ({ data: call++ === 0 ? [{ id: '1' }] : [] }),
        }),
      }),
    });
    expect(await findUniqueSlug('lapki')).toBe('lapki-2');
  });

  it('throws after 20 failed attempts', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: () => ({ eq: () => ({ limit: () => ({ data: [{ id: '1' }] }) }) }),
    });
    await expect(findUniqueSlug('taken')).rejects.toThrow('Cannot generate unique slug');
  });
});
