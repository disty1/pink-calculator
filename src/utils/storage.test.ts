import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_HISTORY, parseAngle, parseHistory, parseMode, parseTheme, readStorage, writeStorage } from './storage';

function stubLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    },
  });
  return data;
}

describe('storage helpers', () => {
  beforeEach(() => stubLocalStorage());
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips values', () => {
    writeStorage('k', { a: 1 });
    expect(readStorage('k', (r) => r as { a: number }, { a: 0 })).toEqual({ a: 1 });
  });

  it('falls back for missing keys', () => {
    expect(readStorage('missing', parseTheme, 'light')).toBe('light');
  });

  it('falls back for corrupted JSON', () => {
    stubLocalStorage({ k: '{not json' });
    expect(readStorage('k', parseTheme, 'light')).toBe('light');
  });

  it('falls back for values of the wrong shape', () => {
    stubLocalStorage({ k: '"purple"' });
    expect(readStorage('k', parseTheme, 'dark')).toBe('dark');
  });

  it('survives a throwing localStorage', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('quota');
        },
      },
    });
    expect(readStorage('k', parseTheme, 'light')).toBe('light');
    expect(() => writeStorage('k', 1)).not.toThrow();
  });
});

describe('parsers', () => {
  it('validates simple settings', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('x')).toBeNull();
    expect(parseMode('scientific')).toBe('scientific');
    expect(parseMode(1)).toBeNull();
    expect(parseAngle('rad')).toBe('rad');
    expect(parseAngle(null)).toBeNull();
  });

  it('keeps only valid history entries and caps the length', () => {
    const good = { id: 'a', expression: '1+1', result: '2', timestamp: 1 };
    expect(parseHistory('nope')).toBeNull();
    expect(parseHistory([good, null, 5, { id: 1 }, { ...good, timestamp: 'x' }])).toEqual([good]);
    const many = Array.from({ length: 80 }, (_, i) => ({ ...good, id: String(i) }));
    expect(parseHistory(many)).toHaveLength(MAX_HISTORY);
  });
});
