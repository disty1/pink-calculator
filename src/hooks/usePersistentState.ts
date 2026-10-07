import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

/** `useState` that is hydrated from, and saved to, localStorage (validated via `parse`). */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStorage(key, parse, fallback));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
