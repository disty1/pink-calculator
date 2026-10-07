import { useCallback, useEffect, useRef, useState } from 'react';
import type { Theme } from '../types/calculator';
import { parseTheme, readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';
import { useMediaQuery } from './useMediaQuery';

/**
 * Light/dark theme. Follows the system preference until the user picks one,
 * after which the saved choice wins.
 */
export function useTheme() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [saved, setSaved] = useState<Theme | null>(() => readStorage<Theme | null>(STORAGE_KEYS.theme, parseTheme, null));
  const theme: Theme = saved ?? (prefersDark ? 'dark' : 'light');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#180e14' : '#fff1f7');
  }, [theme]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // Briefly enable colour transitions so the switch fades instead of snapping.
    const root = document.documentElement;
    root.classList.add('theme-anim');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => root.classList.remove('theme-anim'), 450);
    setSaved(next);
    writeStorage(STORAGE_KEYS.theme, next);
  }, [theme]);

  return { theme, toggleTheme };
}
