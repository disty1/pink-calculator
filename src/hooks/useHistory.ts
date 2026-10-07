import { useCallback } from 'react';
import type { HistoryEntry } from '../types/calculator';
import { MAX_HISTORY, parseHistory, STORAGE_KEYS } from '../utils/storage';
import { usePersistentState } from './usePersistentState';

const EMPTY: HistoryEntry[] = [];

export function useHistory() {
  const [entries, setEntries] = usePersistentState<HistoryEntry[]>(STORAGE_KEYS.history, EMPTY, parseHistory);

  const add = useCallback(
    (entry: HistoryEntry) => setEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY)),
    [setEntries],
  );
  const remove = useCallback((id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)), [setEntries]);
  const clear = useCallback(() => setEntries([]), [setEntries]);

  return { entries, add, remove, clear };
}
