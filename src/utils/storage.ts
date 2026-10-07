import type { AngleMode, CalculatorMode, HistoryEntry, Theme } from '../types/calculator';

export const STORAGE_KEYS = {
  history: 'pinkcalc:history',
  theme: 'pinkcalc:theme',
  mode: 'pinkcalc:mode',
  angle: 'pinkcalc:angle',
} as const;

export const MAX_HISTORY = 50;

/** Reads and validates a JSON value; any failure (missing, corrupt, blocked) yields `fallback`. */
export function readStorage<T>(key: string, parse: (raw: unknown) => T | null, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    return parse(JSON.parse(stored)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full, disabled or blocked — the app keeps working in memory.
  }
}

export const parseTheme = (raw: unknown): Theme | null => (raw === 'light' || raw === 'dark' ? raw : null);
export const parseMode = (raw: unknown): CalculatorMode | null =>
  raw === 'basic' || raw === 'scientific' ? raw : null;
export const parseAngle = (raw: unknown): AngleMode | null => (raw === 'deg' || raw === 'rad' ? raw : null);

export function parseHistory(raw: unknown): HistoryEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: HistoryEntry[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, expression, result, timestamp } = item as Record<string, unknown>;
    if (
      typeof id === 'string' &&
      typeof expression === 'string' &&
      typeof result === 'string' &&
      typeof timestamp === 'number' &&
      Number.isFinite(timestamp)
    ) {
      entries.push({ id, expression, result, timestamp });
    }
  }
  return entries.slice(0, MAX_HISTORY);
}
